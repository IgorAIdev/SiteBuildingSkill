import type { Lang } from './locale.ts'
import type { Collection, Doc, Facet } from './source/contract.ts'
import { t } from './i18n/index.ts'
import { hrefFor } from './href.ts'
import { source, content } from './source/index.ts'
import { moneyShort } from './money.ts'

/* Пустой список — общий на оба провала источника: своя `[]` в JSX-пропе на
   каждый рендер словит react-perf/jsx-no-new-array-as-prop. */
const NONE: never[] = []

/** Полка в шапке: адрес, имя, знак и строка о ней (у «всех товаров» строки
 *  нет). Снимка полки в меню нет — знак (И753). Строкой или рядом в шторке её
 *  рисует шапка. */
/** `facets` — общие параметры полки (И478): её грани значениями со ссылкой в
 *  полку сразу с фильтром — «Концентрация 5 % · 10 % …» у масел (меню
 *  cbdshop.bg). У «всех товаров» и у полки без своих граней — пусто.
 *  `sign` — знак полки из данных (`Collection.sign`), у «всех товаров» — знак
 *  магазина, тот же, что у «В магазин» героя: строки полок окна поиска
 *  (И691). */
export type NavLink = { href: string; label: string; sign: string | null; line: string | null; facets: NavGroup[]; kids: NavKid[]; menu: boolean }
/** Подменю-список строки шапки (слово заказчика 02.10.2026: «All products —
 *  раскрывающееся меню, в нём категории с иконками»): у «всех товаров» —
 *  полки со знаком из данных (`Collection.sign`; нет знака — `null`, строка
 *  стоит словом). У остальных полок — пусто: у них грани (`facets`). */
export type NavKid = { href: string; label: string; sign: string | null }
/** Грань полки в меню (И478): имя и значения ссылками в полку с этой гранью. */
export type NavGroup = { name: string; links: { label: string; href: string }[] }
/** `service` — служебное в шторке меню под полками (И497): доставка и
 *  контакты — из тех же документов магазина, что в подвале. */
/** `top` — верхняя строка шапки (бриф docs/design/шапка.md): служебные
 *  ссылки «куда ещё» и обещание доставки ссылкой на её условия. Порог — из
 *  данных магазина (`ShopFacts.freeDeliveryFrom`); нет порога — строкой
 *  обещания магазина. */
/** Служебная ссылка: адрес, слово и знак строки в низу шторки меню (И770). */
export type ServiceLink = { href: string; label: string; sign: string | null }
export type TopBar = { links: ServiceLink[]; promo: { text: string; href: string | null } }
export type ShellData = { nav: NavLink[]; docs: Doc[]; service: ServiceLink[]; top: TopBar }

/** Грань, значения которой повторяют полки (Vendure: «category» — oil,
 *  capsules …; образец: «Форма» — Масло, Капсулы …), в шторке не нужна: полки
 *  уже стоят строками. Повтором считается, когда хотя бы половина значений
 *  совпадает с полкой адресом или именем. */
const mirrorsShelves = (f: Facet, cols: Collection[]): boolean => {
  const slugs = new Set(cols.map((c) => c.slug))
  const names = new Set(cols.map((c) => c.name.toLowerCase()))
  const same = f.values.filter((v) => slugs.has(v.code) || names.has(v.name.toLowerCase())).length
  return same * 2 >= f.values.length
}

/** Полки шапки (первой — весь каталог) и документы подвала. Групп «по поводу»
 *  во всём каталоге нет: в шторке они повторяли грани масел (слово заказчика
 *  05.10.2026; И430). Шапка и подвал не падают вместе с источником: не
 *  ответил — полок и документов в них нет, а страница говорит сама за себя. Берут двое —
 *  макет языка и «не найдено» без языка. */
/** Служебное шторки — доставка и контакты (разбор impeccable 27.09.2026:
 *  в меню телефона не было ни доставки, ни связи). */
const SERVICE = ['livrare-si-plata', 'contact']
/** Верхняя строка — «о нас» и контакты (слово заказчика 28.09.2026: «О нас,
 *  Контакты, Блог»). Блог — третьей ссылкой, когда в нём есть статьи: пустой
 *  раздел был бы тупиком. */
const TOP = ['despre-noi', 'contact']
const DELIVERY = 'livrare-si-plata'
/* Знак служебной строки в низу шторки меню (И770): строки низа — той же формы,
   что полки над ними, знак + слово. Документ без знака стоит словом. */
const DOC_SIGN: Record<string, string> = { 'despre-noi': 'info', contact: 'phone', 'livrare-si-plata': 'truck' }
const BLOG_SIGN = 'newspaper'

/** Полки, у которых раскрывающееся подменю с гранями (слово заказчика
 *  02.10.2026: подменю — у «Oil»; у «Capsules», «Paste», «Edibles», «Pets»,
 *  «Vape» и остальных только ссылка). Что в меню и у кого — решает магазин,
 *  это его данные: ключ — имя коллекции в движке. Шторка телефона следует
 *  строке шапки: грани раскрываются только у этих полок (слово заказчика
 *  05.10.2026, поправка И478). */
const MENU_SHELVES = new Set(['oil'])

export async function shellData(lang: Lang): Promise<ShellData> {
  const [cols, docs, facts, posts] = await Promise.all([
    source().collections(lang), content().docs(lang), content().facts(), content().posts(lang),
  ])
  const shelves = cols.ok ? cols.value : NONE
  /* Общие параметры каждой полки — её грани по её товарам (И478): значения
     с товарами, у грани больше одного значения, повторяющие полки — прочь.
     Не ответил источник по полке — полка стоит без параметров. */
  const facetsOf = await Promise.all(shelves.map((c) => source().listing(lang, { category: c.slug, facets: {}, sort: 'popular', page: null })))
  const groupsOf = (facets: Facet[], to: (code: string, value: string) => string): NavGroup[] => facets
    /* Посчитанные отрезки (мг, цена — `Facet.bands`, И742) в меню не идут:
       ссылка из меню на отрезок стареет вместе с ассортиментом полки. */
    .filter((f) => !f.bands)
    .map((f): Facet => ({ code: f.code, name: f.name, values: f.values.filter((v) => v.count > 0) }))
    .filter((f) => f.values.length > 1 && !mirrorsShelves(f, shelves))
    .map((f) => ({ name: f.name, links: f.values.map((v) => ({ label: v.name, href: to(f.code, v.code) })) }))
  const nav = [
    { href: hrefFor(lang, { catalog: true }), label: t(lang, 'nav.catalog'), sign: 'shop-awning', line: null, facets: NONE, menu: false, kids: shelves.map((c) => ({ href: hrefFor(lang, { category: c.slug }), label: c.name, sign: c.sign })) },
    ...shelves.map((c, i) => {
      const r = facetsOf[i]
      const facets = r.ok ? groupsOf(r.value.facets, (code, value) => hrefFor(lang, { category: c.slug, facets: { [code]: [value] } })) : NONE
      return { href: hrefFor(lang, { category: c.slug }), label: c.name, sign: c.sign, line: c.description, facets, kids: NONE, menu: MENU_SHELVES.has(c.slug) && facets.length > 0 }
    }),
  ]
  const shown = docs.ok ? docs.value : NONE
  const doc = (slug: string): ServiceLink[] => shown.filter((d) => d.slug === slug).map((d) => ({ href: hrefFor(lang, { doc: d.slug }), label: d.title, sign: DOC_SIGN[d.slug] ?? null }))
  const service = SERVICE.flatMap(doc)
  const links = TOP.flatMap(doc)
  if (posts.ok && posts.value.length) links.push({ href: hrefFor(lang, { blog: true }), label: t(lang, 'nav.blog'), sign: BLOG_SIGN })
  const from = facts.ok ? facts.value.freeDeliveryFrom : null
  const delivery = shown.some((d) => d.slug === DELIVERY) ? hrefFor(lang, { doc: DELIVERY }) : null
  const promo = { text: from ? t(lang, 'header.freeFrom', { price: moneyShort(from, lang) }) : t(lang, 'header.promise'), href: delivery }
  return { nav, docs: shown, service, top: { links, promo } }
}
