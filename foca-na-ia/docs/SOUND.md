# Som — pontos de sincronização

**Nenhum áudio está incorporado ao vídeo.** O projeto não continha trilha nem efeitos, e nada foi gerado.
Os pontos abaixo estão definidos em `src/config/timeline.js` → `audioCues` (fonte única) e repetidos aqui para o editor de som.

| Tempo | Tipo | Ação |
|---|---|---|
| 0,00 s | trilha | Drone grave quase inaudível (sub ~40 Hz), fade-in de 1,5 s — **curiosidade** |
| 0,80 s | sfx | Ping de cursor (bip curto e frio) |
| 1,00 s | sfx | Linha de interface sendo desenhada (whoosh fino, 1 s) |
| 1,35 s | sfx | Digitação suave, um tique por letra até ~2,4 s |
| 4,00 s | trilha | Pulso rítmico entra (~100 BPM) — **tensão crescente** |
| 4,90 s | sfx | Notificações sobrepostas, cada vez mais densas até 9 s |
| 8,35 s | sfx | Swipe metálico: linha atravessando o centro |
| 9,00 s | trilha | Riser + rotação (Doppler) — tensão máxima |
| 9,35 s | impacto | “INFORMAÇÃO DEMAIS.” |
| 11,05 s | impacto | “DIREÇÃO DE MENOS.” |
| **12,35 s** | **corte** | **Silêncio total por 0,6 s — congelamento** |
| 12,95 s | sfx | Reverse cymbal / respiração: as partículas se soltam |
| 13,60 s | trilha | Pad limpo e aberto — **pausa / transformação** |
| 16,30 s | sfx | Swell de formação do objeto |
| **17,40 s** | **impacto** | **Revelação do produto: grave + brilho metálico** |
| 19,25 s | sfx | Shimmer na marca “FOCA NA IA” |
| 23,20 s | trilha | Batida elegante retorna — conhecimento em ação |
| 26,10 s | sfx | Whoosh reverso: elementos voltando ao livro |
| 27,55 s | impacto | Assinatura: acorde final sofisticado |
| 29,40 s | trilha | Cauda de reverb até 30 s (sem explosão final) |

## Como incorporar uma trilha

1. Coloque o arquivo em `assets/audio/` (ex.: `trilha.mp3`, 30 s).
2. No `index.html`, dentro de `#root`, adicione:

```html
<audio id="trilha" src="assets/audio/trilha.mp3" data-start="0" data-duration="30" data-track-index="9"></audio>
```

3. Rode `npm run check` e renderize novamente. (Todo `<audio>` precisa de `id`, senão o render sai mudo.)
