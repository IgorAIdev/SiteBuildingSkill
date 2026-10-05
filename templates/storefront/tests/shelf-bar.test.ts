import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Строка над полкой (И758): «Filters», счёт и порядок — роль обычной кнопки на
   всех ширинах; на узкой коробке — одной строкой, счёт посередине; на телефоне
   порядок — одним знаком. Заказчик 05.10.2026: «почему такой большой, он что не
   по ролям?», «85 products отнимает целую строку». */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('the shelf bar takes the ordinary button size', () => {
  assert.doesNotMatch(read('../components/Filters.tsx'), /s\.open\}`\} data-voice="bare" data-size=/)
  assert.doesNotMatch(read('../components/SortMenu.tsx'), /data-size=/)
  assert.doesNotMatch(read('../components/Catalog.tsx'), /className=\{s\.count\} data-size=/)
})

test('on the narrow box the count stays in the bar, between filters and sort', () => {
  const css = read('../components/Catalog.module.css')
  assert.match(css, /@container \(max-width:819px\)\{\s*\.count\{margin-inline:auto\}/)
  assert.doesNotMatch(css, /\.count\{order:1;flex-basis:100%\}/)
  assert.match(css, /@container \(max-width:559px\)\{\s*\.sortWord\{display:none\}/)
})
