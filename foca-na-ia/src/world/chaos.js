// CAOS — o túnel de interfaces das sequências 01–03.
// Janelas e linhas vivem no mesmo grupo, que gira ao redor do eixo da câmera
// em S3 e congela no instante FREEZE. Depois do congelamento, o grupo fornece
// as posições exatas de onde nascem as partículas (S4) e as linhas se
// realinham em raios que convergem para o ponto P.
import * as THREE from "three";
import { mulberry32, clamp, lerp, smooth, window01, easeOutCubic, easeInOutCubic } from "../lib/math.js";
import { chaosPanelTexture, CHAOS_KINDS } from "./textures.js";
import { LineBatch } from "./lineBatch.js";

const LINE_PTS = 48;

export function createChaos({ T, camTrack, resolution }) {
  const rand = mulberry32(2026);
  const group = new THREE.Group();
  const F = T.freeze;
  const W = T.world;

  // ---------------------------------------------------- texturas compartilhadas
  const texCache = {};
  const tex = (kind, v) => (texCache[kind + v] ||= chaosPanelTexture(kind, 100 + CHAOS_KINDS.indexOf(kind) * 7 + v));

  // ---------------------------------------------------- janelas
  const windows = [];
  const camZ = (t) => camTrack(t).r;

  function addWindow({ appear, kind, ahead, radius, angle, size }) {
    const { texture, aspect } = tex(kind, windows.length % 2);
    const h = size / aspect;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, h), material);
    const z = camZ(appear) - ahead;
    const base = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
    const w = {
      mesh,
      material,
      appear,
      base,
      size,
      h,
      tilt: new THREE.Euler((rand() - 0.5) * 0.5, -Math.sign(base.x) * (0.25 + rand() * 0.45), (rand() - 0.5) * 0.25),
      slide: new THREE.Vector3(Math.sign(base.x || 1) * (0.6 + rand() * 0.6), (rand() - 0.5) * 0.4, 0),
      drift: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 0.12,
      peak: 0.62 + rand() * 0.3,
    };
    group.add(mesh);
    windows.push(w);
    return w;
  }

  // S1 — poucas interfaces nas laterais, “entrando em um sistema”
  [
    { appear: 2.1, kind: "chat", angle: Math.PI * 0.96, radius: 2.5, ahead: 13, size: 2.1 },
    { appear: 2.5, kind: "code", angle: Math.PI * 0.04, radius: 2.6, ahead: 14, size: 2.0 },
    { appear: 3.1, kind: "notif", angle: Math.PI * 0.62, radius: 2.9, ahead: 12, size: 1.7 },
    { appear: 3.4, kind: "chart", angle: -Math.PI * 0.3, radius: 2.8, ahead: 13, size: 1.9 },
  ].forEach(addWindow);

  // S2 — sobrecarga em vários planos de profundidade (cada vez mais rápido)
  for (let i = 0; i < 34; i++) {
    const k = i / 33;
    const appear = 4.15 + Math.pow(k, 0.8) * 4.5;
    addWindow({
      appear,
      kind: CHAOS_KINDS[Math.floor(rand() * CHAOS_KINDS.length)],
      angle: rand() * Math.PI * 2,
      radius: 1.5 + rand() * 2.6,
      ahead: 7 + rand() * 12,
      size: 1.3 + rand() * 1.2,
    });
  }
  // S3 — acúmulo máximo, janelas cercando a câmera
  for (let i = 0; i < 40; i++) {
    const k = i / 39;
    addWindow({
      appear: 9.05 + Math.pow(k, 0.9) * 2.9,
      kind: CHAOS_KINDS[Math.floor(rand() * CHAOS_KINDS.length)],
      angle: rand() * Math.PI * 2,
      radius: 1.3 + rand() * 2.4,
      ahead: 3.5 + rand() * 9,
      size: 1.0 + rand() * 1.1,
    });
  }

  // ---------------------------------------------------- linhas
  // Cada linha: shape(u, tau) → ponto local; draw: [início, duração]
  const lines = [];
  const v3 = () => new THREE.Vector3();
  function addLine(def) {
    def.pts = Array.from({ length: LINE_PTS }, v3);
    def.ordered = Array.from({ length: LINE_PTS }, v3);
    lines.push(def);
    return def;
  }

  const heroZ = camZ(1.0) - 26;
  // S1: primeira linha de interface (do centro para as laterais)
  for (const dir of [-1, 1]) {
    addLine({
      hero: true,
      start: W.heroLine.start,
      dur: W.heroLine.dur,
      int: 1.0,
      shape: (u, _tau, out) => out.set(dir * u * 3.6, -0.62, heroZ),
    });
  }
  // S1→S2: as linhas se multiplicam — guias paralelas e conectores em ângulo reto
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const y = -0.62 + (i < 2 ? -0.32 : i < 4 ? 0.95 : -1.5) * (1 + rand() * 0.2);
    const z = heroZ - 2 - rand() * 6;
    const x0 = side * (0.6 + rand() * 0.8);
    const x1 = side * (2.8 + rand() * 1.8);
    addLine({
      start: 2.2 + i * 0.28,
      dur: 0.9,
      int: 0.7,
      shape: (u, _tau, out) => {
        if (u < 0.6) return out.set(lerp(x0, x1, u / 0.6), y, z);
        return out.set(x1, y + side * (u - 0.6) * 2.4, z - (u - 0.6) * 3);
      },
    });
  }
  // S2: circuitos entre janelas, em profundidade
  for (let i = 0; i < 20; i++) {
    const a = windows[4 + Math.floor(rand() * 34)];
    const b = windows[4 + Math.floor(rand() * 34)];
    const pa = a.base.clone();
    const pb = b.base.clone();
    const mid = rand() < 0.5;
    addLine({
      start: Math.max(a.appear, b.appear) - 0.2 + rand() * 0.3,
      dur: 0.7 + rand() * 0.6,
      int: 0.5 + rand() * 0.35,
      shape: (u, _tau, out) => {
        // rota em “L” (estilo diagrama de interface)
        if (u < 0.5) {
          const k = u / 0.5;
          return mid ? out.set(lerp(pa.x, pb.x, k), pa.y, pa.z) : out.set(pa.x, lerp(pa.y, pb.y, k), pa.z);
        }
        const k = (u - 0.5) / 0.5;
        return mid
          ? out.set(pb.x, lerp(pa.y, pb.y, k), lerp(pa.z, pb.z, k))
          : out.set(lerp(pa.x, pb.x, k), pb.y, lerp(pa.z, pb.z, k));
      },
    });
  }
  // S2→S3: uma linha atravessa o centro e se divide em ramificações
  const splitZ = camZ(W.splitLine.start) - 6.5;
  const split = addLine({
    hero: true,
    start: W.splitLine.start,
    dur: W.splitLine.dur,
    int: 1.4,
    shape: (u, _tau, out) => out.set(lerp(-5.5, 5.5, u), 0.05, splitZ),
    fade: (u) => 0.5 + 0.5 * Math.sin(u * Math.PI),
  });
  for (let i = 0; i < 12; i++) {
    const ox = lerp(-2.6, 2.6, i / 11) + (rand() - 0.5) * 0.3;
    const ang = (i % 2 ? 1 : -1) * (0.5 + rand() * 1.0);
    const len = 2.5 + rand() * 3.5;
    const curl = (rand() - 0.5) * 2.5;
    const dz = -(1.5 + rand() * 6);
    addLine({
      start: W.splitLine.branchAt + Math.abs(ox) * 0.08,
      dur: 0.8 + rand() * 0.6,
      int: 0.8,
      shape: (u, tau, out) => {
        const wob = Math.sin(u * 6 + tau * 2.2 + i) * 0.12 * clamp(tau - 9, 0, 3);
        const a = ang + curl * u * u;
        return out.set(ox + Math.sin(a) * len * u * 0.55, 0.05 + Math.cos(a) * len * u * Math.sign(ang) * 0.9 + wob, splitZ + dz * u);
      },
    });
  }
  // S3: emaranhado — espirais ao redor da câmera
  for (let i = 0; i < 16; i++) {
    const r0 = 1.4 + rand() * 2.4;
    const ph = rand() * Math.PI * 2;
    const turns = 0.6 + rand() * 1.4;
    const zStart = camZ(9.4 + i * 0.16) - 2 - rand() * 3;
    const zLen = 8 + rand() * 10;
    addLine({
      start: 9.3 + i * 0.17,
      dur: 0.9 + rand() * 0.5,
      int: 0.55 + rand() * 0.35,
      shape: (u, tau, out) => {
        const a = ph + u * turns * Math.PI * 2 + (tau - 9) * 0.3;
        const r = r0 * (1 + 0.25 * Math.sin(u * 9 + i));
        return out.set(Math.cos(a) * r, Math.sin(a) * r, zStart - u * zLen);
      },
    });
  }

  // alvo ordenado de cada linha: raios que convergem para P (no frame congelado)
  lines.forEach((l, i) => {
    const a = (i / lines.length) * Math.PI * 2 + 0.2;
    const rOuter = 5.5 + (i % 3) * 1.2;
    for (let k = 0; k < LINE_PTS; k++) {
      const u = k / (LINE_PTS - 1);
      const r = lerp(rOuter, 0.55, u);
      l.ordered[k].set(Math.cos(a) * r, Math.sin(a) * r, lerp(3.5 + (i % 4), 0.2, u));
    }
  });

  const heroBatch = new LineBatch(LINE_PTS * 8, { width: 3.2, resolution });
  const batch = new LineBatch(LINE_PTS * lines.length, { width: 1.7, resolution });
  // ficam fora do grupo giratório: as linhas recebem coordenadas de mundo
  const lineRoot = new THREE.Group();
  lineRoot.add(heroBatch.mesh, batch.mesh);

  // ---------------------------------------------------- tempo
  const spinStart = W.spinStart;
  const spinAt = (tau) => {
    // aceleração angular constante: girar cada vez mais rápido até o congelamento
    const d = Math.max(0, tau - spinStart);
    return 0.5 * 0.26 * d * d;
  };
  const tmp = new THREE.Vector3();
  const rot = new THREE.Matrix4();
  const rotF = new THREE.Matrix4().makeRotationZ(spinAt(F));
  const rotFInv = rotF.clone().invert();
  const orderedLocal = new THREE.Vector3();

  function windowState(w, tau, t, out) {
    const k = easeOutCubic((tau - w.appear) / 0.45);
    out.pos.copy(w.base).addScaledVector(w.slide, 1 - k);
    out.pos.y += Math.sin(tau * 0.7 + w.drift) * 0.06;
    out.rot.set(w.tilt.x, w.tilt.y, w.tilt.z + w.spin * Math.max(0, tau - spinStart) ** 2);
    out.scale = lerp(0.82, 1, k);
    out.vis = clamp((tau - w.appear) / 0.3);
    return out;
  }
  const ws = { pos: new THREE.Vector3(), rot: new THREE.Euler(), scale: 1, vis: 0 };
  // tudo que se aproxima do plano da câmera se apaga antes de atravessá-lo (sem “pop”)
  let camZCur = 1e9;
  const nearFade = (z) => smooth((camZCur - z - 0.6) / 3.2);

  function update(t, L, camZNow) {
    const tau = Math.min(t, F);
    camZCur = camZNow;
    group.rotation.z = spinAt(tau);
    const dim = 1 - window01(t, W.dimStart, W.dimEnd);
    const darken = 1 - window01(t, W.dimStart - 0.1, W.dimStart + 1.0);
    for (const w of windows) {
      windowState(w, tau, t, ws);
      w.mesh.position.copy(ws.pos);
      w.mesh.rotation.copy(ws.rot);
      w.mesh.scale.setScalar(ws.scale);
      const op = ws.vis * w.peak * clamp(L.chaos, 0, 1.1) * dim * nearFade(ws.pos.z);
      w.material.opacity = op;
      w.material.color.setScalar(lerp(0.25, 1, darken));
      w.mesh.visible = op > 0.003;
    }

    // linhas
    rot.makeRotationZ(spinAt(tau));
    const align = easeInOutCubic((t - W.linesAlign[0]) / (W.linesAlign[1] - W.linesAlign[0]));
    const fadeK = window01(t, W.linesFade[0], W.linesFade[1]);
    heroBatch.begin();
    batch.begin();
    for (const l of lines) {
      const prog = easeInOutCubic((tau - l.start) / l.dur);
      if (prog <= 0) continue;
      for (let k = 0; k < LINE_PTS; k++) {
        const u = k / (LINE_PTS - 1);
        l.shape(u, tau, tmp);
        // o grupo de linhas gira junto com as janelas (exceto S1, já ultrapassado)
        tmp.applyMatrix4(rot);
        if (align > 0) {
          orderedLocal.copy(l.ordered[k]);
          tmp.lerp(orderedLocal, align);
        }
        l.pts[k].copy(tmp);
      }
      // brilho: perde luz no congelamento, volta a brilhar ao se alinhar e some no fim
      const chaosI = clamp(L.chaos, 0, 1.1) * lerp(0.3, 1, darken);
      const orderI = 0.75 * Math.sin(Math.PI * clamp(align));
      const inten = l.int * Math.max(chaosI * (1 - align), orderI) * (1 - fadeK);
      // ao apagar, cada raio se recolhe em direção a P
      const a = align > 0.5 ? fadeK * 0.98 : 0;
      (l.hero && align < 0.5 ? heroBatch : batch).add(l.pts, a, prog, inten, l.fade, nearFade);
    }
    heroBatch.end();
    batch.end();
  }

  /** Amostra n pontos (coordenadas de mundo) sobre as janelas e linhas congeladas. */
  function sampleFrozen(n, rnd, cameraZ) {
    const out = [];
    const tF = F;
    const candidates = windows.filter((w) => w.appear < tF - 0.2 && w.base.z < cameraZ - 1.2);
    const areas = candidates.map((w) => w.size * w.h);
    const total = areas.reduce((a, b) => a + b, 0);
    const lineShare = 0.22;
    const mat = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const p = new THREE.Vector3();
      if (rnd() < lineShare) {
        const l = lines[Math.floor(rnd() * lines.length)];
        const prog = clamp((tF - l.start) / l.dur);
        l.shape(rnd() * prog, tF, p);
        p.applyMatrix4(rotF);
        if (p.z > cameraZ - 1) p.z = cameraZ - 1 - rnd() * 4;
        out.push({ p, src: "line" });
        continue;
      }
      let pick = rnd() * total;
      let w = candidates[0];
      for (let j = 0; j < candidates.length; j++) {
        pick -= areas[j];
        if (pick <= 0) {
          w = candidates[j];
          break;
        }
      }
      windowState(w, tF, tF, ws);
      // pontos mais densos na borda (a moldura prateada)
      let x;
      let y;
      if (rnd() < 0.45) {
        const e = rnd() * 4;
        const s = rnd() - 0.5;
        x = e < 1 ? -0.5 : e < 2 ? 0.5 : s;
        y = e < 1 || e < 2 ? s : e < 3 ? -0.5 : 0.5;
      } else {
        x = rnd() - 0.5;
        y = rnd() - 0.5;
      }
      p.set(x * w.size, y * w.h, 0);
      quat.setFromEuler(ws.rot);
      mat.compose(ws.pos, quat, new THREE.Vector3(ws.scale, ws.scale, ws.scale));
      p.applyMatrix4(mat).applyMatrix4(rotF);
      out.push({ p, src: "window" });
    }
    return out;
  }

  return { group, lineRoot, update, sampleFrozen, rotFInv };
}
