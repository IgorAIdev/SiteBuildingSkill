import type { Lang } from '../../locale.ts'
import type { Facet, Listing, ListingQuery, Result, SortKey } from '../contract.ts'
import { onSite } from '../effect.ts'
import { facetValueFilters, pageVariables, pageCount } from './core/search.mjs'
import { PAGE_SIZE } from '../page.ts'
import { VIRTUAL, chosen, virtualFacets } from './traits.ts'
import { SHELF_FACET, countedHere, poolOf } from './pool.ts'
import { COUNTS, SEARCH, cardOf, nativeSlug, type Engine, type SearchData } from './shape.ts'
import type { Reads } from './reads.ts'
import { BIND, RANGE, num } from '../../format.ts'
import { t } from '../../i18n/index.ts'

/* Полка движка: выдача, выбор граней, счёт значений и порядок граней в
   фильтре. Грани движка — его кодами; значения — все, что есть в рамке (полка
   без выбора покупателя), с нулём, когда выбор их не находит; счёт значения —
   против всех граней, кроме своей (cbd-facet, §3), у себя по товарам рамки
   (pool.ts). Грани из полей товара
   (концентрация, содержание, тип, цена) поиск движка не знает — их выбор и
   счёт делает переходник (traits.ts). */

type Paging = { ok: true; page: number; take: number; skip: number } | { ok: false }
type Filter = { and: string } | { or: string[] }

/* Страница полки — одно число на оба источника (`PAGE_SIZE`, И732). */
const PAGE = PAGE_SIZE
const SORT: Record<SortKey, Record<string, 'ASC' | 'DESC'> | undefined> = { popular: undefined, newest: undefined, 'price-asc': { price: 'ASC' }, 'price-desc': { price: 'DESC' } }

export function listingOf({ ask, channelOf, speak }: Engine, reads: Reads) {
  return async (lang: Lang, query: ListingQuery): Promise<Result<Listing>> => {
    const paging = pageVariables({ page: query.page ?? undefined }, { pageSize: PAGE }) as Paging
    if (!paging.ok) return { ok: false, reason: 'bad-request' }
    const [c, languageCode] = [await channelOf(), await speak(lang)]
    if (!c || !languageCode) return { ok: false, reason: 'unavailable' }
    let collectionId: string | undefined
    if (query.category) {
      const list = await reads.collectionsRaw(languageCode)
      if (!list) return { ok: false, reason: 'unavailable' }
      collectionId = list.find((y) => nativeSlug(c, y) === query.category)?.id
      if (!collectionId) return { ok: false, reason: 'not-found' }
    }
    const base = { groupByProduct: true, ...(collectionId ? { collectionId } : {}), ...(query.q?.trim() ? { term: query.q.trim() } : {}) }
    /* Словарь «код → id» — из граней той же выборки без фильтров: коды
       стабильны, id у разработки и боя разные (references/vendure.md). */
    const all = await ask<SearchData>(COUNTS, { input: { ...base, take: 0 } }, languageCode)
    if (!all.ok) return { ok: false, reason: 'unavailable' }
    const known = all.data.search.facetValues.map((f) => f.facetValue)
    const dictionary: Record<string, Record<string, string>> = {}
    for (const v of known) (dictionary[v.facet.code] ??= {})[v.code] = v.id
    const filtered = (facets: Record<string, string[]>) => facetValueFilters(facets, dictionary) as unknown as { filters: Filter[]; invalid: string[] }
    /* Грани из полей товара поиск движка не знает: выбор по ним — ниже, в
       переходнике (traits.ts). */
    const real = Object.fromEntries(Object.entries(query.facets).filter(([k]) => !(VIRTUAL as readonly string[]).includes(k)))
    const picked = Object.fromEntries(VIRTUAL.map((k) => [k, query.facets[k] ?? []])) as Record<(typeof VIRTUAL)[number], string[]>
    const { filters, invalid } = filtered(real)
    const sort = SORT[query.sort] ? { sort: SORT[query.sort] } : {}
    /* Признаки товаров — у любой полки, все грани скелета (И742): «Все товары» и
       эффект показывают и содержание CBD (процентами у масел и пасты, мг у
       остального), и вид экстракта (слово заказчика 04.10.2026: «вид / тип
       продукта нужно выбирать… и CBD содержание»; цену он снял тем же вечером). */
    const traits = await reads.traitsOf(languageCode)
    const age = query.sort === 'newest' ? await reads.newestOf(languageCode) : null
    if (query.sort === 'newest' && !age) return { ok: false, reason: 'unavailable' }
    const scope = traits || age ? await ask<SearchData>(SEARCH, { input: { ...base, facetValueFilters: filters, take: 100, ...sort } }, languageCode) : null
    if (age && !scope?.ok) return { ok: false, reason: 'unavailable' }
    const hits = scope?.ok ? scope.data.search.items.map((h) => h.productId) : null
    const rank = (id: string) => age?.get(id) ?? Number.MAX_SAFE_INTEGER
    const scopeIds = hits && age ? [...hits].sort((a, b) => rank(a) - rank(b)) : hits
    /* Рамка — товары полки без выбора покупателя с их значениями граней
       (pool.ts): по ней стоят значения граней переходника, и по ней же
       считаются грани движка — без запроса на каждую грань. */
    const frame = traits ? await poolOf(ask, base, languageCode) : undefined
    if (frame === null) return { ok: false, reason: 'unavailable' }
    const own = (traits && scopeIds && frame ? virtualFacets(scopeIds, traits, picked, {
      concentration: t(lang, 'facet.concentration'), content: t(lang, 'facts.total'), type: t(lang, 'facet.type'),
      types: { full: t(lang, 'type.full'), broad: t(lang, 'type.broad'), isolate: t(lang, 'type.isolate'), raw: t(lang, 'type.raw') },
      mg: (lo, hi) => `${lo === hi ? num(lang, lo) : `${num(lang, lo)}${RANGE}${num(lang, hi)}`}${BIND}mg`,
    }, frame.map((h) => h.productId)) : [])
    const narrowed = traits && scopeIds && VIRTUAL.some((k) => picked[k].length) ? chosen(scopeIds, traits, picked) : null
    let total: number
    let ids: string[]
    if (narrowed) { total = narrowed.length; ids = narrowed.slice(paging.skip, paging.skip + paging.take) }
    else if (age && scopeIds) { total = scopeIds.length; ids = scopeIds.slice(paging.skip, paging.skip + paging.take) }
    else {
      const found = await ask<SearchData>(SEARCH, { input: { ...base, facetValueFilters: filters, take: paging.take, skip: paging.skip, ...sort } }, languageCode)
      if (!found.ok) return { ok: false, reason: 'unavailable' }
      total = found.data.search.totalItems
      ids = found.data.search.items.map((h) => h.productId)
    }
    const pages = pageCount(total, PAGE) as number
    if (paging.page > pages) return { ok: false, reason: 'not-found' }
    /* Счёт значения — против всех граней, КРОМЕ своей (cbd-facet, §3): по
       рамке у себя (pool.ts); нет у движка полей товара — запросом на грань. */
    const codes = [...new Set(known.map((v) => v.facet.code))]
    const counted = frame && traits ? countedHere(codes, known, real, dictionary, frame.filter((h) => chosen([h.productId], traits, picked).length)) : await Promise.all(codes.map(async (code) => {
      const others = Object.fromEntries(Object.entries(real).filter(([k]) => k !== code))
      const r = await ask<SearchData>(COUNTS, { input: { ...base, facetValueFilters: filtered(others).filters, take: 0 } }, languageCode)
      return r.ok ? r.data.search.facetValues.filter((f) => f.facetValue.facet.code === code) : null
    }))
    if (counted.some((x) => x === null)) return { ok: false, reason: 'unavailable' }
    const facets: Facet[] = codes.map((code, i) => {
      const first = known.find((v) => v.facet.code === code)!
      const facet: Facet = {
        code, name: first.facet.name,
        values: known.filter((v) => v.facet.code === code && onSite(code, v.code)).map((v) => ({
          code: v.code, name: v.name,
          count: counted[i]!.find((f) => f.facetValue.id === v.id)?.count ?? 0,
          selected: (query.facets[code] ?? []).includes(v.code),
        })),
      }
      if (code === SHELF_FACET) facet.shelf = true
      return facet
    })
    /* Порядок граней — скелет фильтра (И742): концентрация, мг и вид
       экстракта, за ними грани движка (полка, эффект). */
    const ordered = [...own, ...facets]
    if (query.count) return { ok: true, value: { items: [], total, page: 1, pages: 1, facets: ordered, invalid } } // только счёт: без карточек
    const products = await reads.productsById(languageCode, ids)
    if (!products) return { ok: false, reason: 'unavailable' }
    return { ok: true, value: { items: products.map((p) => cardOf(c, p)), total, page: paging.page, pages, facets: ordered, invalid } }
  }
}
