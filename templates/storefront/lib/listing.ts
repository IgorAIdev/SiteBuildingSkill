import type { Lang } from './locale.ts'
import type { Listing, ListingQuery, Result, SortKey, Source } from './source/contract.ts'
import { parseFacetParams } from './source/vendure/core/search.mjs'

export type Params = Record<string, string | string[] | undefined>
/** `from` — с какой страницы полка показана подряд («Показать ещё», И721):
 *  `?page=3&from=1` — страницы с первой по третью одной полкой. */
export type Asked = { facets: Record<string, string[]>; sort: SortKey; page: string | null; from?: string | null }

const SORTS = new Set<SortKey>(['popular', 'newest', 'price-asc', 'price-desc'])
export const first = (v: string | string[] | undefined): string | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null))

/** Номер чистой страницы выдачи — без граней и в порядке по умолчанию: 1, если
 *  не листали, иначе номер листа; `null` — выборка фильтра или сортировки.
 *  Лист 2 и дальше — своя страница для поиска (canonical на себя, Google
 *  pagination guide); редакционный текст полки — только на первом чистом
 *  листе, иначе он повторяется на каждом листе и каждой выборке (И789). */
export function cleanPage(asked: Asked): number | null {
  if (Object.values(asked.facets).some((v) => v.length) || asked.sort !== 'popular') return null
  const n = Number(asked.page)
  return Number.isInteger(n) && n > 1 ? n : 1
}

/** Что спрошено адресом. Номер страницы здесь не толкуется: мусор и «за
 *  концом» — решение источника (404), а не тихая первая страница. */
export function readQuery(params: Params): Asked {
  const sort = first(params.sort)
  return {
    facets: parseFacetParams(params) as Record<string, string[]>,
    sort: SORTS.has(sort as SortKey) ? (sort as SortKey) : 'popular',
    page: first(params.page),
    from: first(params.from),
  }
}

/** Полка, показанная подряд: страницы `from`…`page` одной полкой (`items`) и
 *  номер первого показанного товара (`first`, с единицы) — для строки
 *  «Показано 24 из 96». */
export type Shown = Listing & { from: number; first: number }

/* Больше десяти страниц подряд не собирается: мусорный `from=1` при
   `page=500` — не пятьсот запросов к источнику, а последние десять. */
const RUN = 10

/** «Показать ещё» (И721) — ссылка на следующую страницу с `from`: сервер
 *  отдаёт все страницы с `from` по `page` одной полкой, ссылка остаётся
 *  настоящим адресом (без скрипта — обычный переход, поисковику — обычная
 *  страница). Сломанный `from` (не число, за `page`) не ошибка: полка —
 *  одна страница `page`, как без него. Источник не знает о «показать ещё»
 *  ничего: он отдаёт страницы, склеивает их здесь страница маршрута. */
export async function shownListing(src: Source, lang: Lang, asked: ListingQuery & { from?: string | null }): Promise<Result<Shown>> {
  const { from: rawFrom, ...query } = asked
  const r = await src.listing(lang, query)
  if (!r.ok) return r
  const { page, pages, total, items } = r.value
  const start = Number(rawFrom)
  const from = Number.isInteger(start) && start >= 1 && start < page ? Math.max(start, page - RUN + 1) : page
  const before = from < page ? await Promise.all(Array.from({ length: page - from }, (_, i) => src.listing(lang, { ...query, page: String(from + i) }))) : []
  if (before.some((b) => !b.ok)) return { ok: true, value: { ...r.value, from: page, first: firstOf(page, pages, total, items.length) } }
  const head = before.flatMap((b) => (b.ok ? b.value.items : []))
  /* Страница `from` — не последняя (за ней стоит `page`), значит полная: её
     длина и есть размер страницы. */
  const size = before[0]?.ok ? before[0].value.items.length : 0
  return { ok: true, value: { ...r.value, items: [...head, ...items], from, first: from < page ? (from - 1) * size + 1 : firstOf(page, pages, total, items.length) } }
}

/** Номер первого товара одной страницы: у не последней размер страницы — её
 *  длина; последняя кончается на `total`. */
const firstOf = (page: number, pages: number, total: number, length: number) => (page < pages ? (page - 1) * length + 1 : Math.max(1, total - length + 1))

/** Сколько товаров в рамке страницы без граней покупателя — для «6 din 16
 *  produse» (И734). Граней нет — null: счёт полки и есть рамка, второго
 *  запроса не нужно. Рамка — полка (`category`) или грани, которые страница
 *  держит сама (эффект); источник отдаёт только счёт (`count`). Источник
 *  молчит — null, и строка остаётся простым счётом. */
export async function frameTotal(src: Source, lang: Lang, asked: Asked, frame: { category?: string; facets?: Record<string, string[]> } = {}): Promise<number | null> {
  if (!Object.keys(asked.facets).length) return null
  const r = await src.listing(lang, { category: frame.category, facets: frame.facets ?? {}, sort: 'popular', page: null, count: true })
  return r.ok ? r.value.total : null
}
