// PARTÍCULAS — o elo entre o caos e o produto.
// Cada partícula nasce num ponto exato de uma janela/linha congelada (aSrc)
// e viaja por uma Bézier cúbica ordenada (aC1, aC2) até um ponto do livro
// ou do halo (aDst). Ordem de partida = ângulo de origem → fluxos precisos.
import * as THREE from "three";

const vert = /* glsl */ `
  attribute vec3 aSrc;
  attribute vec3 aC1;
  attribute vec3 aC2;
  attribute vec3 aDst;
  attribute float aStart;
  attribute float aDur;
  attribute float aSeed;
  attribute float aKind; // 0 = superfície do livro, 1 = halo
  uniform float uTime;
  uniform float uAppear;
  uniform float uSolid;
  uniform float uHaloSpin;
  uniform float uSize;
  uniform float uGain;
  varying float vAlpha;

  vec3 bez(vec3 a, vec3 b, vec3 c, vec3 d, float k) {
    float i = 1.0 - k;
    return i*i*i*a + 3.0*i*i*k*b + 3.0*i*k*k*c + k*k*k*d;
  }
  vec3 rotZ(vec3 p, float a) {
    float c = cos(a), s = sin(a);
    return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z);
  }
  float ease(float k) { // easeInOutCubic
    return k < 0.5 ? 4.0*k*k*k : 1.0 - pow(-2.0*k + 2.0, 3.0) / 2.0;
  }

  void main() {
    float k = clamp((uTime - aStart) / aDur, 0.0, 1.0);
    float e = ease(k);
    vec3 dst = aDst;
    vec3 c2 = aC2;
    if (aKind > 0.5) {
      float a = uHaloSpin * (0.6 + 0.4 * aSeed);
      dst = rotZ(dst, a);
      c2 = rotZ(c2, a);
    }
    vec3 p = bez(aSrc, aC1, c2, dst, e);
    // respiração sutil depois de pousar
    p += vec3(0.0, sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 30.0)) * 0.012 * k;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.7 + 0.3 * sin(uTime * 2.4 + aSeed * 60.0);
    // em voo, a partícula fica mais brilhante (rastro de luz)
    float flight = sin(3.14159 * k);
    float size = uSize * (0.6 + 0.8 * aSeed) * (1.0 + 0.9 * flight);
    gl_PointSize = clamp(size * 900.0 / -mv.z, 1.2, 8.0);
    float land = aKind < 0.5 ? (1.0 - uSolid * 0.9 * smoothstep(0.8, 1.0, k)) : 1.0;
    vAlpha = uAppear * uGain * twinkle * (0.55 + 0.6 * flight) * land;
  }
`;

const frag = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float a = pow(max(0.0, 1.0 - d), 1.8);
    gl_FragColor = vec4(vec3(0.88, 0.92, 0.97) * a * vAlpha, 1.0);
  }
`;

/**
 * items: [{ src, c1, c2, dst, start, dur, seed, kind }]
 */
export function createParticles(items, { size = 0.05 } = {}) {
  const n = items.length;
  const geo = new THREE.BufferGeometry();
  const f3 = (key) => {
    const a = new Float32Array(n * 3);
    items.forEach((it, i) => it[key].toArray(a, i * 3));
    return new THREE.BufferAttribute(a, 3);
  };
  const f1 = (key) => new THREE.BufferAttribute(Float32Array.from(items, (it) => it[key]), 1);
  geo.setAttribute("position", f3("src"));
  geo.setAttribute("aSrc", f3("src"));
  geo.setAttribute("aC1", f3("c1"));
  geo.setAttribute("aC2", f3("c2"));
  geo.setAttribute("aDst", f3("dst"));
  geo.setAttribute("aStart", f1("start"));
  geo.setAttribute("aDur", f1("dur"));
  geo.setAttribute("aSeed", f1("seed"));
  geo.setAttribute("aKind", f1("kind"));
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uAppear: { value: 0 },
      uSolid: { value: 0 },
      uHaloSpin: { value: 0 },
      uSize: { value: size },
      uGain: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return { points, uniforms: material.uniforms };
}
