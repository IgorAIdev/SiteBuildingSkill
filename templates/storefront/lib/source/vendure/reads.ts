import type { Result } from '../contract.ts'
import { traitOf, type Trait } from './traits.ts'
import { ASSET, PRODUCT, SEARCH, type Ask, type SearchData, type Translation, type VCollection, type VProduct } from './shape.ts'

/* Чтения из движка — запросы, которые берут полка (listing.ts), карта товара
   (product.ts) и сборка (catalog.ts). Каждое знает свой запрос и что делать,
   когда движок молчит; решений о виде здесь нет. */

/** Сосед по полке для линейки (И503): имя, адрес, поля силы и меры, наличие. */
export type VMate = { id: string; name: string; slug: string; translations: Translation[]; customFields: VProduct['customFields']; variants: { stockLevel: string }[] }

export function readsOf(ask: Ask) {
  /** Товары движка по id — одним запросом, в порядке ids. */
  const productsById = async (languageCode: string, ids: string[]): Promise<VProduct[] | null> => {
    if (!ids.length) return []
    const r = await ask<{ products: { items: VProduct[] } }>(`query ($ids: [String!]!, $take: Int) { products(options: { filter: { id: { in: $ids } }, take: $take }) { items { ${PRODUCT} } } }`, { ids, take: ids.length }, languageCode)
    if (!r.ok) return null
    const byId = new Map(r.data.products.items.map((p) => [p.id, p]))
    return ids.flatMap((id) => byId.get(id) ?? [])
  }
  /** Поля товаров для граней переходника (traits.ts): все товары канала
   *  постранично по сто, один запрос на страницу, кэш — как у остального
   *  каталога. Не ответил движок или у него нет этих полей — `null`, и граней
   *  нет, а каталог стоит как стоял. */
  const traitsOf = async (languageCode: string): Promise<Map<string, Trait> | null> => {
    type Row = Parameters<typeof traitOf>[0] & { id: string }
    const pages = await Promise.all([0, 100, 200, 300, 400].map((skip) => ask<{ products: { items: Row[] } }>(`query { products(options: { take: 100, skip: ${skip} }) { items { id facetValues { code facet { code } } customFields { volume strength spectrumKey dropsPerMl applicatorMl } } } }`, {}, languageCode)))
    const out = new Map<string, Trait>()
    for (const r of pages) {
      /* Ответ не того вида (нет списка товаров) — то же «не ответил»: граней нет. */
      if (!r.ok || !Array.isArray(r.data?.products?.items)) return null
      for (const p of r.data.products.items) out.set(p.id, traitOf(p))
    }
    return out
  }
  /** Товары линейки (И503) — соседи по полке: у магазина отдельный товар
   *  на каждую силу и меру, и сила стоит в имени («CBD масло 10% …»), так
   *  что имя линейки считает `lineOf`, а движок отдаёт полку целиком. Молчит
   *  движок — линейки нет, страница стоит одна, а не падает. */
  const shelfMates = async (languageCode: string, collectionId: string): Promise<VMate[]> => {
    const found = await ask<SearchData>(SEARCH, { input: { groupByProduct: true, collectionId, take: 100 } }, languageCode)
    if (!found.ok) return []
    const ids = found.data.search.items.map((h) => h.productId)
    if (!ids.length) return []
    const r = await ask<{ products: { items: VMate[] } }>(`query ($ids: [String!]!, $take: Int) { products(options: { filter: { id: { in: $ids } }, take: $take }) { items { id name slug translations { languageCode slug } customFields { brand volume strength } variants { stockLevel } } } }`, { ids, take: ids.length }, languageCode)
    return r.ok ? r.data.products.items : []
  }
  const bySlug = async (languageCode: string, slug: string): Promise<Result<VProduct>> => {
    const r = await ask<{ product: VProduct | null }>(`query ($slug: String!) { product(slug: $slug) { ${PRODUCT} } }`, { slug }, languageCode)
    if (!r.ok) return { ok: false, reason: 'unavailable' }
    return r.data.product ? { ok: true, value: r.data.product } : { ok: false, reason: 'not-found' }
  }
  const collectionsRaw = async (languageCode: string): Promise<VCollection[] | null> => {
    const r = await ask<{ collections: { items: VCollection[] } }>(`{ collections(options: { topLevelOnly: true, take: 100 }) { items { id slug name description featuredAsset { ${ASSET} } translations { languageCode slug } } } }`, {}, languageCode)
    return r.ok ? r.data.collections.items : null
  }
  /** «Newest» (И709): поиск движка порядка по дате не знает (только имя и цена),
   *  поэтому место товара по новизне — из `products` по дате создания, сто за
   *  запрос, как поля граней; выдача поиска сводится по нему в переходнике.
   *  Не ответил движок — `null`, и полка «недоступна», а не тихо в другом порядке. */
  const newestOf = async (languageCode: string): Promise<Map<string, number> | null> => {
    const pages = await Promise.all([0, 100, 200, 300, 400].map((skip) => ask<{ products: { items: { id: string }[] } }>(`query { products(options: { sort: { createdAt: DESC }, take: 100, skip: ${skip} }) { items { id } } }`, {}, languageCode)))
    const out = new Map<string, number>()
    for (const r of pages) {
      if (!r.ok) return null
      for (const p of r.data.products.items) out.set(p.id, out.size)
    }
    return out
  }
  return { productsById, traitsOf, shelfMates, bySlug, collectionsRaw, newestOf }
}
export type Reads = ReturnType<typeof readsOf>
