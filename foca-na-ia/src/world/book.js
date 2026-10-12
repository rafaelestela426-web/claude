// E-BOOK FOCA NA IA — mockup 3D (capa dura: duas capas, lombada e miolo).
// Nasce como silhueta (contorno desenhado), ganha espessura (escala Z),
// textura e reflexo a partir da luz das partículas que pousam nele.
import * as THREE from "three";
import { clamp, lerp, smooth, window01, easeOutCubic } from "../lib/math.js";
import { coverTextures, spineTexture, pagesTexture, backTexture, glowTexture } from "./textures.js";
import { LineBatch } from "./lineBatch.js";

export const BOOK = { W: 2.0, H: 2.8, D: 0.3, board: 0.035 };

export function createBook({ T, resolution, envMap }) {
  const { W, H, D, board } = BOOK;
  const brand = T.brand;
  const root = new THREE.Group(); // posição flutuante
  const body = new THREE.Group(); // escala Z (ganho de espessura)
  root.add(body);

  const cover = coverTextures(brand);
  let coverMap = cover.map;
  if (brand.coverImage) {
    coverMap = new THREE.TextureLoader().load(brand.coverImage);
    coverMap.colorSpace = THREE.SRGBColorSpace;
  }
  const all = [];
  const std = (opts) => {
    const m = new THREE.MeshPhysicalMaterial({ envMap, transparent: true, ...opts });
    all.push(m);
    return m;
  };
  const black = std({ color: 0x08090a, roughness: 0.55, metalness: 0.3, clearcoat: 0.15, clearcoatRoughness: 0.4 });
  const coverMat = std({
    map: coverMap,
    roughnessMap: brand.coverImage ? null : cover.orm,
    metalnessMap: brand.coverImage ? null : cover.orm,
    roughness: 1,
    metalness: brand.coverImage ? 0.3 : 1,
    specularIntensityMap: brand.coverImage ? null : cover.spec,
    clearcoat: 0,
  });
  const backMat = std({ map: backTexture(brand), roughness: 0.5, metalness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const spineMat = std({ map: spineTexture(brand), roughness: 0.4, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 });
  const pagesV = std({ map: pagesTexture(true), roughness: 0.85, metalness: 0 });
  const pagesH = std({ map: pagesTexture(false), roughness: 0.85, metalness: 0 });

  // capa frontal (+z) — ordem das faces do BoxGeometry: +x, -x, +y, -y, +z, -z
  const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, board), [black, black, black, black, coverMat, black]);
  front.position.z = D / 2 - board / 2;
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, board), [black, black, black, black, black, backMat]);
  back.position.z = -D / 2 + board / 2;
  const spine = new THREE.Mesh(new THREE.BoxGeometry(board, H, D), [black, spineMat, black, black, black, black]);
  spine.position.x = -W / 2 + board / 2;
  // miolo (páginas) levemente recuado
  const pw = W - board - 0.05;
  const pages = new THREE.Mesh(new THREE.BoxGeometry(pw, H - 0.07, D - board * 2), [pagesV, black, pagesH, pagesH, black, black]);
  pages.position.x = -W / 2 + board + pw / 2;
  body.add(front, back, spine, pages);
  [front, back, spine, pages].forEach((m) => {
    m.renderOrder = 2;
  });

  // brilho de nascimento (luz que esfria e vira material)
  const glowTex = glowTexture(256, 1.6);
  const birthGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 2.4, H * 2.0),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  );
  birthGlow.position.z = D / 2 + 0.02;
  root.add(birthGlow);

  // silhueta: plano fantasma + contorno desenhado
  const ghost = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ color: 0xdfe6ee, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  );
  ghost.position.z = D / 2 + 0.01;
  root.add(ghost);
  const outline = new LineBatch(64, { width: 2.6, resolution });
  root.add(outline.mesh);
  const zf = D / 2 + 0.012;
  const half = (dir) => {
    const pts = [];
    const corners = [
      [0, H / 2],
      [dir * W / 2, H / 2],
      [dir * W / 2, -H / 2],
      [0, -H / 2],
    ];
    for (let c = 0; c < 3; c++) {
      const [x0, y0] = corners[c];
      const [x1, y1] = corners[c + 1];
      for (let k = 0; k < 10; k++) pts.push(new THREE.Vector3(lerp(x0, x1, k / 10), lerp(y0, y1, k / 10), zf));
    }
    pts.push(new THREE.Vector3(0, -H / 2, zf));
    return pts;
  };
  const outA = half(-1);
  const outB = half(1);

  // feixe que varre a capa (S5→S6)
  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.02, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  );
  beam.position.z = D / 2 + 0.015;
  root.add(beam);

  // mascote opcional (somente se houver imagem oficial)
  let mascot = null;
  if (brand.mascotImage) {
    const mt = new THREE.TextureLoader().load(brand.mascotImage);
    mt.colorSpace = THREE.SRGBColorSpace;
    mascot = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({ map: mt, transparent: true, depthWrite: false, opacity: 0 }),
    );
    mascot.position.set(0.9, 0.6, -1.6);
    root.add(mascot);
  }

  const W5 = T.world;
  function update(t, L) {
    const sil = W5.silhouette;
    const silK = smooth((t - sil.start) / sil.dur);
    const solidK = window01(t, W5.bookSolid[0], W5.bookSolid[1]);
    const born = t >= W5.bookSolid[0];

    // flutuação contínua depois do nascimento
    const f = Math.max(0, t - 16.5);
    root.position.y = 0.05 * Math.sin(f * 1.0) * smooth(f / 1.5);
    root.rotation.y = 0.07 * Math.sin(f * 0.55) * smooth(f / 2);
    root.rotation.x = 0.03 * Math.sin(f * 0.8 + 1.2) * smooth(f / 2);

    body.visible = born;
    body.scale.z = lerp(0.03, 1, easeOutCubic(solidK));
    const op = clamp(solidK * 1.7);
    const em = Math.pow(1 - solidK, 1.6) * 0.45;
    for (const m of all) {
      m.opacity = op;
      m.emissive.setScalar(1);
      m.emissiveIntensity = em;
      m.envMapIntensity = lerp(0.1, m === coverMat ? 1.6 : 0.55, L.key);
    }

    // silhueta: contorno desenha-se e depois se dissolve no material
    const silFade = 1 - window01(t, W5.bookSolid[0] + 0.2, W5.bookSolid[1] + 0.2);
    outline.begin();
    if (silK > 0) {
      const inten = 1.1 * silFade;
      outline.add(outA, 0, silK, inten);
      outline.add(outB, 0, silK, inten);
    }
    outline.end();
    ghost.material.opacity = 0.035 * smooth((t - sil.start - 0.4) / 1.2) * silFade;
    birthGlow.material.opacity = 0.16 * Math.sin(Math.PI * clamp((t - W5.bookSolid[0] + 0.5) / 2.2)) * L.core;

    // feixe de leitura da capa
    const bk = clamp((t - (W5.knowledgeOut[0] - 0.25)) / 0.7);
    beam.material.opacity = Math.sin(Math.PI * bk) * 0.85;
    beam.position.y = lerp(H / 2, -H / 2, bk);

    if (mascot) mascot.material.opacity = 0.55 * window01(t, 27.4, 28.6);
  }

  return { root, update, coverMap };
}
