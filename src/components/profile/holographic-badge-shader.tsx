"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  BadgeTier,
  buildBadgeShaderUniforms,
  getBadgeTierConfig,
  HolographicBadgeMetadata,
} from "../../types/badge";

export const HOLOGRAM_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  vNormal = vec3(0.0, 0.0, 1.0);
  vViewDir = vec3(0.0, 0.0, 1.0);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const HOLOGRAM_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform float uTime;
uniform vec2 uTilt;
uniform vec3 uBaseColor;
uniform vec3 uSheenColor;
uniform float uIridescence;
uniform float uDiffractionFreq;
uniform float uSparkIntensity;

vec3 thinFilmSpectrum(float phase) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);
  return a + b * cos(6.2831853 * (c * phase + d));
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 centeredUv = vUv * 2.0 - 1.0;
  float radialDist = length(centeredUv);

  vec3 tiltedNormal = normalize(vec3(uTilt.x * 0.85, uTilt.y * 0.85, 1.0));
  float ndotv = clamp(dot(tiltedNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  float fresnel = pow(1.0 - ndotv, 2.2);

  float gratingWave = sin(
    (vUv.x * 0.75 + vUv.y * 0.65 + dot(uTilt, vec2(0.35, -0.35))) * uDiffractionFreq + uTime * 1.4
  );
  float opticalPathDiff = radialDist * 1.35 + dot(vUv - 0.5, uTilt) * 2.4 + gratingWave * 0.08;
  vec3 rainbowSheen = thinFilmSpectrum(opticalPathDiff + uTime * 0.12);

  float sweepPos = dot(vUv - 0.5, normalize(uTilt + vec2(0.25, 0.35)));
  float specularBand = exp(-pow((sweepPos - sin(uTime * 0.9) * 0.25) * 5.5, 2.0));

  float spark = 0.0;
  if (uSparkIntensity > 0.01) {
    vec2 grid = floor(vUv * 18.0);
    float rnd = hash21(grid);
    float twinkle = 0.5 + 0.5 * sin(uTime * 5.0 + rnd * 25.0);
    float starMask = smoothstep(0.92, 0.995, rnd) * twinkle;
    spark = starMask * uSparkIntensity;
  }

  vec3 metallicBase = mix(uBaseColor, uSheenColor, 0.35 + 0.35 * gratingWave);
  vec3 holoColor = metallicBase
    + rainbowSheen * uIridescence * (0.32 + 0.55 * fresnel)
    + uSheenColor * specularBand * 0.45
    + vec3(1.0, 0.98, 0.92) * spark;

  float edgeGlow = smoothstep(0.98, 0.82, radialDist);
  gl_FragColor = vec4(holoColor * (0.85 + 0.25 * edgeGlow), 1.0);
}
`;

export interface HolographicBadgeShaderProps {
  badge: HolographicBadgeMetadata;
  sizePx?: number;
  forceFallback2D?: boolean;
  onWebglDispose?: () => void;
}

export function clampTilt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

export const HolographicBadgeShader: React.FC<HolographicBadgeShaderProps> = ({
  badge,
  sizePx = 220,
  forceFallback2D = false,
  onWebglDispose,
}) => {
  const tierConfig = useMemo(() => getBadgeTierConfig(badge.tier), [badge.tier]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tiltRef = useRef<[number, number]>([0, 0]);
  const [tilt, setTilt] = useState<[number, number]>([0, 0]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(Boolean(mq.matches));
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);

  const useFallbackSvg = forceFallback2D || prefersReducedMotion || webglUnsupported;

  // Device gyroscope orientation listener for mobile 3D tilt physics
  useEffect(() => {
    if (useFallbackSvg || typeof window === "undefined") return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const gamma = typeof event.gamma === "number" ? event.gamma / 45 : 0; // left-right [-1..1]
      const beta = typeof event.beta === "number" ? (event.beta - 45) / 45 : 0; // front-back [-1..1]
      const nextTilt: [number, number] = [clampTilt(gamma), clampTilt(beta)];
      tiltRef.current = nextTilt;
      setTilt(nextTilt);
    };

    window.addEventListener("deviceorientation", handleDeviceOrientation);
    return () => window.removeEventListener("deviceorientation", handleDeviceOrientation);
  }, [useFallbackSvg]);

  // WebGL shader initialization, 60 FPS uniform loop, and deterministic resource cleanup on unmount
  useEffect(() => {
    if (useFallbackSvg) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebglUnsupported(true);
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, HOLOGRAM_VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, HOLOGRAM_FRAGMENT_SHADER);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      setWebglUnsupported(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglUnsupported(true);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglUnsupported(true);
      return;
    }

    gl.useProgram(program);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, "uTime");
    const uTiltLoc = gl.getUniformLocation(program, "uTilt");
    const uBaseColorLoc = gl.getUniformLocation(program, "uBaseColor");
    const uSheenColorLoc = gl.getUniformLocation(program, "uSheenColor");
    const uIridescenceLoc = gl.getUniformLocation(program, "uIridescence");
    const uDiffractionFreqLoc = gl.getUniformLocation(program, "uDiffractionFreq");
    const uSparkIntensityLoc = gl.getUniformLocation(program, "uSparkIntensity");

    const startTimeMs = performance.now();
    let rafId = 0;

    const renderFrame = () => {
      if (!gl) return;
      const elapsedSec = (performance.now() - startTimeMs) / 1000;
      const uniforms = buildBadgeShaderUniforms(badge.tier, tiltRef.current, elapsedSec);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform1f(uTimeLoc, uniforms.uTime);
      gl.uniform2f(uTiltLoc, uniforms.uTilt[0], uniforms.uTilt[1]);
      gl.uniform3f(
        uBaseColorLoc,
        uniforms.uBaseColor[0],
        uniforms.uBaseColor[1],
        uniforms.uBaseColor[2],
      );
      gl.uniform3f(
        uSheenColorLoc,
        uniforms.uSheenColor[0],
        uniforms.uSheenColor[1],
        uniforms.uSheenColor[2],
      );
      gl.uniform1f(uIridescenceLoc, uniforms.uIridescence);
      gl.uniform1f(uDiffractionFreqLoc, uniforms.uDiffractionFreq);
      gl.uniform1f(uSparkIntensityLoc, uniforms.uSparkIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      if (gl) {
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      onWebglDispose?.();
    };
  }, [badge.tier, useFallbackSvg, onWebglDispose]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (useFallbackSvg) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    const nextTilt: [number, number] = [clampTilt(nx), clampTilt(ny)];
    tiltRef.current = nextTilt;
    setTilt(nextTilt);
  };

  const handlePointerLeave = () => {
    tiltRef.current = [0, 0];
    setTilt([0, 0]);
  };

  const rotateXDeg = useFallbackSvg ? 0 : Number((tilt[1] * 18).toFixed(2));
  const rotateYDeg = useFallbackSvg ? 0 : Number((tilt[0] * 18).toFixed(2));

  return (
    <div
      data-testid="holographic-badge-container"
      data-tier={badge.tier}
      data-render-mode={useFallbackSvg ? "svg-fallback" : "webgl-shader"}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        width: sizePx,
        transform: `perspective(800px) rotateX(${rotateXDeg}deg) rotateY(${rotateYDeg}deg)`,
      }}
      className="relative select-none rounded-3xl border border-white/15 bg-zinc-950/90 p-4 shadow-2xl transition-transform duration-150 ease-out"
    >
      <div className="relative mx-auto flex items-center justify-center overflow-hidden rounded-2xl">
        {useFallbackSvg ? (
          <svg
            data-testid="holographic-badge-svg-fallback"
            width={sizePx - 32}
            height={sizePx - 32}
            viewBox="0 0 200 200"
            role="img"
            aria-label={`${badge.tier} ${badge.title} Badge`}
          >
            <defs>
              <linearGradient id={`grad-${badge.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={tierConfig.primaryHex} />
                <stop offset="50%" stopColor={tierConfig.accentHex} />
                <stop offset="100%" stopColor={tierConfig.secondaryHex} />
              </linearGradient>
            </defs>
            <polygon
              points="100,10 182,55 182,145 100,190 18,145 18,55"
              fill={`url(#grad-${badge.id})`}
              stroke={tierConfig.accentHex}
              strokeWidth="4"
            />
            <text
              x="100"
              y="96"
              textAnchor="middle"
              fill="#09090B"
              fontSize="16"
              fontWeight="800"
            >
              {badge.tier.toUpperCase()}
            </text>
            <text
              x="100"
              y="118"
              textAnchor="middle"
              fill="#18181B"
              fontSize="11"
              fontWeight="600"
            >
              {badge.title}
            </text>
          </svg>
        ) : (
          <canvas
            ref={canvasRef}
            data-testid="holographic-badge-canvas"
            width={sizePx - 32}
            height={sizePx - 32}
            aria-label={`${badge.tier} ${badge.title} WebGL Holographic Badge`}
            className="rounded-2xl"
          />
        )}

        {tierConfig.enableParticleSparks && (
          <div
            data-testid="holographic-tier-sparks"
            className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 backdrop-blur"
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
            {tierConfig.sparkCount} sparks
          </div>
        )}
      </div>

      <div className="mt-3 text-center">
        <div
          style={{ color: tierConfig.primaryHex }}
          className="text-xs font-extrabold uppercase tracking-widest"
        >
          {badge.tier} Tier
        </div>
        <div className="mt-0.5 truncate text-sm font-bold text-white">{badge.title}</div>
        {badge.percentileLabel && (
          <div className="mt-0.5 text-[11px] text-zinc-400">{badge.percentileLabel}</div>
        )}
      </div>
    </div>
  );
};

export default HolographicBadgeShader;
