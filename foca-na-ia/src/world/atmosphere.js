// ATMOSFERA — elementos que nunca saem de cena: o ponto de luz P,
// a poeira prateada em profundidade e o halo suave atrás do produto.
import * as THREE from "three";
import { mulberry32 } from "../lib/math.js";
import { glowTexture } from "./textures.js";

export function createAtmosphere() {
  const group = new THREE.Group();
  const glow = glowTexture(256, 2.4);

  // ponto de luz P: o primeiro sinal e o destino de tudo
  const coreMat = new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const core = new THREE.Sprite(coreMat);
  const coreHaze = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(256, 1.3), color: 0xbac4cf, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  core.position.set(0, 0, -0.6);
  coreHaze.position.set(0, 0, -1.2);
  group.add(coreHaze, core);

  // poeira: profundidade constante ao longo de todo o filme
  const rand = mulberry32(77);
  const N = 1400;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.8 + Math.pow(rand(), 0.6) * 9;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r;
    pos[i * 3 + 2] = -8 + rand() * 75;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.045,
    map: glowTexture(32, 1.4),
    color: 0xcfd6de,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  group.add(dust);

  function update(t, L, camDist) {
    // o ponto mantém tamanho aparente pequeno no túnel e vira brilho de fundo no produto
    const s = Math.max(0.35, camDist * 0.05);
    core.scale.setScalar(s * (0.9 + 0.1 * Math.sin(t * 2.0)));
    coreMat.opacity = L.core;
    coreHaze.scale.setScalar(Math.max(4.5, camDist * 0.32));
    coreHaze.material.opacity = 0.35 * L.core;
    dustMat.opacity = L.dust;
    dust.rotation.z = t * 0.012;
  }

  return { group, update };
}
