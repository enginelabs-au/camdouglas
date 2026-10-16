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

// How much to scale the brightness of the galaxy's own stars for the screen. Cells are a fixed
// size in pixels, so a phone has several times fewer cells across the galaxy than a laptop but
// the same number of stars, and they pile into solid blocks of "$" that hide the rings and
// lanes. The gain keeps the stars per cell at the laptop level (1 on desktop, lower on phones).
export function densityGain(W: number, H: number) {
  const scale = Math.min(W / 6.9, H / 3.5);
  const font = clamp(W / 108, 9.2, 12.6);
  const cells = (scale * scale) / (0.64 * font * 1.14 * font);
  return clamp(cells / 336, 0.18, 1);
}

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

  // Fill. The arms alone leave wide empty lanes between the bright hub and the outer stars, so
  // the galaxy read as a wheel rim. These extra stars come from their own generator (the layout
  // of everything else is unchanged): a broader set of arm stars, and a smooth diffuse disc of
  // dim stars at every angle that makes the whole thing read as one mass with soft streaks.
  let fillSeed = 9917;
  const fill = () => {
    fillSeed = (1664525 * fillSeed + 1013904223) >>> 0;
    return fillSeed / 4294967296;
  };
  const fillGauss = () => Math.sqrt(-2 * Math.log(Math.max(fill(), 0.000001))) * Math.cos(TAU * fill());
  // Dark lanes: thin bands of near-empty space between the rings, so each ring stands apart.
  // The fill stars thin out hard inside them (the original arms and hub are left alone).
  const LANES = [0.6, 0.86, 1.14, 1.46, 1.82, 2.22, 2.66, 3.1];
  const laneOpen = (r: number) => {
    let open = 1;
    for (const l of LANES) open *= 1 - 0.98 * Math.exp(-(((r - l) / 0.13) ** 2));
    return open;
  };
  // Spiral arms for the fill, as in a grand-design spiral: stars gather along four arms that
  // wind like the main ones, and the space between the arms is mostly dark.
  const armOpen = (r: number, a: number) => {
    const c = 0.5 + 0.5 * Math.cos(4 * (a - Math.log(r / 0.25) * 2.9));
    return 0.1 + 0.9 * c * c;
  };
  const fillAngle = (r: number) => {
    let a = fill() * TAU;
    for (let tries = 0; tries < 8 && fill() > armOpen(r, a); tries++) a = fill() * TAU;
    return a;
  };
  const fillRadius = (draw: () => number) => {
    let r = draw();
    for (let tries = 0; tries < 8 && fill() > laneOpen(r); tries++) r = draw();
    return r;
  };
  for (let i = 0; i < 2500; i++) {
    const r = fillRadius(() => clamp(0.2 + Math.pow(fill(), 0.8) * 2.9, 0.2, 3.2));
    const arm = Math.floor(fill() * 4);
    const angle = (arm * TAU) / 4 + Math.log(r / 0.25) * 2.9 + fillGauss() * (0.34 + 0.14 * r);
    const b = fill();
    arms.push({
      r,
      a: angle,
      z: fillGauss() * (0.03 + 0.02 * r),
      col: b < 0.25 ? 1 : b < 0.4 ? 2 : 0,
      v: 0.2 + fill() * 0.4,
      om: galaxyOmega(r),
    });
  }
  // A little clumping, about a tenth more matter, gathered into arcs on different rings. Each
  // ring turns at its own rate, so the arcs visibly slide past one another and show the rotation.
  for (let c = 0; c < 18; c++) {
    const cr = 0.55 + fill() * 2.2;
    const ca = fill() * TAU;
    for (let i = 0; i < 70; i++) {
      const r = clamp(cr + fillGauss() * 0.05, 0.25, 3.2);
      const b = fill();
      arms.push({
        r,
        a: ca + fillGauss() * (0.22 / Math.sqrt(cr)),
        z: fillGauss() * (0.03 + 0.02 * r),
        col: b < 0.3 ? 1 : b < 0.45 ? 2 : 0,
        v: 0.45 + fill() * 0.5,
        om: galaxyOmega(r),
      });
    }
  }
  // A soft shoulder just outside the bright hub, where the lane was emptiest.
  for (let i = 0; i < 1800; i++) {
    const r = fillRadius(() => 0.5 + fill() * 1.0);
    const b = fill();
    arms.push({
      r,
      a: fillAngle(r),
      z: fillGauss() * (0.03 + 0.02 * r),
      col: b < 0.3 ? 1 : b < 0.45 ? 2 : 0,
      v: 0.2 + fill() * 0.3,
      om: galaxyOmega(r),
    });
  }
  for (let i = 0; i < 4500; i++) {
    const r = fillRadius(() => clamp(0.2 + Math.pow(fill(), 1.0) * 2.7, 0.2, 3.0));
    const b = fill();
    arms.push({
      r,
      a: fillAngle(r),
      z: fillGauss() * (0.03 + 0.02 * r),
      col: b < 0.2 ? 1 : b < 0.3 ? 2 : 0,
      v: 0.15 + fill() * 0.3,
      om: galaxyOmega(r),
    });
  }
  // A short bright bar through the hub, turning as one rigid piece like the bar in the Milky Way.
  const barOm = galaxyOmega(0.35);
  for (let i = 0; i < 420; i++) {
    const x = (fill() * 2 - 1) * (0.2 + 0.4 * fill());
    const r = Math.max(0.1, Math.abs(x));
    const b = fill();
    arms.push({
      r,
      a: (x < 0 ? Math.PI : 0) + (fillGauss() * 0.045) / r,
      z: fillGauss() * 0.02,
      col: b < 0.5 ? 5 : b < 0.8 ? 4 : 2,
      v: 0.35 + fill() * 0.5,
      om: barOm,
    });
  }
  // Thin the original arm stars where they cross a dark lane, so the lanes read as real gaps. A
  // separate generator is used so nothing else in the galaxy shifts.
  let thinSeed = 4177;
  const thin = () => {
    thinSeed = (1664525 * thinSeed + 1013904223) >>> 0;
    return thinSeed / 4294967296;
  };
  const kept = arms.filter((p, i) => i >= 3500 || thin() < 0.05 + 0.95 * laneOpen(p.r));
  arms.length = 0;
  for (const p of kept) arms.push(p);

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
