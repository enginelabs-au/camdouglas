import {
  Camera,
  PALETTE,
  RAMP,
  clamp,
  densityGain,
  diskDoppler,
  emitOverlay,
  type GalaxyModel,
  type Renderer,
  type ViewState,
} from "@/lib/galaxy/model";

// Fallback renderer for browsers without WebGL2. Every cell is drawn with fillText, so it is
// the slow path: it caps its frame rate and steps its resolution down if the device struggles.

const ALPHA_STEPS = 24;

const QUALITY = [
  { dpr: 1.6, interval: 34 },
  { dpr: 1.25, interval: 50 },
  { dpr: 1, interval: 67 },
] as const;

export function createRenderer2D(canvas: HTMLCanvasElement, model: GalaxyModel): Renderer | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Pre-built fill styles (palette x quantised alpha) so the draw loop never builds strings.
  const styles: string[] = [];
  for (const rgb of PALETTE) {
    for (let i = 0; i < ALPHA_STEPS; i++) {
      styles.push(`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(i / (ALPHA_STEPS - 1)).toFixed(3)})`);
    }
  }

  let quality = (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 0;
  let W = 700;
  let H = 500;
  let font = 11;
  let cw = 7;
  let ch = 13;
  let cols = 100;
  let rows = 40;
  let energy = new Float32Array(0);
  let colID = new Uint8Array(0);
  let priority = new Float32Array(0);
  const cam = new Camera();

  function put(x: number, y: number, v: number, col: number) {
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

  function draw(view: ViewState) {
    if (!ctx) return;
    energy.fill(0);
    priority.fill(0);
    colID.fill(0);

    const t = view.t;
    const gain = densityGain(W, H);
    cam.prepare(view, W, H);

    for (const p of model.back) {
      put(
        (p.u * W + Math.sin(view.yaw) * p.phase * 35 + W) % W,
        (p.v * H + Math.cos(view.pitch) * p.phase * 15 + H) % H,
        p.brightness * 0.43,
        p.col,
      );
    }

    for (const p of model.arms) {
      const a = p.a + t * p.om;
      const v = cam.project(p.r * Math.cos(a), p.r * Math.sin(a), p.z);
      put(v.x, v.y, p.v * (1.15 - 0.17 * p.r) * gain, p.col);
    }

    for (const p of model.halo) {
      const a = p.a + t * p.om;
      const v = cam.project(p.r * Math.cos(a), p.r * Math.sin(a), p.z);
      put(v.x, v.y, p.v * gain, p.col);
    }

    for (const p of model.disk) {
      const a = p.a + t * p.om;
      const v = cam.project(p.r * Math.cos(a), p.r * Math.sin(a), p.z);
      put(v.x, v.y, p.v * diskDoppler(a, view.yaw) * gain, p.col);
    }

    const origin = cam.project(0, 0, 0);
    const centre = { x: origin.x, y: origin.y, scale: origin.scale };
    const rad = 0.17 * centre.scale;

    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * ch - centre.y;
      if (Math.abs(y) > rad) continue;
      for (let col = 0; col < cols; col++) {
        const x = (col + 0.5) * cw - centre.x;
        if (x * x + y * y < rad * rad * 0.85) {
          const k = row * cols + col;
          energy[k] = 0;
          priority[k] = 0;
        }
      }
    }

    emitOverlay(model, view, cam, centre, put);

    ctx.fillStyle = "#03050a";
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${font}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let lastStyle = -1;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const k = y * cols + x;
        const v = energy[k];
        if (v < 0.13) continue;
        const idx = clamp(
          Math.floor(Math.pow(Math.min(v, 1.8) / 1.8, 0.68) * (RAMP.length - 1)),
          1,
          RAMP.length - 1,
        );
        const alpha = clamp(0.2 + v * 0.54, 0.22, 1);
        const style = colID[k] * ALPHA_STEPS + Math.round(alpha * (ALPHA_STEPS - 1));
        if (style !== lastStyle) {
          ctx.fillStyle = styles[style];
          lastStyle = style;
        }
        ctx.fillText(RAMP[idx], (x + 0.5) * cw, (y + 0.5) * ch);
      }
    }
  }

  return {
    kind: "2d",
    interval: () => QUALITY[quality].interval,
    tier: () => quality,
    resize(width, height) {
      W = Math.max(300, width);
      H = Math.max(320, height);
      const dpr = Math.min(window.devicePixelRatio || 1, QUALITY[quality].dpr);
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
    },
    draw,
    stepDown() {
      if (quality >= QUALITY.length - 1) return false;
      quality += 1;
      return true;
    },
    destroy() {},
  };
}


