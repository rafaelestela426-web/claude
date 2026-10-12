# FOCA NA IA — comercial do e-book (HyperFrames)

Filme publicitário contínuo de **30 s**, vertical **1080 × 1920**, 30 fps, estética *Black Luxury*.
Narrativa visual: **CAOS → DESCOBERTA → CONTROLE → FOCA NA IA**. Um único mundo 3D, uma única câmera:
o caos de interfaces congela, vira partículas prateadas e essas partículas constroem o e-book.

## Executar

Requisitos: Node.js ≥ 22 e FFmpeg.

```bash
cd foca-na-ia
npm run check     # lint + runtime + layout + contraste
npm run dev       # Studio de pré-visualização (no navegador)
npm run render    # gera o MP4 (padrão em renders/)
# ou, com nome de saída explícito:
npx hyperframes@0.8.150 render -o renders/master-foca-na-ia.mp4
```

Render local (Linux, GPU por software/SwiftShader): ~17 min para 900 frames. O master sai com ~330 MB;
a versão de entrega `renders/foca-na-ia.mp4` é recodificada com H.264 a 10 Mb/s (2 passadas):

```bash
ffmpeg -i renders/master-foca-na-ia.mp4 -c:v libx264 -preset slow -b:v 10M -pass 1 -an -f null /dev/null
ffmpeg -i renders/master-foca-na-ia.mp4 -c:v libx264 -preset slow -b:v 10M -maxrate 14M -bufsize 20M -pass 2 -pix_fmt yuv420p -movflags +faststart renders/foca-na-ia.mp4
```

Frames de verificação: `npx hyperframes@0.8.150 snapshot --at 4,8.6,12.4,13.3,17,23.4,27,29.9`

## Estrutura

| Caminho | Papel |
|---|---|
| `index.html` | Composição raiz: canvas 3D (camada contínua, não é clip), 7 camadas de texto (uma por sequência, `class="clip"`), timeline GSAP dos textos |
| `src/config/timeline.js` | **Timeline central**: tempos das sequências, keyframes de câmera, luz/atmosfera, eventos 3D, textos e deixas de som |
| `src/main.js` | Mundo Three.js: câmera, luzes, pós-processamento (bloom), partículas; renderiza o tempo exato a cada `hf-seek` |
| `src/world/chaos.js` | S1–S3: túnel de janelas e linhas; giro, congelamento, realinhamento das linhas, amostragem das posições congeladas |
| `src/world/particles.js` | S3→S5: partículas em trajetórias Bézier ordenadas (shader) |
| `src/world/book.js` | S4–S7: silhueta → mockup 3D (capa dura, lombada, miolo), feixe sobre a capa, mascote opcional |
| `src/world/knowledge.js` | S6: painéis de conhecimento conectados ao livro (mesma linguagem das janelas do caos) |
| `src/world/atmosphere.js` | Ponto de luz P, poeira de profundidade |
| `src/world/textures.js` | Todas as texturas em canvas (interfaces, capa provisória, lombada, páginas) |
| `src/world/lineBatch.js` | Linhas finas com desenho progressivo |
| `src/lib/math.js` | PRNG com semente, easing, trilhas cúbicas monotônicas |
| `src/styles/global.css` | Estilos globais e zonas seguras |
| `assets/` | fontes, bibliotecas locais (GSAP, Three.js), `brand/` e `audio/` para materiais oficiais |
| `docs/CONTINUITY.md` | Mapa de continuidade |
| `docs/ASSETS.md` | O que é provisório e como substituir pela marca oficial |
| `docs/SOUND.md` | Pontos de sincronização de trilha/efeitos |

## Ajustar o filme

Quase tudo se ajusta em `src/config/timeline.js`: mova um texto mudando `in`/`out`, refaça o movimento de câmera
nos keyframes `camera` (coordenadas esféricas em torno do ponto onde o livro nasce), mude a luz em `light`.
Se mudar o início/fim de uma sequência, atualize também `data-start`/`data-duration` da `<section>` correspondente no `index.html`.

Determinismo: sem `Math.random` (PRNG com semente), sem relógio, sem rede — todas as libs e fontes são locais.
