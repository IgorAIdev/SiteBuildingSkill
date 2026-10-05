import type { Lang } from './locale.ts'
import type { Card, Facet, Listing, SortKey } from './source/contract.ts'
import type { Asked, Shown } from './listing.ts'
import { hrefFor, type Query } from './href.ts'
import { t, tn, type Key } from './i18n/index.ts'
import { shelfCard, type ShelfCard } from './view.ts'
import { PHONE_FIRST } from './source/page.ts'

/** Пусто — почему и куда дальше (экран «пусто», StateScreen). */
export type Empty = { title: string; step: string; href: string }
/** Пустая полка: `title` null — заголовка «пусто» не нужно, пустоту уже
 *  назвал заголовок страницы («No results for…»), и второй повторял бы
 *  первый (разбор 24.09.2026, Q4). */
/** `hint` — совет тихой строкой над выходом (пустой поиск: «проверьте
 *  написание»); выход — коротким словом, как у «не найдено» (И485). */
export type ShelfEmpty = { title: string | null; hint?: string | null; step: string; href: string }
/** Группа фильтра, готовая к показу, — одна грань адреса (И742; общего
 *  заголовка «Содержание CBD» над концентрацией и мг нет — заказчик 04.10.2026:
 *  «CBD content — слово удаляй»). `code` — имя поля формы и адрес раскрытия в
 *  строке над полкой (`popovertarget`), `label` — имя с числом выбранного,
 *  `values` — значения на виду, `fold` — остаток длинного списка под «Arată
 *  toate (14)» (`foldValues`), раскрыт, если в нём есть выбранное. */
export type FacetView = { code: string; name: string; label: string; values: Facet['values']; fold: { label: string; values: Facet['values']; open: boolean } | null }
/** Живой счёт кнопки «применить» (Baymard 2026: кнопка фильтра говорит,
 *  сколько товаров даст выбор, и пересчитывает его на каждой галочке):
 *  `href` — адрес счёта полки без граней (`countHref`), грани формы
 *  дописывает кнопка; `label` — надпись под уже применённый выбор, `total` —
 *  его счёт. Без скрипта кнопка остаётся «применить». */
export type LiveCount = { href: string; label: string; total: number }
export type FiltersView = {
  action: string; facets: FacetView[]
  title: string; apply: string; clear: Link | null; live: LiveCount
  /** Полка страницы — в имени окна фильтра («Filters · Capsules») и ссылкой «All
   *  products» в его шапке (И740): пилюлей её не повторяют — её называет заголовок. */
  scope: (ChipView & { all: string }) | null
  /** Кнопка шторки на узком — с числом выбранного, её крестик и сколько выбрано. */
  open: string; close: string; chosen: number
}
export type Link = { label: string; href: string }
/** Порядок полки — ссылками: каждый порядок — адрес (shop, «Фильтры живут в
 *  адресе всегда»), и выбор ведёт по ссылке, а не отправляет форму на
 *  изменении списка (И265, WCAG 3.2.2 «On Input»). `current` — надпись
 *  кнопки, `said` — её имя для чтения вслух («Sort by: Best sellers»). */
export type SortView = { label: string; current: string; said: string; options: { value: SortKey; label: string; href: string; on: boolean }[] }
/** Выбранное значение пилюлей: `said` — что сделает нажатие, для чтения вслух.
 *  Та же запись — выход из полки страницы (категория, эффект) во все товары с
 *  теми же гранями и порядком (`FiltersView.scope`, И734, И740). */
export type ChipView = { label: string; said: string; href: string }
/** Рамка страницы полки: имя полки и адрес полки шире (всех товаров) — его
 *  строит страница, грани и порядок переносит `catalogView`. */
export type Scope = { name: string; wider: (q: Query) => string }
/** Номер страницы: `href` null — текущая; `gap` — перед номером пропуск «…». */
export type PageItem = { n: number; href: string | null; gap: boolean }
/** Листание под полкой (И721, И731): назад, номера, вперёд, «Показать ещё»
 *  (`more` — адрес следующей страницы, приклеенной к показанным; null —
 *  показано всё) и строка «Показано 24 из 96» (`shown`) — одной строкой.
 *  `now` / `total` — «2 / 4» компактного вида и узкой коробки. */
export type PagesView = {
  label: string; prev: string | null; next: string | null; prevLabel: string; nextLabel: string; items: PageItem[]
  more: string | null; moreLabel: string; shown: string; now: number; total: number
}
/** Полка «куда дальше» под пустым поиском: лучшее магазина. */
/** Полка «ходовых» под пустым итогом — общая полка (`Shelf`, И481) с
 *  выходом ко всему каталогу. */
export type MoreView = { title: string; all: string; cards: ShelfCard[] }
/** Полка телефона шагами (И754, FoldGrid): видно `start` карточек, каждое
 *  «Показать ещё» (`more`) добавляет `step`; кончились загруженные (`loaded`) — шаг
 *  дописывает следующую страницу (`next`, мягким переходом с `from`). `shown` —
 *  строка счёта с местом `{k}` под показанное, «Показано 48 из 85»; `at` —
 *  адрес полки без страницы: другая полка — другая свёртка, с начала. */
export type FoldView = { at: string; start: number; step: number; loaded: number; total: number; next: string | null; more: string; shown: string }
export type CatalogView = {
  title: string; lede: string | null; count: string | null; shelf: string; cards: ShelfCard[]
  filters: FiltersView | null; sort: SortView | null; chips: ChipView[]; clear: Link | null
  invalid: string | null; empty: ShelfEmpty; pages: PagesView | null; fold: FoldView | null; more: MoreView | null
}

/** Надпись кнопки «применить» под счёт: «Arată 12 produse»; ноль — «Niciun produs». */
export const showLabel = (lang: Lang, n: number): string => (n ? tn(lang, 'catalog.show', n) : t(lang, 'catalog.showNone'))
/** Адрес счёта полки (app/api/shelf-count): язык и рамка страницы — полка
 *  или эффект; грани дописывает кнопка из своей формы. */
export const countHref = (lang: Lang, at: { category?: string; effect?: string } = {}): string =>
  `/api/shelf-count?${new URLSearchParams({ lang, ...at })}`

/* Длинный список значений свёрнут (Baymard, Macy's: на виду около десяти, с
   пятнадцати — беда; Shopify Dawn: десять, остальное под «Show more»). Прятать
   одно-два значения незачем — свёртка, только когда под ней не меньше трёх. */
export const FOLD_SHOWN = 10
const FOLD_MIN = 3
export function foldValues(values: Facet['values']): [Facet['values'], Facet['values']] {
  return values.length - FOLD_SHOWN >= FOLD_MIN ? [values.slice(0, FOLD_SHOWN), values.slice(FOLD_SHOWN)] : [values, []]
}

const SORTS: [SortKey, Key][] = [['popular', 'sort.popular'], ['newest', 'sort.newest'], ['price-asc', 'sort.priceAsc'], ['price-desc', 'sort.priceDesc']]

/** Что из граней показывать (cbd-facet, §7). Значения — рамки (полка без
 *  выбора покупателя, `Facet.values`); значение, которое выбор других граней
 *  не находит, стоит погашенным с «(0)», а не пропадает (И750; заказчик
 *  05.10.2026: «должны становиться неактивными и количество ноль»): список не
 *  прыгает от галочки к галочке. Галочку погашенного не поставить
 *  (`ValueTick`) — раньше «Капсулы (0)» на полке масел давали пустую полку
 *  (разбор, C2). Грань с одним значением на всю выборку выбора не даёт — на
 *  полке масел «Форма: Масло (5)» из пяти. */
export function shownFacets(facets: Facet[], total: number): Facet[] {
  return facets
    .filter((f) => f.values.some((v) => v.selected) || f.values.length > 1 || (f.values.length === 1 && f.values[0].count < total))
    /* Полки — первой слева: самый важный выбор (заказчик 04.10.2026, И740);
       остальные — в порядке источника. */
    .sort((a, b) => Number(!a.shelf) - Number(!b.shelf))
}

const drop = (facets: Record<string, string[]>, code: string, value: string): Record<string, string[]> =>
  Object.fromEntries(Object.entries(facets).map(([k, vs]) => [k, k === code ? vs.filter((v) => v !== value) : vs]).filter(([, vs]) => vs.length))

/** Группа фильтра из грани: имя с числом выбранного, длинный список — свёрнут. */
function facetView(lang: Lang, f: Facet): FacetView {
  const name = facetName(lang, f)
  const n = f.values.filter((v) => v.selected).length
  const [shown, rest] = foldValues(f.values)
  const fold = rest.length ? { label: t(lang, 'catalog.allValues', { n: f.values.length }), values: rest, open: rest.some((v) => v.selected) } : null
  return { code: f.code, name, label: n ? `${name} (${n})` : name, values: shown, fold }
}

/** Имя грани для покупателя: грань полок — словом сайта «Категории», а не
 *  именем из админки движка («Shelf»; заказчик 04.10.2026: «не Shelf, а
 *  категории»); остальные — как назвал магазин. */
const facetName = (lang: Lang, f: Facet): string => (f.shelf ? t(lang, 'facet.shelf') : f.name)

/** Грани, которые едут во все товары при снятии полки: кроме тех, что живут
 *  только в ней (`scoped`). */
const wide = (facets: Record<string, string[]>, known: Facet[]): Record<string, string[]> => {
  const own = new Set(known.filter((f) => f.scoped).map((f) => f.code))
  return Object.fromEntries(Object.entries(facets).filter(([k]) => !own.has(k)))
}

/** Номера страниц: до семи — все; дальше первая, последняя и соседи текущей,
 *  между ними пропуск. */
function pageItems(page: number, pages: number, href: (n: number) => string): PageItem[] {
  const want = pages <= 7 ? Array.from({ length: pages }, (_, i) => i + 1) : [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  return want.map((n, i) => ({ n, href: n === page ? null : href(n), gap: i > 0 && n - want[i - 1] > 1 }))
}

/** Порядок: у каждого свой адрес с теми же гранями, с первой страницы. */
function sortView(lang: Lang, asked: Asked, at: (q: Query) => string): SortView {
  const options = SORTS.map(([value, key]) => ({ value, label: t(lang, key), href: at({ facets: asked.facets, sort: value }), on: value === asked.sort }))
  const label = t(lang, 'catalog.sort')
  const current = (options.find((o) => o.on) ?? options[0]).label
  return { label, current, said: `${label}: ${current}`, options }
}

/** Полка готовыми строками. `at` строит адрес этой же полки — у категории,
 *  у всего каталога и у поиска он свой, а грани и порядок переносит сам. */
export function catalogView(lang: Lang, a: {
  title: string; lede: string | null; listing: Listing; asked: Asked
  at: (q: Query) => string; filters: boolean; empty: ShelfEmpty; more?: { title: string; cards: Card[] } | null
  scope?: Scope | null
  /** Сколько товаров в рамке без граней покупателя (`frameTotal`); null — граней нет. */
  all?: number | null
  /** Рамка счёта кнопки «применить» — та же, что у полки страницы. */
  counted?: { category?: string; effect?: string }
}): CatalogView {
  const { listing, asked, at } = a
  const keep = { facets: asked.facets, sort: asked.sort }
  /* Полка показана подряд с `from` (shownListing, И721); без него — одна страница. */
  const shown = listing as Listing & Partial<Shown>
  const from = shown.from ?? listing.page
  const head = shown.first ?? (listing.page < listing.pages ? (listing.page - 1) * listing.items.length + 1 : Math.max(1, listing.total - listing.items.length + 1))
  const tail = Math.min(listing.total, head + listing.items.length - 1)
  const chosen = listing.facets.reduce((n, f) => n + f.values.filter((v) => v.selected).length, 0)
  /* Снять фильтры — не снять порядок: «сбросить» относится к граням. */
  const clear = chosen ? { label: t(lang, 'catalog.clear'), href: at({ sort: asked.sort }) } : null
  /* «6 din 16 produse», когда выбор сузил полку (Shopify Dawn: «12 of 24
     products»); без выбора — просто счёт. `all` — полка рамки без граней
     покупателя (`frameTotal`). Один на строку органов и кнопку панели. */
  const count = listing.total ? (a.all && a.all > listing.total ? tn(lang, 'catalog.countOf', a.all, { k: listing.total }) : tn(lang, 'catalog.count', listing.total)) : null
  return {
    title: a.title,
    lede: a.lede,
    count,
    shelf: t(lang, 'catalog.shelf'),
    cards: listing.items.map((c) => shelfCard(lang, c)),
    filters: a.filters ? {
      action: at({}),
      facets: shownFacets(listing.facets, listing.total).map((f) => facetView(lang, f)),
      title: t(lang, 'catalog.filters'), apply: t(lang, 'catalog.apply'), clear,
      live: { href: countHref(lang, a.counted), label: showLabel(lang, listing.total), total: listing.total },
      /* Полка страницы — в имени фильтра и выходом из неё в его шапке (И740):
         грани и порядок едут с покупателем во все товары, кроме живущих только
         в полке (`scoped`). */
      scope: a.scope ? { label: a.scope.name, all: t(lang, 'catalog.title'), said: t(lang, 'shelf.widen', { name: a.scope.name }), href: a.scope.wider({ facets: wide(asked.facets, listing.facets), sort: asked.sort }) } : null,
      open: chosen ? `${t(lang, 'catalog.open')} (${chosen})` : t(lang, 'catalog.open'), close: t(lang, 'catalog.close'), chosen,
    } : null,
    sort: a.filters ? sortView(lang, asked, at) : null,
    chips: listing.facets.flatMap((f) => f.values.filter((v) => v.selected).map((v) => ({
      label: v.name, said: t(lang, 'shelf.remove', { name: `${facetName(lang, f)}: ${v.name}` }), href: at({ facets: drop(asked.facets, f.code, v.code), sort: asked.sort }),
    }))),
    clear,
    invalid: listing.invalid.length ? t(lang, 'catalog.invalid') : null,
    empty: a.empty,
    pages: listing.pages > 1 ? {
      label: t(lang, 'catalog.page', { n: listing.page, total: listing.pages }),
      /* Назад — страница перед первой показанной, вперёд — после последней. */
      prev: from > 1 ? at({ ...keep, page: from - 1 }) : null,
      next: listing.page < listing.pages ? at({ ...keep, page: listing.page + 1 }) : null,
      prevLabel: t(lang, 'catalog.prev'), nextLabel: t(lang, 'catalog.next'),
      items: pageItems(listing.page, listing.pages, (n) => at({ ...keep, page: n })),
      more: listing.page < listing.pages ? at({ ...keep, page: listing.page + 1, from }) : null,
      moreLabel: t(lang, 'catalog.more'),
      shown: head === 1 ? tn(lang, 'catalog.shown', listing.total, { k: tail }) : tn(lang, 'catalog.shownRange', listing.total, { a: head, b: tail }),
      now: listing.page, total: listing.pages,
    } : null,
    /* Свёртка — у полки, показанной с первого товара, где товаров больше шага
       (И754). Пришедший сразу на третью страницу листает страницами. Открытая
       с `from` (страница перезагружена после «Показать ещё») показывает всё,
       что просила. */
    fold: head === 1 && listing.total > PHONE_FIRST ? {
      at: at(keep),
      start: from === listing.page ? PHONE_FIRST : listing.items.length,
      step: PHONE_FIRST,
      loaded: listing.items.length,
      total: listing.total,
      next: listing.page < listing.pages ? at({ ...keep, page: listing.page + 1, from }) : null,
      more: t(lang, 'catalog.more'),
      shown: tn(lang, 'catalog.shown', listing.total, { k: '{k}' }),
    } : null,
    more: a.more?.cards.length ? { title: a.more.title, all: hrefFor(lang, { catalog: true }), cards: a.more.cards.map((c) => shelfCard(lang, c)) } : null,
  }
}

/** Пусто — почему и куда дальше: грани ничего не дали — снять их; полка пуста — ко всем товарам. */
export function emptyFor(lang: Lang, asked: Asked, at: (q: Query) => string): Empty {
  return Object.keys(asked.facets).length
    ? { title: t(lang, 'catalog.none'), step: t(lang, 'catalog.noneStep'), href: at({ sort: asked.sort }) }
    : { title: t(lang, 'catalog.empty'), step: t(lang, 'catalog.emptyStep'), href: hrefFor(lang, { catalog: true }) }
}
