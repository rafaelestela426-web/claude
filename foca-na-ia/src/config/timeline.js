/*
 * FOCA NA IA — TIMELINE CENTRAL
 * ------------------------------------------------------------
 * Fonte única de verdade do filme. Lida por:
 *   - index.html (script inline)  → timeline GSAP dos textos
 *   - src/main.js (módulo)        → mundo 3D (câmera, luz, partículas, livro)
 *
 * Script clássico de propósito: expõe window.FOCA_TIMELINE antes de qualquer
 * outro script rodar, para que o HTML e o módulo 3D leiam os mesmos números.
 *
 * Todas as trilhas de keyframes usam interpolação cúbica monotônica
 * (sem overshoot): dois keyframes iguais = parada real.
 */
(function () {
  const FREEZE = 12.35; // instante em que o caos congela (S3)
  const FREEZE_HOLD = 0.6; // tempo suspenso

  window.FOCA_TIMELINE = {
    fps: 30,
    duration: 30,
    width: 1080,
    height: 1920,

    freeze: FREEZE,
    freezeHold: FREEZE_HOLD,

    // ---------------------------------------------------------- sequências
    sequences: [
      { id: "s1-primeiro-sinal", start: 0, end: 4 },
      { id: "s2-problema-cresce", start: 4, end: 9 },
      { id: "s3-ruptura", start: 9, end: 13 },
      { id: "s4-transformacao", start: 13, end: 17 },
      { id: "s5-revelacao", start: 17, end: 23 },
      { id: "s6-conhecimento", start: 23, end: 27 },
      { id: "s7-assinatura", start: 27, end: 30 },
    ],

    // ---------------------------------------------------------- marca
    // Troque por arquivos oficiais quando disponíveis (veja docs/ASSETS.md).
    brand: {
      name: "FOCA NA IA",
      coverTitle: ["FOCA", "NA IA"],
      coverSubtitle: "INTELIGÊNCIA ARTIFICIAL APLICADA AO MARKETING DIGITAL",
      coverKicker: "E-BOOK",
      coverImage: null, // ex.: "assets/brand/cover.png" (proporção 1:1.4)
      mascotImage: null, // ex.: "assets/brand/mascote-foca.png" (PNG com transparência)
    },

    // ---------------------------------------------------------- câmera
    // Coordenadas esféricas em torno do ponto de convergência P = (0,0,0),
    // que é o mesmo ponto de luz do primeiro frame e o lugar onde o livro nasce.
    // r: distância · az/el: graus · lookY: deslocamento vertical do alvo
    // roll: graus · fov: vertical, graus
    camera: [
      { t: 0.0, r: 62.0, az: 0.0, el: 1.2, lookY: 0.0, roll: 0, fov: 40 },
      { t: 4.0, r: 47.0, az: 0.6, el: 0.9, lookY: 0.0, roll: -1.5, fov: 41 },
      { t: 9.0, r: 29.0, az: 3.0, el: 0.0, lookY: 0.0, roll: 4, fov: 44 },
      { t: 12.1, r: 16.2, az: -5.5, el: -1.8, lookY: 0.0, roll: -13, fov: 47 },
      { t: FREEZE, r: 15.6, az: -6.0, el: -2.0, lookY: 0.0, roll: -14, fov: 47 },
      { t: FREEZE + FREEZE_HOLD, r: 15.6, az: -6.0, el: -2.0, lookY: 0.0, roll: -14, fov: 47 },
      { t: 14.6, r: 14.2, az: -4.0, el: -1.0, lookY: -0.1, roll: -8, fov: 42 },
      { t: 17.0, r: 10.6, az: 0.0, el: 2.0, lookY: -0.45, roll: 0, fov: 37 },
      { t: 19.6, r: 9.4, az: 28.0, el: 6.0, lookY: -0.85, roll: 0, fov: 37 },
      { t: 22.6, r: 9.2, az: -20.0, el: 3.0, lookY: -0.85, roll: 0, fov: 37 },
      { t: 24.6, r: 7.9, az: -8.0, el: 2.0, lookY: 0.05, roll: 0, fov: 37 },
      { t: 26.4, r: 7.6, az: -4.0, el: 1.0, lookY: 0.05, roll: 0, fov: 37 },
      { t: 29.2, r: 9.9, az: -9.0, el: 2.0, lookY: -0.95, roll: 0, fov: 37 },
      { t: 30.0, r: 9.9, az: -9.0, el: 2.0, lookY: -0.95, roll: 0, fov: 37 },
    ],

    // ---------------------------------------------------------- luz / atmosfera
    // bg: brilho do fundo (0–1 sobre grafite) · core: ponto de luz P
    // key/rim: luzes do produto · bloom: intensidade do brilho
    // chaos: exposição das interfaces · dust: poeira ambiente
    light: [
      { t: 0.0, bg: 0.0, core: 0.25, key: 0.0, rim: 0.0, bloom: 0.9, chaos: 0.0, dust: 0.25 },
      { t: 1.0, bg: 0.02, core: 0.9, key: 0.0, rim: 0.0, bloom: 1.0, chaos: 0.7, dust: 0.35 },
      { t: 4.0, bg: 0.06, core: 0.7, key: 0.0, rim: 0.0, bloom: 0.95, chaos: 0.85, dust: 0.45 },
      { t: 9.0, bg: 0.12, core: 0.45, key: 0.0, rim: 0.0, bloom: 0.9, chaos: 1.0, dust: 0.6 },
      { t: FREEZE, bg: 0.16, core: 0.3, key: 0.0, rim: 0.0, bloom: 0.95, chaos: 1.05, dust: 0.7 },
      { t: FREEZE + FREEZE_HOLD, bg: 0.16, core: 0.3, key: 0.0, rim: 0.0, bloom: 0.95, chaos: 1.0, dust: 0.7 },
      { t: 14.2, bg: 0.05, core: 0.5, key: 0.1, rim: 0.2, bloom: 1.05, chaos: 0.15, dust: 0.45 },
      { t: 16.4, bg: 0.03, core: 1.0, key: 0.4, rim: 0.6, bloom: 1.15, chaos: 0.0, dust: 0.35 },
      { t: 17.6, bg: 0.04, core: 0.55, key: 1.0, rim: 1.0, bloom: 0.5, chaos: 0.0, dust: 0.3 },
      { t: 23.0, bg: 0.05, core: 0.5, key: 1.0, rim: 1.0, bloom: 0.5, chaos: 0.0, dust: 0.3 },
      { t: 24.5, bg: 0.06, core: 0.45, key: 0.8, rim: 0.9, bloom: 0.55, chaos: 0.0, dust: 0.3 },
      { t: 27.0, bg: 0.05, core: 0.55, key: 0.95, rim: 1.0, bloom: 0.55, chaos: 0.0, dust: 0.3 },
      { t: 30.0, bg: 0.05, core: 0.6, key: 1.0, rim: 1.0, bloom: 0.5, chaos: 0.0, dust: 0.28 },
    ],

    // ---------------------------------------------------------- eventos do mundo 3D
    world: {
      heroLine: { start: 1.0, dur: 1.0 }, // primeira linha de interface (S1)
      splitLine: { start: 8.35, dur: 0.6, branchAt: 8.75 }, // linha que atravessa o centro (S2→S3)
      spinStart: 9.0, // caos começa a girar ao redor da câmera
      dimStart: FREEZE + FREEZE_HOLD, // elementos congelados perdem a luz
      dimEnd: FREEZE + FREEZE_HOLD + 0.95,
      particlesAppear: [FREEZE + FREEZE_HOLD - 0.1, FREEZE + FREEZE_HOLD + 0.7],
      particlesFlow: { start: 13.6, spread: 1.5, dur: 2.0 }, // trajetórias ordenadas
      linesAlign: [13.0, 14.9], // linhas caóticas → raios ordenados
      linesFade: [15.6, 17.4],
      silhouette: { start: 14.7, dur: 1.4 }, // contorno retangular no centro
      bookSolid: [16.3, 17.6], // silhueta ganha espessura, textura e luz
      knowledgeOut: [23.2, 24.6], // elementos saem do livro
      knowledgeBack: [26.1, 27.2], // elementos retornam ao livro
      returnParticles: { start: 26.25, spread: 0.5, dur: 1.3 },
    },

    // ---------------------------------------------------------- textos
    // Cada entrada corresponde a um elemento [data-cue] no index.html.
    text: [
      { id: "t-s1", in: 1.35, out: 3.55, outDur: 0.6, style: "type" },
      { id: "t-s2", in: 4.9, out: 8.35, outDur: 0.55, style: "rise", exit: "slice" },
      { id: "t-s3a", in: 9.35, out: 10.85, outDur: 0.22, style: "slam", exit: "snap" },
      { id: "t-s3b", in: 11.05, out: FREEZE + FREEZE_HOLD, outDur: 0.95, style: "slam", exit: "dissolve" },
      { id: "t-s4a", in: 13.85, out: 15.3, outDur: 0.45, style: "calm" },
      { id: "t-s4b", in: 15.75, out: 16.95, outDur: 0.5, style: "calm" },
      { id: "t-s5a", in: 18.4, out: 22.45, outDur: 0.5, style: "rise" },
      { id: "t-s5b", in: 19.25, out: 22.55, outDur: 0.55, style: "brand" },
      { id: "t-s6", in: 23.9, out: 26.15, outDur: 0.45, style: "rise" },
      { id: "t-s7a", in: 27.55, out: null, style: "brand" },
      { id: "t-s7b", in: 28.25, out: null, style: "calm" },
      { id: "t-s7c", in: 28.8, out: null, style: "cta" },
    ],

    // ---------------------------------------------------------- som
    // Pontos de sincronização para trilha/efeitos (nenhum áudio está embutido).
    audioCues: [
      { t: 0.0, kind: "music", note: "Drone grave quase inaudível, sub 40 Hz, entra em fade de 1,5 s (curiosidade)" },
      { t: 0.8, kind: "sfx", note: "Ping de cursor / bip curto e frio" },
      { t: 1.0, kind: "sfx", note: "Risco de luz: linha de interface sendo desenhada (whoosh fino, 1 s)" },
      { t: 1.35, kind: "sfx", note: "Digitação suave, um tique por letra até 2,4 s" },
      { t: 4.0, kind: "music", note: "Pulso rítmico entra (tensão crescente, ~100 BPM)" },
      { t: 4.9, kind: "sfx", note: "Notificações sobrepostas, cada vez mais densas até 9 s" },
      { t: 8.35, kind: "sfx", note: "Corte de luz atravessando o centro (swipe metálico)" },
      { t: 9.0, kind: "music", note: "Riser + rotação (Doppler), tensão máxima" },
      { t: 9.35, kind: "hit", note: "Impacto seco: INFORMAÇÃO DEMAIS." },
      { t: 11.05, kind: "hit", note: "Impacto seco: DIREÇÃO DE MENOS." },
      { t: 12.35, kind: "stop", note: "CORTE TOTAL DO SOM — congelamento (silêncio de 0,6 s)" },
      { t: 12.95, kind: "sfx", note: "Respiração / reverse cymbal suave: partículas se soltam" },
      { t: 13.6, kind: "music", note: "Pad limpo e aberto (transformação, pausa)" },
      { t: 16.3, kind: "sfx", note: "Swell de formação do objeto" },
      { t: 17.4, kind: "hit", note: "IMPACTO DA REVELAÇÃO: grave + brilho metálico" },
      { t: 19.25, kind: "sfx", note: "Shimmer na marca FOCA NA IA" },
      { t: 23.2, kind: "music", note: "Batida elegante volta (conhecimento em ação)" },
      { t: 26.1, kind: "sfx", note: "Elementos retornando ao livro (whoosh reverso)" },
      { t: 27.55, kind: "hit", note: "Assinatura: acorde final sofisticado" },
      { t: 29.4, kind: "music", note: "Cauda de reverb até 30 s, sem explosão final" },
    ],
  };
})();
