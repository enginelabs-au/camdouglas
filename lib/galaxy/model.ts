// The galaxy itself: particle data, palette and camera maths shared by both renderers.
// The random sequence is fixed, so the galaxy looks the same in WebGL and Canvas 2D.

export const TAU = Math.PI * 2;
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export const RAMP = " .,:;+=*oO#%@$";

export const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [177, 194, 225],
  [105, 146, 205],
  [255, 211, 151],
  [233, 144, 105],
  [240, 169, 92],
  [254, 227, 167],
  [105, 120, 166],
  [247, 246, 230],
];

export type Particle = { r: number; a: number; z: number; col: number; v: number; om: number };
export type BackStar = { u: number; v: number; phase: number; brightness: number; col: number };
export type Planet = { a: number; e: number; n: number; phase: number; node: number; incl: number; col: number };
export type System = { r: number; a: number; om: number; col: number; planets: Planet[] };

export type GalaxyModel = {
  arms: Particle[];
  halo: Particle[];
  disk: Particle[];
  back: BackStar[];
  systems: System[];
};

export type ViewState = { t: number; yaw: number; pitch: number; zoom: number };

// Angular speeds depend only on radius, so they are computed once, not every frame.
function galaxyOmega(r: number) {
  return Math.sqrt(0.0004 / Math.pow(r * r + 0.055, 1.5) + 0.005 / (r * r + 0.15));
}

export function createGalaxyModel(): GalaxyModel {
  let seed = 24171;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 0.000001))) * Math.cos(TAU * rand());

  const arms: Particle[] = [];
  const halo: Particle[] = [];
  const disk: Particle[] = [];
  const back: BackStar[] = [];
  const systems: System[] = [];

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
      om: galaxyOmega(r),
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
      om: galaxyOmega(r) * 0.8,
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
      om: 0.034 / Math.pow(r, 1.5),
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
    const planets: Planet[] = [];
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
      om: galaxyOmega(r),
      planets,
      col: i % 3 === 0 ? 7 : i % 3 === 1 ? 1 : 2,
    });
  }

  return { arms, halo, disk, back, systems };
}

// Camera: trig is refreshed once per frame, not once per particle.
export class Camera {
  c = 1;
  s = 0;
  cp = 1;
  sp = 0;
  base = 1;
  W = 700;
  H = 500;
  readonly out = { x: 0, y: 0, scale: 0 };

  prepare(view: ViewState, W: number, H: number) {
    this.W = W;
    this.H = H;
    this.c = Math.cos(view.yaw);
    this.s = Math.sin(view.yaw);
    this.cp = Math.cos(view.pitch);
    this.sp = Math.sin(view.pitch);
    this.base = Math.min(W / 6.9, H / 3.5) * view.zoom * 7;
  }

  project(x: number, y: number, z: number) {
    const xx = x * this.c - y * this.s;
    const yy = x * this.s + y * this.c;
    const zz = yy * this.sp + z * this.cp;
    const dy = yy * this.cp - z * this.sp;
    const scale = this.base / (7 + 0.4 * zz);
    this.out.x = this.W * 0.5 + xx * scale;
    this.out.y = this.H * 0.51 + dy * scale;
    this.out.scale = scale;
    return this.out;
  }
}

function solveKepler(M: number, e: number) {
  let E = M;
  for (let i = 0; i < 5; i++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
}

export type Emit = (x: number, y: number, weight: number, colour: number) => void;

// Everything that is drawn after the black hole is cut out: the event-horizon ring, the
// faint outer arc, and the star systems with their planets and orbit trails.
// Only a few hundred points, so it is cheap to compute on the CPU every frame.
export function emitOverlay(
  model: GalaxyModel,
  view: ViewState,
  cam: Camera,
  centre: { x: number; y: number; scale: number },
  emit: Emit,
) {
  const rad = 0.17 * centre.scale;

  for (let a = 0; a < TAU; a += 0.045) {
    emit(
      centre.x + rad * Math.cos(a),
      centre.y + rad * Math.sin(a),
      0.7 + 0.45 * Math.max(0, Math.cos(a - view.yaw)),
      a > Math.PI ? 5 : 4,
    );
  }

  for (let a = 3.43; a < 6.05; a += 0.07) {
    emit(centre.x + rad * 1.48 * Math.cos(a), centre.y + rad * 1.48 * Math.sin(a), 0.27, 7);
  }

  for (const sys of model.systems) {
    const a = sys.a + view.t * sys.om;
    const x = sys.r * Math.cos(a);
    const y = sys.r * Math.sin(a);
    const star = cam.project(x, y, 0.03);
    emit(star.x, star.y, 2.5, sys.col);

    for (const p of sys.planets) {
      const E = solveKepler(p.phase + view.t * p.n, p.e);
      const ox = p.a * (Math.cos(E) - p.e);
      const oy = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E);
      const cs = Math.cos(p.node);
      const sn = Math.sin(p.node);
      const cosI = Math.cos(p.incl);
      const sinI = Math.sin(p.incl);
      const pt = cam.project(
        x + ox * cs - oy * sn,
        y + (ox * sn + oy * cs) * cosI,
        (ox * sn + oy * cs) * sinI,
      );
      emit(pt.x, pt.y, 1.8, p.col);

      const minor = p.a * Math.sqrt(1 - p.e * p.e);
      for (let j = 0; j < 22; j++) {
        const q = (j * TAU) / 22;
        const ex = p.a * (Math.cos(q) - p.e);
        const ey = minor * Math.sin(q);
        const po = cam.project(
          x + ex * cs - ey * sn,
          y + (ex * sn + ey * cs) * cosI,
          (ex * sn + ey * cs) * sinI,
        );
        emit(po.x, po.y, 0.11, 6);
      }
    }
  }
}

// Doppler brightening of the inner disk, shared by the CPU and GPU paths.
export function diskDoppler(angle: number, yaw: number) {
  return clamp(0.86 + 0.43 * Math.cos(angle - yaw), 0.35, 1.3);
}

export type Renderer = {
  kind: "webgl" | "2d";
  // Minimum milliseconds between draws at the current quality tier.
  interval: () => number;
  // Current quality tier, 0 being the best. Exposed for diagnostics.
  tier: () => number;
  resize: (width: number, height: number) => void;
  draw: (view: ViewState) => void;
  // Lower the quality one step. Returns false when already at the lowest.
  stepDown: () => boolean;
  destroy: () => void;
};
