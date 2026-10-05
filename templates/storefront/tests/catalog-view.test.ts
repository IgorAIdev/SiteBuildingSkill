import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sample, sampleSource } from '../lib/source/sample/catalog.ts'
import { catalogView, emptyFor, foldValues, shownFacets, showLabel } from '../lib/catalog-view.ts'
import { hrefFor, type Query } from '../lib/href.ts'
import { frameTotal, shownListing, type Asked } from '../lib/listing.ts'
import type { Facet } from '../lib/source/contract.ts'

const NB = '\u00a0'

const none = { title: '', step: '', href: '' }

test('page links keep the chosen facets and sort; the first page carries no number', async () => {
  const asked: Asked = { facets: {}, sort: 'price-asc', page: '2' }
  const r = await sampleSource(10).listing('ro', asked)
  assert.ok(r.ok)
  const at = (q: Query) => hrefFor('ro', { catalog: true, ...q })
  const v = catalogView('ro', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: emptyFor('ro', asked, at) })
  assert.equal(v.pages?.prev, '/ro/catalog?sort=price-asc')
  assert.equal(v.pages?.next, null)
  assert.equal(v.pages?.label, 'Pagina 2 din 2')
  assert.deepEqual(v.pages?.items, [{ n: 1, href: '/ro/catalog?sort=price-asc', gap: false }, { n: 2, href: null, gap: false }])
  assert.equal(v.count, '19 produse')
  assert.equal(v.cards.length, 9)
  assert.equal(v.sort?.options.find((o) => o.on)?.value, 'price-asc')
})

/* Порядок — ссылками (И265): каждая ведёт на первую страницу той же полки
   с теми же гранями. */
test('sort options are addresses that keep the facets and start from the first page', async () => {
  const asked: Asked = { facets: { forma: ['ulei'] }, sort: 'popular', page: null }
  const r = await sample.listing('en', asked)
  assert.ok(r.ok)
  const v = catalogView('en', { title: 'T', lede: null, listing: r.value, asked, at: (q) => hrefFor('en', { catalog: true, ...q }), filters: true, empty: none })
  assert.deepEqual(v.sort?.options.map((o) => o.href), ['/en/catalog?facet.forma=ulei', '/en/catalog?facet.forma=ulei&sort=newest', '/en/catalog?facet.forma=ulei&sort=price-asc', '/en/catalog?facet.forma=ulei&sort=price-desc'])
  assert.equal(v.sort?.said, 'Sort by: Best sellers')
})

/* Четыре пункта, на которых сходятся образцы (И709): продаваемые — умолчание,
   новые, цена в обе стороны. Алфавит, скидка и оценка — не по умолчанию. */
test('sort menu: best sellers, newest, price up, price down — in this order, in every language', async () => {
  const asked: Asked = { facets: {}, sort: 'newest', page: null }
  const r = await sample.listing('en', asked)
  assert.ok(r.ok)
  const at = (q: Query) => hrefFor('en', { catalog: true, ...q })
  const v = catalogView('en', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none })
  assert.deepEqual(v.sort?.options.map((o) => o.label), ['Best sellers', 'Newest', 'Price: low to high', 'Price: high to low'])
  assert.equal(v.sort?.current, 'Newest')
  for (const lang of ['ro', 'hu'] as const) {
    const w = catalogView(lang, { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none })
    assert.equal(new Set(w.sort?.options.map((o) => o.label)).size, 4, `${lang}: у каждого пункта своё слово`)
  }
})

test('long page runs keep the first, the last and the neighbours of the current', async () => {
  const r = await sampleSource(1).listing('en', { facets: {}, sort: 'popular', page: '6' })
  assert.ok(r.ok)
  const v = catalogView('en', { title: 'T', lede: null, listing: r.value, asked: { facets: {}, sort: 'popular', page: '6' }, at: (q) => hrefFor('en', { catalog: true, ...q }), filters: true, empty: none })
  assert.deepEqual(v.pages?.items.flatMap((x) => (x.gap ? ['…', x.n] : [x.n])), [1, '…', 5, 6, 7, '…', 19])
})

test('empty: with facets — clear them; without — go to all products', () => {
  const at = (q: Query) => hrefFor('en', { category: 'uleiuri', ...q })
  const out = emptyFor('en', { facets: { forma: ['crema'] }, sort: 'popular', page: null }, at)
  assert.deepEqual(out, { title: 'No products match these filters', step: 'Clear one of the filters', href: '/en/catalog/uleiuri' })
  assert.equal(emptyFor('en', { facets: {}, sort: 'popular', page: null }, at).href, '/en/catalog')
})

test('filters on a phone: the open button counts what is chosen', async () => {
  const asked: Asked = { facets: { putere: ['10', '20'] }, sort: 'popular', page: null }
  const r = await sample.listing('ro', { category: 'uleiuri', ...asked })
  assert.ok(r.ok)
  const at = (q: Query) => hrefFor('ro', { category: 'uleiuri', ...q })
  const v = catalogView('ro', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none })
  assert.equal(v.filters?.chosen, 2)
  assert.equal(v.filters?.open, 'Filtre (2)')
  assert.equal(v.filters?.close, 'Închide filtrele')
})

/* cbd-facet, §7: значение без товаров — тупик; грань, где у всей выборки
   одно значение, выбора не даёт; выбранное остаётся всегда. */
/* Значение, которое выбор не находит, стоит погашенным с нулём, а не пропадает
   (И750); грань с одним значением на всю выборку не стоит. */
test('facets keep zero values to grey them out; a facet with one value for the whole shelf is not shown', () => {
  const f = (code: string, values: [string, number, boolean][]): Facet => ({ code, name: code, values: values.map(([c, count, selected]) => ({ code: c, name: c, count, selected })) })
  const shown = shownFacets([
    f('forma', [['ulei', 5, false], ['capsule', 0, false]]),
    f('putere', [['5', 2, false], ['10', 2, false], ['2.5', 0, false]]),
    f('marca', [['a', 0, true]]),
    f('note', [['x', 2, false]]),
    f('kind', [['k', 5, false]]),
  ], 5)
  assert.deepEqual(shown.map((x) => [x.code, x.values.map((v) => [v.code, v.count])]), [
    ['forma', [['ulei', 5], ['capsule', 0]]], ['putere', [['5', 2], ['10', 2], ['2.5', 0]]], ['marca', [['a', 0]]], ['note', [['x', 2]]],
  ])
})

test('chosen values become pills that remove only themselves and keep the order', async () => {
  const asked: Asked = { facets: { forma: ['ulei'], putere: ['10'] }, sort: 'price-asc', page: null }
  const r = await sample.listing('en', asked)
  assert.ok(r.ok)
  const at = (q: Query) => hrefFor('en', { catalog: true, ...q })
  const v = catalogView('en', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none })
  assert.deepEqual(v.chips.map((c) => [c.label, c.href]), [
    ['Oil', '/en/catalog?facet.putere=10&sort=price-asc'],
    [`10${NB}%`, '/en/catalog?facet.forma=ulei&sort=price-asc'],
  ])
  assert.equal(v.chips[0].said, 'Remove filter Categories: Oil', 'грань полок — словом сайта «Categories» (И740)')
  assert.equal(v.clear?.href, '/en/catalog?sort=price-asc', 'сброс граней не сбрасывает порядок')
})

/* Полка — рамка страницы (слово заказчика 04.10.2026): на полке масел других
   форм в гранях нет; полку называет заголовок, в фильтре — имя его окна, а
   выход из неё ведёт во все товары с теми же гранями и порядком — там формы
   снова есть. Пилюлей полка не повторяется (И740). */
test('a shelf page: the shelf is named in the filter, not a pill, and widens to all products keeping facets', async () => {
  const asked: Asked = { facets: { putere: ['10'] }, sort: 'price-asc', page: '1' }
  const r = await sample.listing('en', { category: 'uleiuri', ...asked })
  assert.ok(r.ok)
  const at = (q: Query) => hrefFor('en', { category: 'uleiuri', ...q })
  const v = catalogView('en', { title: 'CBD oils', lede: null, listing: r.value, asked, at, filters: true, empty: none, scope: { name: 'CBD oils', wider: (q) => hrefFor('en', { catalog: true, ...q }) } })
  assert.deepEqual(v.chips.map((c) => [c.label, c.href]), [[`10${NB}%`, '/en/catalog/uleiuri?sort=price-asc']])
  assert.deepEqual(v.filters?.scope, { label: 'CBD oils', all: 'All products', said: 'All products, not only CBD oils', href: '/en/catalog?facet.putere=10&sort=price-asc' })
  assert.ok(!v.filters?.facets.some((f) => f.code === 'forma'), 'на полке масел формы не предлагаются')
  /* «Расслабление» есть у масел и капсул: на полке масел формы нет, во всех
     товарах с тем же эффектом — есть. */
  const relax: Asked = { facets: { effect: ['relax'] }, sort: 'popular', page: null }
  const oils = await sample.listing('en', { category: 'uleiuri', ...relax })
  const all = await sample.listing('en', relax)
  assert.ok(oils.ok && all.ok)
  const facetsOf = (l: typeof all.value) => catalogView('en', { title: 'T', lede: null, listing: l, asked: relax, at: (q) => hrefFor('en', { catalog: true, ...q }), filters: true, empty: none }).filters?.facets.map((f) => f.code)
  assert.ok(!facetsOf(oils.value)?.includes('forma'))
  assert.ok(facetsOf(all.value)?.includes('forma'), 'во всех товарах формы снова есть')
  assert.equal(v.clear?.href, '/en/catalog/uleiuri?sort=price-asc', 'сброс граней полку не снимает')
})

/* Amazon, «Any Department»: снятие полки уносит только то, что есть шире;
   грань, живущая лишь в полке (`scoped` — у движка, где грань есть лишь у одной полки),
   остаётся с полкой. */
test('widening a shelf drops the facets that live only inside it', () => {
  const listing = { items: [], total: 0, page: 1, pages: 1, invalid: [], facets: [
    { code: 'concentration', name: 'Strength', scoped: true as const, values: [{ code: '10', name: '10%', count: 2, selected: true }] },
    { code: 'effect', name: 'Effect', values: [{ code: 'sleep', name: 'Sleep', count: 2, selected: true }] },
  ] }
  const asked: Asked = { facets: { concentration: ['10'], effect: ['sleep'] }, sort: 'popular', page: null }
  const v = catalogView('en', { title: 'T', lede: null, listing, asked, at: (q) => hrefFor('en', { category: 'uleiuri', ...q }), filters: true, empty: none, scope: { name: 'CBD oils', wider: (q) => hrefFor('en', { catalog: true, ...q }) } })
  assert.equal(v.filters?.scope?.href, '/en/catalog?facet.effect=sleep')
})

test('nothing chosen — no clear button and no pills', async () => {
  const asked: Asked = { facets: {}, sort: 'popular', page: null }
  const r = await sample.listing('en', asked)
  assert.ok(r.ok)
  const v = catalogView('en', { title: 'T', lede: null, listing: r.value, asked, at: (q) => hrefFor('en', { catalog: true, ...q }), filters: true, empty: none })
  assert.equal(v.clear, null)
  assert.equal(v.filters?.clear, null)
  assert.deepEqual(v.chips, [])
})

/* «Показать ещё» (И721): ссылка на следующую страницу с `from`, счёт показанного
   и доля для полоски; назад — перед первой показанной страницей. */
test('show more links the next page glued to the shown ones, counts what is shown', async () => {
  const at = (q: Query) => hrefFor('en', { catalog: true, ...q })
  const asked: Asked = { facets: {}, sort: 'popular', page: '2', from: '1' }
  const r = await shownListing(sampleSource(5), 'en', asked)
  assert.ok(r.ok)
  const v = catalogView('en', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none })
  assert.equal(v.cards.length, 10)
  assert.equal(v.pages?.more, '/en/catalog?page=3&from=1')
  assert.equal(v.pages?.shown, '10 of 19')
  assert.equal(v.pages?.prev, null)
  assert.equal(v.pages?.next, '/en/catalog?page=3')
  const alone: Asked = { facets: {}, sort: 'popular', page: '3' }
  const one = await shownListing(sampleSource(5), 'en', alone)
  assert.ok(one.ok)
  const w = catalogView('en', { title: 'T', lede: null, listing: one.value, asked: alone, at, filters: true, empty: none })
  assert.equal(w.pages?.shown, '11–15 of 19')
  assert.equal(w.pages?.more, '/en/catalog?page=4&from=3')
  assert.equal(w.pages?.prev, '/en/catalog?page=2')
  const end = await shownListing(sampleSource(5), 'en', { facets: {}, sort: 'popular', page: '4', from: '1' })
  assert.ok(end.ok)
  const x = catalogView('en', { title: 'T', lede: null, listing: end.value, asked, at, filters: true, empty: none })
  assert.equal(x.pages?.more, null)
  assert.equal(x.pages?.shown, '19 of 19')
})

/* Кнопка «применить» со счётом (И734) и живые числа у значений (И740):
   источник отдаёт счёт выдачи и граней на выбор — без карточек; надпись —
   числом по правилам языка, ноль — «нет товаров». */
test('count-only listing: the total and the facet counts of a choice, no cards', async () => {
  const r = await sample.listing('ro', { category: 'uleiuri', facets: { putere: ['10'] }, sort: 'popular', page: null, count: true })
  assert.ok(r.ok)
  const full = await sample.listing('ro', { category: 'uleiuri', facets: { putere: ['10'] }, sort: 'popular', page: null })
  assert.ok(full.ok)
  assert.equal(r.value.total, full.value.total)
  assert.deepEqual(r.value.items, [])
  assert.deepEqual(r.value.facets, full.value.facets, 'числа у значений — те же, что у полки на этот выбор')
  assert.equal(showLabel('ro', 1), 'Arată 1 produs')
  assert.equal(showLabel('ro', 6), 'Arată 6 produse')
  assert.equal(showLabel('ro', 24), 'Arată 24 de produse')
  assert.equal(showLabel('en', 0), 'No products')
  const v = catalogView('ro', { title: 'T', lede: null, listing: full.value, asked: { facets: { putere: ['10'] }, sort: 'popular', page: null }, at: (q) => hrefFor('ro', { category: 'uleiuri', ...q }), filters: true, empty: none, counted: { category: 'uleiuri' } })
  assert.equal(v.filters?.live.href, '/api/shelf-count?lang=ro&category=uleiuri')
  assert.equal(v.filters?.live.label, showLabel('ro', full.value.total))
})

/* «6 din 16 produse» (И734): выбор сузил полку — счёт «из» рамки без граней
   покупателя; без выбора второго запроса нет и счёт простой. */
test('a narrowed shelf counts «k of n»; no choice — a plain count and no second ask', async () => {
  const asked: Asked = { facets: { putere: ['10'] }, sort: 'popular', page: null }
  const r = await sample.listing('ro', { category: 'uleiuri', ...asked })
  assert.ok(r.ok)
  const all = await frameTotal(sample, 'ro', asked, { category: 'uleiuri' })
  const shelf = await sample.listing('ro', { category: 'uleiuri', facets: {}, sort: 'popular', page: null })
  assert.ok(shelf.ok)
  assert.equal(all, shelf.value.total)
  assert.ok(r.value.total < shelf.value.total, 'выбор сужает полку')
  const at = (q: Query) => hrefFor('ro', { category: 'uleiuri', ...q })
  const v = catalogView('ro', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none, all })
  assert.equal(v.count, `${r.value.total} din ${all} produse`)
  assert.equal(catalogView('en', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none, all }).count, `${r.value.total} of ${all} products`)
  assert.equal(await frameTotal(sample, 'ro', { facets: {}, sort: 'popular', page: null }, { category: 'uleiuri' }), null)
  const plain = catalogView('ro', { title: 'T', lede: null, listing: r.value, asked, at, filters: true, empty: none, all: r.value.total })
  assert.equal(plain.count, `${r.value.total} produse`, 'равный рамке выбор — простой счёт')
})

/* Длинный список значений (Baymard, Dawn): десять на виду, остальное под
   «Arată toate»; прятать меньше трёх незачем; выбранное в свёртке её раскрывает. */
test('long value lists fold after ten, only when three or more hide, open on a chosen one', () => {
  const vals = (n: number, chosen = -1) => Array.from({ length: n }, (_, i) => ({ code: String(i), name: String(i), count: 1, selected: i === chosen }))
  assert.deepEqual(foldValues(vals(12)).map((x) => x.length), [12, 0])
  assert.deepEqual(foldValues(vals(13)).map((x) => x.length), [10, 3])
  const listing = { items: [], total: 13, page: 1, pages: 1, invalid: [], facets: [{ code: 'putere', name: 'Strength', values: vals(13, 11) }] }
  const v = catalogView('ro', { title: 'T', lede: null, listing, asked: { facets: { putere: ['11'] }, sort: 'popular', page: null }, at: (q) => hrefFor('ro', { catalog: true, ...q }), filters: true, empty: none })
  const f = v.filters?.facets[0]
  assert.equal(f?.values.length, 10)
  assert.deepEqual([f?.fold?.label, f?.fold?.values.length, f?.fold?.open], ['Arată toate (13)', 3, true])
})

/* Фильтр без цены (заказчик 04.10.2026: «удаляй выбор по цене»; cbdin.bg:
   «Категория · Ефект · CBD съдържание · Вид продукт»): цены нет ни на одной
   полке. Общего заголовка «CBD content» нет (заказчик 04.10.2026: «слово
   удаляй»): концентрация и мг — каждая своей группой со своим именем. */
test('the filter has no price on any shelf; concentration and mg stand as their own groups', async () => {
  const all = await sample.listing('en', { facets: {}, sort: 'popular', page: null })
  const oils = await sample.listing('en', { category: 'uleiuri', facets: {}, sort: 'popular', page: null })
  const sleep = await sample.listing('en', { facets: { effect: ['sleep'] }, sort: 'popular', page: null })
  assert.ok(all.ok && oils.ok && sleep.ok)
  for (const l of [all.value, oils.value, sleep.value]) assert.ok(!l.facets.some((f) => f.code === 'price'), 'цены нет')
  const old = await sample.listing('en', { facets: { price: ['100-2000'] }, sort: 'popular', page: null })
  assert.ok(old.ok)
  assert.ok(old.value.invalid.length, 'старая ссылка с ценой — неизвестный фильтр, о нём сказано')
  const at = (q: Query) => hrefFor('en', { catalog: true, ...q })
  const v = catalogView('en', { title: 'T', lede: null, listing: all.value, asked: { facets: {}, sort: 'popular', page: null }, at, filters: true, empty: none })
  assert.equal(v.filters?.facets.find((g) => g.code === 'putere')?.name, 'Strength')
  const three: Facet[] = [
    { code: 'concentration', name: 'Concentration', values: [{ code: '10', name: '10%', count: 2, selected: true }, { code: '20', name: '20%', count: 1, selected: false }] },
    { code: 'content', name: 'CBD in total', bands: true, values: [{ code: '300-600', name: '300–600 mg', count: 3, selected: false }, { code: '900-900', name: '900 mg', count: 1, selected: false }] },
    { code: 'type', name: 'Type', values: [{ code: 'full', name: 'Full spectrum', count: 2, selected: false }, { code: 'broad', name: 'Broad spectrum', count: 2, selected: false }] },
  ]
  const g = catalogView('en', { title: 'T', lede: null, listing: { items: [], total: 4, page: 1, pages: 1, invalid: [], facets: three }, asked: { facets: { concentration: ['10'] }, sort: 'popular', page: null }, at, filters: true, empty: none })
  assert.deepEqual(g.filters?.facets.map((x) => [x.code, x.label]), [['concentration', 'Concentration (1)'], ['content', 'CBD in total'], ['type', 'Type']])
})
