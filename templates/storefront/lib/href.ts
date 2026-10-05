import type { Lang } from './locale.ts'
import type { SortKey } from './source/contract.ts'
import type { Step } from './checkout-steps.ts'

/** `from` — с какой страницы полка показана подряд («Показать ещё», И721); пишется, только когда раньше `page`. */
export type Query = { page?: number; from?: number; facets?: Record<string, string[]>; sort?: SortKey }
type To =
  | { home: true }
  | ({ catalog: true } & Query)
  | ({ category: string } & Query)
  | ({ effect: string } & Query)
  | { product: string; options?: Record<string, string>; choose?: boolean }
  | { search: string; page?: number; from?: number }
  | { doc: string }
  | { blog: true }
  /** Рубрика блога — своя страница (И749). */
  | { blogTopic: string }
  | { post: string }
  | { cart: true; result?: string }
  | { saved: string[] }
  | { checkout: Step | 'done'; city?: string }
  /** Отказ от договора (OUG 34/2014; кнопка «Retrageți-vă din contract aici»,
   *  с 19.06.2026 — ст. 11a Директивы 2011/83): страница формы, И748. */
  | { withdraw: true }
  /** Кабинет покупателя (И771): `home` — вход или кабинет, `register` —
   *  создание, `password` — сброс (с `token` из письма — новый пароль),
   *  `verify` — подтверждение адреса по `token`, `addresses` — адреса.
   *  `next` — куда вернуться после входа (свой путь, lib/account-form.ts);
   *  `edit` — открытая правка адреса (`new` — новый). */
  | { account: 'home' | 'register' | 'password' | 'verify' | 'addresses'; token?: string; next?: string; edit?: string }
  /** Заказ в кабинете — по коду. */
  | { order: string }

type Pair = [string, string]
/* Слаг и id — ОДИН сегмент пути, и кодируется он здесь же: из живого
   источника придёт «uleiuri și creme» или «olaj/10», и пробел, буква с
   надстрочным знаком или косая черта иначе ломали бы адрес или делили его на
   два сегмента. Латинский слаг из образца не меняется. */
const seg = (s: string) => encodeURIComponent(s)
const withQuery = (path: string, params: Pair[]) => {
  const q = new URLSearchParams(params).toString()
  return q ? `${path}?${q}` : path
}
const pageParam = (page?: number, from?: number): Pair[] => [
  ...(page && page > 1 ? [['page', String(page)] as Pair] : []),
  ...(page && from && from < page ? [['from', String(from)] as Pair] : []),
]
const shelfParams = (q: Query): Pair[] => [
  ...Object.entries(q.facets ?? {})
    .filter(([, values]) => values.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, values]): Pair => [`facet.${code}`, values.join(',')]),
  ...(q.sort && q.sort !== 'popular' ? [['sort', q.sort] as Pair] : []),
  ...pageParam(q.page, q.from),
]

/** Одна функция адреса (references/payload.md, «Одна функция адреса»): из
 *  неё ссылки, карта сайта, canonical и hreflang. Склейка адреса в другом
 *  месте — дефект: такой клей однажды отдал в карту 84 несуществующих адреса. */
export function hrefFor(lang: Lang, to: To): string {
  if ('home' in to) return `/${lang}`
  if ('catalog' in to) return withQuery(`/${lang}/catalog`, shelfParams(to))
  if ('category' in to) return withQuery(`/${lang}/catalog/${seg(to.category)}`, shelfParams(to))
  if ('effect' in to) return withQuery(`/${lang}/effect/${seg(to.effect)}`, shelfParams(to))
  if ('product' in to) {
    const opts = Object.entries(to.options ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]): Pair => [`option.${k}`, v])
    /* `choose=1` — покупатель нажал «в корзину», не выбрав варианта: карта
       товара покажет «Choose an option» у групп выбора (lib/variant.ts,
       `askedToChoose`). */
    return withQuery(`/${lang}/product/${seg(to.product)}`, [...opts, ...(to.choose ? [['choose', '1'] as Pair] : [])])
  }
  if ('search' in to) return withQuery(`/${lang}/search`, [...(to.search ? [['q', to.search] as Pair] : []), ...pageParam(to.page, to.from)])
  if ('cart' in to) return withQuery(`/${lang}/cart`, to.result ? [['r', to.result]] : [])
  if ('saved' in to) return withQuery(`/${lang}/saved`, to.saved.length ? [['ids', to.saved.join(',')]] : [])
  if ('blog' in to) return `/${lang}/blog`
  if ('blogTopic' in to) return `/${lang}/blog/topic/${seg(to.blogTopic)}`
  if ('post' in to) return `/${lang}/blog/${seg(to.post)}`
  if ('checkout' in to) return withQuery(`/${lang}/checkout/${to.checkout}`, to.city ? [['city', to.city]] : [])
  if ('withdraw' in to) return `/${lang}/withdraw`
  if ('account' in to) {
    const path = to.account === 'home' ? `/${lang}/account` : `/${lang}/account/${to.account}`
    const query: [string, string | undefined][] = [['token', to.token], ['next', to.next], ['edit', to.edit]]
    return withQuery(path, query.filter((q): q is Pair => !!q[1]))
  }
  if ('order' in to) return `/${lang}/account/orders/${seg(to.order)}`
  return `/${lang}/info/${seg(to.doc)}`
}
