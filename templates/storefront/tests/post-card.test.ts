import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Карточка статьи без рамки: строки идут подряд одним шагом (check:craft `twinGap`),
   низ текста у карточек ряда один (И762, `railTail`): под коротким заголовком нет
   пустой строки ни внутри карточки, ни до следующего раздела (23.10.2026). */
test('the post card lines follow one another; the row aligns their bottom, not a line reserve', () => {
  const css = readFileSync(new URL('../components/PostCard.module.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.match(css, /\.title\{[^}]*line-clamp:2;/)
  assert.match(css, /\.summary\{[^}]*line-clamp:2;/)
  /* Строки подряд одним шагом, низ текста у карточек ряда один (twinGap и railTail, 23.10.2026). */
  assert.match(css, /\.text\{display:flex;flex-direction:column;gap:var\(--sp-1\);flex:1 0 auto;justify-content:flex-end\}/)
  assert.doesNotMatch(css, /min-block-size/, 'запас у строки ставил шаг под коротким заголовком больше, чем под длинным')
  /* Многоточие срезало бы рубрику — у строки о статье перенос, а не обрезка. */
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
  assert.match(listCss, /\[data-place='list'\] \.text\{flex:1;gap:var\(--air-tight\);justify-content:flex-start\}/, 'в списке строки сверху вниз, низ прижат строкой данных')
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
   карточки → описание → низ карточки — `--air-tight`, ряд → ряд — `--air-block`. Было 14 /
   14 / 36 — «расстояния между текстами великоваты»; 23.10.2026 у низа снято своё поле
   `--air-row`: по краске низ стоял от описания почти как соседняя карточка (27 при 32,
   заказчик: «ну снова ритмы»; check:craft `footAir`). */
test('list cards step by the relation: name, text and footer tight, rows by the block air', () => {
  assert.ok(has("[data-place='list'] .text{flex:1;gap:var(--air-tight);justify-content:flex-start}"), 'имя → описание → низ — --air-tight, строки сверху вниз')
  assert.ok(has("[data-place='list'] .foot{margin-block-start:auto;display:flex;"), 'низ карточки прижат к низу ряда, своего поля сверху нет')
  const grid = readFileSync(new URL('../components/BlogIndex.module.css', import.meta.url), 'utf8')
  assert.match(grid, /\.grid\{row-gap:var\(--air-block\)\}/, 'ряд карточек → ряд — --air-block')
})
