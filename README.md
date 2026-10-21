# Tinta & Montanha

**O cavalo do velho da fronteira** (塞翁失马), uma fábula chinesa de dois mil anos contada em pintura a tinta e música. Tudo é gerado com código: não há nenhuma imagem nem arquivo de áudio no projeto.

> Sorte e azar se transformam um no outro, como as estações. Antes de chamar algo de desgraça ou de bênção, espere a história terminar.

## A história

Um velho da fronteira perde o seu único cavalo. Os vizinhos lamentam e ele responde: *quem sabe se isso não é uma bênção?* O cavalo volta trazendo um garanhão, o filho cai e quebra a perna, chega a guerra… e a cada reviravolta o velho repete a mesma pergunta. São oito capítulos, cada um com a sua pintura, o seu clima e o seu arranjo musical.

## Como funciona

| Parte | Arquivo | O que faz |
| --- | --- | --- |
| Pincéis | `src/engine/ink.js` | Montanhas com aguada e rugas de rocha (*cun*), pinheiros do Huangshan, bambus, pavilhões, ponte em arco, cachoeiras, bordos vermelhos. Tudo em Canvas 2D com aleatoriedade determinística (cada cena tem uma semente). |
| Efeitos | `src/engine/fx.js` | Névoa que corre entre as camadas, garças em voo, cavalos a galope, pétalas, neve, selo vermelho e textura de papel de arroz. |
| Cenas | `src/engine/scenes.js` | As oito pinturas, montadas em camadas com profundidade para o parallax. |
| Palco | `src/engine/stage.js` | Câmera lenta, reflexo na água e a transição entre pinturas: uma máscara de ruído que faz a nova cena se espalhar como tinta no papel. |
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

- Fábula do *Huainanzi* (淮南子), século II a.C., em domínio público.
- Pinturas, música e código originais, gerados de forma procedural.

## Licença

[MIT](LICENSE)
