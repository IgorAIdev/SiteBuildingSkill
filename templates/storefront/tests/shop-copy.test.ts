import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LOCALES } from '../lib/locale.ts'
import { categoryCopy, effectCopy, type ShopCopy } from '../lib/content/shop-copy.ts'
import { sample } from '../lib/source/sample/catalog.ts'
import { source } from '../lib/source/index.ts'

const categories = ['oil', 'capsules', 'paste', 'edibles', 'pets', 'vape', 'cosmetics', 'topicals']
const effects = ['sleep', 'relax', 'recovery', 'balance', 'mood-focus', 'womens-health']

test('each active category and effect has complete, distinct localized copy', () => {
  for (const lang of LOCALES) {
    const copies: ShopCopy[] = [
      ...categories.map((code) => categoryCopy(lang, code)),
      ...effects.map((code) => effectCopy(lang, code)),
    ].map((copy) => { assert.ok(copy); return copy })
    for (const copy of copies) {
      assert.ok(copy.heading && copy.title && copy.description && copy.lede)
      assert.ok(copy.sections.length && copy.sections.every((section) => section.heading && section.paragraphs.every(Boolean)))
      assert.ok(copy.faq.title && copy.faq.items.length && copy.faq.items.every((item) => item.q && item.a))
      assert.equal(new Set(copy.faq.items.map((item) => item.q)).size, copy.faq.items.length)
    }
    assert.equal(new Set(copies.map((copy) => copy.title)).size, copies.length)
    assert.equal(new Set(copies.map((copy) => copy.description)).size, copies.length)
    assert.equal(new Set(copies.map((copy) => JSON.stringify(copy.faq.items))).size, copies.length)
  }
})

test('sample category aliases resolve the same copy; unknown routes get no editorial content', async () => {
  for (const lang of LOCALES) {
    for (const [slug, form] of [['uleiuri', 'oil'], ['capsule', 'capsules'], ['cosmetice', 'cosmetics'], ['animale', 'pets']]) {
      assert.equal(categoryCopy(lang, slug), categoryCopy(lang, form))
      const category = await sample.collection(lang, slug)
      assert.ok(category.ok)
      assert.equal(category.value.description, categoryCopy(lang, slug)?.lede)
    }
    assert.equal(categoryCopy(lang, 'future-category'), null)
    assert.equal(effectCopy(lang, 'future-effect'), null)
    assert.equal(effectCopy(lang, '__proto__'), null)
    assert.equal(effectCopy(lang, 'immunity'), null)
  }
})

test('the Vendure consumer uses local editorial copy even when upstream copy exists', async (t) => {
  const previous = process.env.SOURCE
  process.env.SOURCE = 'vendure'
  const env = {
    VENDURE_SHOP_API_URL: 'https://engine.test/shop-api',
    VENDURE_CHANNEL_TOKEN: 'test',
  }
  const saved = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]))
  Object.assign(process.env, env)
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    const { query } = JSON.parse(String(init.body))
    const data = query.includes('activeChannel')
      ? { activeChannel: { defaultLanguageCode: 'bg', availableLanguageCodes: ['bg', 'en'], defaultCurrencyCode: 'EUR' } }
      : query.includes('collections(')
        ? { collections: { items: ['oil', 'future-category'].map((slug) => ({ id: slug, slug: `${slug}-en`, name: slug, description: 'Existing upstream copy', featuredAsset: null, translations: [{ languageCode: 'bg', slug }] })) } }
        : { search: { facetValues: ['sleep', 'future-effect', 'immunity'].map((code) => ({ count: 1, facetValue: { id: code, code, name: code, facet: { id: 'effect', code: 'effect', name: 'Effect' } } })) } }
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  try {
    for (const lang of LOCALES) {
      const collection = await source().collection(lang, 'oil')
      const collections = await source().collections(lang)
      const facets = await source().effects(lang)
      assert.ok(collection.ok && collections.ok && facets.ok)
      assert.equal(collection.value.description, categoryCopy(lang, 'oil')?.lede)
      assert.equal(collections.value.find((item) => item.slug === 'oil')?.description, collection.value.description)
      assert.equal(collections.value.find((item) => item.slug === 'future-category')?.description, 'Existing upstream copy')
      assert.equal(facets.value.find((item) => item.code === 'sleep')?.description, effectCopy(lang, 'sleep')?.lede)
      assert.equal(facets.value.find((item) => item.code === 'future-effect')?.description, '')
      assert.ok(!facets.value.some((item) => item.code === 'immunity'))
    }
  } finally {
    for (const [key, value] of Object.entries({ SOURCE: previous, ...saved })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
