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

// Spectral rainbow thin-film interference phase-to-RGB mapping
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

  // Viewing angle + pointer/gyroscope tilt contribution
  vec3 tiltedNormal = normalize(vec3(uTilt.x * 0.85, uTilt.y * 0.85, 1.0));
  float ndotv = clamp(dot(tiltedNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
  float fresnel = pow(1.0 - ndotv, 2.2);

  // Diffraction grating micro-ridges reacting to tilt & UV phase
  float gratingWave = sin(
    (vUv.x * 0.75 + vUv.y * 0.65 + dot(uTilt, vec2(0.35, -0.35))) * uDiffractionFreq + uTime * 1.4
  );
  float opticalPathDiff = radialDist * 1.35 + dot(vUv - 0.5, uTilt) * 2.4 + gratingWave * 0.08;
  vec3 rainbowSheen = thinFilmSpectrum(opticalPathDiff + uTime * 0.12);

  // Metallic specular sweep band
  float sweepPos = dot(vUv - 0.5, normalize(uTilt + vec2(0.25, 0.35)));
  float specularBand = exp(-pow((sweepPos - sin(uTime * 0.9) * 0.25) * 5.5, 2.0));

  // Top-tier particle sparks (Diamond, Master, Grandmaster)
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

  // Crisp circular/hexagonal medallion vignette edge
  float edgeGlow = smoothstep(0.98, 0.82, radialDist);
  gl_FragColor = vec4(holoColor * (0.85 + 0.25 * edgeGlow), 1.0);
}
