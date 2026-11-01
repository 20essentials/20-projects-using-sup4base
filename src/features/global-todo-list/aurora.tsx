/**
 * React Bits Aurora by David Haz.
 * Copyright (c) 2026 David Haz. MIT + Commons Clause License Condition v1.0.
 * https://github.com/DavidHDev/react-bits
 *
 * Permission is granted to use, modify, and include this software in an
 * application, subject to including this notice. The component itself may not
 * be sold, sublicensed, or redistributed on its own.
 */
import { useEffect, useRef } from 'react';

const MAX_STOPS = 5;

const vertexShader = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uStops[${MAX_STOPS}];
uniform int uStopCount;
out vec4 outColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float smooth5(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * float(uStopCount - 1);
  int i = int(min(floor(x), float(uStopCount - 2)));
  float f = x - float(i);
  f = f * f * (3.0 - 2.0 * f);
  vec3 lch = mix(uStops[i], uStops[i + 1], f);
  return toSrgb(oklabToLinear(vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z))));
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float y = 1.0 - frag.y / uResolution.y;
  float u = frag.x / uResolution.x;
  float x = (frag.x - uResolution.x * 0.5) / uResolution.y;
  float warp = snoise(vec2(x * 0.45 + uTime * 0.02, uTime * 0.05));
  float wave = snoise(vec2(x * 0.75 + warp * 0.35 - uTime * 0.03, uTime * 0.07)) * 0.72
    + snoise(vec2(x * 1.6 + warp * 0.5 + uTime * 0.04, uTime * 0.1)) * 0.28;
  float hem = 0.43 + wave * 0.12;
  float rise = hem - y;
  float body = pow(smooth5(-0.09, 0.33, rise), 1.8);
  float lobes = 0.86 + 0.14 * snoise(vec2(x * 0.9 - uTime * 0.025, y * 0.3 + uTime * 0.04));
  float alpha = body * lobes * 0.82;
  vec3 color = ramp(u + 0.05 * sin(uTime * 0.08) + max(rise, 0.0) * 0.05);
  color *= smooth5(0.0, 0.7, alpha);
  float dither = (hash(frag) - 0.5) / 255.0;
  outColor = vec4(color + dither, alpha);
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function toOklch(rgb: number[]) {
  const [r, g, b] = rgb.map(value =>
    value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  );
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bValue = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [lightness, Math.hypot(a, bValue), Math.atan2(bValue, a)];
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function Aurora() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });

    if (!container || !canvas || !gl) return;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
      const uniform = gl.getActiveUniform(program, i);
      if (uniform) uniforms[uniform.name.replace('[0]', '')] = gl.getUniformLocation(program, uniform.name);
    }

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    if (!buffer || !vao) {
      gl.deleteProgram(program);
      return;
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const colorProbe = document.createElement('canvas').getContext('2d', {
      willReadFrequently: true
    });
    const colorStops = ['#ff1744', '#ff375f', '#9d4edd', '#ff1744'];
    const cache = new Map<string, number[]>();
    const parseColor = (value: string) => {
      const cached = cache.get(value);
      if (cached) return cached;
      if (!colorProbe) return [1, 1, 1];
      colorProbe.fillStyle = value;
      colorProbe.fillRect(0, 0, 1, 1);
      const [red, green, blue] = colorProbe.getImageData(0, 0, 1, 1).data;
      const result = [red / 255, green / 255, blue / 255];
      cache.set(value, result);
      return result;
    };
    const palette = new Float32Array(MAX_STOPS * 3);
    const stops = colorStops.map(stop => toOklch(parseColor(stop)));
    let previousHue = stops[0][2];
    stops.forEach((stop, index) => {
      let hue = stop[1] > 0.02 ? stop[2] : previousHue;
      while (hue - previousHue > Math.PI) hue -= Math.PI * 2;
      while (hue - previousHue < -Math.PI) hue += Math.PI * 2;
      previousHue = hue;
      palette.set([stop[0], stop[1], hue], index * 3);
    });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let visible = true;

    const render = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform3fv(uniforms.uStops, palette);
      gl.uniform1i(uniforms.uStopCount, colorStops.length);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const animate = (now: number) => {
      frameId = 0;
      if (!visible || document.hidden) return;
      const delta = lastFrame ? clamp((now - lastFrame) / 1000, 0.0005, 0.05) : 1 / 60;
      lastFrame = now;
      if (!reducedMotion) elapsed += delta * 0.24;
      render();
      frameId = requestAnimationFrame(animate);
    };

    const wake = () => {
      if (!frameId && visible && !document.hidden && !reducedMotion) {
        frameId = requestAnimationFrame(animate);
      } else {
        render();
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(container.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(container.clientHeight * ratio));
      render();
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        lastFrame = 0;
        wake();
      }
    });

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    document.addEventListener('visibilitychange', wake);
    resize();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', wake);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <div className='gx-aurora' ref={containerRef} aria-hidden='true'>
      <canvas ref={canvasRef} />
    </div>
  );
}
