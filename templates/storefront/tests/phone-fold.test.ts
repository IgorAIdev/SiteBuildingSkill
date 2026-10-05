import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sampleSource } from '../lib/source/sample/catalog.ts'
import { catalogView } from '../lib/catalog-view.ts'
import { hrefFor, type Query } from '../lib/href.ts'
import type { Asked } from '../lib/listing.ts'
import type { Listing } from '../lib/source/contract.ts'
import { PAGE_SIZE, PHONE_FIRST } from '../lib/source/page.ts'

/* Полка на телефоне шагами (И754): страница и адреса — те же 60, а видно 24,
   и каждое «Показать ещё» добавляет ещё 24 — 24 → 48 → 72 → 85; кончились
   загруженные — шаг дописывает следующую страницу. Заказчик 05.10.2026: «на
   тлф сразу 60 — не много ли?», затем «до нажатия 24, после — 60, а с чего
   60? логика какая?». Baymard — 15–30 на телефоне. */
const none = { title: '', step: '', href: '' }
const at = (q: Query) => hrefFor('en', { catalog: true, ...q })
const asked: Asked = { facets: {}, sort: 'popular', page: null }

/** Полка в `n` товаров на странице из `total` — из образца, карточки размножены. */
async function shelf(n: number, total: number, page = 1): Promise<Listing> {
  const r = await sampleSource(PAGE_SIZE).listing('en', asked)
  assert.ok(r.ok)
  const items = Array.from({ length: n }, (_, i) => ({ ...r.value.items[i % r.value.items.length], id: `p${i}` }))
  return { ...r.value, items, total, page, pages: Math.ceil(total / PAGE_SIZE) }
}

test('the phone shelf steps by 24 and loads the next page when the loaded run ends', async () => {
  const v = catalogView('en', { title: 'T', lede: null, listing: await shelf(60, 85), asked, at, filters: true, empty: none })
  assert.equal(PHONE_FIRST, 24)
  assert.equal(v.fold?.start, 24)
  assert.equal(v.fold?.step, 24)
  assert.equal(v.fold?.total, 85)
  assert.equal(v.fold?.next, '/en/catalog?page=2&from=1')
  assert.equal(v.fold?.shown.replace('{k}', '48'), '48 of 85')
  assert.equal(v.fold?.loaded, 60)
  /* Адрес полки без страницы — одна свёртка на все дописанные страницы. */
  assert.equal(v.fold?.at, '/en/catalog')
})

test('a reloaded «Show more» address shows all it asked for; the last page has no next', async () => {
  const listing = { ...(await shelf(85, 85, 2)), from: 1, first: 1 }
  const v = catalogView('en', { title: 'T', lede: null, listing, asked: { ...asked, page: '2' }, at, filters: true, empty: none })
  assert.equal(v.fold?.start, 85)
  assert.equal(v.fold?.next, null)
  assert.equal(v.fold?.at, '/en/catalog')
})

test('a shelf up to 24 has no fold; a later page opened directly pages as before', async () => {
  const small = catalogView('en', { title: 'T', lede: null, listing: await shelf(24, 24), asked, at, filters: true, empty: none })
  assert.equal(small.fold, null)
  const later = catalogView('en', { title: 'T', lede: null, listing: await shelf(25, 85, 2), asked: { ...asked, page: '2' }, at, filters: true, empty: none })
  assert.equal(later.fold, null)
  assert.ok(later.pages)
})

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('each press adds one step, never the rest of the page', () => {
  const fold = read('../components/FoldShelf.tsx')
  assert.match(fold, /const want = count \+ fold\.step/)
  assert.match(fold, /if \(want > fold\.loaded && next\) load\(\(\) => router\.push\(next, \{ scroll: false \}\)\)/)
  const grid = read('../components/FoldGrid.tsx')
  assert.match(grid, /'data-past': i >= count \? '' : undefined/)
})

test('cards past the step hide only in the narrow shelf box; the page pager steps aside there', () => {
  const css = read('../components/Catalog.module.css')
  assert.match(css, /@container \(max-width:559px\)\{\s*\.shelf\[data-fold\] > \[data-past\]\{display:none\}/)
  assert.match(css, /\.area\{[^}]*container-type:inline-size/)
  /* На телефоне в строке листания — номера, шаг на 24 и счёт показанного; «Показать
     ещё» страницы и её счёт уступают (заказчик: «как в десктопе — и страницы, и show
     more, и 24 of 85»). */
  const pager = read('../components/Pagination.module.css')
  assert.match(pager, /:has\(> \* > \[data-fold\]\) > \.pages \.row > :is\(\.next, \.count\)\{display:none\}/)
  assert.doesNotMatch(pager, /\.pages\{display:none\}/)
  assert.doesNotMatch(pager, /:has\(> \* > \[data-fold\]\)[^{]*:is\([^)]*\.steps/)
})
