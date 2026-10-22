import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Карточка статьи без рамки держит две строки заголовка и две строки описания
   (И762): ряд одной высоты, под коротким заголовком нет пустой строки до
   следующего раздела. */
test('the post card keeps two lines for the title and two for the summary', () => {
  const css = readFileSync(new URL('../components/PostCard.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.title\{[^}]*line-clamp:2;[^}]*min-block-size:2lh/)
  assert.match(css, /\.summary\{[^}]*line-clamp:2;[^}]*min-block-size:2lh/)
  /* Строка о статье держит две строки и прижата к заголовку (поправка И762):
     перенос у одной карточки тянул ряд; многоточие срезало рубрику. */
  assert.match(css, /\.meta\{min-block-size:2lh;display:flex;flex-direction:column;justify-content:flex-end\}/)
  assert.doesNotMatch(css, /\.meta\{[^}]*(nowrap|overflow)/)
  const tsx = readFileSync(new URL('../components/PostCard.tsx', import.meta.url), 'utf8')
  assert.match(tsx, /<p className=\{`\$\{p\.note\} \$\{s\.meta\}`\}>/)
})

/* Карточка статьи (components/PostCard.module.css). Купили дефекты 21–22.10.2026:
   под однострочным именем стоял запас под вторую строку, и описание у соседних
   статей отходило от имени на разное расстояние («текст описания от заголовка на
   разном расстоянии у разных статей»); наведение — один еле видный наплыв, у
   закреплённой «Start here» — никакого («наведение / нажатие в блоге не нужно
   как-то отобразить?»). */
const listCss = readFileSync(new URL('../components/PostCard.module.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

test('list cards keep no line reserves: the description sits right under the name', () => {
  assert.match(listCss, /\[data-place='list'\] :is\(\.meta, \.title, \.summary\)\{min-block-size:0\}/, 'в списке у имени, описания и строки данных нет запаса строк')
})

const has = (text: string) => listCss.includes(text)

/* Имя под рукой молчит — как у двери полки и карточки товара (22.10.2026: «откуда её дизайн
   наведение / нажатие?» — марочное имя было придумано на месте). */
test('the card answers the hand like the shop cards: edge on the picture, picture creeps, name silent', () => {
  for (const state of ['hover', 'active']) {
    assert.ok(has(`.card:${state} > .shot{--line-card:`), `${state}: кромка снимка у карточки`)
    assert.ok(!has(`.card:${state} .title{color`), `${state}: имя не перекрашивается`)
    assert.ok(has(`.card:${state} .shot img{scale:var(--creep)}`), `${state}: наплыв снимка у карточки`)
  }
})

/* Ступень по отношению (scale, «Шаг 5»; замер семи редакционных лент 22.10.2026): имя
   карточки → описание — `--air-tight`, низ карточки — от `--air-row`, ряд → ряд —
   `--air-block`. Было 14 / 14 / 36 — «расстояния между текстами великоваты». */
test('list cards step by the relation: name to text tight, footer apart, rows by the block air', () => {
  assert.ok(has("[data-place='list'] .text{flex:1;gap:var(--air-tight)}"), 'имя → описание — --air-tight')
  assert.ok(has("[data-place='list'] .foot{margin-block-start:auto;padding-block-start:var(--air-row);"), 'низ карточки — от --air-row, прижат к низу ряда')
  const grid = readFileSync(new URL('../components/BlogIndex.module.css', import.meta.url), 'utf8')
  assert.match(grid, /\.grid\{row-gap:var\(--air-block\)\}/, 'ряд карточек → ряд — --air-block')
})
