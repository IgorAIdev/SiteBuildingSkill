import type { Lang } from '../../locale.ts'
import type { Collection, Source } from '../contract.ts'
import { shopFetch } from './core/request.mjs'
import { EFFECT_FACET, onSite } from '../effect.ts'
import { SHELF_SIGN } from '../../shelf-sign.ts'
import { COUNTS, SEARCH, cardOf, image, nativeSlug, type Channel, type Engine, type Fetched, type SearchData, type VCollection } from './shape.ts'
import { readsOf } from './reads.ts'
import { listingOf } from './listing.ts'
import { productOf } from './product.ts'

/* Торговля из Vendure Shop API (план 4, торговая половина): каталог — этим
   файлом и его соседями, покупка — commerce.ts рядом. Переходник превращает
   ответы движка в ту же форму данных, что у образца (lib/source/contract.ts),
   и ни одного решения о виде в себе не держит (CLAUDE.md, «Переносимость»).

   Разложен по работам (04.10.2026, файл дорос до порога чтения check:code):
   · catalog.ts — подключение, полки, эффекты, карточки, похожие, адреса;
   · shape.ts — форма данных движка: типы, куски запросов, упаковка, карточка;
   · reads.ts — чтения: товары по id, поля граней, соседи линейки, полки;
   · listing.ts — полка: выдача, выбор граней, счёт, порядок граней;
   · product.ts — карта товара и линейка;
   · traits.ts и pool.ts — грани из полей товара и их счёт.

   Что откуда (движок cbdin, Vendure 3.7, снято 25.09.2026):
   · адрес товара — slug на языке канала по умолчанию: он один на все языки
     витрины, а движок находит товар по slug любого своего языка;
   · полка — коллекция верхнего уровня, тем же slug языка канала;
   · грани — грани движка кодами; счёт значения — против всех граней, кроме
     своей (cbd-facet, §3), по товарам полки у себя (pool.ts, И750);
   · прежняя цена — поле товара `wasPrice` (в центах, как всякая цена);
   · упаковка — поля товара `volume` («10ml», «30 capsules») и `strength`
     («1000mg»): числа, а не слова, — строка фактов и грань силы считают их
     одной арифметикой (lib/facts.ts);
   · партии и протоколов у движка нет — `batch: null`, `labReports: []`:
     блок протокола молчит (shop, «Блок, обещающий факт, спрашивает флаг»);
   · отзывов в ядре движка нет — `rating: null`: строки звёзд нет (И512);
     плагин отзывов, когда встанет, отдаёт её сюда.

   Язык витрины, которого у канала нет (у cbdin — bg и en; у витрины — ro,
   en, hu), спрашивается запасным языком `VENDURE_FALLBACK_LANG` (en): иначе
   движок молча ответит языком канала — болгарским на румынской странице. */

/** Сколько секунд ответ движка живёт в кэше страницы. Обновление раньше —
 *  тегом `catalog` через POST /api/revalidate. */
const FRESH = 60

/** Настройки подключения — из окружения сервера, не из браузера. */
export type VendureEnv = { apiUrl: string; channelToken: string; fallbackLang: string }
export function vendureEnv(env: Record<string, string | undefined> = process.env): VendureEnv {
  const apiUrl = env.VENDURE_SHOP_API_URL ?? ''
  const channelToken = env.VENDURE_CHANNEL_TOKEN ?? ''
  if (!apiUrl || !channelToken) throw new Error('SOURCE=vendure: нужны VENDURE_SHOP_API_URL и VENDURE_CHANNEL_TOKEN (.env)')
  return { apiUrl, channelToken, fallbackLang: env.VENDURE_FALLBACK_LANG || 'en' }
}

/** Полка движка в форме данных витрины. */
const collectionOf = (c: Channel, x: VCollection): Collection => ({
  slug: nativeSlug(c, x), name: x.name, description: x.description.replace(/<[^>]*>/g, '').trim(),
  image: image(x.featuredAsset, x.name),
  /* Знак полки — поле коллекции в движке; у Vendure его пока нет (И422),
     знак берётся по имени коллекции (lib/shelf-sign.ts): по адресу на
     любом из языков — на каком языке движок отдал коллекцию, адрес у неё
     другой («oil», «ulei»). */
  sign: [x.slug, ...x.translations.map((tr) => tr.slug)].map((slug) => SHELF_SIGN[slug]).find(Boolean) ?? null,
})

export function vendureSource(env: VendureEnv, fetchImpl: typeof fetch = globalThis.fetch): Source {
  const ask = async <T,>(query: string, variables: Record<string, unknown>, languageCode?: string): Promise<Fetched<T>> =>
    shopFetch({ apiUrl: env.apiUrl, query, variables, channelToken: env.channelToken, languageCode }, { fetch: fetchImpl, init: { next: { revalidate: FRESH, tags: ['catalog'] } } }) as Promise<Fetched<T>>

  let channel: Promise<Channel | null> | null = null
  const channelOf = () => (channel ??= ask<{ activeChannel: Channel }>(`{ activeChannel { defaultLanguageCode availableLanguageCodes defaultCurrencyCode } }`, {})
    .then((r) => (r.ok ? r.data.activeChannel : null))
    .then((c) => { if (!c) channel = null; return c }))
  /** Язык запроса движку: язык страницы, если он у канала есть, иначе запасной. */
  const speak = async (lang: Lang): Promise<string | null> => {
    const c = await channelOf()
    if (!c) return null
    return c.availableLanguageCodes.includes(lang) ? lang : c.availableLanguageCodes.includes(env.fallbackLang) ? env.fallbackLang : c.defaultLanguageCode
  }
  const engine: Engine = { ask, channelOf, speak }
  const reads = readsOf(ask)

  return {
    async collections(lang) {
      const [c, languageCode] = [await channelOf(), await speak(lang)]
      if (!c || !languageCode) return { ok: false, reason: 'unavailable' }
      const list = await reads.collectionsRaw(languageCode)
      return list ? { ok: true, value: list.map((x) => collectionOf(c, x)) } : { ok: false, reason: 'unavailable' }
    },
    async collection(lang, slug) {
      const [c, languageCode] = [await channelOf(), await speak(lang)]
      if (!c || !languageCode) return { ok: false, reason: 'unavailable' }
      const list = await reads.collectionsRaw(languageCode)
      if (!list) return { ok: false, reason: 'unavailable' }
      const x = list.find((y) => nativeSlug(c, y) === slug)
      return x ? { ok: true, value: collectionOf(c, x) } : { ok: false, reason: 'not-found' }
    },
    /* Эффекты — значения грани эффекта из выдачи всего каталога: с товаром
       под ними, в порядке движка. Описания и снимка у значения грани в
       движке нет — пустое описание и null; кадр образца по коду ставит
       lib/source/index.ts, пока свой не даст Payload (план 4). */
    async effects(lang) {
      const [c, languageCode] = [await channelOf(), await speak(lang)]
      if (!c || !languageCode) return { ok: false, reason: 'unavailable' }
      const all = await ask<SearchData>(COUNTS, { input: { groupByProduct: true, take: 0 } }, languageCode)
      if (!all.ok) return { ok: false, reason: 'unavailable' }
      const effects = all.data.search.facetValues.filter((f) => f.facetValue.facet.code === EFFECT_FACET && f.count > 0 && onSite(EFFECT_FACET, f.facetValue.code))
      return { ok: true, value: effects.map((f) => ({ code: f.facetValue.code, name: f.facetValue.name, description: '', image: null })) }
    },
    listing: listingOf(engine, reads),
    async cards(lang, ids) {
      const [c, languageCode] = [await channelOf(), await speak(lang)]
      if (!c || !languageCode) return { ok: false, reason: 'unavailable' }
      const found = await Promise.all(ids.map((id) => reads.bySlug(languageCode, id)))
      if (found.some((r) => !r.ok && r.reason === 'unavailable')) return { ok: false, reason: 'unavailable' }
      return { ok: true, value: found.flatMap((r) => (r.ok ? [cardOf(c, r.value)] : [])) }
    },
    product: productOf(engine, reads),
    async related(lang, id, limit) {
      const [c, languageCode] = [await channelOf(), await speak(lang)]
      if (!c || !languageCode) return { ok: false, reason: 'unavailable' }
      const r = await reads.bySlug(languageCode, id)
      if (!r.ok) return r
      const collectionId = r.value.collections[0]?.id
      if (!collectionId) return { ok: true, value: [] }
      const found = await ask<SearchData>(SEARCH, { input: { groupByProduct: true, collectionId, take: limit + 1 } }, languageCode)
      if (!found.ok) return { ok: false, reason: 'unavailable' }
      const ids = found.data.search.items.map((h) => h.productId).filter((x) => x !== r.value.id).slice(0, limit)
      const products = await reads.productsById(languageCode, ids)
      return products ? { ok: true, value: products.map((p) => cardOf(c, p)) } : { ok: false, reason: 'unavailable' }
    },
    async productIds() {
      const c = await channelOf()
      if (!c) return { ok: false, reason: 'unavailable' }
      type Page = { products: { totalItems: number; items: { slug: string; translations: { languageCode: string; slug: string }[] }[] } }
      const page = (skip: number) => ask<Page>(`query ($skip: Int!) { products(options: { take: 100, skip: $skip }) { totalItems items { slug translations { languageCode slug } } } }`, { skip }, c.defaultLanguageCode)
      /* Первая страница называет число товаров; остальные — разом. */
      const first = await page(0)
      if (!first.ok) return { ok: false, reason: 'unavailable' }
      const rest = await Promise.all(Array.from({ length: Math.ceil(first.data.products.totalItems / 100) - 1 }, (_, i) => page((i + 1) * 100)))
      if (rest.some((r) => !r.ok)) return { ok: false, reason: 'unavailable' }
      const pages = [first, ...rest].flatMap((r) => (r.ok ? r.data.products.items : []))
      return { ok: true, value: pages.map((p) => nativeSlug(c, p)) }
    },
  }
}
