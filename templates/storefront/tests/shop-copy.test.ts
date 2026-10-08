import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LOCALES } from '../lib/locale.ts'
import { categoryCopy, effectCopy, type ShopCopy } from '../lib/content/shop-copy.ts'
import { sample } from '../lib/source/sample/catalog.ts'
import { source } from '../lib/source/index.ts'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

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
      assert.equal(category.value.description, categoryCopy(lang, slug)?.caption)
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
      assert.equal(collection.value.description, categoryCopy(lang, 'oil')?.caption)
      assert.equal(collections.value.find((item) => item.slug === 'oil')?.description, collection.value.description)
      assert.equal(collections.value.find((item) => item.slug === 'future-category')?.description, 'Existing upstream copy')
      assert.equal(facets.value.find((item) => item.code === 'sleep')?.description, effectCopy(lang, 'sleep')?.caption)
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

/* Текст страницы проверяется навыком seo-content (scripts/lint-copy.mjs): запрос
   покупателя в title/H1 и над сеткой, без эха сниппета, без оговорок и
   состояний здоровья на продающей странице, без литерала валюты; FAQ — по
   норме проекта (главная 6–8, полка 5–10). Навык ставится в .claude/skills
   вместе с витриной. */
const LINT = ['.claude/skills/seo-content/scripts/lint-copy.mjs', '.agents/skills/seo-content/scripts/lint-copy.mjs']
  .map((p) => fileURLToPath(new URL('../' + p, import.meta.url))).find((p) => existsSync(p))
const PROFILE = { faq: { home: [6, 8], category: [5, 10], hub: [5, 10] } }

test('every category, moment hub and home text passes the seo-content copy check', async () => {
  assert.ok(LINT, 'навык seo-content не установлен рядом с витриной — проверке текста нечем работать')
  const { lintPages } = await import(pathToFileURL(LINT).href)
  const shop = JSON.parse(readFileSync(new URL('../lib/content/shop-copy.json', import.meta.url), 'utf8'))
  const home = JSON.parse(readFileSync(new URL('../lib/content/home-copy.json', import.meta.url), 'utf8'))
  const pages: object[] = []
  for (const [kind, type] of [['categories', 'category'], ['effects', 'hub']]) {
    for (const [code, langs] of Object.entries(shop[kind] as Record<string, Record<string, object>>)) {
      for (const [lang, copy] of Object.entries(langs)) pages.push({ id: `${type}:${code}`, lang, type, level: 'A', ...copy })
    }
  }
  for (const lang of LOCALES) {
    const h = home[lang]
    pages.push({ id: 'home', lang, type: 'home', level: 'A', query: h.query, title: h.title, description: h.description, heading: h.hero.title, lede: h.hero.lede, sections: [{ heading: h.story.title, paragraphs: h.story.body.split('\n\n') }], faq: h.faq })
  }
  const fails = (lintPages(pages, { profile: PROFILE }) as { level: string; family: string; lang: string; id: string; field: string; message: string }[])
    .filter((f) => f.level === 'fail')
  assert.deepEqual(fails.map((f) => `${f.family} ${f.lang} ${f.id} ${f.field}: ${f.message}`), [])
})

test('category and hub names, tile captions and links come from the editorial copy', async () => {
  for (const lang of LOCALES) {
    for (const code of [...categories, ...effects]) {
      const copy = categoryCopy(lang, code) ?? effectCopy(lang, code)
      assert.ok(copy?.name && copy.caption && copy.query?.primary, `${lang}/${code}: нет имени, подписи плитки или запроса`)
      assert.notEqual(copy.caption, copy.lede); assert.notEqual(copy.description, copy.lede)
      assert.ok(copy.links?.length, `${lang}/${code}: нет ссылок на гиды`)
    }
    const shelves = await sample.collections(lang)
    assert.ok(shelves.ok)
    const oil = shelves.value.find((c) => categoryCopy(lang, c.slug) === categoryCopy(lang, 'oil'))
    assert.equal(oil?.name, categoryCopy(lang, 'oil')?.name)
  }
})

test('the effect filter names its values like the moment hubs', async () => {
  for (const lang of LOCALES) {
    const r = await sample.listing(lang, { facets: {}, sort: 'popular', page: null })
    assert.ok(r.ok)
    const effect = r.value.facets.find((f) => f.code === 'effect')
    const sleep = effect?.values.find((v) => v.code === 'sleep')
    if (sleep) assert.equal(sleep.name, effectCopy(lang, 'sleep')?.name)
  }
})

test('paged lists keep their own canonical page; the shelf text stands only on the clean first page', async () => {
  const { cleanPage } = await import('../lib/listing.ts')
  const base = { facets: {}, sort: 'popular' as const, page: null }
  assert.equal(cleanPage(base), 1)
  assert.equal(cleanPage({ ...base, page: '3' }), 3)
  assert.equal(cleanPage({ ...base, page: 'x' }), 1)
  assert.equal(cleanPage({ ...base, facets: { effect: ['sleep'] } }), null)
  assert.equal(cleanPage({ ...base, facets: { effect: [] } }), 1)
  assert.equal(cleanPage({ ...base, sort: 'price-asc' }), null)
})
