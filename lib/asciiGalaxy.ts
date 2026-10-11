export type GalaxyView = {
  yaw: number;
  pitch: number;
  zoom: number;
};

export type GalaxyHandle = {
  setView: (view: GalaxyView, auto?: boolean) => void;
  reset: (view: GalaxyView) => void;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
};

const TAU = Math.PI * 2;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const HOME_VIEW: GalaxyView = { yaw: 0.35, pitch: 0.83, zoom: 1 };

export function startAsciiGalaxy(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  options?: { reducedMotion?: boolean; initialView?: GalaxyView },
): GalaxyHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let seed = 24171;
  function rand() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function gauss() {
    return Math.sqrt(-2 * Math.log(Math.max(rand(), 0.000001))) * Math.cos(TAU * rand());
  }

  const ramp = " .,:;+=*oO#%@$";
  const palette = [
    [177, 194, 225],
    [105, 146, 205],
    [255, 211, 151],
    [233, 144, 105],
    [240, 169, 92],
    [254, 227, 167],
    [105, 120, 166],
    [247, 246, 230],
  ] as const;

  const arms: Array<{ r: number; a: number; z: number; col: number; v: number }> = [];
  const halo: Array<{ r: number; a: number; z: number; col: number; v: number }> = [];
  const disk: Array<{ r: number; a: number; z: number; col: number; v: number }> = [];
  const back: Array<{ u: number; v: number; phase: number; brightness: number; col: number }> = [];
  const systems: Array<{
    r: number;
    a: number;
    col: number;
    planets: Array<{
      a: number;
      e: number;
      n: number;
      phase: number;
      node: number;
      incl: number;
      col: number;
    }>;
  }> = [];

  for (let i = 0; i < 3500; i++) {
    const r = clamp(0.18 + Math.pow(rand(), 0.72) * 3.1, 0.18, 3.3);
    const arm = Math.floor(rand() * 4);
    const angle = (arm * TAU) / 4 + Math.log(r / 0.25) * 2.9 + gauss() * (0.16 + 0.08 * r);
    const b = rand();
    arms.push({
      r,
      a: angle,
      z: gauss() * (0.024 + 0.02 * r),
      col: b < 0.23 ? 1 : b < 0.4 ? 2 : b < 0.44 ? 3 : 0,
      v: 0.18 + rand() * 0.72,
    });
  }

  for (let i = 0; i < 530; i++) {
    const r = Math.abs(gauss()) * 0.76;
    halo.push({
      r,
      a: rand() * TAU,
      z: gauss() * 0.16,
      col: rand() < 0.18 ? 2 : 6,
      v: 0.13 + rand() * 0.43,
    });
  }

  for (let i = 0; i < 850; i++) {
    const r = 0.16 + Math.sqrt(rand()) * 0.51;
    disk.push({
      r,
      a: rand() * TAU,
      z: gauss() * 0.012,
      v: 0.45 + rand() * 0.58,
      col: rand() < 0.45 ? 4 : 5,
    });
  }

  for (let i = 0; i < 330; i++) {
    back.push({
      u: rand(),
      v: rand(),
      phase: rand(),
      brightness: 0.13 + rand() * 0.42,
      col: rand() < 0.25 ? 1 : 6,
    });
  }

  for (let i = 0; i < 6; i++) {
    const r = 0.85 + i * 0.32;
    const a = i * 2.34 + 0.4;
    const planets = [];
    for (let p = 0; p < 1 + (i % 3); p++) {
      const semi = 0.11 + p * 0.065 + rand() * 0.035;
      const e = 0.06 + rand() * 0.24;
      planets.push({
        a: semi,
        e,
        n: Math.sqrt(0.0006 / Math.pow(semi, 3)),
        phase: rand() * TAU,
        node: rand() * TAU,
        incl: 0.25 + rand() * 0.7,
        col: (i + p) % 4,
      });
    }
    systems.push({
      r,
      a,
      planets,
      col: i % 3 === 0 ? 7 : i % 3 === 1 ? 1 : 2,
    });
  }

  let W = 700;
  let H = 500;
  let dpr = 1;
  let font = 11;
  let cw = 7;
  let ch = 13;
  let cols = 100;
  let rows = 40;
  let energy: Float32Array | undefined;
  let colID: Uint8Array | undefined;
  let priority: Float32Array | undefined;

  const initial = options?.initialView ?? HOME_VIEW;
  const state = {
    t: 0,
    velocity: 1,
    paused: Boolean(options?.reducedMotion),
    yaw: initial.yaw,
    targetYaw: initial.yaw,
    pitch: initial.pitch,
    targetPitch: initial.pitch,
    zoom: initial.zoom,
    targetZoom: initial.zoom,
    auto: !options?.reducedMotion,
    frame: 0,
    last: 0,
  };

  function galaxyOmega(r: number) {
    return Math.sqrt(0.0004 / Math.pow(r * r + 0.055, 1.5) + 0.005 / (r * r + 0.15));
  }

  function project(x: number, y: number, z: number) {
    const c = Math.cos(state.yaw);
    const s = Math.sin(state.yaw);
    const xx = x * c - y * s;
    const yy = x * s + y * c;
    const cp = Math.cos(state.pitch);
    const sp = Math.sin(state.pitch);
    const zz = yy * sp + z * cp;
    const dy = yy * cp - z * sp;
    const scale = ((Math.min(W / 6.9, H / 3.5) * state.zoom * 7) / (7 + 0.4 * zz));
    return {
      x: W * 0.5 + xx * scale,
      y: H * 0.51 + dy * scale,
      scale,
    };
  }

  function put(x: number, y: number, v: number, col: number) {
    if (!energy || !priority || !colID) return;
    const cx = Math.floor(x / cw);
    const cy = Math.floor(y / ch);
    if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) return;
    const k = cy * cols + cx;
    energy[k] = Math.min(2.5, energy[k] + v);
    if (v > priority[k]) {
      priority[k] = v;
      colID[k] = col;
    }
  }

  function solveE(M: number, e: number) {
    let E = M;
    for (let i = 0; i < 5; i++) {
      E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
  }

  function draw() {
    if (!energy || !priority || !colID) return;
    energy.fill(0);
    priority.fill(0);
    colID.fill(0);

    const t = state.t;

    for (const p of back) {
      put(
        (p.u * W + Math.sin(state.yaw) * p.phase * 35 + W) % W,
        (p.v * H + Math.cos(state.pitch) * p.phase * 15 + H) % H,
        p.brightness * 0.43,
        p.col,
      );
    }

    for (const p of arms) {
      const a = p.a + t * galaxyOmega(p.r);
      const v = project(p.r * Math.cos(a), p.r * Math.sin(a), p.z);
      put(v.x, v.y, p.v * (1.15 - 0.17 * p.r), p.col);
    }

    for (const p of halo) {
      const a = p.a + t * galaxyOmega(p.r) * 0.8;
      const v = project(p.r * Math.cos(a), p.r * Math.sin(a), p.z);
      put(v.x, v.y, p.v, p.col);
    }

    for (const p of disk) {
      const a = p.a + t * 0.034 / Math.pow(p.r, 1.5);
      const v = project(p.r * Math.cos(a), p.r * Math.sin(a), p.z);
      const doppler = clamp(0.86 + 0.43 * Math.cos(a - state.yaw), 0.35, 1.3);
      put(v.x, v.y, p.v * doppler, p.col);
    }

    const center = project(0, 0, 0);
    const rad = 0.17 * center.scale;

    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * ch - center.y;
      if (Math.abs(y) > rad) continue;
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5) * cw - center.x;
        if (x * x + y * y < rad * rad * 0.85) {
          const k = row * cols + col;
          energy[k] = 0;
          priority[k] = 0;
        }
      }
    }

    for (let a = 0; a < TAU; a += 0.045) {
      put(
        center.x + rad * Math.cos(a),
        center.y + rad * Math.sin(a),
        0.7 + 0.45 * Math.max(0, Math.cos(a - state.yaw)),
        a > Math.PI ? 5 : 4,
      );
    }

    for (let a = 3.43; a < 6.05; a += 0.07) {
      put(center.x + rad * 1.48 * Math.cos(a), center.y + rad * 1.48 * Math.sin(a), 0.27, 7);
    }

    for (const s of systems) {
      const a = s.a + t * galaxyOmega(s.r);
      const x = s.r * Math.cos(a);
      const y = s.r * Math.sin(a);
      const star = project(x, y, 0.03);
      put(star.x, star.y, 2.5, s.col);

      for (const p of s.planets) {
        const M = p.phase + t * p.n;
        const E = solveE(M, p.e);
        const ox = p.a * (Math.cos(E) - p.e);
        const oy = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
        const cs = Math.cos(p.node);
        const sn = Math.sin(p.node);
        const xx = x + ox * cs - oy * sn;
        const yy = y + (ox * sn + oy * cs) * Math.cos(p.incl);
        const zz = (ox * sn + oy * cs) * Math.sin(p.incl);
        const pt = project(xx, yy, zz);
        put(pt.x, pt.y, 1.8, p.col);

        for (let j = 0; j < 22; j++) {
          const q = (j * TAU) / 22;
          const ex = p.a * (Math.cos(q) - p.e);
          const ey = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(q);
          const po = project(
            x + ex * cs - ey * sn,
            y + (ex * sn + ey * cs) * Math.cos(p.incl),
            (ex * sn + ey * cs) * Math.sin(p.incl),
          );
          put(po.x, po.y, 0.11, 6);
        }
      }
    }

    if (!ctx) return;
    ctx.fillStyle = "#03050a";
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${font}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const k = y * cols + x;
        const v = energy[k];
        if (v < 0.13) continue;
        const idx = clamp(
          Math.floor(Math.pow(Math.min(v, 1.8) / 1.8, 0.68) * (ramp.length - 1)),
          1,
          ramp.length - 1,
        );
        const rgb = palette[colID[k]];
        const alpha = clamp(0.2 + v * 0.54, 0.22, 1);
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
        ctx.fillText(ramp[idx], (x + 0.5) * cw, (y + 0.5) * ch);
      }
    }
  }

  function resize() {
    if (!ctx) return;
    const rect = root.getBoundingClientRect();
    W = Math.max(300, rect.width);
    H = Math.max(320, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    font = clamp(W / 108, 9.2, 12.6);
    cw = font * 0.64;
    ch = font * 1.14;
    cols = Math.ceil(W / cw);
    rows = Math.ceil(H / ch);
    energy = new Float32Array(cols * rows);
    priority = new Float32Array(cols * rows);
    colID = new Uint8Array(cols * rows);
    draw();
  }

  let raf = 0;
  function animate(now: number) {
    const dt = Math.min((now - (state.last || now)) / 1000, 0.065);
    state.last = now;
    if (!state.paused) {
      state.t += dt * state.velocity;
      if (state.auto) state.targetYaw += dt * 0.014;
    }
    state.yaw += (state.targetYaw - state.yaw) * Math.min(1, dt * 5);
    state.pitch += (state.targetPitch - state.pitch) * Math.min(1, dt * 5);
    state.zoom += (state.targetZoom - state.zoom) * Math.min(1, dt * 5);
    if (now - state.frame > 34 && !document.hidden) {
      draw();
      state.frame = now;
    }
    raf = requestAnimationFrame(animate);
  }

  const pointers = new Map<number, { x: number; y: number; startX: number; startY: number; inPanel: boolean; locked: boolean }>();
  let oldX = 0;
  let oldY = 0;
  let pinch = 0;
  const ignoreDrag = "a, button, input, textarea, select, label, .star-rating, .site-footer";

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest(ignoreDrag)) return;
    const inPanel = e.pointerType === "touch" && Boolean(target?.closest(".panel"));
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      inPanel,
      locked: !inPanel,
    });
    oldX = e.clientX;
    oldY = e.clientY;
    pinch = 0;
    if (inPanel) return;
    state.auto = false;
    try {
      root.setPointerCapture(e.pointerId);
    } catch {
      // iOS and already-released pointers still rotate from window move events.
    }
    canvas.style.cursor = "grabbing";
    if (e.cancelable) e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const next = { ...prev, x: e.clientX, y: e.clientY };
    if (prev.inPanel && !prev.locked) {
      const totalX = e.clientX - prev.startX;
      const totalY = e.clientY - prev.startY;
      if (Math.hypot(totalX, totalY) < 12) return;
      if (Math.abs(totalY) >= Math.abs(totalX)) {
        pointers.delete(e.pointerId);
        return;
      }
      next.locked = true;
      state.auto = false;
    }
    pointers.set(e.pointerId, next);
    if (pointers.size >= 2) {
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinch) state.targetZoom = clamp(state.targetZoom * (dist / pinch), 0.6, 2.5);
      pinch = dist;
      if (e.cancelable) e.preventDefault();
      return;
    }
    if (prev.inPanel && !next.locked) return;
    state.targetYaw += (e.clientX - oldX) * 0.008;
    state.targetPitch += (e.clientY - oldY) * 0.008;
    oldX = e.clientX;
    oldY = e.clientY;
    if ((e.pointerType === "touch" || next.locked) && e.cancelable) e.preventDefault();
  };

  const onPointerUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      pinch = 0;
      canvas.style.cursor = "grab";
    } else {
      const remaining = pointers.values().next().value;
      if (remaining) {
        oldX = remaining.x;
        oldY = remaining.y;
      }
      pinch = 0;
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    state.targetZoom = clamp(state.targetZoom * Math.exp(-e.deltaY * 0.001), 0.6, 2.5);
    state.auto = false;
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: false, capture: true });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  root.addEventListener("wheel", onWheel, { passive: false });

  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();
  raf = requestAnimationFrame(animate);

  return {
    setView(view, auto = false) {
      state.targetYaw = view.yaw;
      state.targetPitch = view.pitch;
      state.targetZoom = view.zoom;
      state.auto = auto;
    },
    reset(view) {
      state.t = 0;
      state.yaw = view.yaw;
      state.targetYaw = view.yaw;
      state.pitch = view.pitch;
      state.targetPitch = view.pitch;
      state.zoom = view.zoom;
      state.targetZoom = view.zoom;
      state.auto = !options?.reducedMotion;
      state.paused = Boolean(options?.reducedMotion);
      draw();
    },
    setPaused(paused) {
      state.paused = paused;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("wheel", onWheel);
    },
  };
}
