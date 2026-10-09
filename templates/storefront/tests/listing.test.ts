import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readQuery, shownListing } from '../lib/listing.ts'
import { sampleSource } from '../lib/source/sample/catalog.ts'

test('the address says which facets, sort and page; junk sort falls back, the page stays raw for the source to judge', () => {
  assert.deepEqual(readQuery({ 'facet.forma': ['ulei', 'capsule'], sort: 'price-asc', page: '2' }), { facets: { forma: ['ulei', 'capsule'] }, sort: 'price-asc', page: '2', from: null })
  assert.deepEqual(readQuery({ 'facet.putere': '10,20' }).facets, { putere: ['10', '20'] })
  assert.deepEqual(readQuery({ sort: 'cheap' }), { facets: {}, sort: 'popular', page: null, from: null })
  assert.equal(readQuery({ sort: 'newest' }).sort, 'newest')
  assert.equal(readQuery({ page: 'abc' }).page, 'abc')
})

/* «Показать ещё» (И721): `?page=3&from=1` — три страницы одной полкой; сломанный
   `from` не ошибка, а одна страница; номер первого показанного — для строки счёта. */
test('show more glues the pages from `from` to `page` into one shelf', async () => {
  const src = sampleSource(5)
  const run = await shownListing(src, 'en', { facets: {}, sort: 'popular', page: '3', from: '1' })
  assert.ok(run.ok)
  assert.equal(run.value.items.length, 15)
  assert.deepEqual([run.value.from, run.value.first, run.value.page], [1, 1, 3])
  const one = await shownListing(src, 'en', { facets: {}, sort: 'popular', page: '3', from: 'x' })
  assert.ok(one.ok)
  assert.deepEqual([one.value.items.length, one.value.from, one.value.first], [5, 3, 11])
  const late = await shownListing(src, 'en', { facets: {}, sort: 'popular', page: '2', from: '4' })
  assert.ok(late.ok)
  assert.deepEqual([late.value.items.length, late.value.from], [5, 2])
  const last = await shownListing(src, 'en', { facets: {}, sort: 'popular', page: '4', from: null })
  assert.ok(last.ok)
  assert.deepEqual([last.value.items.length, last.value.first, last.value.total], [4, 16, 19])
})
