// Utilitários determinísticos: PRNG com semente, easing e trilhas de keyframes.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => {
  k = clamp(k);
  return k * k * (3 - 2 * k);
};
export const easeInOutCubic = (k) => {
  k = clamp(k);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
export const easeOutCubic = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeInCubic = (k) => Math.pow(clamp(k), 3);
export const easeOutExpo = (k) => (clamp(k) === 1 ? 1 : 1 - Math.pow(2, -10 * clamp(k)));

/** 0→1 entre a e b com smoothstep */
export const window01 = (t, a, b) => smooth((t - a) / (b - a));

/**
 * Trilha cúbica monotônica (Fritsch–Carlson) por canal.
 * keys: [{ t, canal1, canal2, ... }] em ordem de tempo.
 * Retorna (t) => { canal: valor }.
 * Monotônica = nunca ultrapassa os keyframes; dois keys iguais seguram o valor.
 */
export function makeTrack(keys) {
  const channels = Object.keys(keys[0]).filter((k) => k !== "t");
  const ts = keys.map((k) => k.t);
  const n = keys.length;
  const tangents = {};
  for (const ch of channels) {
    const ys = keys.map((k) => k[ch]);
    const d = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (ts[i + 1] - ts[i]));
    const m = new Array(n);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    }
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * a * d[i];
        m[i + 1] = tau * b * d[i];
      }
    }
    // extremos sempre com tangente zero: o filme começa e termina parado
    m[0] = 0;
    m[n - 1] = 0;
    tangents[ch] = { ys, m };
  }
  const out = {};
  return function (t) {
    let i = 0;
    if (t <= ts[0]) i = 0;
    else if (t >= ts[n - 1]) i = n - 2;
    else while (i < n - 2 && t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const s = clamp((t - ts[i]) / h);
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    for (const ch of channels) {
      const { ys, m } = tangents[ch];
      out[ch] = h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
    }
    return out;
  };
}
