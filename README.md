# Tinta & Montanha

**As raízes que atravessaram o mar**: a história real do Kasato Maru (笠戸丸), o navio que trouxe os primeiros imigrantes japoneses ao Brasil em 1908, pintada no estilo da pintura chinesa a tinta (*shan shui*). Tudo é gerado com código: não há nenhuma imagem nem arquivo de áudio no projeto.

> Raiz não é onde a gente nasce. É o que a gente leva e o que a gente planta.

## A história

Oito capítulos, cada um com a sua pintura animada e o seu arranjo musical: a partida de Kobe entre cerejeiras, os 52 dias de mar, a chegada a Santos e a subida da Serra do Mar de trem, o cafezal, a saudade sob as araucárias, o chá e os ipês do Vale do Ribeira, as lanternas da Liberdade e a lição final.

## Como funciona

| Parte | Arquivo | O que faz |
| --- | --- | --- |
| Pincéis | `src/engine/ink.js` | Montanhas com aguada e rugas de rocha (*cun*), pinheiros, cerejeiras, ipês, araucárias, palmeiras, cafezais, o navio, a casa de fazenda, prédios de São Paulo. Folhagem em verde-escuro. Tudo em Canvas 2D com aleatoriedade determinística (cada cena tem uma semente). |
| Efeitos | `src/engine/fx.js` | Névoa que corre entre as camadas, mar em ondas, trem a vapor, lanternas, garças, pétalas, vaga-lumes, cachoeiras, selo vermelho e textura de papel de arroz. |
| Cenas | `src/engine/scenes.js` | As oito pinturas, montadas em camadas com profundidade para o parallax. |
| Palco | `src/engine/stage.js` | Pintura em tela cheia, câmera com aproximação lenta e parallax do mouse, árvores ao vento, camadas que sobem da névoa, reflexo na água e a transição entre pinturas: uma máscara de ruído que faz a nova cena se espalhar como tinta no papel. |
| Música | `src/engine/music.js` | Trilha original em Web Audio: Ré pentatônico, 81 BPM, guzheng sintetizado por Karplus-Strong (com glissandos e notas puxadas), flauta *dizi* com deslizes, vibrato e sopro, pad de cordas, tambor *tanggu* e gongo. O arranjo muda a cada capítulo. |
| História | `src/story.js` | Os textos. A palavra entre `*asteriscos*` vira o destaque em itálico âmbar. |
| Interface | `src/App.jsx`, `src/index.css` | React. Rolagem por capítulos, teclado (↑ ↓ espaço), "modo filme" que avança a cada 4 compassos da música. |

## Design system

Extraído do vídeo de referência:

| Token | Valor | Uso |
| --- | --- | --- |
| Papel | `#EFEBE3` | Fundo, com manchas suaves e grão |
| Tinta | `#141210` | Títulos e traços |
| Âmbar | `#A8651E` | Palavra de destaque, em itálico |
| Verde-petróleo | `#2D6356` / `#1F7A6A` | Quadradinhos, régua do rótulo, progresso |
| Vermelho selo | `#9B2B2B` | Pavilhões, selo, sol |

- **Tipografia:** Instrument Serif (títulos condensados, itálico para o destaque), JetBrains Mono (rótulos espaçados em caixa alta), Ma Shan Zheng (caracteres chineses).
- **Componentes:** etiqueta com borda fina e quadradinhos nos cantos opostos, rótulo com régua e letras espaçadas, legenda com quadradinho verde, pintura com bordas esfumadas.
- **Movimento:** textos entram como tinta assentando (desfoque → nítido), pinturas trocam com uma mancha de tinta que se espalha, câmera em parallax lento.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

O som só começa depois de um clique (regra dos navegadores). Use **assistir com música** para o modo filme ou **ler no meu ritmo** para rolar sozinho.

## Publicação

O workflow `.github/workflows/deploy.yml` publica no GitHub Pages a cada push na `main`. Para ativar, vá em **Settings → Pages** e escolha **GitHub Actions** como fonte.

## Créditos

- Fatos históricos da imigração japonesa: partida de Kobe em 28/04/1908, chegada a Santos em 18/06/1908 com 781 imigrantes.
- Pinturas, música e código originais, gerados de forma procedural.

## Licença

[MIT](LICENSE)
