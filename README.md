# Três sites com foto e vídeo no scroll

Três sites conceituais, cada um com uma linguagem visual diferente:

| | Site | Linguagem | Efeitos principais |
|---|---|---|---|
| 01 | [`mare/`](mare/) — **Maré**, revista de litoral | Editorial impresso: papel, Bodoni, colunas, capitulares | Vídeo que abre de uma janela até a tela cheia · ensaio horizontal com parallax interno · citação que acende palavra por palavra · vídeo fixo com a curva da maré desenhada pelo scroll · índice com foto que segue o cursor |
| 02 | [`vao/`](vao/) — **VÃO**, escritório de arquitetura | Grade suíça de 12 colunas, Archivo largo, mono, laranja de sinalização | Vídeo dentro das letras com zoom para dentro do traço · projetos empilhados (sticky) · grade 3×3 em que a foto central vira tela cheia · arquivo filtrável · faixa de vídeo que abre lateralmente |
| 04 | [`petshop/`](petshop/) — **Banho de Cheiro**, petshop na Vila Mariana | Azulejo de banheiro + toalha amarela, site pronto para negócio real | Tabela de preços por porte/pelo · agendamento que abre o WhatsApp com a mensagem pronta · status aberto/fechado no fuso de SP · passo a passo do banho com foto fixa · barra fixa de agendar no celular |
| 03 | [`altitude/`](altitude/) — **Altitude**, mostra de cinema de montanha | Escuro, granulação de película, cinemascope 2.39:1 | Tarjas pretas que recolhem · túnel 3D de fotogramas · vídeo comandado pelo scroll com timecode · película que entorta com a velocidade · ingressos com picote |

## Petshop: o que trocar para usar de verdade

Tudo fica no topo de `petshop/main.js`: número do WhatsApp, horário de funcionamento e a tabela de serviços e preços. Nome, endereço e telefone estão no `petshop/index.html`.

## Como abrir

Precisa de um servidor local (os arquivos se referenciam por caminho relativo):

```bash
npx http-server . -p 8080   # ou: python3 -m http.server 8080
```

Abra `http://localhost:8080`. Para publicar, dá para ativar o GitHub Pages neste repositório (Settings → Pages → branch) — não precisa de build.

## Mídia

- **Fotos:** Unsplash, escolhidas pelo dataset público oficial (Unsplash Lite), com nome do fotógrafo e local reais. Carregadas direto de `images.unsplash.com` com `srcset` responsivo.
- **Vídeos:** Wikimedia Commons (CC BY / CC BY-SA, créditos no rodapé de cada site). O código tenta as versões 720p → 480p → 1080p → original e, se nada carregar, mostra uma foto como poster.
- Para produção, o ideal é baixar e servir os vídeos do próprio domínio, recodificados com keyframe a cada quadro (`-g 1`) no vídeo de scroll do Altitude.

## Técnica

- `shared/core.js` — monta fotos e vídeos a partir de `data-u` / `data-commons`, liga Lenis ao ticker do GSAP, toca e pausa vídeo conforme a visibilidade, utilitários (vídeo comandado pelo scroll, timecode, prévia no cursor).
- GSAP 3.15 (ScrollTrigger, SplitText) e Lenis 1.3, servidos localmente em `shared/vendor/`. Fontes locais (Fontsource, licença OFL) em `shared/fonts/`.
- Respeita `prefers-reduced-motion`: sem scroll suave, sem pins, conteúdo estático.

## Referências da pesquisa

- Awwwards — elementos de scroll/vídeo/fotografia (ex.: [Video Scroll — Move Studio](https://www.awwwards.com/inspiration/video-scroll-move-studio), [Video on scroll — Goldschmiede Schubart](https://www.awwwards.com/inspiration/video-on-scroll-goldschmiede-schubart), [Minimal scroll photography gallery — BH Studio](https://www.awwwards.com/inspiration/minimal-scroll-photography-gallery-bh-studio))
- Codrops — [Scroll Animation Ideas for Image Grids](https://tympanus.net/codrops/2022/05/31/scroll-animation-ideas-for-image-grids/), [Sticky Grid Scroll](https://tympanus.net/codrops/2026/03/02/sticky-grid-scroll-building-a-scroll-driven-animated-grid/), [Infinite scroll com GSAP & Lenis](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/)
- CodePen / fórum GSAP — vídeo com scrub ([Video Scrolling with GSAP + Scrub](https://codepen.io/luis-lessrain/pen/wvRoBBz)) e o problema de vídeo voltando ao quadro 0 no fim do scroll
- YouTube — sequência de imagens estilo AirPods com ScrollTrigger (tutorial Webflow, youtu.be/JO-g2vz7BYE)
- Discussões sobre “cara de IA” ([Why AI websites look the same](https://www.managed-code.com/blog-post/why-ai-websites-look-the-same), [Fix a generic AI landing page](https://superdesign.dev/blog/fix-generic-ai-landing-page)): evitar roxo/índigo, título com degradê, Inter padrão, hero centralizado + três cards. Aqui: nenhum degradê em texto, nenhum card com sombra, tipografia com personalidade e texto com voz própria.
