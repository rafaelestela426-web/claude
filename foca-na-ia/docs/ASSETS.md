# Assets da marca — o que é oficial e o que é provisório

Nenhum arquivo da marca (capa, logo ou mascote) estava no projeto. Tudo o que aparece é **provisório e gerado por código**:

| Elemento | Situação | Onde está | Como substituir |
|---|---|---|---|
| Capa do e-book | **PROVISÓRIA** (gerada em canvas) | `src/world/textures.js` → `coverTextures()` | Salve a capa oficial em `assets/brand/cover.png` (proporção 1 : 1,4, ex. 1024 × 1434) e defina `brand.coverImage: "assets/brand/cover.png"` em `src/config/timeline.js` |
| Lombada / contracapa | provisórias | `spineTexture()`, `backTexture()` | edite os textos em `brand` ou as funções |
| Textos da capa | editáveis | `brand.coverTitle`, `brand.coverSubtitle`, `brand.coverKicker` | `src/config/timeline.js` |
| Logo “FOCA NA IA” no vídeo | tipografia (Unbounded 700) com gradiente prata | `index.html` (`.brand`) | troque por `<img>` da logo oficial nos blocos `t-s5b` e `t-s7a` |
| Mascote da foca | **ausente** (não aparece) | suporte pronto em `src/world/book.js` | salve um PNG com transparência em `assets/brand/mascote-foca.png` e defina `brand.mascotImage`; ele surge discretamente atrás do livro a partir de 27,4 s |
| Conteúdo dos painéis da S6 | genérico (prompts, ideias de conteúdo, ferramentas de IA, aplicações práticas) | `knowledgePanelTexture()` | **confira com o sumário real do e-book** e ajuste os textos |

## Fontes (licença SIL OFL, via @fontsource)

`assets/fonts/` — Unbounded (títulos), Inter (texto), JetBrains Mono (interfaces).

## Bibliotecas locais

`assets/vendor/` — GSAP 3.14.2 e Three.js r181 (0.181.2), copiados localmente para o render não depender de rede.
