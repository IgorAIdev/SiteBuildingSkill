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
  assert.match(lines, /className=\{`\$\{go\.go\} \$\{p\.tap\} \$\{s\.drop\}`\}/)
})

test('a narrow cart pane puts the unit price on the facts row, not on its own row', () => {
  assert.match(cart, /@container \(max-width: 22rem\)\{[^@]*grid-template-areas:'thumb name name' 'thumb facts unit' 'act act act'/)
  assert.match(cart, /\.pane \.what\{display:contents\}/)
})

test('the pane foot is one pair — quiet on the left, loud on the right, one row, loud above when it wraps (И772)', () => {
  const panecss = read('../styles/pane.module.css')
  assert.match(panecss, /\.acts\{\s*display:flex;flex-wrap:wrap-reverse/)
  /* Корзина и фильтры берут пару окна, а не пишут свою: тихая первой в разметке. */
  assert.match(pane, /<div className=\{pn\.acts\}>\s*<a className=\{b\.btn\} href=\{view\.open\.href\}>[^\n]*\n\s*<a className=\{b\.btn\} data-voice="loud" href/)
  assert.doesNotMatch(cart, /\.paneGo\b|\.paneOpen\b/)
  assert.doesNotMatch(pane, /data-voice="loud" data-size="lg"/)
  const filters = read('../components/Filters.tsx')
  assert.match(filters, /className=\{`\$\{pn\.foot\} \$\{pn\.acts\} \$\{s\.actions\}`\}>[\s\S]*?view\.clear \? <a className=\{b\.btn\}[\s\S]*?<ApplyCount className=\{b\.btn\} data-voice="loud"/)
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
