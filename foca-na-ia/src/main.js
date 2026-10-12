// FOCA NA IA — mundo 3D contínuo.
// Uma cena, uma câmera, um relógio: tudo é função do tempo do HyperFrames
// (evento hf-seek), lido da timeline central em src/config/timeline.js.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { makeTrack, mulberry32, clamp, lerp, window01 } from "./lib/math.js";
import { createChaos } from "./world/chaos.js";
import { createParticles } from "./world/particles.js";
import { createBook, BOOK } from "./world/book.js";
import { createKnowledge } from "./world/knowledge.js";
import { createAtmosphere } from "./world/atmosphere.js";

const T = window.FOCA_TIMELINE;
const W = T.width;
const H = T.height;
const DEG = Math.PI / 180;

const camTrack = makeTrack(T.camera);
const lightTrack = makeTrack(T.light);

window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["foca-world"] = build();

let renderAt = null;

async function build() {
  // as texturas em canvas usam as fontes da marca: espere por elas
  await Promise.all(
    ["700 40px Unbounded", "500 40px Unbounded", "400 20px Inter", "500 20px Inter", "400 20px 'JetBrains Mono'", "500 20px 'JetBrains Mono'"].map((f) =>
      document.fonts.load(f),
    ),
  );

  const canvas = document.getElementById("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const bg = new THREE.Color(0, 0, 0);
  scene.background = bg;
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 220);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const resolution = new THREE.Vector2(W, H);

  // ------------------------------------------------ mundo
  const atmosphere = createAtmosphere();
  scene.add(atmosphere.group);

  const chaos = createChaos({ T, camTrack, resolution });
  scene.add(chaos.group, chaos.lineRoot);

  const book = createBook({ T, resolution, envMap });
  scene.add(book.root);

  const knowledge = createKnowledge({ T, resolution });
  book.root.add(knowledge.group);

  // luzes do produto
  const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x08090a, 0);
  const key = new THREE.DirectionalLight(0xffffff, 0);
  key.position.set(-3.5, 4.5, 6);
  const rimR = new THREE.PointLight(0xe6eef7, 0, 12, 1.6);
  rimR.position.set(3.2, 2.2, -2.6);
  const rimL = new THREE.PointLight(0xc8d2dc, 0, 12, 1.6);
  rimL.position.set(-3.0, -1.6, -2.2);
  scene.add(hemi, key, rimR, rimL);

  // ------------------------------------------------ partículas: caos → livro
  const rnd = mulberry32(4242);
  const F = T.freeze;
  const camF = camTrack(F);
  const camZF = camF.r * Math.cos(camF.el * DEG) * Math.cos(camF.az * DEG);
  const N = 9000;
  const sources = chaos.sampleFrozen(N, rnd, camZF).map((s) => s.p);
  const targets = [];
  const { W: BW, H: BH, D: BD } = BOOK;
  for (let i = 0; i < N; i++) {
    const r = rnd();
    let p;
    let kind = 0;
    if (r < 0.42) {
      // face da capa (com mais densidade no contorno)
      const edge = rnd() < 0.4;
      let x = rnd() - 0.5;
      let y = rnd() - 0.5;
      if (edge) {
        const e = Math.floor(rnd() * 4);
        if (e === 0) x = -0.5;
        else if (e === 1) x = 0.5;
        else if (e === 2) y = -0.5;
        else y = 0.5;
      }
      p = new THREE.Vector3(x * BW, y * BH, BD / 2 + 0.01);
    } else if (r < 0.62) {
      // espessura: lombada, miolo e capa traseira
      const side = rnd();
      if (side < 0.5) p = new THREE.Vector3((side < 0.25 ? -1 : 1) * BW * 0.5, (rnd() - 0.5) * BH, (rnd() - 0.5) * BD);
      else p = new THREE.Vector3((rnd() - 0.5) * BW, (side < 0.75 ? -1 : 1) * BH * 0.5, (rnd() - 0.5) * BD);
    } else {
      // halo atrás do livro (elipse vertical, para o quadro 9:16)
      kind = 1;
      const a = rnd() * Math.PI * 2;
      const band = Math.pow(rnd(), 1.6);
      const rx = 1.5 + band * 0.75;
      const ry = 2.0 + band * 0.75;
      p = new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry, -0.7 - rnd() * 0.6);
    }
    targets.push({ p, kind });
  }
  const ang = (v) => Math.atan2(v.y, v.x);
  const srcOrder = sources.map((p, i) => [ang(p), i]).sort((a, b) => a[0] - b[0]);
  const dstOrder = targets.map((d, i) => [ang(d.p), i]).sort((a, b) => a[0] - b[0]);
  const flow = T.world.particlesFlow;
  const items = [];
  for (let j = 0; j < N; j++) {
    const src = sources[srcOrder[j][1]];
    const tg = targets[dstOrder[j][1]];
    const a0 = srcOrder[j][0];
    const a1 = dstOrder[j][0];
    const R1 = 3.0 + rnd() * 0.5;
    const c1 = new THREE.Vector3(Math.cos(a0) * R1, Math.sin(a0) * R1, src.z - 1.2);
    const R2 = 1.8 + rnd() * 0.6;
    const c2 = new THREE.Vector3(Math.cos(a1) * R2, Math.sin(a1) * R2 * 1.25, tg.p.z + 2.6);
    const sweep = (a0 + Math.PI) / (Math.PI * 2);
    items.push({
      src,
      c1,
      c2,
      dst: tg.p,
      start: flow.start + flow.spread * sweep + rnd() * 0.12 + (tg.kind ? 0.25 : 0),
      dur: flow.dur * (0.85 + rnd() * 0.3),
      seed: rnd(),
      kind: tg.kind,
    });
  }
  const particles = createParticles(items, { size: 0.05 });
  scene.add(particles.points);

  // partículas de retorno: painéis de conhecimento → halo (S6 → S7)
  const RN = 1800;
  const rsrc = knowledge.samplePanels(RN, rnd);
  const rp = T.world.returnParticles;
  const ritems = rsrc.map((src, i) => {
    const a = Math.atan2(src.y, src.x) + (rnd() - 0.5) * 0.6;
    const band = Math.pow(rnd(), 1.4);
    const dst = new THREE.Vector3(Math.cos(a) * (1.5 + band * 0.8), Math.sin(a) * (2.0 + band * 0.8), -0.6 - rnd() * 0.7);
    return {
      src,
      c1: new THREE.Vector3(src.x * 0.4, src.y * 0.4, BD / 2 + 0.6),
      c2: new THREE.Vector3(dst.x * 0.6, dst.y * 0.6, BD / 2 + 0.2),
      dst,
      start: rp.start + rp.spread * (i / RN),
      dur: rp.dur * (0.8 + rnd() * 0.4),
      seed: rnd(),
      kind: 1,
    };
  });
  const returnParticles = createParticles(ritems, { size: 0.042 });
  book.root.add(returnParticles.points);

  // ------------------------------------------------ pós-processamento
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.9, 0.5, 0.5);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ------------------------------------------------ camadas DOM ligadas à câmera
  
  const grain = document.getElementById("grain");
  const graphite = new THREE.Color(0x30353b);

  renderAt = (t) => {
    const C = camTrack(t);
    const L = lightTrack(t);

    // câmera esférica em torno de P
    const r = C.r;
    const az = C.az * DEG;
    const el = C.el * DEG;
    camera.position.set(r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az));
    camera.fov = C.fov;
    camera.updateProjectionMatrix();
    camera.up.set(0, 1, 0);
    camera.lookAt(0, C.lookY, 0);
    camera.rotateZ(C.roll * DEG);

    // luz e atmosfera evoluem gradualmente
    bg.setRGB(0, 0, 0).lerp(graphite, L.bg);
    scene.fog.color.copy(bg);
    scene.fog.density = lerp(0.028, 0.012, clamp((t - 13) / 4));
    hemi.intensity = 0.35 * L.key;
    key.intensity = 1.6 * L.key;
    rimR.intensity = 30 * L.rim;
    rimL.intensity = 18 * L.rim;
    bloom.strength = L.bloom;

    atmosphere.update(t, L, r);
    chaos.update(t, L, camera.position.z);
    book.update(t, L);
    knowledge.update(t);

    const pu = particles.uniforms;
    pu.uTime.value = t;
    pu.uAppear.value = window01(t, T.world.particlesAppear[0], T.world.particlesAppear[1]);
    pu.uSolid.value = window01(t, T.world.bookSolid[0], T.world.bookSolid[1]);
    pu.uHaloSpin.value = Math.max(0, t - 15) * 0.07;
    pu.uGain.value = 1.0 - 0.35 * window01(t, 17.5, 19);
    const ru = returnParticles.uniforms;
    ru.uTime.value = t;
    ru.uAppear.value = window01(t, rp.start - 0.05, rp.start + 0.35);
    ru.uHaloSpin.value = Math.max(0, t - 26) * 0.07;
    ru.uGain.value = 0.8;

    composer.render();

    // texto acompanha (sutilmente) o roll e a órbita da câmera: mesmo espaço
    const camT = `translate3d(${(-C.az * 1.2).toFixed(2)}px, 0, 0) rotate(${(C.roll * 0.3).toFixed(3)}deg)`;
    for (const el of document.querySelectorAll(".cam")) el.style.transform = camT;
    const fr = Math.round(t * T.fps);
    grain.style.backgroundPosition = `${(fr * 137) % 512}px ${(fr * 251) % 512}px`;
  };

  window.__focaRenderAt = renderAt;
  renderAt(window.__hfThreeTime || 0);
}

window.addEventListener("hf-seek", (e) => {
  if (renderAt) renderAt(e.detail.time);
});
