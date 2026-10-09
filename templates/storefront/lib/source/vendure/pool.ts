import type { Ask } from './shape.ts'

/* Счёт граней движка у себя (И740): выбор граней переходника (концентрация,
   содержание, тип — traits.ts) поиск движка не знает, и его счёт значений
   «Effect» шёл мимо выбранных 10 %. Поэтому товары полки — рамка — берутся с
   их значениями граней (`facetValueIds`), и значения граней движка считаются
   здесь — «против всех граней, кроме своей» (cbd-facet, §3). Та же рамка
   даёт значения граней переходника (traits.ts). Запрос передаёт источник
   (`ask`). */

/** Грань полок движка cbdin — «Shelf» (`category`): та же полка, что коллекция;
 *  в фильтре первая и словом сайта «Categories» (catalog-view.ts). */
export const SHELF_FACET = 'category'
/* Товары полки с их значениями граней: счёт граней движка у себя, когда выбрана
   грань переходника (концентрация, тип), — поиск движка её не знает. */
const POOL = `query ($input: SearchInput!) { search(input: $input) { totalItems items { productId facetValueIds } } }`
type PoolData = { search: { totalItems: number; items: { productId: string; facetValueIds: string[] }[] } }
/** Товары полки с их значениями граней — страницами по сто (поиск движка
 *  больше ста за раз не отдаёт; не дальше тысячи); у CBD-магазина полка —
 *  десятки товаров. Первая страница называет, сколько всего, остальные
 *  спрашиваются разом. */
const TAKE = 100
const MOST = 1000
export async function poolOf(ask: Ask, input: Record<string, unknown>, languageCode: string): Promise<PoolData['search']['items'] | null> {
  const page = (skip: number) => ask<PoolData>(POOL, { input: { ...input, take: TAKE, skip } }, languageCode)
  const first = await page(0)
  if (!first.ok) return null
  const more = Math.ceil(Math.min(first.data.search.totalItems, MOST) / TAKE) - 1
  const rest = await Promise.all(Array.from({ length: Math.max(0, more) }, (_, i) => page((i + 1) * TAKE)))
  const items: PoolData['search']['items'] = [...first.data.search.items]
  for (const r of rest) {
    if (!r.ok) return null
    items.push(...r.data.search.items)
  }
  return items
}
type Known = { id: string; code: string; name: string; facet: { id: string; code: string; name: string } }
/** Счёт значений граней движка у себя: для грани — товары, прошедшие выбор всех
 *  ДРУГИХ граней (внутри грани «или», между гранями «и»), по её значениям. */
export function countedHere(codes: string[], known: Known[], real: Record<string, string[]>, dictionary: Record<string, Record<string, string>>, hits: PoolData['search']['items']) {
  const idsOf = (code: string) => (real[code] ?? []).map((v) => dictionary[code]?.[v]).filter((x): x is string => Boolean(x))
  return codes.map((code) => {
    const others = Object.keys(real).filter((k) => k !== code && idsOf(k).length)
    const pass = hits.filter((h) => others.every((k) => idsOf(k).some((id) => h.facetValueIds.includes(id))))
    return known.filter((v) => v.facet.code === code).map((v) => ({ count: pass.filter((h) => h.facetValueIds.includes(v.id)).length, facetValue: v }))
  })
}
