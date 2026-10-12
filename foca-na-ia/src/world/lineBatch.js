// Lote de linhas finas (Line2/LineMaterial) reescrito a cada frame.
// Um único draw call para dezenas de polilinhas, com desenho progressivo
// (trecho [a, b] de cada linha) e intensidade por linha (mistura aditiva).
import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

export class LineBatch {
  constructor(maxSegments, { width = 2, color = 0xe8edf2, resolution }) {
    this.max = maxSegments;
    this.pos = new Float32Array(maxSegments * 6);
    this.col = new Float32Array(maxSegments * 6);
    this.geometry = new LineSegmentsGeometry();
    this.geometry.setPositions(this.pos);
    this.geometry.setColors(this.col);
    this.material = new LineMaterial({
      color,
      linewidth: width,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      worldUnits: false,
    });
    this.material.resolution.copy(resolution);
    this.mesh = new LineSegments2(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.n = 0;
  }

  begin() {
    this.n = 0;
  }

  /** points: array de THREE.Vector3; desenha o trecho entre as frações a..b */
  add(points, a, b, intensity, fade = null, atten = null) {
    if (intensity <= 0.001 || b <= a) return;
    const last = points.length - 1;
    const fa = a * last;
    const fb = b * last;
    const i0 = Math.floor(fa);
    const i1 = Math.min(last - 1, Math.ceil(fb) - 1);
    for (let i = i0; i <= i1 && this.n < this.max; i++) {
      const s0 = Math.max(fa, i) - i;
      const s1 = Math.min(fb, i + 1) - i;
      if (s1 <= s0) continue;
      const p = points[i];
      const q = points[i + 1];
      const o = this.n * 6;
      this.pos[o] = p.x + (q.x - p.x) * s0;
      this.pos[o + 1] = p.y + (q.y - p.y) * s0;
      this.pos[o + 2] = p.z + (q.z - p.z) * s0;
      this.pos[o + 3] = p.x + (q.x - p.x) * s1;
      this.pos[o + 4] = p.y + (q.y - p.y) * s1;
      this.pos[o + 5] = p.z + (q.z - p.z) * s1;
      // fade opcional ao longo da linha (ex.: ponta mais brilhante)
      let k0 = fade ? fade((i + s0) / last) * intensity : intensity;
      let k1 = fade ? fade((i + s1) / last) * intensity : intensity;
      if (atten) {
        k0 *= atten(this.pos[o + 2]);
        k1 *= atten(this.pos[o + 5]);
      }
      this.col[o] = this.col[o + 1] = this.col[o + 2] = k0;
      this.col[o + 3] = this.col[o + 4] = this.col[o + 5] = k1;
      this.n++;
    }
  }

  end() {
    // segmentos não usados viram comprimento zero e cor preta (invisíveis no aditivo)
    this.pos.fill(0, this.n * 6);
    this.col.fill(0, this.n * 6);
    const start = this.geometry.attributes.instanceStart.data;
    start.array.set(this.pos);
    start.needsUpdate = true;
    const cs = this.geometry.attributes.instanceColorStart.data;
    cs.array.set(this.col);
    cs.needsUpdate = true;
  }
}
