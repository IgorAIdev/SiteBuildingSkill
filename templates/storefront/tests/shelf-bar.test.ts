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

test('on the narrow box the count stays in the bar, pressed to Filters, sort at the end', () => {
  /* Заказчик 08.10.2026: «счёт лучше прижать к фильтру, они же в единой работе»
     (поправка И758): счёт сразу за «Filters», без своей строки и без середины. */
  const css = read('../components/Catalog.module.css')
  const view = read('../components/Catalog.tsx')
  assert.doesNotMatch(css, /\.count\{margin-inline:auto\}/, 'счёт не уходит на середину строки')
  assert.doesNotMatch(css, /\.count\{order:1;flex-basis:100%\}/, 'счёт не стоит своей строкой')
  assert.match(css, /\.sort\{[^}]*margin-inline-start:auto/, 'порядок — у конца строки')
  assert.ok(view.indexOf('<Filters ') < view.indexOf('className={s.count}') && view.indexOf('className={s.count}') < view.indexOf('<SortMenu '), 'порядок в строке: Filters, счёт, порядок')
  assert.match(css, /@container \(max-width:559px\)\{\s*\.sortWord\{display:none\}/)
})
