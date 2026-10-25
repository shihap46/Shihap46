"use client";

import { useEffect, useRef } from "react";

/* GPU fluid simulation (stable-fluids: advect → curl → vorticity → divergence →
   pressure solve → gradient subtract) rendered as colourless liquid glass: the fluid
   is treated as a liquid surface and only its light and shadow are drawn, so it takes
   on whatever background colour sits underneath — dark sections and the light one alike.
   Pauses off-screen; static for reduced motion. */

const CONFIG = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 1.6,
  VELOCITY_DISSIPATION: 0.3,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 12,
  CURL: 22,
  SPLAT_RADIUS: 0.22,
  SPLAT_FORCE: 5200,
};


const BASE_VERTEX = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const CLEAR_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const SPLAT_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const ADVECTION_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
  #ifdef MANUAL_FILTERING
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    vec4 result = bilerp(uSource, coord, dyeTexelSize);
  #else
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
  #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const DIVERGENCE_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const CURL_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const VORTICITY_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const PRESSURE_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT_SUBTRACT_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// Liquid glass: the amount of fluid is a surface height; its slope gives a normal that is
// lit from the top-left. Only neutral highlights and shadows are output (premultiplied),
// so a flat, resting surface is fully transparent and no hue is ever added.
const DISPLAY_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uTexture;
  uniform vec2 texelSize;
  uniform float uTone;
  void main () {
    float hL = length(texture2D(uTexture, vL).rgb);
    float hR = length(texture2D(uTexture, vR).rgb);
    float hT = length(texture2D(uTexture, vT).rgb);
    float hB = length(texture2D(uTexture, vB).rgb);
    vec3 n = normalize(vec3(hL - hR, hB - hT, length(texelSize) * 5.0));
    vec3 lightDir = normalize(vec3(-0.5, 0.6, 0.65));
    float facing = dot(n, lightDir) - lightDir.z;
    float spec = pow(max(dot(reflect(-lightDir, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * (1.0 - n.z);
    float rim = pow(1.0 - n.z, 2.0);
    // Dark sections read the glass through its highlights, the light section through its shadows
    float hi = (max(facing, 0.0) * 0.32 + spec * 0.4 + rim * 0.08) * mix(1.0, 0.45, uTone);
    float lo = (max(-facing, 0.0) * 0.26 + rim * 0.03) * mix(0.5, 0.75, uTone);
    float a = clamp(hi + lo, 0.0, 0.4);
    gl_FragColor = vec4(vec3(min(hi, a)), a);
  }
`;

type GL = WebGL2RenderingContext;

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
}

interface DoubleFBO {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
}

// `global`: a fixed full-page layer that follows the pointer anywhere on the page
export default function FluidBackground({ className = "", global = false }: { className?: string; global?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Listen on the whole section so moving over the text above the canvas still stirs the fluid
    const host: HTMLElement | Window = global ? window : (canvas.closest("section") ?? canvas.parentElement ?? canvas);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Context + float texture support ──
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext("webgl2", params) as GL | null;
    const isWebGL2 = !!gl;
    if (!gl) gl = (canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params)) as GL | null;
    if (!gl) return;
    const ctx: GL = gl;

    let halfFloatType: number;
    let supportLinearFiltering: unknown;
    if (isWebGL2) {
      ctx.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = ctx.getExtension("OES_texture_float_linear");
      halfFloatType = ctx.HALF_FLOAT;
    } else {
      const halfFloat = ctx.getExtension("OES_texture_half_float");
      supportLinearFiltering = ctx.getExtension("OES_texture_half_float_linear");
      if (!halfFloat) return;
      halfFloatType = halfFloat.HALF_FLOAT_OES;
    }
    ctx.clearColor(0, 0, 0, 0);

    const supportsRenderFormat = (internalFormat: number, format: number, type: number) => {
      const texture = ctx.createTexture();
      ctx.bindTexture(ctx.TEXTURE_2D, texture);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
      ctx.texImage2D(ctx.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = ctx.createFramebuffer();
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, fbo);
      ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0, ctx.TEXTURE_2D, texture, 0);
      const ok = ctx.checkFramebufferStatus(ctx.FRAMEBUFFER) === ctx.FRAMEBUFFER_COMPLETE;
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
      ctx.deleteFramebuffer(fbo);
      ctx.deleteTexture(texture);
      return ok;
    };

    const supportedFormat = (
      internalFormat: number,
      format: number,
      type: number
    ): { internalFormat: number; format: number } | null => {
      if (supportsRenderFormat(internalFormat, format, type)) return { internalFormat, format };
      if (!isWebGL2) return null;
      if (internalFormat === ctx.R16F) return supportedFormat(ctx.RG16F, ctx.RG, type);
      if (internalFormat === ctx.RG16F) return supportedFormat(ctx.RGBA16F, ctx.RGBA, type);
      return null;
    };

    const formatRGBA = isWebGL2 ? supportedFormat(ctx.RGBA16F, ctx.RGBA, halfFloatType) : supportedFormat(ctx.RGBA, ctx.RGBA, halfFloatType);
    const formatRG = isWebGL2 ? supportedFormat(ctx.RG16F, ctx.RG, halfFloatType) : supportedFormat(ctx.RGBA, ctx.RGBA, halfFloatType);
    const formatR = isWebGL2 ? supportedFormat(ctx.R16F, ctx.RED, halfFloatType) : supportedFormat(ctx.RGBA, ctx.RGBA, halfFloatType);
    if (!formatRGBA || !formatRG || !formatR) return;

    // ── Shaders / programs ──
    const compile = (type: number, source: string) => {
      const shader = ctx.createShader(type)!;
      const src = supportLinearFiltering ? source : `#define MANUAL_FILTERING\n${source}`;
      ctx.shaderSource(shader, src);
      ctx.compileShader(shader);
      if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
        console.warn("[fluid] shader error", ctx.getShaderInfoLog(shader));
      }
      return shader;
    };

    const baseVertex = compile(ctx.VERTEX_SHADER, BASE_VERTEX);

    const makeProgram = (fragmentSource: string) => {
      const program = ctx.createProgram()!;
      ctx.attachShader(program, baseVertex);
      ctx.attachShader(program, compile(ctx.FRAGMENT_SHADER, fragmentSource));
      ctx.bindAttribLocation(program, 0, "aPosition");
      ctx.linkProgram(program);
      if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
        console.warn("[fluid] link error", ctx.getProgramInfoLog(program));
      }
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const count = ctx.getProgramParameter(program, ctx.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i++) {
        const name = ctx.getActiveUniform(program, i)!.name;
        uniforms[name] = ctx.getUniformLocation(program, name);
      }
      return {
        program,
        uniforms,
        bind: () => ctx.useProgram(program),
      };
    };

    const clearProgram = makeProgram(CLEAR_SHADER);
    const splatProgram = makeProgram(SPLAT_SHADER);
    const advectionProgram = makeProgram(ADVECTION_SHADER);
    const divergenceProgram = makeProgram(DIVERGENCE_SHADER);
    const curlProgram = makeProgram(CURL_SHADER);
    const vorticityProgram = makeProgram(VORTICITY_SHADER);
    const pressureProgram = makeProgram(PRESSURE_SHADER);
    const gradientProgram = makeProgram(GRADIENT_SUBTRACT_SHADER);
    const displayProgram = makeProgram(DISPLAY_SHADER);

    // ── Full-screen quad ──
    ctx.bindBuffer(ctx.ARRAY_BUFFER, ctx.createBuffer());
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), ctx.STATIC_DRAW);
    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, ctx.createBuffer());
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), ctx.STATIC_DRAW);
    ctx.vertexAttribPointer(0, 2, ctx.FLOAT, false, 0, 0);
    ctx.enableVertexAttribArray(0);

    const blit = (target: FBO | null) => {
      if (target === null) {
        ctx.viewport(0, 0, ctx.drawingBufferWidth, ctx.drawingBufferHeight);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
      } else {
        ctx.viewport(0, 0, target.width, target.height);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, target.fbo);
      }
      ctx.drawElements(ctx.TRIANGLES, 6, ctx.UNSIGNED_SHORT, 0);
    };

    // ── Framebuffers ──
    const createFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number): FBO => {
      ctx.activeTexture(ctx.TEXTURE0);
      const texture = ctx.createTexture()!;
      ctx.bindTexture(ctx.TEXTURE_2D, texture);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, param);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, param);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
      ctx.texImage2D(ctx.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = ctx.createFramebuffer()!;
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, fbo);
      ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0, ctx.TEXTURE_2D, texture, 0);
      ctx.viewport(0, 0, w, h);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        attach: (id: number) => {
          ctx.activeTexture(ctx.TEXTURE0 + id);
          ctx.bindTexture(ctx.TEXTURE_2D, texture);
          return id;
        },
      };
    };

    const createDoubleFBO = (w: number, h: number, internalFormat: number, format: number, type: number, param: number): DoubleFBO => {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        get write() {
          return fbo2;
        },
        swap() {
          const t = fbo1;
          fbo1 = fbo2;
          fbo2 = t;
        },
      };
    };

    const resolution = (res: number) => {
      let aspect = ctx.drawingBufferWidth / ctx.drawingBufferHeight;
      if (aspect < 1) aspect = 1 / aspect;
      const min = Math.round(res);
      const max = Math.round(res * aspect);
      return ctx.drawingBufferWidth > ctx.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    };

    const filtering = supportLinearFiltering ? ctx.LINEAR : ctx.NEAREST;
    let dye: DoubleFBO;
    let velocity: DoubleFBO;
    let divergence: FBO;
    let curl: FBO;
    let pressure: DoubleFBO;

    const initFramebuffers = () => {
      const isSmall = window.innerWidth < 768;
      const simRes = resolution(CONFIG.SIM_RESOLUTION);
      const dyeRes = resolution(isSmall ? 384 : CONFIG.DYE_RESOLUTION);
      ctx.disable(ctx.BLEND);
      dye = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, halfFloatType, filtering);
      velocity = createDoubleFBO(simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, halfFloatType, filtering);
      divergence = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatType, ctx.NEAREST);
      curl = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatType, ctx.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatType, ctx.NEAREST);
    };

    // Soft light and shadow only, so it is drawn at CSS-pixel size and upscaled: on a
    // high-DPI screen that is less than half the pixels to shade every frame
    const resizeCanvas = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        return true;
      }
      return false;
    };

    resizeCanvas();
    initFramebuffers();

    // Measuring the canvas forces layout, so do it when its size changes rather than every frame
    let resized = false;
    const resizeObserver = new ResizeObserver(() => {
      resized = true;
    });
    resizeObserver.observe(canvas);

    // ── Simulation ──
    const aspect = () => canvas.width / canvas.height;
    const correctRadius = (r: number) => (aspect() > 1 ? r * aspect() : r);

    const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number]) => {
      splatProgram.bind();
      ctx.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      ctx.uniform1f(splatProgram.uniforms.aspectRatio, aspect());
      ctx.uniform2f(splatProgram.uniforms.point, x, y);
      ctx.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
      ctx.uniform1f(splatProgram.uniforms.radius, correctRadius(CONFIG.SPLAT_RADIUS / 100));
      blit(velocity.write);
      velocity.swap();

      ctx.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      ctx.uniform3f(splatProgram.uniforms.color, color[0], color[1], color[2]);
      blit(dye.write);
      dye.swap();
    };

    // Neutral "dye": only its amount matters, because the display draws light and shadow, not colour
    const nextColor = (intensity: number): [number, number, number] => {
      const v = intensity * (0.8 + Math.random() * 0.4);
      return [v, v, v];
    };
    // Eases toward 1 while the light (white) section is on screen
    let tone = document.documentElement.dataset.theme === "light" ? 1 : 0;

    const randomSplat = () => {
      const x = 0.15 + Math.random() * 0.7;
      const y = 0.15 + Math.random() * 0.7;
      const angle = Math.random() * Math.PI * 2;
      const force = 900 + Math.random() * 700;
      splat(x, y, Math.cos(angle) * force, Math.sin(angle) * force, nextColor(0.2));
    };

    const step = (dt: number) => {
      ctx.disable(ctx.BLEND);

      curlProgram.bind();
      ctx.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      ctx.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      ctx.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      ctx.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      ctx.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      ctx.uniform1f(vorticityProgram.uniforms.curl, CONFIG.CURL);
      ctx.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      ctx.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      ctx.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      ctx.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      ctx.uniform1f(clearProgram.uniforms.value, CONFIG.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      pressureProgram.bind();
      ctx.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      ctx.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
        ctx.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradientProgram.bind();
      ctx.uniform2f(gradientProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      ctx.uniform1i(gradientProgram.uniforms.uPressure, pressure.read.attach(0));
      ctx.uniform1i(gradientProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      ctx.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!supportLinearFiltering) {
        ctx.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      }
      const velocityId = velocity.read.attach(0);
      ctx.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      ctx.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      ctx.uniform1f(advectionProgram.uniforms.dt, dt);
      ctx.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!supportLinearFiltering) {
        ctx.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      }
      ctx.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      ctx.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      ctx.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    };

    const render = () => {
      ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
      ctx.enable(ctx.BLEND);
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
      ctx.viewport(0, 0, ctx.drawingBufferWidth, ctx.drawingBufferHeight);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      displayProgram.bind();
      ctx.uniform2f(displayProgram.uniforms.texelSize, 2 / dye.width, 2 / dye.height);
      ctx.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
      tone += ((document.documentElement.dataset.theme === "light" ? 1 : 0) - tone) * 0.06;
      ctx.uniform1f(displayProgram.uniforms.uTone, tone);
      blit(null);
    };

    // ── Input: the whole section drives the fluid, not just the bare canvas ──
    const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false, down: false, last: performance.now() };
    const onPointerMove = (e: PointerEvent) => {
      // The global layer is fixed to the viewport, so it needs no layout read per pointer event
      const rect = global
        ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
        : canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      let dx = x - pointer.x;
      let dy = y - pointer.y;
      if (aspect() < 1) dx *= aspect();
      if (aspect() > 1) dy /= aspect();
      // Ignore the jump when the pointer first enters
      if (performance.now() - pointer.last > 250) {
        dx = 0;
        dy = 0;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.dx = dx * CONFIG.SPLAT_FORCE;
      pointer.dy = dy * CONFIG.SPLAT_FORCE;
      pointer.moved = true;
      pointer.last = performance.now();
    };
    host.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });

    // ── Loop (paused while the section is off-screen) ──
    let raf = 0;
    let running = false;
    let lastTime = performance.now();
    let idleTimer = 0;

    for (let i = 0; i < 6; i++) randomSplat();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.016666);
      lastTime = now;

      if (resized) {
        resized = false;
        if (resizeCanvas()) initFramebuffers();
      }

      if (pointer.moved) {
        pointer.moved = false;
        splat(pointer.x, pointer.y, pointer.dx, pointer.dy, nextColor(0.16));
      }

      // Keep it alive without a cursor: a gentle swirl every couple of seconds
      idleTimer += dt;
      if (now - pointer.last > 1500 && idleTimer > 2.2) {
        idleTimer = 0;
        randomSplat();
      }

      step(dt);
      render();
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    if (reduceMotion) {
      step(0.016);
      render();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (reduceMotion) return;
        if (entry.isIntersecting) start();
        else stop();
      },
      { rootMargin: "120px" }
    );
    observer.observe(canvas);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove as EventListener);
      // No loseContext(): React StrictMode re-runs this effect on the same canvas, and a
      // force-lost context can never render again. The browser frees it with the canvas.
    };
  }, [global]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${className}`} aria-hidden />;
}
