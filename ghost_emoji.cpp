#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <cmath>
#include <cstdio>
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <string>
#include <termios.h>
#include <thread>
#include <unistd.h>
#include <vector>

int kbhit() {
    struct termios oldt, newt;
    int ch;
    int oldf;

    tcgetattr(STDIN_FILENO, &oldt);
    newt = oldt;
    newt.c_lflag &= ~(ICANON | ECHO);
    tcsetattr(STDIN_FILENO, TCSANOW, &newt);
    oldf = fcntl(STDIN_FILENO, F_GETFL, 0);
    fcntl(STDIN_FILENO, F_SETFL, oldf | O_NONBLOCK);

    ch = getchar();

    tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
    fcntl(STDIN_FILENO, F_SETFL, oldf);

    if (ch != EOF) {
        ungetc(ch, stdin);
        return 1;
    }
    return 0;
}

class GhostEmojiRenderer {
public:
    GhostEmojiRenderer(int w = 70, int h = 34, int frameLimit = 120, bool live = false)
        : width(w),
          height(h),
          depthBuffer(width * height, -1.0f),
          groupBuffer(width * height, -1),
          intensityBuffer(width * height, 0.0f),
          historyBuffer(width * height, 0.0f),
          charBuffer(width * height, ' '),
          A(0.0f),
          B(0.0f),
          C(0.0f),
          distanceFromCam(50.0f),
          zoomLevel(54.0f),
          maxFrames(frameLimit),
          liveMode(live),
          running(true) {
        loadMesh();
    }

    ~GhostEmojiRenderer() { showCursor(); }

    void run() {
        hideCursor();
        int frameCount = 0;
        while (running) {
            std::fill(depthBuffer.begin(), depthBuffer.end(), -1.0f);
            std::fill(groupBuffer.begin(), groupBuffer.end(), -1);
            std::fill(intensityBuffer.begin(), intensityBuffer.end(), 0.0f);

            handleInput();
            rasterizeMesh();
            composeFrame();
            display();

            ++frameCount;
            if (!liveMode && frameCount >= maxFrames) running = false;

            std::this_thread::sleep_for(std::chrono::milliseconds(70));
        }
    }

private:
    struct Vec3 {
        float x, y, z;
        Vec3 operator+(const Vec3& o) const { return {x + o.x, y + o.y, z + o.z}; }
        Vec3 operator-(const Vec3& o) const { return {x - o.x, y - o.y, z - o.z}; }
        Vec3 operator*(float s) const { return {x * s, y * s, z * s}; }
    };

    struct ProjV {
        float sx, sy;
        float invz;
        Vec3 cam;
    };

    int width, height;
    std::vector<float> depthBuffer;
    std::vector<int> groupBuffer;
    std::vector<float> intensityBuffer;
    std::vector<float> historyBuffer;
    std::vector<char> charBuffer;
    struct Tri {
        Vec3 a, b, c;
        int group; // 0 body/other, 1 eyes, 2 mouth, 3 tongue
    };
    std::vector<Tri> triangles;

    float A, B, C;
    float distanceFromCam;
    float zoomLevel;
    int maxFrames;
    bool liveMode;
    bool running;

    static Vec3 cross(const Vec3& a, const Vec3& b) {
        return {
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        };
    }

    static float dot(const Vec3& a, const Vec3& b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

    static float length(const Vec3& v) { return std::sqrt(dot(v, v)); }

    static Vec3 normalize(const Vec3& v) {
        float len = length(v);
        if (len < 1e-6f) return {0.0f, 0.0f, 0.0f};
        return {v.x / len, v.y / len, v.z / len};
    }

    void loadMesh() {
        std::ifstream in("ghost_mesh.csv");
        if (!in.is_open()) {
            std::cerr << "Could not open ghost_mesh.csv.\n";
            running = false;
            return;
        }

        std::vector<Vec3> verts;
        std::vector<int> groups;
        std::string line;
        while (std::getline(in, line)) {
            if (line.empty() || line[0] == '#') continue;
            Vec3 v{};
            int g = 0;
            int parsed = std::sscanf(line.c_str(), "%f,%f,%f,%d", &v.x, &v.y, &v.z, &g);
            if (parsed >= 3) {
                verts.push_back(v);
                groups.push_back((parsed == 4) ? g : 0);
            }
        }

        if (verts.size() < 3) {
            std::cerr << "Mesh is empty or invalid.\n";
            running = false;
            return;
        }
        if (verts.size() % 3 != 0) {
            std::cerr << "Mesh vertex count is not multiple of 3; trailing vertices ignored.\n";
        }
        for (size_t i = 0; i + 2 < verts.size(); i += 3) {
            int g = groups[i];
            triangles.push_back({verts[i], verts[i + 1], verts[i + 2], g});
        }
    }

    Vec3 rotate(const Vec3& p) const {
        return {
            p.x * std::cos(C) * std::cos(B) +
                p.y * (std::cos(C) * std::sin(B) * std::sin(A) - std::sin(C) * std::cos(A)) +
                p.z * (std::cos(C) * std::sin(B) * std::cos(A) + std::sin(C) * std::sin(A)),
            p.x * std::sin(C) * std::cos(B) +
                p.y * (std::sin(C) * std::sin(B) * std::sin(A) + std::cos(C) * std::cos(A)) +
                p.z * (std::sin(C) * std::sin(B) * std::cos(A) - std::cos(C) * std::sin(A)),
            p.x * -std::sin(B) + p.y * std::cos(B) * std::sin(A) + p.z * std::cos(B) * std::cos(A)
        };
    }

    static float edgeFn(float ax, float ay, float bx, float by, float px, float py) {
        return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
    }

    void rasterTriangle(const ProjV& v0, const ProjV& v1, const ProjV& v2, float brightness, int group) {
        float minXf = std::floor(std::min({v0.sx, v1.sx, v2.sx}));
        float maxXf = std::ceil(std::max({v0.sx, v1.sx, v2.sx}));
        float minYf = std::floor(std::min({v0.sy, v1.sy, v2.sy}));
        float maxYf = std::ceil(std::max({v0.sy, v1.sy, v2.sy}));

        int minX = std::max(0, static_cast<int>(minXf));
        int maxX = std::min(width - 1, static_cast<int>(maxXf));
        int minY = std::max(0, static_cast<int>(minYf));
        int maxY = std::min(height - 1, static_cast<int>(maxYf));

        float area = edgeFn(v0.sx, v0.sy, v1.sx, v1.sy, v2.sx, v2.sy);
        if (std::fabs(area) < 1e-6f) return;

        for (int y = minY; y <= maxY; ++y) {
            for (int x = minX; x <= maxX; ++x) {
                float px = static_cast<float>(x) + 0.5f;
                float py = static_cast<float>(y) + 0.5f;

                float w0 = edgeFn(v1.sx, v1.sy, v2.sx, v2.sy, px, py);
                float w1 = edgeFn(v2.sx, v2.sy, v0.sx, v0.sy, px, py);
                float w2 = edgeFn(v0.sx, v0.sy, v1.sx, v1.sy, px, py);

                bool inside = (area > 0.0f) ? (w0 >= 0.0f && w1 >= 0.0f && w2 >= 0.0f)
                                            : (w0 <= 0.0f && w1 <= 0.0f && w2 <= 0.0f);
                if (!inside) continue;

                w0 /= area;
                w1 /= area;
                w2 /= area;

                float invz = w0 * v0.invz + w1 * v1.invz + w2 * v2.invz;
                int idx = y * width + x;
                if (invz > depthBuffer[idx]) {
                    depthBuffer[idx] = invz;
                    intensityBuffer[idx] = brightness;
                    groupBuffer[idx] = group;
                }
            }
        }
    }

    void applySilhouettePass() {
        std::vector<float> original = intensityBuffer;
        for (int y = 1; y < height - 1; ++y) {
            for (int x = 1; x < width - 1; ++x) {
                int idx = y * width + x;
                if (depthBuffer[idx] <= 0.0f) continue;

                int l = idx - 1, r = idx + 1, u = idx - width, d = idx + width;
                float z = depthBuffer[idx];
                bool edge = false;

                if (depthBuffer[l] <= 0.0f || depthBuffer[r] <= 0.0f || depthBuffer[u] <= 0.0f ||
                    depthBuffer[d] <= 0.0f) {
                    edge = true;
                } else {
                    float t = 0.0018f;
                    edge = std::fabs(z - depthBuffer[l]) > t || std::fabs(z - depthBuffer[r]) > t ||
                           std::fabs(z - depthBuffer[u]) > t || std::fabs(z - depthBuffer[d]) > t;
                }

                if (edge) intensityBuffer[idx] = std::max(original[idx], 1.0f);
            }
        }
    }

    void rasterizeMesh() {
        if (triangles.empty()) return;

        Vec3 lightDir = normalize({0.35f, -0.35f, 0.87f});
        size_t triCount = triangles.size();

        for (size_t t = 0; t < triCount; ++t) {
            const Tri& tri = triangles[t];
            const Vec3& a = tri.a;
            const Vec3& b = tri.b;
            const Vec3& c = tri.c;

            Vec3 ar = rotate(a);
            Vec3 br = rotate(b);
            Vec3 cr = rotate(c);

            ProjV p0{}, p1{}, p2{};
            p0.cam = {ar.x, ar.y, ar.z + distanceFromCam};
            p1.cam = {br.x, br.y, br.z + distanceFromCam};
            p2.cam = {cr.x, cr.y, cr.z + distanceFromCam};
            if (p0.cam.z <= 0.05f || p1.cam.z <= 0.05f || p2.cam.z <= 0.05f) continue;

            Vec3 n = cross(p1.cam - p0.cam, p2.cam - p0.cam);
            if (n.z >= 0.0f) continue; // back-face culling
            Vec3 fn = normalize(n * -1.0f);

            float diffuse = std::max(0.0f, dot(fn, lightDir));
            float brightness = std::min(1.0f, 0.20f + 0.80f * diffuse);
            if (tri.group == 1) brightness = 1.0f;          // eyes
            else if (tri.group == 2) brightness = 0.92f;    // mouth
            else if (tri.group == 3) brightness = 0.78f;    // tongue

            p0.invz = 1.0f / p0.cam.z;
            p1.invz = 1.0f / p1.cam.z;
            p2.invz = 1.0f / p2.cam.z;

            p0.sx = width * 0.5f + zoomLevel * p0.invz * p0.cam.x * 2.0f;
            p0.sy = height * 0.5f + zoomLevel * p0.invz * p0.cam.y;
            p1.sx = width * 0.5f + zoomLevel * p1.invz * p1.cam.x * 2.0f;
            p1.sy = height * 0.5f + zoomLevel * p1.invz * p1.cam.y;
            p2.sx = width * 0.5f + zoomLevel * p2.invz * p2.cam.x * 2.0f;
            p2.sy = height * 0.5f + zoomLevel * p2.invz * p2.cam.y;

            rasterTriangle(p0, p1, p2, brightness, tri.group);
        }

        applySilhouettePass();
    }

    void composeFrame() {
        static const std::string ramp = " .,:-=+*#%@";
        for (size_t i = 0; i < intensityBuffer.size(); ++i) {
            float blended = std::max(intensityBuffer[i], historyBuffer[i] * 0.72f);
            historyBuffer[i] = blended;

            if (blended < 0.03f) {
                charBuffer[i] = ' ';
                continue;
            }
            int g = groupBuffer[i];
            if (g == 1) {
                charBuffer[i] = '@';
                continue;
            }
            if (g == 2) {
                charBuffer[i] = '#';
                continue;
            }
            if (g == 3) {
                charBuffer[i] = 'o';
                continue;
            }
            int idx = static_cast<int>(blended * static_cast<float>(ramp.size() - 1));
            idx = std::max(0, std::min(idx, static_cast<int>(ramp.size() - 1)));
            charBuffer[i] = ramp[idx];
        }
    }

    void handleInput() {
        if (!kbhit()) return;
        int ch = getchar();

        if (ch == 'q' || ch == 'Q') {
            running = false;
            return;
        }

        if (ch == '\033') {
            getchar(); // skip '['
            switch (getchar()) {
                case 'A': A -= 0.08f; break; // Up
                case 'B': A += 0.08f; break; // Down
                case 'C': B += 0.08f; break; // Right
                case 'D': B -= 0.08f; break; // Left
            }
        }
    }

    void display() {
        static std::string frame;
        frame.clear();
        frame.reserve(static_cast<size_t>(width * height + height + 8));
        frame += "\x1b[H";
        for (int y = 0; y < height; ++y) {
            frame.append(&charBuffer[y * width], width);
            frame.push_back('\n');
        }
        std::cout << frame << std::flush;
    }

    void hideCursor() { std::cout << "\x1b[?25l"; }

    void showCursor() { std::cout << "\x1b[?25h"; }
};

int main(int argc, char** argv) {
    bool live = true;
    int frameLimit = 120;
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--live") live = true;
        if (arg == "--safe") live = false;
        if (arg == "--frames" && i + 1 < argc) {
            frameLimit = std::max(1, std::atoi(argv[++i]));
            live = false;
        }
    }
    GhostEmojiRenderer renderer(70, 34, frameLimit, live);
    renderer.run();
    return 0;
}
