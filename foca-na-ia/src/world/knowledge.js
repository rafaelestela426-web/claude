// CONHECIMENTO EM AÇÃO (S6) — os mesmos painéis de interface do caos,
// agora alinhados, ancorados no livro e conectados por linhas finas.
// Saem da capa, formam uma única composição em cascata e voltam ao livro.
import * as THREE from "three";
import { clamp, lerp, easeInOutCubic, easeOutCubic, window01 } from "../lib/math.js";
import { knowledgePanelTexture, glowTexture } from "./textures.js";
import { LineBatch } from "./lineBatch.js";
import { BOOK } from "./book.js";

// Cascata em zigue-zague: prompt → ideia → ferramenta → aplicação
export const NODES = [
  { kind: "prompts", pos: [-0.3, 0.92, 1.05], rotY: 0.16, delay: 0.0 },
  { kind: "ideias", pos: [0.32, 0.24, 1.35], rotY: -0.16, delay: 0.18 },
  { kind: "ferramentas", pos: [-0.3, -0.46, 1.55], rotY: 0.16, delay: 0.36 },
  { kind: "aplicacoes", pos: [0.3, -1.16, 1.3], rotY: -0.16, delay: 0.54 },
];
const PW = 1.02;

export function createKnowledge({ T, resolution }) {
  const group = new THREE.Group();
  const W = T.world;
  const zCover = BOOK.D / 2 + 0.02;
  const panels = NODES.map((n) => {
    const { texture, aspect } = knowledgePanelTexture(n.kind);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PW / aspect), material);
    mesh.renderOrder = 5;
    group.add(mesh);
    const target = new THREE.Vector3(...n.pos);
    // ponto de saída: o lugar correspondente sobre a capa
    const origin = new THREE.Vector3(n.pos[0] * 0.5, n.pos[1] * 0.75, zCover);
    return { ...n, mesh, material, target, origin, h: PW / aspect };
  });

  const lines = new LineBatch(600, { width: 1.6, resolution });
  group.add(lines.mesh);

  // pulsos de luz viajando pelas conexões
  const DOTS = 10;
  const dotGeo = new THREE.BufferGeometry();
  const dotPos = new Float32Array(DOTS * 3);
  dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
  const dotMat = new THREE.PointsMaterial({
    size: 0.09,
    map: glowTexture(64, 1.5),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
    opacity: 0,
  });
  const dots = new THREE.Points(dotGeo, dotMat);
  dots.frustumCulled = false;
  group.add(dots);

  const anchor = (p, side) => new THREE.Vector3(p.x + side * (PW / 2) * 0.98, p.y, p.z);
  const curve = (a, b, n = 24) => {
    const pts = [];
    const m1 = new THREE.Vector3(a.x, lerp(a.y, b.y, 0.5), lerp(a.z, b.z, 0.3));
    const m2 = new THREE.Vector3(b.x, lerp(a.y, b.y, 0.5), lerp(a.z, b.z, 0.7));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const ik = 1 - k;
      pts.push(
        new THREE.Vector3()
          .addScaledVector(a, ik * ik * ik)
          .addScaledVector(m1, 3 * ik * ik * k)
          .addScaledVector(m2, 3 * ik * k * k)
          .addScaledVector(b, k * k * k),
      );
    }
    return pts;
  };
  const tmp = new THREE.Vector3();
  const state = panels.map(() => ({ pos: new THREE.Vector3(), s: 0, vis: 0 }));

  function panelState(i, t) {
    const p = panels[i];
    const st = state[i];
    const [o0, o1] = W.knowledgeOut;
    const [b0, b1] = W.knowledgeBack;
    const kOut = easeInOutCubic((t - o0 - p.delay) / (o1 - o0 - 0.4));
    const kBack = easeInOutCubic((t - b0 - (0.54 - p.delay) * 0.6) / (b1 - b0 - 0.35));
    const k = kOut * (1 - kBack);
    st.pos.lerpVectors(p.origin, p.target, k);
    st.s = lerp(0.18, 1, k);
    st.vis = clamp(kOut * 2) * (1 - clamp((kBack - 0.55) / 0.45));
    return st;
  }

  function update(t) {
    lines.begin();
    const active = t > W.knowledgeOut[0] - 0.1 && t < W.knowledgeBack[1] + 0.1;
    group.visible = active;
    if (!active) {
      lines.end();
      return;
    }
    panels.forEach((p, i) => {
      const st = panelState(i, t);
      p.mesh.position.copy(st.pos);
      p.mesh.scale.setScalar(st.s);
      p.mesh.rotation.set(0, p.rotY * st.s, 0);
      p.material.opacity = st.vis * 0.94;
    });
    // conexões: livro → cada painel e painel → painel (cadeia)
    const grow = window01(t, W.knowledgeOut[0] + 0.5, W.knowledgeOut[1] + 0.3);
    const shrink = window01(t, W.knowledgeBack[0], W.knowledgeBack[0] + 0.5);
    const inten = 0.9 * (1 - shrink);
    const chains = [];
    panels.forEach((p, i) => {
      const st = state[i];
      const side = p.pos[0] < 0 ? 1 : -1;
      chains.push(curve(new THREE.Vector3(p.origin.x, p.origin.y, zCover), anchor(st.pos, -side * 0.0)));
      if (i < panels.length - 1) {
        const nx = state[i + 1];
        chains.push(curve(anchor(st.pos, side), anchor(nx.pos, -side)));
      }
    });
    chains.forEach((c) => lines.add(c, 0, grow, inten, (u) => 0.45 + 0.55 * u));
    lines.end();
    // pulsos de luz (ideia → ação) correndo pela cadeia
    const flow = clamp((t - W.knowledgeOut[1]) / 0.3) * (1 - shrink);
    dotMat.opacity = flow;
    const links = chains.filter((_, i) => i % 2 === 1);
    for (let d = 0; d < DOTS; d++) {
      const c = links[d % links.length];
      const u = ((((t - 24) * 0.55 + d * 0.37) % 1) + 1) % 1;
      const f = u * (c.length - 1);
      const i0 = Math.floor(f);
      tmp.lerpVectors(c[i0], c[Math.min(c.length - 1, i0 + 1)], f - i0);
      tmp.toArray(dotPos, d * 3);
    }
    dotGeo.attributes.position.needsUpdate = true;
  }

  /** pontos sobre os painéis no início do retorno (origem das partículas de retorno) */
  function samplePanels(n, rnd) {
    const t = W.knowledgeBack[0];
    const out = [];
    for (let j = 0; j < n; j++) {
      const i = j % panels.length;
      const st = panelState(i, t);
      const p = panels[i];
      out.push(new THREE.Vector3(st.pos.x + (rnd() - 0.5) * PW, st.pos.y + (rnd() - 0.5) * p.h, st.pos.z));
    }
    return out;
  }

  return { group, update, samplePanels };
}
