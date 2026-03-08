const GRID_W = 84;
const GRID_H = 42;
const CHARSET = " .,:-=+*#%@";

const canvas = document.getElementById("ascii");
const ctx = canvas.getContext("2d");
const cmdkBackdrop = document.getElementById("cmdk-backdrop");
const cmdkSearch = document.getElementById("cmdk-search");
const cmdkList = document.getElementById("cmdk-list");
let cellW = 10;
let cellH = 18;
let drawOffsetX = 0;
let drawOffsetY = 0;

let A = 0.0;
let B = 0.0;
let C = 0.0;
let autoMotion = true;
let statusMessage = "Loading mesh...";
let motionOffsetY = 0.0;
let yawOrbit = 0.0;
let motionTime = 0.0;
let lastTs = 0.0;

const baseA = -0.16;
const baseB = 0.0;
const baseC = -0.05;

const distanceFromCam = 46.0;
const zoomLevel = 65.0;

const depth = new Float32Array(GRID_W * GRID_H);
const intensity = new Float32Array(GRID_W * GRID_H);
const history = new Float32Array(GRID_W * GRID_H);
const chars = new Array(GRID_H).fill("");

/** @type {{a:number[],b:number[],c:number[]}[]} */
let triangles = [];
let wristPivot = [0, 0, 0];
let palmPivot = [0, 0, 0];
let cmdkOpen = false;
let cmdkActive = 0;

const commandGroups = [
  {
    name: "Social",
    items: [
      {
        label: "LinkedIn",
        icon: "linkedin",
        meta: "francisco-t-334545144",
        url: "https://www.linkedin.com/in/francisco-t-334545144/",
      },
      {
        label: "X",
        icon: "x",
        meta: "@frankterpo",
        url: "https://x.com/frankterpo",
      },
      {
        label: "GitHub",
        icon: "github",
        meta: "frankterpo",
        url: "https://github.com/frankterpo",
      },
    ],
  },
  {
    name: "Actions",
    items: [
      {
        label: "Toggle Command Menu",
        icon: "⌘",
        meta: "Cmd/Ctrl + K",
        action: () => setCmdkOpen(!cmdkOpen),
      },
      {
        label: "Toggle Pinch Motion",
        icon: "↕",
        meta: "Space",
        action: () => {
          autoMotion = !autoMotion;
        },
      },
    ],
  },
];

function idx(x, y) {
  return y * GRID_W + x;
}

function flattenCommands(query = "") {
  const q = query.trim().toLowerCase();
  const sections = [];
  for (const group of commandGroups) {
    const filtered = group.items.filter((item) => {
      if (!q) return true;
      return `${item.label} ${item.meta ?? ""}`.toLowerCase().includes(q);
    });
    if (filtered.length) {
      sections.push({ name: group.name, items: filtered });
    }
  }
  return sections;
}

function iconMarkup(icon) {
  if (icon === "linkedin") {
    return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 10H5.67V18H8.34V10ZM7 5.88A1.54 1.54 0 1 0 7 8.96A1.54 1.54 0 0 0 7 5.88ZM18.33 13.48C18.33 10.89 16.95 9.69 15.11 9.69C13.63 9.69 12.96 10.5 12.59 11.08V10H10V18H12.67V14.04C12.67 13 12.87 11.99 14.15 11.99C15.4 11.99 15.42 13.16 15.42 14.11V18H18.09L18.33 13.48Z"/>
    </svg>`;
  }
  if (icon === "x") {
    return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M18.9 2H22L14.9 10.12L23.2 22H16.7L11.6 14.74L5.24 22H2.13L9.73 13.32L1.75 2H8.43L13.04 8.62L18.9 2ZM17.81 20.1H19.53L7.49 3.8H5.64L17.81 20.1Z"/>
    </svg>`;
  }
  if (icon === "github") {
    return `<svg class="cmdk-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12A11.5 11.5 0 0 0 8.36 22.94C8.93 23.05 9.14 22.69 9.14 22.38C9.14 22.1 9.13 21.17 9.12 20.18C5.95 20.87 5.28 18.65 5.28 18.65C4.76 17.32 4 16.97 4 16.97C2.95 16.25 4.08 16.27 4.08 16.27C5.25 16.35 5.86 17.47 5.86 17.47C6.9 19.25 8.59 18.73 9.24 18.43C9.35 17.68 9.65 17.17 9.98 16.88C7.45 16.59 4.8 15.62 4.8 11.3C4.8 10.07 5.24 9.07 5.97 8.29C5.85 8 5.47 6.82 6.08 5.22C6.08 5.22 7.05 4.91 9.12 6.31C10.04 6.05 11.03 5.92 12.02 5.92C13.01 5.92 14 6.05 14.93 6.31C17 4.9 17.97 5.22 17.97 5.22C18.58 6.82 18.2 8 18.08 8.29C18.82 9.07 19.25 10.07 19.25 11.3C19.25 15.64 16.59 16.58 14.05 16.87C14.47 17.23 14.84 17.94 14.84 19.03C14.84 20.6 14.82 21.86 14.82 22.38C14.82 22.7 15.03 23.06 15.61 22.94A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/>
    </svg>`;
  }
  return icon ?? "•";
}

function updateCmdkActiveVisual() {
  const items = cmdkList.querySelectorAll(".cmdk-item");
  items.forEach((el) => {
    const active = Number(el.dataset.index) === cmdkActive;
    el.classList.toggle("active", active);
  });
}

function renderCommandMenu() {
  const sections = flattenCommands(cmdkSearch.value);
  const flat = sections.flatMap((s) => s.items);
  if (cmdkActive >= flat.length) cmdkActive = Math.max(0, flat.length - 1);

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
      btn.innerHTML = `
        <span class="cmdk-left">
          <span class="cmdk-icon">${iconMarkup(item.icon)}</span>
          <span>${item.label}</span>
        </span>
        <span class="cmdk-meta">${item.meta ?? ""}</span>
      `;
      btn.addEventListener("mouseenter", () => {
        cmdkActive = Number(btn.dataset.index);
        updateCmdkActiveVisual();
      });
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

function executeCommand(item) {
  if (!item) return;
  if (item.url) {
    setCmdkOpen(false);
    const w = window.open(item.url, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = item.url;
    return;
  }
  if (item.action) item.action();
  setCmdkOpen(false);
}

function handleCmdkKeydown(e) {
  if (!cmdkOpen) return false;
  const sections = flattenCommands(cmdkSearch.value);
  const flat = sections.flatMap((s) => s.items);
  if (e.key === "Escape") {
    setCmdkOpen(false);
    return true;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    cmdkActive = Math.min(flat.length - 1, cmdkActive + 1);
    updateCmdkActiveVisual();
    return true;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    cmdkActive = Math.max(0, cmdkActive - 1);
    updateCmdkActiveVisual();
    return true;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    executeCommand(flat[cmdkActive]);
    return true;
  }
  return false;
}

function setCmdkOpen(open) {
  cmdkOpen = open;
  cmdkBackdrop.classList.toggle("open", cmdkOpen);
  if (cmdkOpen) {
    cmdkSearch.value = "";
    cmdkActive = 0;
    renderCommandMenu();
    cmdkSearch.focus();
    cmdkSearch.select();
  }
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

function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function rotateWithAngles(p, a, b, c) {
  const [x, y, z] = p;
  return [
    x * Math.cos(c) * Math.cos(b) +
      y * (Math.cos(c) * Math.sin(b) * Math.sin(a) - Math.sin(c) * Math.cos(a)) +
      z * (Math.cos(c) * Math.sin(b) * Math.cos(a) + Math.sin(c) * Math.sin(a)),
    x * Math.sin(c) * Math.cos(b) +
      y * (Math.sin(c) * Math.sin(b) * Math.sin(a) + Math.cos(c) * Math.cos(a)) +
      z * (Math.sin(c) * Math.sin(b) * Math.cos(a) - Math.cos(c) * Math.sin(a)),
    x * -Math.sin(b) + y * Math.cos(b) * Math.sin(a) + z * Math.cos(b) * Math.cos(a),
  ];
}

function rotateAroundPivot(p, pivot, a, b, c) {
  const local = sub(p, pivot);
  const r = rotateWithAngles(local, a, b, c);
  return add(r, pivot);
}

function applyMotionTransform(p) {
  // 1) Pinch articulation around wrist.
  const gesture = rotateAroundPivot(p, wristPivot, A, 0.0, C);
  // 2) Vertical-axis yaw around palm center (natural showcase orbit).
  const yawed = rotateAroundPivot(gesture, palmPivot, 0.0, B, 0.0);
  return [yawed[0], yawed[1] + motionOffsetY, yawed[2]];
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
      let edge = false;
      if (depth[l] <= 0 || depth[r] <= 0 || depth[u] <= 0 || depth[d] <= 0) {
        edge = true;
      } else {
        const t = 0.0018;
        edge =
          Math.abs(z - depth[l]) > t ||
          Math.abs(z - depth[r]) > t ||
          Math.abs(z - depth[u]) > t ||
          Math.abs(z - depth[d]) > t;
      }
      if (edge) intensity[i] = Math.max(copy[i], 1.0);
    }
  }
}

function render() {
  if (!triangles.length) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillText(statusMessage, 10, 12);
    return;
  }

  depth.fill(-1);
  intensity.fill(0);

  const light = norm([0.45, -0.35, 0.82]);
  const projected = [];
  let minPX = Infinity;
  let maxPX = -Infinity;
  let minPY = Infinity;
  let maxPY = -Infinity;

  for (const tri of triangles) {
    const ar = applyMotionTransform(tri.a);
    const br = applyMotionTransform(tri.b);
    const cr = applyMotionTransform(tri.c);

    const p0 = { cam: [ar[0], ar[1], ar[2] + distanceFromCam] };
    const p1 = { cam: [br[0], br[1], br[2] + distanceFromCam] };
    const p2 = { cam: [cr[0], cr[1], cr[2] + distanceFromCam] };
    if (p0.cam[2] <= 0.05 || p1.cam[2] <= 0.05 || p2.cam[2] <= 0.05) continue;

    const n = cross(sub(p1.cam, p0.cam), sub(p2.cam, p0.cam));
    // Two-sided fallback to avoid fully blank output from winding/culling issues.
    const fnRaw = norm(n);
    const fn = n[2] < 0 ? [-fnRaw[0], -fnRaw[1], -fnRaw[2]] : fnRaw;
    const diff = Math.max(0, dot(fn, light));
    const bright = Math.min(1, 0.16 + 0.84 * diff);

    p0.invz = 1 / p0.cam[2];
    p1.invz = 1 / p1.cam[2];
    p2.invz = 1 / p2.cam[2];
    p0.sx = GRID_W * 0.5 + zoomLevel * p0.invz * p0.cam[0] * 2;
    // Flip vertical projection so fingertips point upward and wrist stays lower.
    p0.sy = GRID_H * 0.5 - zoomLevel * p0.invz * p0.cam[1];
    p1.sx = GRID_W * 0.5 + zoomLevel * p1.invz * p1.cam[0] * 2;
    p1.sy = GRID_H * 0.5 - zoomLevel * p1.invz * p1.cam[1];
    p2.sx = GRID_W * 0.5 + zoomLevel * p2.invz * p2.cam[0] * 2;
    p2.sy = GRID_H * 0.5 - zoomLevel * p2.invz * p2.cam[1];

    projected.push({ p0, p1, p2, bright });
    minPX = Math.min(minPX, p0.sx, p1.sx, p2.sx);
    maxPX = Math.max(maxPX, p0.sx, p1.sx, p2.sx);
    minPY = Math.min(minPY, p0.sy, p1.sy, p2.sy);
    maxPY = Math.max(maxPY, p0.sy, p1.sy, p2.sy);
  }

  // Keep full model framed inside ASCII grid while preserving motion.
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

  for (let y = 0; y < GRID_H; y++) {
    let line = "";
    for (let x = 0; x < GRID_W; x++) {
      const i = idx(x, y);
      const blended = Math.max(intensity[i], history[i] * 0.72);
      history[i] = blended;
      if (blended < 0.03) {
        line += " ";
      } else {
        const ci = Math.max(0, Math.min(CHARSET.length - 1, Math.floor(blended * (CHARSET.length - 1))));
        line += CHARSET[ci];
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
}

function tick(ts) {
  if (typeof ts !== "number") ts = performance.now();
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.05, Math.max(0.0, (ts - lastTs) / 1000));
  lastTs = ts;

  if (autoMotion) {
    // Phase-based motion time: pause/resume without jumping ahead.
    motionTime += dt;
    const t = motionTime;
    // V2: pinch-hand gesture + smooth vertical-axis orbit (front/side/back views).
    yawOrbit = t * 0.58;
    const targetA = baseA + Math.sin(t * 2.25) * 0.23;
    const targetB = baseB + yawOrbit + Math.sin(t * 2.25 + 0.45) * 0.08;
    const targetC = baseC + Math.sin(t * 2.25 - 0.25) * 0.14;
    const targetY = Math.sin(t * 2.25) * 0.52;

    // Smoothly blend from the user pose back into routine motion.
    const blend = 1.0 - Math.exp(-dt * 4.2);
    A += (targetA - A) * blend;
    B += (targetB - B) * blend;
    C += (targetC - C) * blend;
    motionOffsetY += (targetY - motionOffsetY) * blend;
  }
  render();
  requestAnimationFrame(tick);
}

async function loadMesh() {
  const res = await fetch("./hand_mesh.csv");
  if (!res.ok) {
    throw new Error(`Failed to load hand_mesh.csv (${res.status})`);
  }
  const txt = await res.text();
  const verts = [];
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const raw of txt.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    // Robust parse supports csv/space/tab and scientific notation.
    const nums = line.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
    if (!nums || nums.length < 3) continue;
    const x = Number(nums[0]);
    const y = Number(nums[1]);
    const z = Number(nums[2]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      verts.push([x, y, z]);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  }
  for (let i = 0; i + 2 < verts.length; i += 3) {
    triangles.push({ a: verts[i], b: verts[i + 1], c: verts[i + 2] });
  }
  if (!triangles.length) {
    const preview = txt.slice(0, 120).replace(/\n/g, "\\n");
    throw new Error(`Parsed 0 triangles. verts=${verts.length}. file_preview=${preview}`);
  }
  // Estimate wrist pivot from bounding box: near left side and lower portion.
  wristPivot = [
    minX + (maxX - minX) * 0.14,
    minY + (maxY - minY) * 0.18,
    (minZ + maxZ) * 0.5,
  ];
  // Palm-centered pivot for yaw orbit (closer to natural hand turn).
  palmPivot = [
    minX + (maxX - minX) * 0.34,
    minY + (maxY - minY) * 0.40,
    (minZ + maxZ) * 0.5,
  ];
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
    autoMotion = !autoMotion;
    e.preventDefault();
    return;
  }
  if (e.key === "ArrowUp") {
    autoMotion = false;
    A -= 0.08;
  }
  if (e.key === "ArrowDown") {
    autoMotion = false;
    A += 0.08;
  }
  if (e.key === "ArrowLeft") {
    autoMotion = false;
    B -= 0.08;
  }
  if (e.key === "ArrowRight") {
    autoMotion = false;
    B += 0.08;
  }
});

cmdkBackdrop.addEventListener("mousedown", (e) => {
  if (e.target === cmdkBackdrop) setCmdkOpen(false);
});
cmdkSearch.addEventListener("keydown", (e) => {
  if (handleCmdkKeydown(e)) e.stopPropagation();
});
cmdkSearch.addEventListener("input", () => {
  cmdkActive = 0;
  renderCommandMenu();
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
  cellW = Math.ceil(metrics.width);
  cellH = 18;
  const artW = GRID_W * cellW;
  // Center render in viewport.
  drawOffsetX = Math.floor((window.innerWidth - artW) * 0.5);
  drawOffsetY = Math.floor((window.innerHeight - GRID_H * cellH) * 0.5);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

async function init() {
  try {
    await loadMesh();
    statusMessage = "";
    requestAnimationFrame(tick);
  } catch (err) {
    statusMessage = `Render failed: ${err?.message || err}`;
    render();
    console.error(err);
  }
}

init();
