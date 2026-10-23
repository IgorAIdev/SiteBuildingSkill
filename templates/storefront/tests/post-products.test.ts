import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { namedProducts, NAMED_MAX, SHELF_FALLBACK } from '../lib/post-view.ts'
import { runsOf } from '../lib/doc-view.ts'
import { content } from '../lib/source/index.ts'

/* Товары статьи — вариант «В» заказчика 23.10.2026 (research/article-products-2026-10-23.md):
   товар, названный в тексте, — ссылкой там, где назван; в конце текста — повтор названного
   строками, до четырёх; восьми ходовых после вопросов нет. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const page = read('../app/[site]/[lang]/blog/[slug]/page.tsx')

const sec = (body: string, more: Partial<{ list: string[]; note: string; table: { head: string[]; rows: string[][] } }> = {}) => ({ heading: 'H', body, ...more })

test('a product named in the text is a link to the product', () => {
  const runs = runsOf('en', 'choose [isolate](product:ulei-cbd-izolat-10) or broad')
  const link = runs.find((r) => r.href)
  assert.ok(link, 'ссылка есть')
  assert.match(link.href ?? '', /\/en\/product\/ulei-cbd-izolat-10$/)
  assert.equal(link.external, false)
})

test('the article lists what it names, in the order of first mention, once, from body, list, note and table', () => {
  const post = { sections: [
    sec('a [x](product:b) and [y](product:a)'),
    sec('again [x](product:b)', { list: ['[z](product:c)'], note: '[w](product:d)', table: { head: ['h'], rows: [['[v](product:e)']] } }),
  ] }
  assert.deepEqual(namedProducts(post), ['b', 'a', 'c', 'd', 'e'])
  assert.deepEqual(namedProducts({ sections: [sec('no products here, only [a guide](post:x)')] }), [])
})

test('the end block repeats up to four named products; an article naming none shows three of its shelf', () => {
  assert.equal(NAMED_MAX, 4)
  assert.equal(SHELF_FALLBACK, 3)
  assert.match(page, /const named = namedProducts\(post\)\.slice\(0, NAMED_MAX\)/)
  assert.match(page, /<PostProducts title=\{productsTitle\} cards=\{cards\} cart=\{CART\} \/>/)
  assert.doesNotMatch(page, /<Shelf |PRODUCTS_SHOWN/, 'ряда из восьми ходовых после вопросов нет')
})

test('the sample article on the three spectrums names its products', async () => {
  const r = await content().post('en', 'full-spectrum-broad-sau-izolat')
  assert.ok(r.ok)
  assert.deepEqual(namedProducts(r.value), ['ulei-cbd-izolat-10', 'ulei-cbd-full-spectrum'])
})
