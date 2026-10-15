import {
  createGalaxyModel,
  type GalaxyModel,
  type Renderer,
  type ViewState,
  clamp,
} from "@/lib/galaxy/model";
import { createRenderer2D } from "@/lib/galaxy/renderer2d";
import { createRendererGL } from "@/lib/galaxy/rendererGL";

export type GalaxyView = {
  yaw: number;
  pitch: number;
  zoom: number;
};

export type GalaxyHandle = {
  kind: Renderer["kind"];
  setView: (view: GalaxyView, auto?: boolean) => void;
  reset: (view: GalaxyView) => void;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
};

const HOME_VIEW: GalaxyView = { yaw: 0.35, pitch: 1.1, zoom: 1 };

// A canvas can only ever hold one kind of context, so each renderer gets its own canvas and a
// failed WebGL attempt is thrown away before the 2D fallback is tried.
function mountRenderer(root: HTMLElement, model: GalaxyModel) {
  const forced2d = new URLSearchParams(window.location.search).get("renderer") === "2d";
  const attempts: Array<(canvas: HTMLCanvasElement) => Renderer | null> = [];
  if (!forced2d) attempts.push((canvas) => createRendererGL(canvas, model));
  attempts.push((canvas) => createRenderer2D(canvas, model));

  for (const attempt of attempts) {
    const canvas = document.createElement("canvas");
    canvas.id = "ascii-galaxy-canvas";
    canvas.className = "ascii-galaxy-canvas";
    canvas.setAttribute("aria-hidden", "true");
    root.appendChild(canvas);
    const renderer = attempt(canvas);
    if (renderer) return { canvas, renderer };
    canvas.remove();
  }
  return null;
}

export function startAsciiGalaxy(
  root: HTMLElement,
  options?: { reducedMotion?: boolean; initialView?: GalaxyView },
): GalaxyHandle | null {
  const model = createGalaxyModel();
  const mounted = mountRenderer(root, model);
  if (!mounted) return null;
  const { canvas, renderer } = mounted;
  root.dataset.renderer = renderer.kind;

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
  // Whether the current page wants the galaxy to orbit by itself (the home page does). Dragging
  // or zooming switches the orbit off while the visitor is steering, and it resumes a moment
  // after they let go, so a drag never leaves the galaxy stuck.
  let orbit = state.auto;
  let resumeAt = 0;
  const RESUME_DELAY = 1200;
  // When the last pointer event arrived. A pointer that never reports its release (the mouse let
  // go outside the window, a lost capture, a tab switch) would otherwise hold the orbit off for
  // good, so stale pointers are dropped.
  let lastPointerAt = 0;
  const STALE_POINTER = 6000;
  const view: ViewState = { t: 0, yaw: initial.yaw, pitch: initial.pitch, zoom: initial.zoom };

  function drawNow() {
    view.t = state.t;
    view.yaw = state.yaw;
    view.pitch = state.pitch;
    view.zoom = state.zoom;
    renderer.draw(view);
  }

  function resize() {
    const rect = root.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);
    drawNow();
  }

  // Both renderers tune themselves to the device. When frames stop arriving at a steady cadence
  // (the GPU or the main thread is behind) the renderer steps down a tier: WebGL drops device
  // pixels and then frame rate, the 2D fallback drops resolution and frame rate. Steps only go
  // down, so the quality cannot flap, and a wrong step costs a little sharpness, not smoothness.
  let raf = 0;
  let dirty = true;
  let slowFrames = 0;
  let stepAt = 0;
  let avgTick = 16;
  let avgDraw = 4;
  // 24ms is roughly 42fps. Below that the galaxy visibly stutters, so a tier is given up.
  const SLOW_TICK = 24;
  const DRAW_BUDGET = renderer.kind === "2d" ? 12 : 8;
  root.dataset.tier = String(renderer.tier());

  // Lightweight readout (renderer, frames per second, JS time per draw) for diagnosing devices.
  let statFrames = 0;
  let statDrawMs = 0;
  let statSince = 0;

  function animate(now: number) {
    const tick = now - (state.last || now);
    const dt = Math.min(tick / 1000, 0.065);
    state.last = now;
    if (!state.paused) {
      state.t += dt * state.velocity;
      // The whole galaxy turns as one mass: a steady orbit, about one lap a minute, close to the
      // feel of dragging it by hand. The stars' own gentle differential spin comes from the model.
      // Zooming in speeds the orbit up (about 2x at 1.5x zoom, 5x at 2.5x zoom). The rate follows
      // the zoom target and is applied to the yaw directly as well as its target, so the speed
      // changes the instant the zoom does instead of lagging behind the smoothing.
      if (state.auto) {
        const step = dt * 0.11 * Math.pow(Math.max(1, state.targetZoom), 1.8);
        state.yaw += step;
        state.targetYaw += step;
      }
    }
    if (pointers.size > 0 && performance.now() - lastPointerAt > STALE_POINTER) releaseAll();
    if (orbit && !state.auto && !state.paused && pointers.size === 0 && now >= resumeAt) {
      state.auto = true;
      // Carry on from where the visitor left the view rather than easing back to a stale target.
      state.targetYaw = state.yaw;
    }
    state.yaw += (state.targetYaw - state.yaw) * Math.min(1, dt * 5);
    state.pitch += (state.targetPitch - state.pitch) * Math.min(1, dt * 5);
    state.zoom += (state.targetZoom - state.zoom) * Math.min(1, dt * 5);

    const settled =
      Math.abs(state.targetYaw - state.yaw) < 0.0004 &&
      Math.abs(state.targetPitch - state.pitch) < 0.0004 &&
      Math.abs(state.targetZoom - state.zoom) < 0.0004;
    const idle = state.paused && settled && !dirty;

    if (now - state.frame >= renderer.interval() && !document.hidden && !idle) {
      const began = performance.now();
      drawNow();
      const spent = performance.now() - began;
      dirty = false;
      state.frame = now;

      statFrames += 1;
      statDrawMs += spent;
      if (now - statSince > 1000) {
        if (statSince) {
          root.dataset.fps = String(Math.round((statFrames * 1000) / (now - statSince)));
          root.dataset.drawMs = (statDrawMs / statFrames).toFixed(2);
          root.dataset.orbit = state.auto ? "1" : "0";
          root.dataset.yaw = state.yaw.toFixed(3);
          root.dataset.zoom = state.zoom.toFixed(2);
        }
        statSince = now;
        statFrames = 0;
        statDrawMs = 0;
      }
      avgDraw += (spent - avgDraw) * 0.05;
    }

    // Ignore the long gaps left by background tabs; they say nothing about device speed. The
    // first three seconds after start or a step are a grace period for hydration and
    // reallocation, and the slowness has to persist for 45 frames so a route change cannot
    // trigger a step. Paused (reduced motion) galaxies draw once and idle; nothing to govern.
    if (tick > 0 && tick < 400 && !idle && !document.hidden) {
      if (!stepAt) stepAt = now;
      avgTick += (tick - avgTick) * 0.05;
      if (now - stepAt > 3000 && (avgTick > SLOW_TICK || avgDraw > DRAW_BUDGET)) slowFrames += 1;
      else slowFrames = 0;
      if (slowFrames > 45) {
        slowFrames = 0;
        stepAt = now;
        avgTick = 16;
        avgDraw = 4;
        if (renderer.stepDown()) {
          root.dataset.tier = String(renderer.tier());
          resize();
        }
      }
    }
    raf = requestAnimationFrame(animate);
  }

  const pointers = new Map<number, { x: number; y: number; startX: number; startY: number; inPanel: boolean; locked: boolean }>();
  let oldX = 0;
  let oldY = 0;
  let pinch = 0;
  const ignoreDrag = "a, button, input, textarea, select, label, .star-rating, .site-footer";

  const onPointerDown = (e: PointerEvent) => {
    lastPointerAt = performance.now();
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
    resumeAt = Infinity;
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
    lastPointerAt = performance.now();
    // A mouse that moves with no button down has been released somewhere we did not hear about.
    if (e.pointerType === "mouse" && e.buttons === 0) {
      onPointerUp(e);
      return;
    }
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
      resumeAt = Infinity;
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

  function onPointerUp(e: PointerEvent) {
    lastPointerAt = performance.now();
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      resumeAt = performance.now() + RESUME_DELAY;
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
  }

  // Drop every pointer and let the orbit come back, for events that never report a release.
  function releaseAll() {
    pointers.clear();
    pinch = 0;
    resumeAt = performance.now() + RESUME_DELAY;
    canvas.style.cursor = "grab";
  }
  const onWindowBlur = () => releaseAll();
  const onVisibility = () => {
    if (document.hidden) releaseAll();
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    state.targetZoom = clamp(state.targetZoom * Math.exp(-e.deltaY * 0.001), 0.6, 2.5);
    state.auto = false;
    resumeAt = performance.now() + RESUME_DELAY;
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: false, capture: true });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("blur", onWindowBlur);
  document.addEventListener("visibilitychange", onVisibility);
  root.addEventListener("lostpointercapture", onPointerUp);
  root.addEventListener("wheel", onWheel, { passive: false });

  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();
  raf = requestAnimationFrame(animate);

  return {
    kind: renderer.kind,
    setView(next, auto = false) {
      dirty = true;
      state.targetYaw = next.yaw;
      state.targetPitch = next.pitch;
      state.targetZoom = next.zoom;
      state.auto = auto;
      orbit = auto && !options?.reducedMotion;
    },
    reset(next) {
      state.t = 0;
      state.yaw = next.yaw;
      state.targetYaw = next.yaw;
      state.pitch = next.pitch;
      state.targetPitch = next.pitch;
      state.zoom = next.zoom;
      state.targetZoom = next.zoom;
      state.auto = !options?.reducedMotion;
      orbit = state.auto;
      state.paused = Boolean(options?.reducedMotion);
      drawNow();
    },
    setPaused(paused) {
      state.paused = paused;
      dirty = true;
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("lostpointercapture", onPointerUp);
      root.removeEventListener("wheel", onWheel);
      renderer.destroy();
      canvas.remove();
      delete root.dataset.renderer;
    },
  };
}
