import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { lookSlots, lookStyles, readPublished, readSite, render } from '../scripts/look-slots.mjs'
import { acceptLook, READ_BY_SERVER, type Facts } from '../lib/look-rule.ts'
import { acceptValues, lookCss, type Slots } from '../lib/look-values.ts'
import { HEADERS } from '../lib/headers.ts'
import { CARDS } from '../lib/cards.ts'

/* Вид — один, значениями, и источник его один — опубликованный вид
   (CLAUDE.md, «Панель настройки физически отделена от сайта»; И270, И272).
   Тесты сайта: опубликованный вид принимается сайтом без потерь; стили вида
   выпускаются из него и несут ровно его значения, без чужих наборов; список
   свойств не отстал от стилей; шапка и карточка рисуют свои варианты. */
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const SLOTS = JSON.parse(read('lib/look-slots.json')) as { slots: Slots; facts: Facts }

/* Опубликованный вид — данные заказчика, а не код: свойство, которого сайт
   больше не объявляет (переименовано, снято), сайт отбрасывает и называет в
   журнале, остальное рисует (lib/look.ts). Тест на живых данных падает на
   том, что сайт НЕ примет молча: значение не своего рода, сочетание, которое
   не носится. Устаревшее свойство — строка в отчёте, а не красный тест. */
const STALE = 'is not a property of this site'

test('look: the published look is accepted — every value of its kind, the combination holds; a stale property is dropped and named', (t) => {
  const raw = JSON.parse(read('lib/source/sample/look.json')) as { header: string; vars: Record<string, string> }
  const { look, notes } = acceptLook(raw, SLOTS.slots, SLOTS.facts)
  for (const n of notes.filter((x) => x.why === STALE)) t.diagnostic(`опубликованный вид: ${n.what} ${n.why} — отброшено, стоит умолчание сайта`)
  assert.deepEqual(notes.filter((x) => x.why !== STALE), [])
  const stale = acceptLook({ ...raw, vars: { ...raw.vars, '--mark-fill': 'transparent' } }, SLOTS.slots, SLOTS.facts)
  assert.ok(stale.notes.some((n) => n.what === '--mark-fill' && n.why === STALE), 'снятое свойство отброшено и названо')
  assert.deepEqual(stale.look.vars, look.vars, 'остальное — как без него')
  assert.equal(look.header, raw.header)
  /* Слова, которые читает сервер для разметки (подложка секции), идут и когда равны умолчанию: вид сайта выпущен в стили. */
  for (const [k, v] of Object.entries(look.vars)) if (!READ_BY_SERVER.test(k)) assert.notEqual(SLOTS.slots[k].value, v, `${k}: значение по умолчанию в блок не идёт`)
  assert.ok(lookCss(look).length < 20000, 'блок вида — не каталог')
})

test('look: the styles emitted from the published look carry exactly its values and no second palette, button or scale set', () => {
  const published = readPublished(ROOT)
  const { files, slots } = lookStyles(readSite(ROOT), published) as unknown as { files: Record<string, string>; slots: { slots: Slots } }
  const values = acceptValues(published, slots.slots).look.vars
  assert.ok(Object.keys(values).length > 100, 'опубликованный вид — полный')
  for (const [name, value] of Object.entries(values)) assert.equal(slots.slots[name].value, value, name)
  for (const [file, css] of Object.entries(files)) {
    assert.doesNotMatch(css, /\[data-(palette|button|scale|face)=/, `${file}: чужой набор`)
    assert.match(css, /Руками не правят/, `${file}: выпущен, а не написан`)
  }
})

test('look: the site stylesheets are emitted, never a second set; the property list is not behind them', () => {
  for (const file of ['styles/palette.css', 'styles/buttons.css', 'styles/scale.css', 'styles/look.css']) {
    assert.doesNotMatch(read(file), /\[data-(palette|button|scale)=/, `${file}: чужой набор`)
  }
  assert.ok(!read('components/Shell.tsx').includes('next/font'), 'next/font в сайте нет')
  assert.equal(read('lib/look-slots.json').replace(/\r\n/g, '\n'), render(lookSlots(readSite(ROOT))))
  const groups = new Set(Object.values(SLOTS.slots).map((s) => s.group))
  assert.deepEqual([...groups].sort(), ['band-effects', 'band-faq', 'band-featured', 'band-posts', 'band-reviews', 'band-story', 'button', 'cart-meta', 'cart-sign', 'corners', 'door-case', 'face', 'field', 'field-label', 'filter-look', 'filter-phone', 'go-hover', 'head-size', 'logo', 'nav-current', 'pager-look', 'pair-look', 'palette', 'pdp-edge', 'pdp-gallery', 'pdp-thumbs', 'quick-look', 'save-look', 'say-look', 'scale', 'seg-look', 'shadow', 'star', 'stock-look', 'text-size', 'tick', 'width'])
  for (const role of ['--page', '--plate', '--quiet', '--pop', '--on-pop']) assert.ok(SLOTS.facts.roles[role], role)
})

test('look: the header and the product card draw each variant the site keeps; the revalidation route knows only closed tags', () => {
  const header = read('components/Header.tsx')
  for (const h of HEADERS) assert.match(header, new RegExp(`data-variant="${h}"`), h)
  const card = read('components/ProductCard.module.css')
  for (const c of CARDS) assert.match(card, new RegExp(`\[data-card='${c}'\]`), c)
  assert.match(read('components/ProductCard.tsx'), /data-card=\{variant\}/)
  const route = read('app/api/revalidate/route.ts')
  /* Теги — закрытый список: вид и каталог движка (SOURCE=vendure); чужое слово ничего не сбрасывает. */
  assert.match(route, /const TAGS = \['look', 'catalog'\] as const/)
  assert.match(route, /REVALIDATE_SECRET/)
  /* `expire: 0` стирает запись статической страницы языка, и при
     `dynamicParams = false` Next отвечает «не найдено» (И270). */
  assert.doesNotMatch(route, /revalidateTag\([^)]*expire:\s*0/)
  assert.match(route, /revalidateTag\(known, 'max'\)/)
})

/* Подложка секции (И591): значение `--band-<блок>` носится всегда — группа вне
   ORDER ни с чем не пара, и `settle` её не отбрасывает молча. Так выбор из
   панели доходил до сервера, а на странице оставался «без подложки». */
test('look: a section background (band-<block>) survives the combination check and keeps its word', () => {
  const { look, notes } = acceptLook({ vars: { '--band-featured': 'dark', '--band-faq': 'quiet', '--band-story': 'brand' } }, SLOTS.slots, SLOTS.facts)
  assert.equal(look.vars['--band-featured'], 'dark')
  assert.equal(look.vars['--band-faq'], 'quiet')
  assert.equal(look.vars['--band-story'], 'brand')
  assert.deepEqual(notes.filter((n) => n.what.includes('band')), [])
  assert.equal(acceptLook({ vars: { '--band-faq': 'loud' } }, SLOTS.slots, SLOTS.facts).look.vars['--band-faq'], undefined, 'a word the site does not know is dropped')
})
