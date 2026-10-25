const palette = `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

vec3 palette(float t) {
  t = fract(t) * 3.0;
  if (t < 1.0) return mix(uColorA, uColorB, smoothstep(0.0, 1.0, t));
  if (t < 2.0) return mix(uColorB, uColorC, smoothstep(0.0, 1.0, t - 1.0));
  return mix(uColorC, uColorA, smoothstep(0.0, 1.0, t - 2.0));
}
`;

export const ringShader = {
  vertex: `
varying vec2 vPos;
void main() {
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragment: `
uniform float uTime;
uniform float uGlow;
uniform float uInner;
uniform float uOuter;
varying vec2 vPos;
${palette}

void main() {
  float r = length(vPos);
  float angle = atan(vPos.y, vPos.x);
  float band = (r - uInner) / (uOuter - uInner);

  float flow = sin(angle * 3.0 + uTime * 0.9) * 0.5
             + sin(angle * 5.0 - uTime * 1.3 + band * 4.0) * 0.3
             + sin(band * 9.0 - uTime * 0.6) * 0.2;
  vec3 color = palette(angle / 6.2831 + flow * 0.18 + uTime * 0.03);

  float profile = exp(-pow((band - 0.55) * 3.2, 2.0));
  float shimmer = 0.75 + 0.25 * sin(angle * 24.0 + uTime * 4.0 + flow * 3.0);
  float intensity = profile * shimmer * uGlow;

  gl_FragColor = vec4(color * intensity * 2.2, intensity);
}
`,
};

export const backdropShader = {
  vertex: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragment: `
uniform float uTime;
uniform float uStrength;
varying vec2 vUv;
${palette}

void main() {
  vec2 p = vUv;
  float wave = sin(p.x * 6.0 + uTime * 0.15) * 0.08 + sin(p.x * 13.0 - uTime * 0.22) * 0.04;
  float curtain = exp(-pow((p.y - 0.62 - wave) * 4.5, 2.0));
  float streaks = 0.55 + 0.45 * sin(p.x * 40.0 + sin(p.x * 7.0 + uTime * 0.3) * 3.0);
  float fade = smoothstep(0.0, 0.35, p.x) * smoothstep(1.0, 0.65, p.x);
  vec3 color = palette(p.x * 0.8 + uTime * 0.02);
  float a = curtain * streaks * fade * uStrength;
  gl_FragColor = vec4(color * a * 0.6, a);
}
`,
};
