import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Меню телефона (И753): кнопка меню — первой в строке шапки, у начального
   края; шторка полок выезжает оттуда же; в строках шторки — знаки полок, а не
   снимки; текущая страница выделена плашкой тихой марки (И716); групп всего
   каталога под полками нет — повторяли грани масел (И430). Слово заказчика
   05.10.2026 со снимком меню cbdin.bg. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const header = read('../components/Header.tsx')
const nav = read('../components/NavLinks.tsx')
const css = read('../components/Header.module.css')

test('the menu button stands first in the header row, before the logo', () => {
  const bars = [...header.matchAll(/\{menu\(lang, nav\)\}[\s\S]{0,40}?\{logo\(lang\)\}/g)]
  /* classic, search и сборка cbdin (tray, nested, step — одна разметка). */
  assert.equal(bars.length, 3)
  for (const m of header.matchAll(/<div className=\{s\.actions\}>[\s\S]*?<\/div>/g)) assert.doesNotMatch(m[0], /menu\(lang, nav\)/)
})

test('the shelf drawer opens from the edge of its button', () => {
  assert.match(header, /data-pane="start"/)
  assert.doesNotMatch(header, /data-pane=\{from\}/)
})

test('the drawer shows shelf signs, not shelf pictures', () => {
  assert.doesNotMatch(nav, /<img\b/)
  assert.match(nav, /<Icon id=\{l\.sign\} \/>/)
})

test('the current page in the drawer sits on the quiet brand plate', () => {
  assert.match(css, /:popover-open[^{]*\.links > li > a\[aria-current='page'\]\{background:var\(--pop-tint\);color:var\(--pop-ink\)/)
})

test('no catalog-wide groups under the shelves', () => {
  assert.doesNotMatch(header, /nav\.groups|sheetGroups/)
  assert.doesNotMatch(css, /\.sheetGroups\b/)
})

test('the menu sign stands on the page edge, its frame inside the window', () => {
  assert.match(css, /\.menu\{display:inline-flex;[^}]*margin-inline-start:max\(\(var\(--glyph-h\) - var\(--ctrl-h\)\) \/ 2, -1 \* var\(--gut\)\)/)
})

/* Шапка телефона (И756): полоса доставки — ростом цели её ссылок, черты текущего
   под знаками на узкой коробке нет. */
test('the promo strip is the target of its links, not target plus air', () => {
  const tokens = read('../styles/tokens.css')
  assert.match(tokens, /--head-strip:max\(var\(--ctrl-target\), calc\(var\(--sp-2\) \* 4\)\);/)
})

test('the current-page line is drawn by the wide header row only', () => {
  assert.match(css, /@container \(min-width:820px\)\{\s*\.head:has\([^{]*\) \.bar::after\{\s*content:''/)
  assert.doesNotMatch(css, /\)::after\{/)
})

/* Шторка следует строке шапки: грани раскрываются только у полки с подменю
   (`menu`, на cbdin — «Oil»); у «Cosmetics», «Vape» и прочих — одна ссылка
   (слово заказчика 05.10.2026, поправка И478). */
test('the drawer opens shelf facets only where the header row has a submenu', () => {
  assert.match(nav, /data-params=\{l\.menu \? '' : undefined\}/)
  assert.match(nav, /\{l\.menu \? \(\s*<>\s*<button className=\{`\$\{b\.btn\} \$\{s\.params\}`\}/)
  assert.doesNotMatch(nav, /\{l\.facets\.length \? \(\s*<>\s*<button/)
})
