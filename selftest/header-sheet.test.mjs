/* Лист шапок (tools/header-sheet.mjs): список сборок читается из lib/headers.ts
   шаблона витрины, вид с выбранной сборкой пишется как у панели, а правило
   «вид новой витрины начинается с шапки» не повисает в воздухе — у него есть
   команда, пункт ворот и строка в ядре правил (слово владельца 14.10.2026). */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { headersOf, withHeader, sheetHtml } from '../tools/header-sheet.mjs'
import { SCRIPTS } from '../scripts.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('список сборок читается из lib/headers.ts шаблона', () => {
  const ids = headersOf(read('templates/storefront/lib/headers.ts'))
  assert.ok(ids.length >= 6, `сборок меньше шести: ${ids.join(', ')}`)
  for (const id of ['classic', 'search', 'boutique', 'tray', 'nested', 'step']) assert.ok(ids.includes(id), `нет сборки ${id}`)
  assert.deepEqual(headersOf('export const HEADERS = [\n \'a\', // look-header:a\n \'b-c\',\n] as const'), ['a', 'b-c'])
  assert.deepEqual(headersOf('нет списка'), [])
})

test('вид с выбранной сборкой несёт её и в поле, и в именах — как пишет панель', () => {
  const look = { header: 'classic', names: { header: 'classic', palette: 'X' }, vars: { '--a': '1' } }
  const out = withHeader(look, 'capsule')
  assert.equal(out.header, 'capsule')
  assert.equal(out.names.header, 'capsule')
  assert.equal(out.names.palette, 'X')
  assert.equal(look.header, 'classic', 'исходный вид не изменён')
})

test('лист — две картинки рядом, без внешних адресов', () => {
  const html = sheetHtml({ title: 'Капсула', desktop: 'AAAA', phone: 'BBBB' })
  assert.match(html, /Капсула · ноутбук/)
  assert.match(html, /data:image\/png;base64,AAAA/)
  assert.match(html, /data:image\/png;base64,BBBB/)
  assert.doesNotMatch(html, /https?:\/\//)
})

test('правило «вид начинается с шапки» держат команда, ворота и ядро правил', () => {
  assert.equal(SCRIPTS['header:sheet'], 'node tools/header-sheet.mjs', 'команда header:sheet не заведена в scripts.mjs')
  const stages = read('tools/stages.mjs')
  assert.match(stages, /шапка показана заказчику картинками/, 'в воротах 0 нет пункта владельца о шапке')
  assert.match(stages, /листа шапок нет \(header:sheet\)/, 'в воротах 0 нет машинного пункта о листе шапок')
  const owner = stages.slice(stages.indexOf('owner: [\n          \'шапка'))
  assert.ok(owner.indexOf('шапка показана') < owner.indexOf('набор цвета показан'), 'шапка в воротах должна стоять раньше цвета')
  const law = read('CLAUDE.md')
  assert.match(law, /Вид новой витрины начинается с шапки/, 'в CLAUDE.md нет правила')
  assert.match(law, /header:sheet/)
})
