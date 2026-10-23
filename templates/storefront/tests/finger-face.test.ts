import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Рисунок малого органа под пальцем не растёт (И764): счётчик и «Удалить» строки
   корзины, кружок сердца на снимке — ростом `--ctrl-face` (32), а палец получает
   свои 44 невидимым запасом наружу. До 05.10.2026 они рисовались ростом пальца,
   44–48: «огромный счётчик», сердце в треть карточки (слово заказчика). Шторка
   корзины на телефоне — по образцу cbdin.bg: цена за штуку в строке фактов,
   «Открыть корзину» и громкая кнопка одним рядом. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const cart = read('../components/Cart.module.css').replace(/\/\*[\s\S]*?\*\//g, '')
const lines = read('../components/CartLines.tsx')
const pane = read('../components/CartPane.tsx')
const glyph = read('../styles/glyph.module.css').replace(/\/\*[\s\S]*?\*\//g, '')
const prim = read('../styles/primitives.module.css').replace(/\/\*[\s\S]*?\*\//g, '')

test('the cart row draws its organs at the small-organ face, not at finger height', () => {
  assert.match(cart, /\.act\{[^}]*--qty-h:var\(--ctrl-face\)/)
  assert.match(cart, /\.sum\{[^}]*line-height:var\(--ctrl-face\)/)
  assert.match(cart, /\.drop\{[^}]*min-block-size:var\(--ctrl-face\)/)
  assert.doesNotMatch(cart, /\.(act|sum|drop)\{[^}]*--ctrl-h-sm/)
  /* Палец получает цель запасом: у счётчика — data-hit, у «Удалить» — p.tap. */
  assert.match(lines, /className=\{`\$\{b\.word\} \$\{p\.tap\} \$\{s\.drop\}`\} data-hand="bad"/)
})

test('a narrow cart list — pane and page alike — puts the unit price on the facts row, the name full width', () => {
  /* Третий ряд пустой и гибкий: остаток роста снимка уходит в него, а не раздвигает имя и факты.
     Страница корзины на телефоне — тот же узкий список, что шторка (слово заказчика 23.10.2026:
     «цена слишком высоко, её нужно ниже, и место освободится для строки названия»). */
  assert.match(cart, /@container \(max-width: 22rem\)\{[^@]*\.line\{grid-template-areas:'thumb name name' 'thumb facts unit' 'thumb \. \.' 'act act act';grid-template-rows:auto auto 1fr auto/)
  assert.match(cart, /@container \(max-width: 22rem\)\{[^@]*\.what\{display:contents\}/)
  assert.doesNotMatch(cart, /\.pane \.what\{display:contents\}/, 'узкий список один на шторку и страницу')
})

/* Имя строки — растянутая ссылка: цель пальца — вся строка, своей коробки цели у имени нет.
   Коробка в 44 под строкой текста в 24 уводила факты от имени на 44 (снимок заказчика
   22.10.2026: «в карт расстояния несколько больший ритмы»; семья `stretchTarget`). */
test('the cart line name is a stretched link without its own target box', () => {
  assert.match(cart, /\.name::after\{content:'';position:absolute;inset:0\}/)
  assert.doesNotMatch(cart, /\.name\{[^}]*(min-block-size|min-height)/)
  /* Ритм лесенкой: имя → факты — воздух одной мысли, снимок → органы и строка → строка — воздух строки. */
  assert.match(cart, /\.what\{[^}]*gap:var\(--air-line\)/)
  assert.match(cart, /\.line\{[^}]*row-gap:var\(--air-row\);\s*padding-block:var\(--air-row\)/)
})

/* Страница корзины на широком листе — строкой таблицы (Dawn, Horizon, Gymshark): снимок ·
   имя, факты, цена за штуку · количество и «Удалить» · сумма у правого края. Разметка та же,
   что у шторки: ряд органов растворяется, органы встают в свои колонки. */
test('the cart page line on a wide sheet is a table row, the pane keeps its rows', () => {
  assert.match(cart, /\.sheet \.list\{container-type:inline-size\}/)
  const wide = cart.match(/@container \(min-width: 36rem\)\{([\s\S]*?)\r?\n\}/)
  assert.ok(wide, 'no wide-sheet block in Cart.module.css')
  assert.match(wide[1], /grid-template-areas:'thumb what qty sum' 'thumb what drop sum' 'thumb unit \. sum' 'thumb \. \. \.'/)
  assert.match(wide[1], /\.sheet \.act\{display:contents\}/)
  assert.match(wide[1], /\.sheet \.act > :not\(\.sum\)\{grid-area:qty;position:relative;z-index:1;pointer-events:auto\}/)
  assert.doesNotMatch(wide[1], /\.pane/)
})

test('the pane foot is one pair — quiet on the left, loud on the right, one row, loud above when it wraps (И772)', () => {
  const panecss = read('../styles/pane.module.css')
  assert.match(panecss, /\.acts\{\s*display:flex;flex-wrap:wrap-reverse/)
  /* Корзина и фильтры берут пару окна, а не пишут свою: тихая первой в разметке. */
  assert.match(pane, /<div className=\{pn\.acts\}>\s*<(?:a|SiteLink) className=\{b\.btn\} href=\{view\.open\.href\}>[^\n]*\n\s*<(?:a|SiteLink) className=\{b\.btn\} data-voice="loud" href/)
  assert.doesNotMatch(cart, /\.paneGo\b|\.paneOpen\b/)
  assert.doesNotMatch(pane, /data-voice="loud" data-size="lg"/)
  const filters = read('../components/Filters.tsx')
  assert.match(filters, /className=\{`\$\{pn\.foot\} \$\{pn\.acts\} \$\{s\.actions\}`\}>[\s\S]*?view\.clear \? <(?:a|SiteLink) className=\{b\.btn\}[\s\S]*?<ApplyCount className=\{b\.btn\} data-voice="loud"/)
})

test('the heart on a picture keeps a small circle under a finger, its target outside', () => {
  const coarse = glyph.match(/@media \(pointer:coarse\)\{([\s\S]*?\n)\}/)
  assert.ok(coarse, 'no finger block in the glyph module')
  assert.match(coarse[1], /\.glyph\[data-over='picture'\]\{min-block-size:var\(--ctrl-face\);min-inline-size:var\(--ctrl-face\)\}/)
  assert.match(coarse[1], /\.glyph\[data-over='picture'\]::after\{[^}]*inline-size:max\(100%, var\(--ctrl-target\)\)/)
})

test('the shelf card button is drawn at 40 under a finger too, its 44 target outside', () => {
  const card = read('../components/ProductCard.module.css').replace(/\/\*[\s\S]*?\*\//g, '')
  const tsx = read('../components/ProductCard.tsx')
  assert.match(card, /\.foot\{[^}]*--ctrl-h:var\(--ctrl-face-md\)/)
  const adds = tsx.match(/className=\{`\$\{b\.btn\}[^`]*\$\{s\.add\}`\}/g) ?? []
  assert.ok(adds.length >= 3, 'card buttons not found')
  for (const a of adds) assert.match(a, /\$\{p\.tap\}/, `card button without a finger target: ${a}`)
})

test('a chip is drawn at the small-organ face; a finger gets 44 around a pressable one', () => {
  assert.match(prim, /:where\(\.chip\)\{--chip-h:var\(--ctrl-face\)\}/)
  assert.match(prim, /\.chip\{[^}]*block-size:var\(--chip-h\)/)
  const chip = [...prim.matchAll(/\.chip[^{]*\{[^}]*\}/g)].map((m) => m[0]).join('\n')
  assert.doesNotMatch(chip, /--ctrl-h-sm/, 'a chip rule still sizes itself by finger height')
  assert.match(prim, /@media \(pointer:coarse\)\{\s*:where\(a\.chip, button\.chip\)\{position:relative\}\s*:where\(a, button\)\.chip::after\{[^}]*max\(100%, var\(--ctrl-target\)\)/)
})
