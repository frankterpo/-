const GRID_W = 120;
const GRID_H = 60;
const CHARSET = " .,:-=+*#%@";

const canvas = document.getElementById("ascii");
const ctx = canvas.getContext("2d");
let cmdkBackdrop = null;
let cmdkSearch = null;
let cmdkList = null;
let cmdkOpen = false;
let cmdkActive = 0;

const params = new URL(import.meta.url).searchParams;
let meshPath = params.get("mesh") || "hand_mesh.csv";

let cellH = 18;
let drawOffsetX = 0;
let drawOffsetY = 0;

let A = -0.08;
let B = 0.0;
let C = 0.0;
let autoSpin = true;
let statusMessage = `Loading ${meshPath}...`;
let lastTs = 0.0;

let distanceFromCam = 52.0;
let zoomLevel = 64.0;

const depth = new Float32Array(GRID_W * GRID_H);
const intensity = new Float32Array(GRID_W * GRID_H);
const history = new Float32Array(GRID_W * GRID_H);
const chars = new Array(GRID_H).fill("");

/** @type {{a:number[],b:number[],c:number[]}[]} */
let triangles = [];
let loadVersion = 0;
let cursorMask = null;
let motionTime = 0.0;
let meshKey = meshPath.split("?")[0];
// Easy revert knob: set to 1.0 to restore original arrow size.
const CURSOR_ARROW_SCALE = 0.90;
let cursorCornerLabels = null;
const CURSOR_START_POSE_KEY = "cursor_ascii_start_pose_v1";

const workItems = [
  { label: "White Circle", icon: "work-white-circle", mesh: "whitecircle_mesh.csv", page: "./work-white-circle.html", status: "Present" },
  { label: "Cursor Ambassador", icon: "work-cursor", mesh: "cursor_mesh_refined.csv", page: "./work-cursor-ambassador.html", status: "Present" },
  { label: "Cala AI 50", icon: "work-cala", mesh: "cala_mesh.csv", page: "./work-cala-ai-50.html", status: "Present" },
  { label: "Specter", icon: "work-specter", mesh: "specter_mesh_refined.csv", page: "./work-specter.html", status: "Past" },
  { label: "bullfinch", icon: "work-bullfinch", mesh: "bullfinch_mesh.csv", page: "./work-bullfinch.html", status: "Past" },
];

const MODEL_PROFILES = {
  "whitecircle_mesh.csv": { zoom: 66.0, distance: 56.0, speedA: 0.02, speedB: 0.42, speedC: 0.0, edgeThreshold: 0.0022, glow: true, charset: " .,:-=+*#%@", useMask: false, twoSided: true, baseBright: 0.16, light: [0.42, -0.2, 0.9] },
  "cursor_mesh_refined.csv": {
    zoom: 62.0,
    distance: 70.0,
    speedA: 0.0,
    speedB: -0.82,
    speedC: 0.0,
    edgeThreshold: 0.0012,
    glow: false,
    charset: " .,:-=+*#%@",
    useMask: false,
    twoSided: true,
    baseBright: 0.08,
    light: [0.52, -0.45, 0.86],
    renderMode: "mesh",
    projection: "perspective",
    pose: { a: -2.32, b: -0.231, c: 0.0 },
    smoothReturn: 4.2,
    minVisible: 0.03,
    showCornerLabels: false,
  },
  "cala_mesh.csv": { zoom: 68.0, distance: 58.0, speedA: 0.03, speedB: 0.5, speedC: 0.02, edgeThreshold: 0.0011, glow: false, charset: " .,:-=+*#%@", useMask: false, twoSided: true, baseBright: 0.16, light: [0.42, -0.2, 0.9] },
  "specter_mesh_refined.csv": {
    zoom: 82.0,
    distance: 56.0,
    speedA: 0.01,
    speedB: 0.22,
    speedC: 0.01,
    edgeThreshold: 0.00085,
    glow: false,
    charset: " .,:-=+*#%@",
    useMask: false,
    twoSided: true,
    baseBright: 0.12,
    light: [0.52, -0.35, 0.90],
    pose: { a: -0.10, b: 0.24, c: 0.0 },
    minVisible: 0.02,
  },
  "bullfinch_mesh.csv": {
    zoom: 74.0,
    distance: 54.0,
    speedA: 0.03,
    speedB: 0.38,
    speedC: 0.01,
    edgeThreshold: 0.0010,
    glow: false,
    charset: " .,:-~=+*#%@",
    useMask: false,
    twoSided: true,
    baseBright: 0.14,
    light: [0.50, -0.32, 0.88],
    pose: { a: -0.22, b: 0.34, c: 0.0 },
    minVisible: 0.02,
  },
  "hand_mesh.csv": { zoom: 64.0, distance: 52.0, speedA: 0.09, speedB: 0.7, speedC: 0.05, edgeThreshold: 0.0018, glow: false, useMask: false, twoSided: true, baseBright: 0.16, light: [0.42, -0.2, 0.9] },
};
let activeProfile = MODEL_PROFILES[meshKey] || MODEL_PROFILES["hand_mesh.csv"];

function loadCursorStartPose() {
  try {
    const raw = localStorage.getItem(CURSOR_START_POSE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!Number.isFinite(p?.a) || !Number.isFinite(p?.b) || !Number.isFinite(p?.c)) return null;
    return { a: p.a, b: p.b, c: p.c };
  } catch {
    return null;
  }
}

function idx(x, y) {
  return y * GRID_W + x;
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function rotate(p) {
  const [x, y, z] = p;
  return [
    x * Math.cos(C) * Math.cos(B) +
      y * (Math.cos(C) * Math.sin(B) * Math.sin(A) - Math.sin(C) * Math.cos(A)) +
      z * (Math.cos(C) * Math.sin(B) * Math.cos(A) + Math.sin(C) * Math.sin(A)),
    x * Math.sin(C) * Math.cos(B) +
      y * (Math.sin(C) * Math.sin(B) * Math.sin(A) + Math.cos(C) * Math.cos(A)) +
      z * (Math.sin(C) * Math.sin(B) * Math.cos(A) - Math.cos(C) * Math.sin(A)),
    x * -Math.sin(B) + y * Math.cos(B) * Math.sin(A) + z * Math.cos(B) * Math.cos(A),
  ];
}

function edgeFn(ax, ay, bx, by, px, py) {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function rasterTriangle(v0, v1, v2, bright) {
  const minX = Math.max(0, Math.floor(Math.min(v0.sx, v1.sx, v2.sx)));
  const maxX = Math.min(GRID_W - 1, Math.ceil(Math.max(v0.sx, v1.sx, v2.sx)));
  const minY = Math.max(0, Math.floor(Math.min(v0.sy, v1.sy, v2.sy)));
  const maxY = Math.min(GRID_H - 1, Math.ceil(Math.max(v0.sy, v1.sy, v2.sy)));
  const area = edgeFn(v0.sx, v0.sy, v1.sx, v1.sy, v2.sx, v2.sy);
  if (Math.abs(area) < 1e-6) return;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let w0 = edgeFn(v1.sx, v1.sy, v2.sx, v2.sy, px, py);
      let w1 = edgeFn(v2.sx, v2.sy, v0.sx, v0.sy, px, py);
      let w2 = edgeFn(v0.sx, v0.sy, v1.sx, v1.sy, px, py);
      const inside = area > 0 ? w0 >= 0 && w1 >= 0 && w2 >= 0 : w0 <= 0 && w1 <= 0 && w2 <= 0;
      if (!inside) continue;

      w0 /= area;
      w1 /= area;
      w2 /= area;
      const invz = w0 * v0.invz + w1 * v1.invz + w2 * v2.invz;
      const i = idx(x, y);
      if (invz > depth[i]) {
        depth[i] = invz;
        intensity[i] = bright;
      }
    }
  }
}

function silhouettePass() {
  const copy = intensity.slice();
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      const i = idx(x, y);
      if (depth[i] <= 0) continue;
      const l = idx(x - 1, y);
      const r = idx(x + 1, y);
      const u = idx(x, y - 1);
      const d = idx(x, y + 1);
      const z = depth[i];
      const threshold = activeProfile.edgeThreshold ?? 0.0018;
      const edge =
        depth[l] <= 0 ||
        depth[r] <= 0 ||
        depth[u] <= 0 ||
        depth[d] <= 0 ||
        Math.abs(z - depth[l]) > threshold ||
        Math.abs(z - depth[r]) > threshold ||
        Math.abs(z - depth[u]) > threshold ||
        Math.abs(z - depth[d]) > threshold;
      if (edge) intensity[i] = Math.max(copy[i], 1.0);
    }
  }
}

function applyGlowPass() {
  if (!activeProfile.glow) return;
  const base = intensity.slice();
  for (let y = 2; y < GRID_H - 2; y++) {
    for (let x = 2; x < GRID_W - 2; x++) {
      const i = idx(x, y);
      if (base[i] > 0.85) continue;
      let near = 0.0;
      for (let oy = -2; oy <= 2; oy++) {
        for (let ox = -2; ox <= 2; ox++) {
          const d2 = ox * ox + oy * oy;
          if (!d2 || d2 > 5) continue;
          const ni = idx(x + ox, y + oy);
          near = Math.max(near, base[ni] - d2 * 0.12);
        }
      }
      intensity[i] = Math.max(intensity[i], near * 0.45);
    }
  }
}

function applyCursorMaskPass() {
  if (!activeProfile.useMask || !cursorMask) return;
  const { width, height, alpha } = cursorMask;
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const i = idx(x, y);
      const mx = Math.max(0, Math.min(width - 1, Math.floor((x / (GRID_W - 1)) * (width - 1))));
      const my = Math.max(0, Math.min(height - 1, Math.floor((y / (GRID_H - 1)) * (height - 1))));
      const a = alpha[my * width + mx];
      if (a < 0.06) {
        intensity[i] *= 0.04;
      } else if (a < 0.22) {
        intensity[i] *= 0.45;
      } else {
        intensity[i] = Math.min(1, intensity[i] * (0.9 + a * 0.25));
      }
    }
  }
}

function renderCursorImageMode() {
  if (!cursorMask) return false;
  const ramp = " .:-=+*#%@";
  const cx = GRID_W * 0.5;
  const cy = GRID_H * 0.53;
  const ang = Math.sin(motionTime * 0.32) * 0.035;
  const ca = Math.cos(-ang);
  const sa = Math.sin(-ang);
  const scale = 0.98 + Math.sin(motionTime * 0.25) * 0.01;
  const skew = Math.sin(motionTime * 0.36) * 0.02;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";

  for (let y = 0; y < GRID_H; y++) {
    let line = "";
    for (let x = 0; x < GRID_W; x++) {
      const nx = (x - cx) / (GRID_W * 0.36);
      const ny = (y - cy) / (GRID_H * 0.36);
      const rx = nx * ca - ny * sa;
      const ry = nx * sa + ny * ca;
      const sx = (rx + ry * skew) / scale;
      const sy = ry / scale;
      const u = sx * 0.5 + 0.5;
      const v = sy * 0.5 + 0.5;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        line += " ";
        continue;
      }
      const ix = Math.max(0, Math.min(cursorMask.width - 1, Math.floor(u * (cursorMask.width - 1))));
      const iy = Math.max(0, Math.min(cursorMask.height - 1, Math.floor(v * (cursorMask.height - 1))));
      const i = iy * cursorMask.width + ix;
      const a = cursorMask.alpha[i];
      if (a < 0.14) {
        line += " ";
        continue;
      }
      // Preserve source logo light/dark faces with mild depth modulation.
      const sourceLuma = cursorMask.luma[i];
      const shade = 0.9 + 0.1 * Math.max(0, 1 - Math.abs(ry));
      const b = Math.max(0.08, Math.min(0.98, sourceLuma * shade));
      const ci = Math.max(0, Math.min(ramp.length - 1, Math.floor(b * (ramp.length - 1))));
      line += ramp[ci];
    }
    chars[y] = line;
    ctx.fillText(chars[y], drawOffsetX, drawOffsetY + y * cellH);
  }
  return true;
}

function render() {
  if (!triangles.length) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillText(statusMessage, 10, 12);
    return;
  }

  if (activeProfile.renderMode === "image" && renderCursorImageMode()) {
    return;
  }

  depth.fill(-1);
  intensity.fill(0);

  const light = norm(activeProfile.light || [0.42, -0.2, 0.9]);
  const projected = [];
  let minPX = Infinity;
  let maxPX = -Infinity;
  let minPY = Infinity;
  let maxPY = -Infinity;

  for (const tri of triangles) {
    const ar = rotate(tri.a);
    const br = rotate(tri.b);
    const cr = rotate(tri.c);

    const p0 = { cam: [ar[0], ar[1], ar[2] + distanceFromCam] };
    const p1 = { cam: [br[0], br[1], br[2] + distanceFromCam] };
    const p2 = { cam: [cr[0], cr[1], cr[2] + distanceFromCam] };
    if (p0.cam[2] <= 0.05 || p1.cam[2] <= 0.05 || p2.cam[2] <= 0.05) continue;

    const n = cross(sub(p1.cam, p0.cam), sub(p2.cam, p0.cam));
    const fnRaw = norm(n);
    const facing = dot(fnRaw, [0, 0, -1]);
    if (activeProfile.twoSided === false && facing <= 0) continue;
    const fn = activeProfile.twoSided === false ? fnRaw : (n[2] < 0 ? [-fnRaw[0], -fnRaw[1], -fnRaw[2]] : fnRaw);
    const baseBright = activeProfile.baseBright ?? 0.16;
    let bright = Math.min(1, baseBright + (1 - baseBright) * Math.max(0, dot(fn, light)));
    if (meshKey === "cursor_mesh_refined.csv") {
      if (tri.layer === "box") {
        bright = Math.min(1, bright * 0.62 + 0.06);
      } else if (tri.layer === "arrow") {
        bright = Math.min(1, bright * 1.05 + 0.20);
      }
    }

    p0.invz = 1 / p0.cam[2];
    p1.invz = 1 / p1.cam[2];
    p2.invz = 1 / p2.cam[2];
    if (activeProfile.projection === "ortho") {
      const os = activeProfile.orthoScale ?? 1.0;
      p0.sx = GRID_W * 0.5 + zoomLevel * os * p0.cam[0];
      p0.sy = GRID_H * 0.5 - zoomLevel * os * p0.cam[1];
      p1.sx = GRID_W * 0.5 + zoomLevel * os * p1.cam[0];
      p1.sy = GRID_H * 0.5 - zoomLevel * os * p1.cam[1];
      p2.sx = GRID_W * 0.5 + zoomLevel * os * p2.cam[0];
      p2.sy = GRID_H * 0.5 - zoomLevel * os * p2.cam[1];
    } else {
      p0.sx = GRID_W * 0.5 + zoomLevel * p0.invz * p0.cam[0] * 2;
      p0.sy = GRID_H * 0.5 - zoomLevel * p0.invz * p0.cam[1];
      p1.sx = GRID_W * 0.5 + zoomLevel * p1.invz * p1.cam[0] * 2;
      p1.sy = GRID_H * 0.5 - zoomLevel * p1.invz * p1.cam[1];
      p2.sx = GRID_W * 0.5 + zoomLevel * p2.invz * p2.cam[0] * 2;
      p2.sy = GRID_H * 0.5 - zoomLevel * p2.invz * p2.cam[1];
    }

    projected.push({ p0, p1, p2, bright });
    minPX = Math.min(minPX, p0.sx, p1.sx, p2.sx);
    maxPX = Math.max(maxPX, p0.sx, p1.sx, p2.sx);
    minPY = Math.min(minPY, p0.sy, p1.sy, p2.sy);
    maxPY = Math.max(maxPY, p0.sy, p1.sy, p2.sy);
  }

  const margin = 2.5;
  let shiftX = 0.0;
  let shiftY = 0.0;
  if (Number.isFinite(minPX) && Number.isFinite(maxPX)) {
    if (minPX < margin) shiftX += margin - minPX;
    if (maxPX > GRID_W - 1 - margin) shiftX += GRID_W - 1 - margin - maxPX;
  }
  if (Number.isFinite(minPY) && Number.isFinite(maxPY)) {
    if (minPY < margin) shiftY += margin - minPY;
    if (maxPY > GRID_H - 1 - margin) shiftY += GRID_H - 1 - margin - maxPY;
  }

  if (meshKey === "cursor_mesh_refined.csv" && activeProfile.showCornerLabels) {
    cursorCornerLabels = {
      p1: { x: minPX + shiftX, y: minPY + shiftY }, // top-left
      p2: { x: maxPX + shiftX, y: minPY + shiftY }, // top-right
      p3: { x: maxPX + shiftX, y: maxPY + shiftY }, // bottom-right
      p4: { x: minPX + shiftX, y: maxPY + shiftY }, // bottom-left
    };
  } else {
    cursorCornerLabels = null;
  }

  for (const t of projected) {
    t.p0.sx += shiftX;
    t.p1.sx += shiftX;
    t.p2.sx += shiftX;
    t.p0.sy += shiftY;
    t.p1.sy += shiftY;
    t.p2.sy += shiftY;
    rasterTriangle(t.p0, t.p1, t.p2, t.bright);
  }

  silhouettePass();
  applyGlowPass();
  applyCursorMaskPass();

  for (let y = 0; y < GRID_H; y++) {
    let line = "";
    const ramp = activeProfile.charset || CHARSET;
    for (let x = 0; x < GRID_W; x++) {
      const i = idx(x, y);
      const blended = Math.max(intensity[i], history[i] * 0.7);
      history[i] = blended;
      const minVisible = activeProfile.minVisible ?? 0.03;
      if (blended < minVisible) {
        line += " ";
      } else {
        const ci = Math.max(0, Math.min(ramp.length - 1, Math.floor(blended * (ramp.length - 1))));
        line += ramp[ci];
      }
    }
    chars[y] = line;
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  for (let y = 0; y < GRID_H; y++) {
    ctx.fillText(chars[y], drawOffsetX, drawOffsetY + y * cellH);
  }
  if (cursorCornerLabels) {
    ctx.save();
    ctx.fillStyle = "#ffd84d";
    ctx.font = "14px Menlo, Consolas, Monaco, monospace";
    ctx.fillText("1", drawOffsetX + cursorCornerLabels.p1.x * 9, drawOffsetY + cursorCornerLabels.p1.y * cellH - 8);
    ctx.fillText("2", drawOffsetX + cursorCornerLabels.p2.x * 9 - 10, drawOffsetY + cursorCornerLabels.p2.y * cellH - 8);
    ctx.fillText("3", drawOffsetX + cursorCornerLabels.p3.x * 9 - 10, drawOffsetY + cursorCornerLabels.p3.y * cellH + 8);
    ctx.fillText("4", drawOffsetX + cursorCornerLabels.p4.x * 9, drawOffsetY + cursorCornerLabels.p4.y * cellH + 8);
    ctx.restore();
  }
}

function ensureCmdkStyles() {
  if (document.getElementById("cmdk-work-style")) return;
  const style = document.createElement("style");
  style.id = "cmdk-work-style";
  style.textContent = `
    .command-kbd {
      position: fixed; top: 18px; right: 18px; color: #cfcfcf;
      border: 1px solid rgba(255, 255, 255, 0.2); border-bottom-width: 2px;
      border-radius: 8px; padding: 6px 10px; font-size: 12px; letter-spacing: 0.02em;
      background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(6px); z-index: 30; user-select: none;
    }
    .command-kbd b { color: #fff; }
    .cmdk-backdrop {
      position: fixed; inset: 0; background: rgba(0, 0, 0, 0.62); display: none;
      align-items: flex-start; justify-content: center; padding-top: 11vh; z-index: 40;
    }
    .cmdk-backdrop.open { display: flex; }
    .cmdk { width: min(680px, calc(100vw - 32px)); background: rgba(14, 14, 14, 0.96); border: 1px solid rgba(255,255,255,0.16); border-radius: 14px; overflow: hidden; box-shadow: 0 24px 70px rgba(0,0,0,0.55); }
    .cmdk-search { width: 100%; box-sizing: border-box; border: none; outline: none; padding: 14px 16px; color: #f2f2f2; font-size: 14px; background: transparent; border-bottom: 1px solid rgba(255,255,255,0.12); }
    .cmdk-list { max-height: min(55vh, 430px); overflow: auto; padding: 8px; }
    .cmdk-group { margin: 6px 0 10px; }
    .cmdk-group-label { color: #8f8f8f; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 8px; }
    .cmdk-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; border: none; border-radius: 8px; padding: 10px; color: #ececec; background: transparent; text-align: left; cursor: pointer; }
    .cmdk-item:hover, .cmdk-item.active { background: rgba(255,255,255,0.1); }
    .cmdk-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .cmdk-icon { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; opacity: 0.95; }
    .cmdk-icon-svg, .cmdk-icon-img { width: 15px; height: 15px; display: block; }
    .cmdk-meta { color: #9c9c9c; font-size: 12px; white-space: nowrap; }
    .cmdk-separator { height: 1px; margin: 8px 4px; background: rgba(255,255,255,0.13); }
  `;
  document.head.appendChild(style);
}

function ensureCmdkUI() {
  ensureCmdkStyles();
  if (!document.querySelector(".command-kbd")) {
    const k = document.createElement("div");
    k.className = "command-kbd";
    k.setAttribute("aria-hidden", "true");
    k.innerHTML = "<b>⌘/Ctrl</b> + <b>K</b>";
    document.body.appendChild(k);
  }
  cmdkBackdrop = document.getElementById("cmdk-backdrop");
  if (!cmdkBackdrop) {
    cmdkBackdrop = document.createElement("div");
    cmdkBackdrop.className = "cmdk-backdrop";
    cmdkBackdrop.id = "cmdk-backdrop";
    cmdkBackdrop.setAttribute("role", "dialog");
    cmdkBackdrop.setAttribute("aria-modal", "true");
    cmdkBackdrop.setAttribute("aria-label", "Command menu");
    cmdkBackdrop.innerHTML = `
      <div class="cmdk">
        <input id="cmdk-search" class="cmdk-search" placeholder="Search commands or links..." autocomplete="off" />
        <div id="cmdk-list" class="cmdk-list"></div>
      </div>
    `;
    document.body.appendChild(cmdkBackdrop);
  }
  cmdkSearch = document.getElementById("cmdk-search");
  cmdkList = document.getElementById("cmdk-list");
}

function loadCursorMask() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = 220;
      const h = 220;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const cx = c.getContext("2d");
      cx.clearRect(0, 0, w, h);
      // Keep logo proportions and center in mask canvas.
      const scale = Math.min((w * 0.82) / img.width, (h * 0.82) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const ox = (w - dw) * 0.5;
      const oy = (h - dh) * 0.5;
      cx.drawImage(img, ox, oy, dw, dh);
      const data = cx.getImageData(0, 0, w, h).data;
      const alpha = new Float32Array(w * h);
      const luma = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) {
        alpha[i] = data[i * 4 + 3] / 255;
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        luma[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      }
      cursorMask = { width: w, height: h, alpha, luma };
      resolve();
    };
    img.onerror = () => resolve();
    img.src = "./gltf/CUBE_25D.svg";
  });
}

function iconMarkup(icon) {
  if (icon === "linkedin") return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 10H5.67V18H8.34V10ZM7 5.88A1.54 1.54 0 1 0 7 8.96A1.54 1.54 0 0 0 7 5.88ZM18.33 13.48C18.33 10.89 16.95 9.69 15.11 9.69C13.63 9.69 12.96 10.5 12.59 11.08V10H10V18H12.67V14.04C12.67 13 12.87 11.99 14.15 11.99C15.4 11.99 15.42 13.16 15.42 14.11V18H18.09L18.33 13.48Z"/></svg>`;
  if (icon === "x") return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22L14.9 10.12L23.2 22H16.7L11.6 14.74L5.24 22H2.13L9.73 13.32L1.75 2H8.43L13.04 8.62L18.9 2ZM17.81 20.1H19.53L7.49 3.8H5.64L17.81 20.1Z"/></svg>`;
  if (icon === "github") return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.94C8.93 23.05 9.14 22.69 9.14 22.38C9.14 22.1 9.13 21.17 9.12 20.18C5.95 20.87 5.28 18.65 5.28 18.65C4.76 17.32 4 16.97 4 16.97C2.95 16.25 4.08 16.27 4.08 16.27C5.25 16.35 5.86 17.47 5.86 17.47C6.9 19.25 8.59 18.73 9.24 18.43C9.35 17.68 9.65 17.17 9.98 16.88C7.45 16.59 4.8 15.62 4.8 11.3C4.8 10.07 5.24 9.07 5.97 8.29C5.85 8 5.47 6.82 6.08 5.22C6.08 5.22 7.05 4.91 9.12 6.31C10.04 6.05 11.03 5.92 12.02 5.92C13.01 5.92 14 6.05 14.93 6.31C17 4.9 17.97 5.22 17.97 5.22C18.58 6.82 18.2 8 18.08 8.29C18.82 9.07 19.25 10.07 19.25 11.3C19.25 15.64 16.59 16.58 14.05 16.87C14.47 17.23 14.84 17.94 14.84 19.03C14.84 20.6 14.82 21.86 14.82 22.38C14.82 22.7 15.03 23.06 15.61 22.94A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>`;
  if (icon === "work-cursor") return `<img class="cmdk-icon-img" src="./gltf/CUBE_25D.svg" alt="" />`;
  if (icon === "work-cala") return `<img class="cmdk-icon-img" src="./gltf/cala_ai_logo.jpeg" alt="" />`;
  if (icon === "work-specter") return `<img class="cmdk-icon-img" src="./gltf/App Icon - White on Blue.svg" alt="" />`;
  if (icon === "work-white-circle") return `<img class="cmdk-icon-img" src="./gltf/white_circle_logo.png" alt="" />`;
  if (icon === "work-bullfinch") return `<img class="cmdk-icon-img" src="./gltf/bullfinchasset_logo.jpeg" alt="" />`;
  if (icon === "command-menu") return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4A3 3 0 0 1 10 7C10 7.35 9.94 7.68 9.82 7.98H14.18A2.98 2.98 0 0 1 14 7A3 3 0 1 1 17 10C16.65 10 16.32 9.94 16.02 9.82V14.18A2.98 2.98 0 0 1 17 14A3 3 0 1 1 14 17C14 16.65 14.06 16.32 14.18 16.02H9.82C9.94 16.32 10 16.65 10 17A3 3 0 1 1 7 14C7.35 14 7.68 14.06 7.98 14.18V9.82A2.98 2.98 0 0 1 7 10A3 3 0 1 1 7 4Z"/></svg>`;
  if (icon === "toggle-spin") return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5A7 7 0 1 1 5 12H3A9 9 0 1 0 12 3V0L17 4L12 8V5Z"/></svg>`;
  return "•";
}

function commandGroups() {
  return [
    {
      name: "Social",
      items: [
        { label: "LinkedIn", icon: "linkedin", meta: "francisco-t-334545144", url: "https://www.linkedin.com/in/francisco-t-334545144/" },
        { label: "X", icon: "x", meta: "@frankterpo", url: "https://x.com/frankterpo" },
        { label: "GitHub", icon: "github", meta: "frankterpo", url: "https://github.com/frankterpo" },
      ],
    },
    {
      name: "Work",
      items: workItems.map((w) => ({
        label: w.label,
        icon: w.icon,
        meta: w.status || "",
        action: () => switchWorkModel(w),
      })),
    },
    {
      name: "Actions",
      items: [
        { label: "Toggle Command Menu", icon: "command-menu", meta: "Cmd/Ctrl + K", action: () => setCmdkOpen(!cmdkOpen) },
        { label: "Toggle Spin", icon: "toggle-spin", meta: "Space", action: () => { autoSpin = !autoSpin; } },
      ],
    },
  ];
}

function flattenCommands(query = "") {
  const q = query.trim().toLowerCase();
  const sections = [];
  for (const group of commandGroups()) {
    const filtered = group.items.filter((item) => !q || `${item.label} ${item.meta ?? ""}`.toLowerCase().includes(q));
    if (filtered.length) sections.push({ name: group.name, items: filtered });
  }
  return sections;
}

function updateCmdkActiveVisual() {
  if (!cmdkList) return;
  const items = cmdkList.querySelectorAll(".cmdk-item");
  items.forEach((el) => el.classList.toggle("active", Number(el.dataset.index) === cmdkActive));
}

function renderCommandMenu() {
  const sections = flattenCommands(cmdkSearch?.value || "");
  const flat = sections.flatMap((s) => s.items);
  if (cmdkActive >= flat.length) cmdkActive = Math.max(0, flat.length - 1);
  if (!cmdkList) return;
  cmdkList.innerHTML = "";
  let globalIndex = 0;
  sections.forEach((section, sIdx) => {
    const g = document.createElement("div");
    g.className = "cmdk-group";
    const label = document.createElement("div");
    label.className = "cmdk-group-label";
    label.textContent = section.name;
    g.appendChild(label);
    section.items.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "cmdk-item" + (globalIndex === cmdkActive ? " active" : "");
      btn.dataset.index = String(globalIndex);
      btn.type = "button";
      btn.innerHTML = `<span class="cmdk-left"><span class="cmdk-icon">${iconMarkup(item.icon)}</span><span>${item.label}</span></span><span class="cmdk-meta">${item.meta ?? ""}</span>`;
      btn.addEventListener("mouseenter", () => { cmdkActive = Number(btn.dataset.index); updateCmdkActiveVisual(); });
      btn.addEventListener("click", () => executeCommand(item));
      g.appendChild(btn);
      globalIndex += 1;
    });
    cmdkList.appendChild(g);
    if (sIdx < sections.length - 1) {
      const sep = document.createElement("div");
      sep.className = "cmdk-separator";
      cmdkList.appendChild(sep);
    }
  });
  updateCmdkActiveVisual();
}

function setCmdkOpen(open) {
  cmdkOpen = open;
  if (!cmdkBackdrop) return;
  cmdkBackdrop.classList.toggle("open", cmdkOpen);
  if (cmdkOpen && cmdkSearch) {
    cmdkSearch.value = "";
    cmdkActive = 0;
    renderCommandMenu();
    cmdkSearch.focus();
    cmdkSearch.select();
  }
}

function executeCommand(item) {
  if (!item) return;
  if (item.url) {
    setCmdkOpen(false);
    const a = document.createElement("a");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.referrerPolicy = "no-referrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  if (item.action) item.action();
}

function handleCmdkKeydown(e) {
  if (!cmdkOpen) return false;
  const sections = flattenCommands(cmdkSearch?.value || "");
  const flat = sections.flatMap((s) => s.items);
  if (e.key === "Escape") { setCmdkOpen(false); return true; }
  if (e.key === "ArrowDown") { e.preventDefault(); cmdkActive = Math.min(flat.length - 1, cmdkActive + 1); updateCmdkActiveVisual(); return true; }
  if (e.key === "ArrowUp") { e.preventDefault(); cmdkActive = Math.max(0, cmdkActive - 1); updateCmdkActiveVisual(); return true; }
  if (e.key === "Enter") { e.preventDefault(); executeCommand(flat[cmdkActive]); return true; }
  return false;
}

function tick(ts) {
  if (typeof ts !== "number") ts = performance.now();
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.05, Math.max(0.0, (ts - lastTs) / 1000));
  lastTs = ts;
  motionTime += dt;

  if (autoSpin) {
    // OG-style motion: smooth return from user pose to routine spin.
    const base = activeProfile.pose || { a: -0.08, b: 0.0, c: 0.0 };
    const targetA = base.a + Math.sin(motionTime * 1.9) * (activeProfile.speedA ?? 0.09) * 0.35;
    const targetC = base.c + Math.sin(motionTime * 1.6 + 0.2) * (activeProfile.speedC ?? 0.05) * 0.35;
    const blend = 1.0 - Math.exp(-dt * (activeProfile.smoothReturn ?? 4.2));
    if (meshKey === "cursor_mesh_refined.csv") {
      // Cursor: same stop/go UX as other models: blend back to scripted pose.
      A += (base.a - A) * blend;
      B += dt * (activeProfile.speedB ?? -0.82);
      C += (base.c - C) * blend;
    } else {
      const targetB = base.b + motionTime * (activeProfile.speedB ?? 0.7);
      A += (targetA - A) * blend;
      B += (targetB - B) * blend;
      C += (targetC - C) * blend;
    }
  }

  render();
  requestAnimationFrame(tick);
}

function parseTrianglesFromCsvText(txt, layer = null) {
  const verts = [];
  const out = [];
  for (const raw of txt.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const nums = line.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
    if (!nums || nums.length < 3) continue;
    const x = Number(nums[0]);
    const y = Number(nums[1]);
    const z = Number(nums[2]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      verts.push([x, y, z]);
    }
  }
  for (let i = 0; i + 2 < verts.length; i += 3) {
    out.push({ a: verts[i], b: verts[i + 1], c: verts[i + 2], layer });
  }
  return out;
}

function scaleTriangleSet(tris, scale) {
  if (!tris.length || scale === 1.0) return tris;
  let cx = 0.0;
  let cy = 0.0;
  let cz = 0.0;
  let count = 0;
  for (const t of tris) {
    for (const p of [t.a, t.b, t.c]) {
      cx += p[0];
      cy += p[1];
      cz += p[2];
      count += 1;
    }
  }
  cx /= count;
  cy /= count;
  cz /= count;
  return tris.map((t) => ({
    ...t,
    a: [(t.a[0] - cx) * scale + cx, (t.a[1] - cy) * scale + cy, (t.a[2] - cz) * scale + cz],
    b: [(t.b[0] - cx) * scale + cx, (t.b[1] - cy) * scale + cy, (t.b[2] - cz) * scale + cz],
    c: [(t.c[0] - cx) * scale + cx, (t.c[1] - cy) * scale + cy, (t.c[2] - cz) * scale + cz],
  }));
}

async function loadMesh(path) {
  const version = ++loadVersion;
  if (meshKey === "cursor_mesh_refined.csv") {
    const [boxRes, arrowRes] = await Promise.all([
      fetch("./cursor_box_mesh.csv", { cache: "no-store" }),
      fetch("./cursor_arrow_mesh.csv", { cache: "no-store" }),
    ]);
    if (!boxRes.ok || !arrowRes.ok) throw new Error("Failed to load cursor layered meshes");
    const [boxTxt, arrowTxt] = await Promise.all([boxRes.text(), arrowRes.text()]);
    const nextTriangles = [
      ...parseTrianglesFromCsvText(boxTxt, "box"),
      ...scaleTriangleSet(parseTrianglesFromCsvText(arrowTxt, "arrow"), CURSOR_ARROW_SCALE),
    ];
    if (!nextTriangles.length) throw new Error("Cursor layered meshes are empty");
    if (version !== loadVersion) return;
    triangles = nextTriangles;
    history.fill(0);
    return;
  }

  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  const txt = await res.text();
  const nextTriangles = parseTrianglesFromCsvText(txt);
  if (!nextTriangles.length) {
    throw new Error(`Parsed mesh but found 0 triangles in ${path}`);
  }
  if (version !== loadVersion) return;
  triangles = nextTriangles;
  history.fill(0);
}

async function switchWorkModel(work) {
  meshPath = work.mesh;
  meshKey = meshPath.split("?")[0];
  activeProfile = MODEL_PROFILES[meshKey] || MODEL_PROFILES["hand_mesh.csv"];
  zoomLevel = activeProfile.zoom;
  distanceFromCam = activeProfile.distance;
  if (meshPath === "cursor_mesh_refined.csv") {
    autoSpin = true;
    const pose = loadCursorStartPose() || activeProfile.pose || { a: -0.55, b: 0.78, c: 0.0 };
    A = pose.a;
    B = pose.b;
    C = pose.c;
  } else if (meshPath === "specter_mesh_refined.csv") {
    A = -0.08;
    B = 0.0;
    C = 0.0;
    autoSpin = true;
  }
  statusMessage = `Loading ${meshPath}...`;
  setCmdkOpen(false);
  await loadMesh(`./${meshPath}`);
  statusMessage = "";
  const page = document.querySelector(".breadcrumb-page");
  if (page) page.textContent = work.label;
  const active = document.querySelectorAll(".breadcrumb-menu-item");
  active.forEach((el) => {
    el.classList.toggle("active", el.getAttribute("href") === work.page);
  });
}

window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    setCmdkOpen(!cmdkOpen);
    return;
  }
  if (cmdkOpen) {
    if (handleCmdkKeydown(e)) return;
    return;
  }
  if (e.key === " ") {
    autoSpin = !autoSpin;
    e.preventDefault();
    return;
  }
  if (e.key === "ArrowUp") {
    autoSpin = false;
    A -= 0.08;
  }
  if (e.key === "ArrowDown") {
    autoSpin = false;
    A += 0.08;
  }
  if (e.key === "ArrowLeft") {
    autoSpin = false;
    B -= 0.08;
  }
  if (e.key === "ArrowRight") {
    autoSpin = false;
    B += 0.08;
  }
});

function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textBaseline = "top";
  ctx.font = "16px Menlo, Consolas, Monaco, monospace";
  const metrics = ctx.measureText("M");
  const cellW = Math.ceil(metrics.width);
  cellH = 18;
  drawOffsetX = Math.floor((window.innerWidth - GRID_W * cellW) * 0.5);
  drawOffsetY = Math.floor((window.innerHeight - GRID_H * cellH) * 0.5);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

async function init() {
  try {
    meshKey = meshPath.split("?")[0];
    activeProfile = MODEL_PROFILES[meshKey] || MODEL_PROFILES["hand_mesh.csv"];
    zoomLevel = activeProfile.zoom;
    distanceFromCam = activeProfile.distance;
    if (activeProfile.pose) {
      if (meshKey === "cursor_mesh_refined.csv") {
        const pose = loadCursorStartPose() || activeProfile.pose;
        A = pose.a ?? A;
        B = pose.b ?? B;
        C = pose.c ?? C;
      } else {
        A = activeProfile.pose.a ?? A;
        B = activeProfile.pose.b ?? B;
        C = activeProfile.pose.c ?? C;
      }
    }
    ensureCmdkUI();
    await loadCursorMask();
    cmdkBackdrop.addEventListener("mousedown", (e) => { if (e.target === cmdkBackdrop) setCmdkOpen(false); });
    cmdkSearch.addEventListener("keydown", (e) => { if (handleCmdkKeydown(e)) e.stopPropagation(); });
    cmdkSearch.addEventListener("input", () => { cmdkActive = 0; renderCommandMenu(); });
    await loadMesh(`./${meshPath}`);
    statusMessage = "";
    requestAnimationFrame(tick);
  } catch (err) {
    statusMessage = `Render failed: ${err?.message || err}`;
    render();
    console.error(err);
  }
}

init();
