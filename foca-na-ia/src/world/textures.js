// Texturas geradas em canvas (determinísticas). Todas as interfaces, a capa
// provisória e as bordas do livro nascem aqui, com a mesma linguagem visual.
import * as THREE from "three";
import { mulberry32 } from "../lib/math.js";

const SILVER = "#d9dee4";
const SILVER_DIM = "rgba(214,221,229,0.55)";
const GRAPHITE = "#2a2e33";
const MONO = "JetBrains Mono";
const DISPLAY = "Unbounded";
const SANS = "Inter";

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

function toTexture(canvas, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function silverGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.45, "#cfd5dc");
  g.addColorStop(0.55, "#9aa1a9");
  g.addColorStop(1, "#e9edf1");
  return g;
}

/** Moldura de janela de interface (vidro escuro + borda prata + barra de título). */
function panelFrame(ctx, w, h, title, { strong = false } = {}) {
  const r = Math.round(h * 0.06);
  roundRect(ctx, 3, 3, w - 6, h - 6, r);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "rgba(26,29,33,0.92)");
  bg.addColorStop(1, "rgba(9,10,12,0.92)");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = strong ? 4 : 3;
  ctx.strokeStyle = strong ? "rgba(236,241,246,0.9)" : SILVER_DIM;
  ctx.stroke();
  // reflexo superior
  const sheen = ctx.createLinearGradient(0, 0, 0, h * 0.4);
  sheen.addColorStop(0, "rgba(255,255,255,0.10)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  roundRect(ctx, 5, 5, w - 10, h * 0.4, r);
  ctx.fill();
  const bar = Math.round(h * 0.13);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(6, 6 + r * 0.3, w - 12, bar - r * 0.3);
  ctx.strokeStyle = "rgba(214,221,229,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, bar + 6);
  ctx.lineTo(w - 6, bar + 6);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(26 + i * 22, 6 + bar / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? "rgba(236,241,246,0.7)" : "rgba(160,168,176,0.45)";
    ctx.fill();
  }
  if (title) {
    ctx.fillStyle = "rgba(214,221,229,0.75)";
    ctx.font = `500 ${Math.round(bar * 0.42)}px ${MONO}`;
    ctx.textBaseline = "middle";
    ctx.fillText(title, 100, 6 + bar / 2);
  }
  return { top: bar + 18, pad: 26 };
}

function bars(ctx, rand, x, y, w, rows, lh, alpha = 0.5) {
  for (let i = 0; i < rows; i++) {
    let cx = x + (rand() < 0.3 ? 24 : 0);
    const segs = 1 + Math.floor(rand() * 3);
    for (let s = 0; s < segs; s++) {
      const sw = (0.12 + rand() * 0.3) * w;
      if (cx + sw > x + w) break;
      ctx.fillStyle = `rgba(214,221,229,${alpha * (0.4 + rand() * 0.6)})`;
      roundRect(ctx, cx, y + i * lh, sw, lh * 0.42, lh * 0.2);
      ctx.fill();
      cx += sw + 14;
    }
  }
}

function text(ctx, str, x, y, size, { font = SANS, weight = 400, color = SILVER, align = "left" } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(str, x, y);
  ctx.textAlign = "left";
}

// ------------------------------------------------------------------ caos
const CHAOS_KINDS = ["chat", "notif", "code", "chart", "tabs", "terminal", "list", "alert"];

export function chaosPanelTexture(kind, seed) {
  const rand = mulberry32(seed);
  const aspect = kind === "notif" || kind === "alert" ? 3.0 : kind === "terminal" ? 1.9 : 1.5;
  const w = 640;
  const h = Math.round(w / aspect);
  const [c, ctx] = makeCanvas(w, h);
  const titles = {
    chat: "assistente.ia",
    code: "prompt_v12_final_agora_vai.txt",
    chart: "métricas · alcance",
    tabs: "37 abas abertas",
    terminal: "terminal",
    list: "ferramentas_de_ia.xlsx",
  };
  if (kind === "notif" || kind === "alert") {
    roundRect(ctx, 3, 3, w - 6, h - 6, 34);
    ctx.fillStyle = "rgba(20,22,26,0.94)";
    ctx.fill();
    ctx.strokeStyle = kind === "alert" ? "rgba(240,244,248,0.85)" : SILVER_DIM;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h / 2, h / 2, h * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = kind === "alert" ? "rgba(240,244,248,0.9)" : "rgba(170,178,186,0.55)";
    ctx.fill();
    const lines =
      kind === "alert"
        ? [["Sem estratégia definida", "revise antes de publicar"], ["Qual ferramenta usar?", "48 opções encontradas"]]
        : [
            ["12 novas ferramentas de IA", "agora mesmo"],
            ["Tendência: automação", "você está atrasado?"],
            ["Novo prompt viral", "salvar para depois"],
            ["Atualização disponível", "mais 9 recursos"],
          ];
    const [l1, l2] = lines[Math.floor(rand() * lines.length)];
    text(ctx, l1, h * 0.95, h * 0.45, h * 0.2, { weight: 500, color: "#eef1f4" });
    text(ctx, l2, h * 0.95, h * 0.72, h * 0.15, { color: "rgba(200,207,214,0.7)" });
    return { texture: toTexture(c), aspect };
  }
  const { top, pad } = panelFrame(ctx, w, h, titles[kind]);
  const iw = w - pad * 2;
  if (kind === "chat") {
    const msgs = ["Como usar IA no marketing?", "Depende... qual objetivo?", "Me dá 30 ideias de post", "Qual prompt é melhor?"];
    let y = top + 10;
    for (let i = 0; i < 3; i++) {
      const right = i % 2 === 1;
      const m = msgs[(i + Math.floor(rand() * 4)) % 4];
      ctx.font = `400 22px ${SANS}`;
      const tw = ctx.measureText(m).width + 36;
      const x = right ? w - pad - tw : pad;
      roundRect(ctx, x, y, tw, 46, 20);
      ctx.fillStyle = right ? "rgba(214,221,229,0.16)" : "rgba(255,255,255,0.06)";
      ctx.fill();
      text(ctx, m, x + 18, y + 31, 22, { color: right ? "#e6eaee" : "rgba(214,221,229,0.75)" });
      y += 62;
    }
    roundRect(ctx, pad, h - 66, iw, 42, 20);
    ctx.strokeStyle = "rgba(214,221,229,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, "Digite um prompt...", pad + 18, h - 38, 18, { font: MONO, color: "rgba(214,221,229,0.45)" });
  } else if (kind === "code" || kind === "terminal") {
    if (kind === "terminal") {
      const cmds = ["> gerar --conteudo --todos", "> erro: objetivo indefinido", "> tentar_de_novo()", "> carregando 2.481 tutoriais"];
      cmds.forEach((s, i) => text(ctx, s, pad, top + 26 + i * 40, 22, { font: MONO, color: i === 1 ? "#f2f4f6" : "rgba(214,221,229,0.7)" }));
    } else {
      bars(ctx, rand, pad, top, iw, Math.floor((h - top - 20) / 30), 30, 0.55);
    }
  } else if (kind === "chart") {
    ctx.strokeStyle = "rgba(214,221,229,0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const y = top + 10 + i * ((h - top - 40) / 3);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }
    ctx.beginPath();
    let v = 0.5;
    for (let i = 0; i <= 14; i++) {
      v = Math.min(0.95, Math.max(0.05, v + (rand() - 0.5) * 0.45));
      const x = pad + (iw * i) / 14;
      const y = top + 10 + (1 - v) * (h - top - 50);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#e6eaee";
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (kind === "tabs") {
    const n = 9;
    for (let i = 0; i < n; i++) {
      roundRect(ctx, pad + i * (iw / n), top - 4, iw / n - 6, 30, 8);
      ctx.fillStyle = i === 4 ? "rgba(214,221,229,0.3)" : "rgba(255,255,255,0.07)";
      ctx.fill();
    }
    bars(ctx, rand, pad, top + 46, iw, Math.floor((h - top - 70) / 32), 32, 0.4);
  } else if (kind === "list") {
    const items = ["Gerador de texto", "Gerador de imagem", "Editor de vídeo", "Automação", "Chatbot", "Agendador", "Análise"];
    items.forEach((s, i) => {
      const y = top + 22 + i * 34;
      if (y > h - 16) return;
      ctx.strokeStyle = "rgba(214,221,229,0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, y - 16, 18, 18);
      text(ctx, s, pad + 34, y, 20, { color: "rgba(214,221,229,0.72)" });
      text(ctx, "?", w - pad - 10, y, 20, { font: MONO, color: "rgba(214,221,229,0.5)" });
    });
  }
  return { texture: toTexture(c), aspect };
}
export { CHAOS_KINDS };

// ------------------------------------------------------------------ conhecimento (S6)
export function knowledgePanelTexture(kind) {
  const w = 1024;
  const h = 640;
  const [c, ctx] = makeCanvas(w, h);
  const conf = {
    prompts: { label: "PROMPTS", tag: "01" },
    ideias: { label: "IDEIAS DE CONTEÚDO", tag: "02" },
    ferramentas: { label: "FERRAMENTAS DE IA", tag: "03" },
    aplicacoes: { label: "APLICAÇÕES PRÁTICAS", tag: "04" },
  }[kind];
  const { top, pad } = panelFrame(ctx, w, h, `foca-na-ia / ${conf.tag}`, { strong: true });
  ctx.font = `700 54px ${DISPLAY}`;
  ctx.fillStyle = silverGradient(ctx, top, top + 60);
  ctx.textBaseline = "alphabetic";
  ctx.fillText(conf.label, pad + 6, top + 72);
  const y0 = top + 120;
  ctx.strokeStyle = "rgba(214,221,229,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, y0 - 30);
  ctx.lineTo(w - pad, y0 - 30);
  ctx.stroke();
  if (kind === "prompts") {
    roundRect(ctx, pad, y0, w - pad * 2, 200, 22);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(214,221,229,0.4)";
    ctx.stroke();
    text(ctx, "“Atue como estrategista de marketing.", pad + 30, y0 + 62, 36, { color: "#eef1f4" });
    text(ctx, " Crie 5 ideias de posts para…”", pad + 30, y0 + 112, 36, { color: "#eef1f4" });
    text(ctx, "▍ estrutura · contexto · objetivo", pad + 30, y0 + 168, 28, { font: MONO, color: "rgba(214,221,229,0.6)" });
    text(ctx, "→ gerar", w - pad - 30, h - 54, 32, { font: MONO, weight: 500, color: "#ffffff", align: "right" });
  } else if (kind === "ideias") {
    ["Reels de bastidores", "Carrossel educativo", "Calendário do mês"].forEach((s, i) => {
      const y = y0 + 40 + i * 78;
      ctx.beginPath();
      ctx.arc(pad + 22, y - 12, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#e6eaee";
      ctx.fill();
      text(ctx, s, pad + 60, y, 40, { color: "#eef1f4" });
    });
  } else if (kind === "ferramentas") {
    ["TEXTO", "IMAGEM", "VÍDEO", "AUTOMAÇÃO"].forEach((s, i) => {
      const cw = (w - pad * 2 - 30) / 2;
      const x = pad + (i % 2) * (cw + 30);
      const y = y0 + Math.floor(i / 2) * 120;
      roundRect(ctx, x, y, cw, 98, 20);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.strokeStyle = "rgba(214,221,229,0.45)";
      ctx.stroke();
      text(ctx, s, x + cw / 2, y + 63, 34, { font: DISPLAY, weight: 500, color: "#eef1f4", align: "center" });
    });
  } else {
    [
      ["Copy", 0.92],
      ["Anúncios", 0.78],
      ["Redes sociais", 0.86],
    ].forEach(([s, v], i) => {
      const y = y0 + 30 + i * 84;
      text(ctx, s, pad, y + 14, 36, { color: "#eef1f4" });
      const bx = pad + 300;
      const bw = w - pad * 2 - 300;
      roundRect(ctx, bx, y - 8, bw, 26, 13);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      roundRect(ctx, bx, y - 8, bw * v, 26, 13);
      ctx.fillStyle = silverGradient(ctx, y - 8, y + 18);
      ctx.fill();
    });
  }
  return { texture: toTexture(c), aspect: w / h };
}

// ------------------------------------------------------------------ livro
function brushed(ctx, w, h, seed, base, amp) {
  const rand = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const y = rand() * h;
    const a = rand() * amp;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(0, y, w, 1);
  }
}

function drawEmblem(ctx, cx, cy, R, stroke) {
  // retícula de foco: o “foco” da marca, com nós de rede no anel externo
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78);
    ctx.lineTo(cx + Math.cos(a) * R * 1.22, cy + Math.sin(a) * R * 1.22);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * CAPA PROVISÓRIA (placeholder editável).
 * Para usar a capa oficial, defina FOCA_TIMELINE.brand.coverImage.
 * Retorna { map, orm } — orm: G = rugosidade, B = metalicidade.
 */
export function coverTextures(brand) {
  const w = 1024;
  const h = 1434;
  const [c, ctx] = makeCanvas(w, h);
  const [o, octx] = makeCanvas(w, h);
  // máscara de especular (alfa): base acetinada quase sem reflexo, prata 100 %
  const [sp, sctx] = makeCanvas(w, h);
  sctx.fillStyle = "rgba(255,255,255,0.18)";
  sctx.fillRect(0, 0, w, h);
  brushed(ctx, w, h, 7, "#0b0c0e", 0.018);
  const vg = ctx.createRadialGradient(w * 0.5, h * 0.38, 40, w * 0.5, h * 0.45, h * 0.75);
  vg.addColorStop(0, "rgba(70,76,84,0.12)");
  vg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  // ORM base: preto acetinado (rugoso, pouco metálico)
  octx.fillStyle = "rgb(0,235,0)";
  octx.fillRect(0, 0, w, h);

  const silverParts = (draw) => {
    draw(ctx, silverGradient(ctx, 0, h));
    draw(octx, "rgb(0,40,255)");
    draw(sctx, "#ffffff");
  };
  silverParts((g, fill) => {
    g.strokeStyle = fill;
    g.lineWidth = 3;
    g.strokeRect(54, 54, w - 108, h - 108);
    g.lineWidth = 1.5;
    g.strokeRect(70, 70, w - 140, h - 140);
  });
  silverParts((g, fill) => {
    g.fillStyle = fill;
    g.font = `500 34px ${SANS}`;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    if ("letterSpacing" in g) g.letterSpacing = "14px";
    g.fillText(brand.coverKicker, w / 2 + 7, 196);
    if ("letterSpacing" in g) g.letterSpacing = "0px";
  });
  silverParts((g, fill) => {
    g.strokeStyle = fill;
    g.fillStyle = fill;
    drawEmblem(g, w / 2, 520, 150, fill);
  });
  const titleGrad = silverGradient(ctx, 760, 1080);
  [ctx, octx, sctx].forEach((g, k) => {
    g.fillStyle = k === 0 ? titleGrad : k === 1 ? "rgb(0,40,255)" : "#ffffff";
    g.textAlign = "center";
    g.font = `700 196px ${DISPLAY}`;
    g.fillText(brand.coverTitle[0], w / 2, 930);
    g.font = `700 150px ${DISPLAY}`;
    g.fillText(brand.coverTitle[1], w / 2, 1100);
  });
  silverParts((g, fill) => {
    g.fillStyle = fill;
    g.fillRect(w / 2 - 90, 1170, 180, 3);
  });
  ctx.fillStyle = "rgba(220,226,232,0.82)";
  ctx.textAlign = "center";
  ctx.font = `400 27px ${SANS}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "4px";
  const sub = brand.coverSubtitle;
  const mid = sub.lastIndexOf(" ", Math.floor(sub.length / 2) + 6);
  ctx.fillText(sub.slice(0, mid), w / 2, 1250);
  ctx.fillText(sub.slice(mid + 1), w / 2, 1292);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  const map = toTexture(c);
  const orm = toTexture(o, false);
  const spec = toTexture(sp, false);
  return { map, orm, spec };
}

export function spineTexture(brand) {
  const w = 160;
  const h = 1434;
  const [c, ctx] = makeCanvas(w, h);
  brushed(ctx, w, h, 11, "#0a0b0d", 0.02);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = silverGradient(ctx, -30, 30);
  ctx.font = `700 64px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(brand.name, 0, 0);
  ctx.restore();
  return toTexture(c);
}

export function pagesTexture(vertical) {
  const w = vertical ? 64 : 1024;
  const h = vertical ? 1024 : 64;
  const [c, ctx] = makeCanvas(w, h);
  ctx.fillStyle = "#d8d9d6";
  ctx.fillRect(0, 0, w, h);
  const rand = mulberry32(vertical ? 3 : 5);
  const n = 220;
  for (let i = 0; i < n; i++) {
    const p = (i / n) * (vertical ? w : h);
    ctx.fillStyle = `rgba(80,84,90,${0.08 + rand() * 0.18})`;
    if (vertical) ctx.fillRect(p, 0, 1, h);
    else ctx.fillRect(0, p, w, 1);
  }
  return toTexture(c);
}

export function backTexture(brand) {
  const w = 512;
  const h = 717;
  const [c, ctx] = makeCanvas(w, h);
  brushed(ctx, w, h, 13, "#0b0c0e", 0.018);
  ctx.strokeStyle = "rgba(214,221,229,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  text(ctx, brand.name, w / 2, h - 70, 30, { font: DISPLAY, weight: 500, color: "rgba(214,221,229,0.8)", align: "center" });
  return toTexture(c);
}

/** Sprite radial suave (ponto de luz, halo, partículas). */
export function glowTexture(size = 256, falloff = 2.2) {
  const [c, ctx] = makeCanvas(size, size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
      const v = Math.pow(1 - d, falloff);
      const i = (y * size + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(v * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c);
}

export const COLORS = { SILVER, GRAPHITE };
