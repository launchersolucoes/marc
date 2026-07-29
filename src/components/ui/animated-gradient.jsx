"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CONFIG = {
  color1: "#1a1a1a",
  color2: "#4a2500",
  color3: "#ffa500",
  rotation: 90,
  proportion: 72,
  scale: 0.72,
  speed: 8,
  distortion: 22,
  swirl: 52,
  swirlIterations: 8,
  softness: 96,
  offset: 0,
  shape: "Edge",
  shapeSize: 44,
};

const SHAPES = { Checks: 0, Stripes: 1, Edge: 2 };

export function AnimatedGradient({ config = {}, className = "", radius = "0px" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const frameRef = useRef();
  const [failed, setFailed] = useState(false);

  const params = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    if (failed) return undefined;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    let gl;
    let resizeObserver;
    let intersectionObserver;
    let program;
    let vertexShader;
    let fragmentShader;
    let positionBuffer;
    let running = false;
    let visible = true;
    let startTime = performance.now();

    try {
      gl = canvas.getContext("webgl2", {
        premultipliedAlpha: true,
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });

      if (!gl) {
        setFailed(true);
        return undefined;
      }

      vertexShader = compileShader(
        gl,
        gl.VERTEX_SHADER,
        `#version 300 es
        in vec4 a_position;
        void main() { gl_Position = a_position; }`,
      );
      fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) {
        setFailed(true);
        return undefined;
      }

      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        setFailed(true);
        return undefined;
      }

      gl.useProgram(program);

      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const positionLocation = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const uniforms = {
        time: gl.getUniformLocation(program, "u_time"),
        resolution: gl.getUniformLocation(program, "u_resolution"),
        pixelRatio: gl.getUniformLocation(program, "u_pixelRatio"),
        scale: gl.getUniformLocation(program, "u_scale"),
        rotation: gl.getUniformLocation(program, "u_rotation"),
        color1: gl.getUniformLocation(program, "u_color1"),
        color2: gl.getUniformLocation(program, "u_color2"),
        color3: gl.getUniformLocation(program, "u_color3"),
        proportion: gl.getUniformLocation(program, "u_proportion"),
        softness: gl.getUniformLocation(program, "u_softness"),
        shape: gl.getUniformLocation(program, "u_shape"),
        shapeScale: gl.getUniformLocation(program, "u_shapeScale"),
        distortion: gl.getUniformLocation(program, "u_distortion"),
        swirl: gl.getUniformLocation(program, "u_swirl"),
        swirlIterations: gl.getUniformLocation(program, "u_swirlIterations"),
      };

      const resize = () => {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        gl.viewport(0, 0, canvas.width, canvas.height);
      };

      const draw = (time) => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const motionFactor = reducedMotion ? 0.5 : 1;
        const elapsed = ((time - startTime) / 1000) * motionFactor;
        const speed = (params.speed / 100) * 5;
        const c1 = hexToRgba(params.color1);
        const c2 = hexToRgba(params.color2);
        const c3 = hexToRgba(params.color3);

        gl.uniform1f(uniforms.time, elapsed * speed + params.offset * 0.01);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.pixelRatio, Math.min(window.devicePixelRatio || 1, 2));
        gl.uniform1f(uniforms.scale, params.scale);
        gl.uniform1f(uniforms.rotation, (params.rotation * Math.PI) / 180);
        gl.uniform4f(uniforms.color1, ...c1);
        gl.uniform4f(uniforms.color2, ...c2);
        gl.uniform4f(uniforms.color3, ...c3);
        gl.uniform1f(uniforms.proportion, params.proportion / 100);
        gl.uniform1f(uniforms.softness, params.softness / 100);
        gl.uniform1f(uniforms.shape, SHAPES[params.shape] ?? SHAPES.Edge);
        gl.uniform1f(uniforms.shapeScale, params.shapeSize / 100);
        gl.uniform1f(uniforms.distortion, params.distortion / 50);
        gl.uniform1f(uniforms.swirl, params.swirl / 100);
        gl.uniform1f(uniforms.swirlIterations, params.swirl === 0 ? 0 : params.swirlIterations);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (running && visible && !document.hidden) {
          frameRef.current = requestAnimationFrame(draw);
        } else {
          running = false;
        }
      };

      const start = () => {
        if (running || !visible || document.hidden) return;
        running = true;
        startTime = performance.now();
        frameRef.current = requestAnimationFrame(draw);
      };

      const stop = () => {
        running = false;
        if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
      };

      const handleVisibility = () => {
        if (document.hidden) stop();
        else start();
      };

      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible) start();
        else stop();
      });
      intersectionObserver.observe(container);
      document.addEventListener("visibilitychange", handleVisibility);
      start();

      return () => {
        stop();
        document.removeEventListener("visibilitychange", handleVisibility);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (program) gl.deleteProgram(program);
        if (vertexShader) gl.deleteShader(vertexShader);
        if (fragmentShader) gl.deleteShader(fragmentShader);
      };
    } catch {
      setFailed(true);
      return undefined;
    }
  }, [
    failed,
    params.color1,
    params.color2,
    params.color3,
    params.distortion,
    params.offset,
    params.proportion,
    params.rotation,
    params.scale,
    params.shape,
    params.shapeSize,
    params.softness,
    params.speed,
    params.swirl,
    params.swirlIterations,
  ]);

  const classes = `animated-gradient ${failed ? "animated-gradient--fallback" : ""} ${className}`.trim();

  return (
    <div
      ref={containerRef}
      className={classes}
      style={{
        borderRadius: radius,
        "--gradient-color-1": params.color1,
        "--gradient-color-2": params.color2,
        "--gradient-color-3": params.color3,
      }}
      aria-hidden="true"
    >
      {!failed && <canvas ref={canvasRef} />}
    </div>
  );
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function hexToRgba(hex) {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((character) => character + character).join("")
    : value;
  const hasAlpha = normalized.length === 8;
  const number = Number.parseInt(normalized, 16);

  return [
    ((number >> (hasAlpha ? 24 : 16)) & 255) / 255,
    ((number >> (hasAlpha ? 16 : 8)) & 255) / 255,
    ((number >> (hasAlpha ? 8 : 0)) & 255) / 255,
    hasAlpha ? (number & 255) / 255 : 1,
  ];
}

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec4 blendColors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edgeBlur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;
  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edgeBlur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edgeBlur, mixer);
  vec3 blended = mix(color1, color2, r1);
  float opacity = mix(c1.a, c2.a, r1);
  return vec4(mix(blended, color3, r2), mix(opacity, c3.a, r2));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float noiseScale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= noiseScale * u_resolution;
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  float shape = 0.;
  float mixer = 0.;

  if (u_shape < .5) {
    vec2 checksUv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checksUv.x) * cos(checksUv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripesUv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripesUv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float edge = 1. - uv.y;
    edge -= .5;
    edge /= noiseScale * u_resolution.y;
    edge += .5;
    float scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - scaling, .55 + scaling, edge + .3 * (proportion - .5));
    mixer = shape;
  }

  vec4 color = blendColors(
    u_color1,
    u_color2,
    u_color3,
    mixer,
    1. - clamp(u_softness, 0., 1.),
    .01 + .01 * u_scale
  );
  fragColor = vec4(color.rgb, color.a);
}`;
