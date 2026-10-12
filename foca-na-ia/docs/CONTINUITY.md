# FOCA NA IA — Mapa de continuidade

Filme único de 30 s, 1080 × 1920, 30 fps. **Um só mundo 3D, uma só câmera, um só ponto de fuga.**

## Princípio

O pequeno ponto de luz do primeiro frame (`P = (0,0,0)`) é o mesmo ponto onde o e-book se forma.
A câmera passa os primeiros 13 s avançando por um túnel de interfaces em direção a esse ponto; o caos
congela, vira partículas, e as partículas viajam em trajetórias ordenadas até `P`, onde constroem o livro.
Nada é cortado: todo elemento visível em uma sequência é reaproveitado, transformado ou dissolvido na seguinte.

Tudo é controlado por `src/config/timeline.js` (tempos das sequências, keyframes de câmera, luz, textos,
deixas de som). `src/main.js` lê esse arquivo para o mundo 3D e para a timeline GSAP dos textos.

## Elementos persistentes (atravessam o filme inteiro)

| Elemento | Onde nasce | Como evolui | Onde termina |
|---|---|---|---|
| Câmera virtual | z = 60, olhando para P | dolly contínuo → aceleração + roll → **parada seca** (12,35 s) → retoma devagar → órbita → aproximação → recuo | enquadramento estável do livro |
| Ponto de luz P (`core glow`) | 0 s, quase invisível | cresce como “destino” do túnel; some atrás do caos no clímax | vira o brilho interno da silhueta e o halo do livro |
| Linhas de interface | a 1ª linha é desenhada em 1 s (S1) | multiplicam (S1→S2), uma atravessa o centro e se ramifica (S2→S3), se emaranham (S3) | **se alinham** em raios ordenados convergindo para P (S4) e se apagam até 17,5 s |
| Janelas / UI | 2 nas laterais (S1) | dezenas em vários planos (S2), giram ao redor da câmera (S3) | congelam, perdem luz e **são substituídas por partículas nas mesmas posições** (S3→S4) |
| Partículas prateadas | nascem sobre as superfícies das janelas e linhas congeladas | trajetórias Bézier ordenadas por ângulo (fluxos precisos) | 65 % formam a superfície do livro, 35 % viram o halo atrás dele (S5–S7) |
| Iluminação / fundo | preto quase puro | grafite frio e contrastado no caos | limpa, prateada, luz-chave + rim no produto |
| Grão + vinheta | constante | — | constante (assinatura visual única) |

## Transições, sequência a sequência

| Corte | Momento | O que leva de uma cena à outra |
|---|---|---|
| S1 → S2 | 4,0 s | A câmera não para. As linhas desenhadas em S1 se multiplicam e puxam novas janelas para os planos laterais; o texto S1 passa pela câmera (escala + desfoque de profundidade). |
| S2 → S3 | 8,4–9,3 s | Uma linha brilhante atravessa o centro e se divide em ramificações; essas ramificações são as linhas que se emaranham em S3. O texto S2 é “cortado” pela linha. |
| S3 → S4 | 12,35–13,9 s | **Congelamento**: elementos, câmera e texto param no mesmo frame por ~0,6 s. Depois, janelas e linhas perdem luz enquanto partículas surgem exatamente nos mesmos pontos. |
| S4 → S5 | 16,2–17,6 s | As partículas pousam na superfície do livro; a silhueta retangular (contorno desenhado em S4) ganha espessura (escala Z), textura e reflexo. O halo é feito das partículas restantes. |
| S5 → S6 | 23,0 s | A órbita da câmera continua e vira aproximação; um feixe varre a capa e dela saem os painéis de conhecimento (mesma linguagem visual das janelas do caos, agora organizadas). |
| S6 → S7 | 26,2–27,6 s | Painéis e conexões voltam para o livro e se desfazem em partículas que reforçam o halo; a câmera recua para o enquadramento final. |

## Rima visual (caos × controle)

As janelas do caos (S2–S3) e os painéis de conhecimento (S6) usam o mesmo componente (`src/world/panels.js`):
no caos, desalinhados, sobrepostos e sem conexão; em S6, alinhados, conectados por linhas finas e ancorados no livro.
