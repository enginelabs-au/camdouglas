import {
  Camera,
  PALETTE,
  RAMP,
  clamp,
  emitOverlay,
  type GalaxyModel,
  type Renderer,
  type ViewState,
} from "@/lib/galaxy/model";

// WebGL2 renderer, in two passes:
//
// 1. Scene pass. The galaxy is drawn as ~5,000 one-texel points into a tiny texture that has
//    exactly one texel per ASCII cell. Additive blending sums the energy and colour per cell.
//    Particle orbits are evaluated in the vertex shader from static buffers, so the CPU only
//    uploads a few hundred overlay points (planets, rings) each frame.
// 2. Glyph pass. One instanced quad per cell. The vertex shader reads the cell from the scene
//    texture, picks the glyph and colour, and passes them down as varyings. The fragment
//    shader only samples the glyph atlas, so there is one texture tap per pixel and the scene
//    texture is read four times per cell, not once per pixel.

const STRIDE = 9; // aPos(4) + aInfo(2) + aColor(3)
const MAX_OVERLAY = 700;
const MIN_ENERGY = 0.13;

const SCENE_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aPos;
layout(location = 1) in vec2 aInfo;
layout(location = 2) in vec3 aColor;

uniform vec2 uSize;
uniform vec2 uCell;
uniform vec2 uGrid;
uniform float uTime;
uniform float uYaw;
uniform vec4 uTrig;
uniform float uBase;
uniform vec3 uMask;
uniform float uScale;

flat out vec4 vOut;

void main() {
  float type = aInfo.y;
  float w = aInfo.x;
  vec2 p;

  if (type > 3.5) {
    p = aPos.xy;
  } else if (type > 2.5) {
    p = vec2(
      mod(aPos.x * uSize.x + uTrig.y * aPos.z * 35.0 + uSize.x, uSize.x),
      mod(aPos.y * uSize.y + uTrig.z * aPos.z * 15.0 + uSize.y, uSize.y)
    );
  } else {
    float a = aPos.y + uTime * aPos.w;
    float x = aPos.x * cos(a);
    float y = aPos.x * sin(a);
    float xx = x * uTrig.x - y * uTrig.y;
    float yy = x * uTrig.y + y * uTrig.x;
    float zz = yy * uTrig.w + aPos.z * uTrig.z;
    float dy = yy * uTrig.z - aPos.z * uTrig.w;
    float sc = uBase / (7.0 + 0.4 * zz);
    p = vec2(uSize.x * 0.5 + xx * sc, uSize.y * 0.51 + dy * sc);
    if (type > 1.5) w *= clamp(0.86 + 0.43 * cos(a - uYaw), 0.35, 1.3);
  }

  vec2 cell = floor(p / uCell);
  vec2 offset = (cell + 0.5) * uCell - uMask.xy;
  bool outside = cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y;
  bool cutOut = type < 3.5 && dot(offset, offset) < uMask.z;

  gl_PointSize = 1.0;
  if (outside || cutOut) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    vOut = vec4(0.0);
    return;
  }
  gl_Position = vec4((cell + 0.5) / uGrid * 2.0 - 1.0, 0.0, 1.0);
  vOut = vec4(aColor * w, w) * uScale;
}
`;

const SCENE_FRAG = `#version 300 es
precision mediump float;
flat in vec4 vOut;
out vec4 outColor;
void main() {
  outColor = vOut;
}
`;

const GLYPH_VERT = `#version 300 es
precision highp float;
precision highp int;
layout(location = 0) in vec2 aCorner;

uniform highp sampler2D uScene;
uniform vec2 uGrid;
uniform vec2 uCellDev;
uniform vec2 uCanvasDev;
uniform float uScale;
uniform float uGlyphs;

out vec2 vUv;
out vec4 vColor;

void main() {
  int cols = int(uGrid.x);
  int cx = gl_InstanceID % cols;
  int cy = gl_InstanceID / cols;
  vec4 t = texelFetch(uScene, ivec2(cx, cy), 0);
  float e = min(t.a / uScale, 2.5);

  if (e < ${MIN_ENERGY.toFixed(2)}) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    vUv = vec2(0.0);
    vColor = vec4(0.0);
    return;
  }

  vec3 col = t.rgb / t.a;
  float idx = clamp(floor(pow(min(e, 1.8) / 1.8, 0.68) * (uGlyphs - 1.0)), 1.0, uGlyphs - 1.0);
  float alpha = clamp(0.2 + e * 0.54, 0.22, 1.0);

  vec2 dev = (vec2(float(cx), float(cy)) + aCorner) * uCellDev;
  gl_Position = vec4(dev.x / uCanvasDev.x * 2.0 - 1.0, 1.0 - dev.y / uCanvasDev.y * 2.0, 0.0, 1.0);
  vUv = vec2((idx + aCorner.x) / uGlyphs, aCorner.y);
  vColor = vec4(col, alpha);
}
`;

const GLYPH_FRAG = `#version 300 es
precision mediump float;
uniform sampler2D uAtlas;
in vec2 vUv;
in vec4 vColor;
out vec4 outColor;
void main() {
  float g = texture(uAtlas, vUv).a;
  outColor = vec4(vColor.rgb, vColor.a * g);
}
`;

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext, vert: string, frag: string, names: string[]): Program | null {
  const vs = compile(gl, gl.VERTEX_SHADER, vert);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Program["uniforms"] = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
}

function colour(index: number) {
  const rgb = PALETTE[index];
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255] as const;
}

function buildStatic(model: GalaxyModel) {
  const total = model.arms.length + model.halo.length + model.disk.length + model.back.length;
  const data = new Float32Array(total * STRIDE);
  let o = 0;
  const push = (a: number, b: number, c: number, d: number, weight: number, type: number, col: number) => {
    const rgb = colour(col);
    data[o++] = a;
    data[o++] = b;
    data[o++] = c;
    data[o++] = d;
    data[o++] = weight;
    data[o++] = type;
    data[o++] = rgb[0];
    data[o++] = rgb[1];
    data[o++] = rgb[2];
  };
  for (const p of model.arms) push(p.r, p.a, p.z, p.om, p.v * (1.15 - 0.17 * p.r), 0, p.col);
  for (const p of model.halo) push(p.r, p.a, p.z, p.om, p.v, 1, p.col);
  for (const p of model.disk) push(p.r, p.a, p.z, p.om, p.v, 2, p.col);
  for (const p of model.back) push(p.u, p.v, p.phase, 0, p.brightness * 0.43, 3, p.col);
  return { data, count: total };
}

export function createRendererGL(canvas: HTMLCanvasElement, model: GalaxyModel): Renderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const cam = new Camera();
  const staticData = buildStatic(model);
  const overlay = new Float32Array(MAX_OVERLAY * STRIDE);
  let overlayCount = 0;

  const emitPoint = (x: number, y: number, weight: number, col: number) => {
    if (overlayCount >= MAX_OVERLAY) return;
    const rgb = colour(col);
    const o = overlayCount * STRIDE;
    overlay[o] = x;
    overlay[o + 1] = y;
    overlay[o + 2] = 0;
    overlay[o + 3] = 0;
    overlay[o + 4] = weight;
    overlay[o + 5] = 4;
    overlay[o + 6] = rgb[0];
    overlay[o + 7] = rgb[1];
    overlay[o + 8] = rgb[2];
    overlayCount += 1;
  };

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cols = 1;
  let rows = 1;
  let cellDev = { w: 7, h: 13 };
  let lost = false;

  let sceneProg: Program | null = null;
  let glyphProg: Program | null = null;
  let staticVao: WebGLVertexArrayObject | null = null;
  let overlayVao: WebGLVertexArrayObject | null = null;
  let quadVao: WebGLVertexArrayObject | null = null;
  let buffers: WebGLBuffer[] = [];
  let sceneTex: WebGLTexture | null = null;
  let sceneFbo: WebGLFramebuffer | null = null;
  let atlasTex: WebGLTexture | null = null;
  let useFloat = true;
  let sceneScale = 1;
  let lastCss = { w: 0, h: 0 };

  const centre = { x: 0, y: 0, scale: 0 };

  function attribLayout(vao: WebGLVertexArrayObject, buffer: WebGLBuffer) {
    gl!.bindVertexArray(vao);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
    const bytes = STRIDE * 4;
    gl!.enableVertexAttribArray(0);
    gl!.vertexAttribPointer(0, 4, gl!.FLOAT, false, bytes, 0);
    gl!.enableVertexAttribArray(1);
    gl!.vertexAttribPointer(1, 2, gl!.FLOAT, false, bytes, 16);
    gl!.enableVertexAttribArray(2);
    gl!.vertexAttribPointer(2, 3, gl!.FLOAT, false, bytes, 24);
  }

  function initResources(): boolean {
    if (!gl) return false;
    sceneProg = link(gl, SCENE_VERT, SCENE_FRAG, [
      "uSize",
      "uCell",
      "uGrid",
      "uTime",
      "uYaw",
      "uTrig",
      "uBase",
      "uMask",
      "uScale",
    ]);
    glyphProg = link(gl, GLYPH_VERT, GLYPH_FRAG, [
      "uScene",
      "uAtlas",
      "uGrid",
      "uCellDev",
      "uCanvasDev",
      "uScale",
      "uGlyphs",
    ]);
    if (!sceneProg || !glyphProg) return false;

    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("EXT_color_buffer_half_float");

    const staticBuffer = gl.createBuffer();
    const overlayBuffer = gl.createBuffer();
    const quadBuffer = gl.createBuffer();
    staticVao = gl.createVertexArray();
    overlayVao = gl.createVertexArray();
    quadVao = gl.createVertexArray();
    if (!staticBuffer || !overlayBuffer || !quadBuffer || !staticVao || !overlayVao || !quadVao) return false;
    buffers = [staticBuffer, overlayBuffer, quadBuffer];

    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, staticData.data, gl.STATIC_DRAW);
    attribLayout(staticVao, staticBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, overlayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, overlay.byteLength, gl.DYNAMIC_DRAW);
    attribLayout(overlayVao, overlayBuffer);

    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    sceneTex = gl.createTexture();
    sceneFbo = gl.createFramebuffer();
    atlasTex = gl.createTexture();
    return Boolean(sceneTex && sceneFbo && atlasTex);
  }

  // Half-float targets keep colour exact; plain 8-bit still works if the device lacks them.
  function allocateScene() {
    if (!gl || !sceneTex || !sceneFbo) return;
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);

    if (useFloat) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cols, rows, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        sceneScale = 1;
        return;
      }
      useFloat = false;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
    // 8-bit targets clamp at 1, so energy is stored as a fraction of its 2.5 maximum.
    sceneScale = 1 / 2.5;
  }

  function buildAtlas(fontDev: number) {
    if (!gl || !atlasTex) return;
    const atlas = document.createElement("canvas");
    atlas.width = RAMP.length * cellDev.w;
    atlas.height = cellDev.h;
    const g = atlas.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, atlas.width, atlas.height);
    g.font = `${fontDev}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let i = 0; i < RAMP.length; i++) {
      g.fillText(RAMP[i], i * cellDev.w + cellDev.w / 2, cellDev.h / 2);
    }
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function resize(width: number, height: number) {
    lastCss = { w: width, h: height };
    if (!gl || lost) return;
    W = Math.max(1, width);
    H = Math.max(1, height);
    // Device pixels are capped at 2x. Glyph quads cover few pixels, so this is cheap and crisp.
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));

    const font = clamp(W / 108, 9.2, 12.6);
    cellDev = {
      w: Math.max(4, Math.round(font * 0.64 * dpr)),
      h: Math.max(6, Math.round(font * 1.14 * dpr)),
    };
    cols = Math.ceil(canvas.width / cellDev.w);
    rows = Math.ceil(canvas.height / cellDev.h);

    allocateScene();
    buildAtlas(font * dpr);
  }

  function draw(view: ViewState) {
    if (!gl || lost || !sceneProg || !glyphProg) return;

    cam.prepare(view, W, H);
    const origin = cam.project(0, 0, 0);
    centre.x = origin.x;
    centre.y = origin.y;
    centre.scale = origin.scale;
    const radius = 0.17 * centre.scale;

    overlayCount = 0;
    emitOverlay(model, view, cam, centre, emitPoint);

    const cellCssW = cellDev.w / dpr;
    const cellCssH = cellDev.h / dpr;

    // Pass 1: the galaxy into the cell-resolution texture.
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
    gl.viewport(0, 0, cols, rows);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    gl.useProgram(sceneProg.program);
    const u = sceneProg.uniforms;
    gl.uniform2f(u.uSize, W, H);
    gl.uniform2f(u.uCell, cellCssW, cellCssH);
    gl.uniform2f(u.uGrid, cols, rows);
    gl.uniform1f(u.uTime, view.t);
    gl.uniform1f(u.uYaw, view.yaw);
    gl.uniform4f(u.uTrig, cam.c, cam.s, cam.cp, cam.sp);
    gl.uniform1f(u.uBase, cam.base);
    gl.uniform3f(u.uMask, centre.x, centre.y, radius * radius * 0.85);
    gl.uniform1f(u.uScale, sceneScale);

    gl.bindVertexArray(staticVao);
    gl.drawArrays(gl.POINTS, 0, staticData.count);

    if (overlayCount > 0) {
      gl.bindVertexArray(overlayVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, overlay, 0, overlayCount * STRIDE);
      gl.drawArrays(gl.POINTS, 0, overlayCount);
    }

    // Pass 2: one textured quad per cell, glyph and colour chosen in the vertex shader.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(3 / 255, 5 / 255, 10 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(glyphProg.program);
    const g = glyphProg.uniforms;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, atlasTex);
    gl.uniform1i(g.uScene, 0);
    gl.uniform1i(g.uAtlas, 1);
    gl.uniform2f(g.uGrid, cols, rows);
    gl.uniform2f(g.uCellDev, cellDev.w, cellDev.h);
    gl.uniform2f(g.uCanvasDev, canvas.width, canvas.height);
    gl.uniform1f(g.uScale, sceneScale);
    gl.uniform1f(g.uGlyphs, RAMP.length);

    gl.bindVertexArray(quadVao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cols * rows);
    gl.bindVertexArray(null);
  }

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
  };
  const onRestored = () => {
    lost = false;
    useFloat = true;
    if (initResources()) resize(lastCss.w, lastCss.h);
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  if (!initResources()) {
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  return {
    kind: "webgl",
    interval: () => 0,
    resize,
    draw,
    // WebGL has headroom to spare, so there is nothing to step down to.
    stepDown: () => false,
    destroy() {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
