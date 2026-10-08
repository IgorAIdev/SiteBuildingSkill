import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import { SearchForm } from './SearchForm.tsx' // look-header:search
import go from '@/styles/go.module.css'
import b from '@/styles/btn.module.css'
import pn from '@/styles/pane.module.css'
import fs from './Filters.module.css'
import s from './Header.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { NavLink, ServiceLink, TopBar } from '@/lib/shell.ts'
import type { HeaderVariant } from '@/lib/headers.ts'
import { t } from '@/lib/i18n/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { Icon } from './Icon.tsx'
import { Logo } from './Logo.tsx'
import { CartLink } from './CartLink.tsx'
import { SavedLink } from './SavedLink.tsx'
import { AccountLink } from './AccountLink.tsx'
import { SearchPane } from './SearchPane.tsx'
import { NavLinks } from './NavLinks.tsx'
import { LangSwitch } from './LangSwitch.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'
import { ReachList } from './ReachList.tsx'
import { PaneHead } from './PaneHead.tsx'
import { MenuFoot } from './MenuFoot.tsx'
import { reachRows } from '@/lib/contacts.ts'

/** Меню шапки: полки, служебное шторки и верхняя строка. */
type Menu = { links: NavLink[]; service: ServiceLink[]; top: TopBar; at: string }
/** `idPrefix` — приставка к id окон шапки (меню, трубка, группы, поле):
 *  второй экземпляр шапки на странице (образец в дизайн-системе) не
 *  повторяет id первой, и его окна открываются свои. На сайте — пусто. */
type Props = { lang: Lang; nav: NavLink[]; service: Menu['service']; top: TopBar; variant: HeaderVariant; idPrefix?: string }

/* Шапка — своя полоса поверхности с волоском снизу, на голом полу страницы
   она не лежит никогда. Вариант приходит значением вида (lib/look.ts):
   разметка своя у каждого, спрятанными варианты не рисуются.
   look-header:* Пока вид выбирается, в коде стоят все (lib/headers.ts);
   look-header:* `npm run look:remove` оставляет выбранный.

   Знаки шапки (поиск, корзина, меню) — тихие глифы ростом с цель
   (`--ctrl-target`), не кнопки действия: стиль кнопок сайта их не касается.
   На узкой коробке шапки у строки одна — меню у начального края, знак,
   поиск, корзина (слово заказчика 05.10.2026: «мобилка, меню перенеси к
   левому краю»; И753); полки уходят в шторку по `popovertarget`, без
   скрипта. */

const logo = (lang: Lang) => <a className={s.logo} href={hrefFor(lang, { home: true })}><Logo /></a>
const cart = (lang: Lang, labelled: boolean) => <CartLink lang={lang} title={t(lang, 'cart.title')} close={t(lang, 'nav.close')} href={hrefFor(lang, { cart: true })} label={t(lang, 'nav.cart')} added={t(lang, 'cart.added')} countUrl={`/api/cart?lang=${lang}`} labelled={labelled} />
/* Верхняя строка — одна у всех вариантов (бриф docs/design/шапка.md; образец —
   cbdin.bg): слева «куда ещё» — служебные ссылки, по центру обещание доставки
   ссылкой на её условия, справа «как показать» — язык и день / ночь. Тише
   строки меню: кегль надписи органа `xs`, приглушённый цвет, без своей краски.
   На узкой коробке остаётся одно обещание; ссылки, язык и тема — в шторке меню
   (7 из 7 референсов), строками её низа (MenuFoot, И770). */
const tools = (lang: Lang) => (
  <>
    {/* В верхней строке — раскрытием при трёх языках и больше (И501). */}
    <span className={s.topLanguage}><LangSwitch lang={lang} label={t(lang, 'nav.lang')} drop trigger={s.glyph} /></span>
    <ThemeToggle label={t(lang, 'theme.toggle')} className={s.glyph} sun={s.sun} moon={s.moon} />
  </>
)
const topRow = (lang: Lang, top: TopBar) => (
  <>
    {top.links.length ? (
      <nav className={s.topLinks} aria-label={t(lang, 'header.links')}>
        <ul>{top.links.map((l) => <li key={l.href}><a className={b.word} data-hand="menu" href={l.href}>{l.label}</a></li>)}</ul>
      </nav>
    ) : null}
    {top.promo.href
      ? <a className={`${s.promo} ${b.word}`} data-hand="menu" href={top.promo.href}><Icon id="truck" />{top.promo.text}</a>
      : <p className={s.promo}><Icon id="truck" />{top.promo.text}</p>}
    <div className={s.topTools}>{tools(lang)}</div>
  </>
)
/* look-header:classic,search,boutique:start */
/* Верхняя полоса — пол шапки, отбита волоском (И703): палубу марки она носила
   один день (И697, п. 2) и снята словом заказчика 04.10.2026: «верхнее меню —
   верни цвет, который был». */
const topBar = (lang: Lang, top: TopBar) => <div className={s.top}><div className={`${p.wrap} ${s.topRow}`}>{topRow(lang, top)}</div></div>
/* look-header:classic,search,boutique:end */
/* look-header:classic,boutique,tray,nested,step:start */
/* Поиск — окном сверху (SearchPane, И539), контакты и избранное — знаками
   рядом с корзиной, как «Пишете ни», «Запазени» у cbdin.bg (слово заказчика
   28.09.2026). Контакты на узкой коробке уходят в шторку меню — там они
   строкой служебных ссылок; знаков в строке телефона остаётся четыре. */
const find = (lang: Lang, nav: Menu) => (
  <SearchPane
    lang={lang} action={hrefFor(lang, { search: '' })} trigger={s.glyph}
    shelves={nav.links}
    words={{ clear: t(lang, 'search.clear'), open: t(lang, 'search.open'), close: t(lang, 'search.close'), label: t(lang, 'search.label'), submit: t(lang, 'search.submit'), all: t(lang, 'search.all', { q: '{q}' }), found: t(lang, 'search.found'), none: t(lang, 'search.none', { q: '{q}' }), shelves: t(lang, 'nav.categories') }}
  />
)
const reach = (lang: Lang, nav: Menu) => (
  <>
    {/* Трубка раскрывает пути связи — телефон, почта, мессенджеры (слово
        заказчика 29.09.2026, образец — cbdin; И547). Раскрытие — то же, что у
        языка в верхней строке и порядка полки: бумага всплывающего под
        кнопкой, от её правого края, Escape и щелчок мимо — от браузера. */}
    <div className={s.contact}>
      <button className={`${s.glyph} ${fs.trigger}`} type="button" popoverTarget={`${nav.at}reach-menu`} aria-label={t(lang, 'reach.menu')}><Icon id="phone" /></button>
      <div id={`${nav.at}reach-menu`} popover="auto" data-scroll-shut className={`${p.menu} ${fs.drop}`} data-align="end" aria-label={t(lang, 'reach.menu')}>
        <ReachList rows={reachRows({ phone: t(lang, 'reach.phone'), email: t(lang, 'reach.email') })} />
      </div>
    </div>
    <SavedLink lang={lang} label={t(lang, 'nav.saved')} />
    {/* Кабинет — за сердцем, перед корзиной (cbdshop.bg; И771); на узкой
        коробке — строкой в шторке меню. */}
    <AccountLink lang={lang} label={t(lang, 'nav.account')} />
  </>
)
/* look-header:classic,boutique,tray,nested,step:end */
/* look-header:classic,search,tray,nested,step:start */
const menu = (lang: Lang, nav: Menu) => <button className={`${s.glyph} ${s.menu}`} type="button" popoverTarget={`${nav.at}site-menu`} aria-label={t(lang, 'nav.menu')}><Icon id="menu" /></button>
/* look-header:classic,search,tray,nested,step:end */
/* Шторка полок — от начального края у всех вариантов: кнопка меню стоит там
   (И753), шторка выезжает из-под неё, как у cbdin.bg. Групп «по поводу» под
   полками нет: они повторяли грани масел (слово заказчика 05.10.2026: «там
   повтор меню масел»; И430). */
const shelves = (lang: Lang, nav: Menu, title: string) => (
  <nav id={`${nav.at}site-menu`} popover="auto" className={`${pn.pane} ${s.nav}`} data-pane="start" data-row aria-label={t(lang, 'nav.categories')}>
    {/* Шторка — окно общего модуля (styles/pane.module.css, И460, И467):
        шапка стоит, прокручиваются полки; край, ширина и угол — `data-pane`.
        В строке шапки тело свёрнуто (`display:contents`), и полки стоят в
        ней как стояли. */}
    <PaneHead className={s.sheetHead} title={title} close={t(lang, 'nav.close')} target={`${nav.at}site-menu`} />
    <div className={`${pn.body} ${s.sheetBody}`}>
      <NavLinks links={nav.links} className={`${p.rail} ${s.links}`} more={t(lang, 'nav.params', { name: '{name}' })} overflow={t(lang, 'nav.more')} />
      <MenuFoot lang={lang} top={nav.top.links} service={nav.service} />
    </div>
  </nav>
)

/* look-header:classic:start */
/* classic — знак, полки строкой рядом; справа язык, поиск, корзина. */
const classic = (lang: Lang, nav: Menu) => (
  <header className={s.head} data-variant="classic">
    {topBar(lang, nav.top)}
    <div className={`${p.wrap} ${s.bar}`}>
      {menu(lang, nav)}
      {logo(lang)}
      {shelves(lang, nav, t(lang, 'nav.menu'))}
      <div className={s.actions}>
        {find(lang, nav)}{reach(lang, nav)}{cart(lang, false)}
      </div>
    </div>
  </header>
)
/* look-header:classic:end */

/* look-header:search:start */
/* search — полоса обещания магазина с языком; строка знака, широкого
   поиска и корзины со словом; строка полок. */
const search = (lang: Lang, nav: Menu) => (
  <header className={s.head} data-variant="search">
    {topBar(lang, nav.top)}
    <div className={`${p.wrap} ${s.bar}`}>
      {menu(lang, nav)}
      {logo(lang)}
      <SearchForm action={hrefFor(lang, { search: '' })} q="" label={t(lang, 'search.label')} submit={t(lang, 'nav.search')} id={`${nav.at}head-q`} quiet className={s.field} />
      <div className={s.actions}>{reach(lang, nav)}{cart(lang, true)}</div>
    </div>
    <div className={`${p.wrap} ${s.shelfRow}`}>{shelves(lang, nav, t(lang, 'nav.menu'))}</div>
  </header>
)
/* look-header:search:end */

/* look-header:boutique:start */
/* boutique — знак по центру, слева язык, справа поиск и корзина; полки —
   строкой под знаком, в той же полосе шапки. На узкой коробке слева «Shop»
   — шторка полок от левого края. Панели полок окном поверх страницы нет:
   слово заказчика 25.09.2026 — «так не делают, меню в верхней полосе должно
   быть». */
const boutique = (lang: Lang, nav: Menu) => (
  <header className={s.head} data-variant="boutique">
    {topBar(lang, nav.top)}
    <div className={`${p.wrap} ${s.bar}`}>
      <button className={`${s.glyph} ${s.shop}`} type="button" popoverTarget={`${nav.at}site-menu`}><Icon id="menu" />{t(lang, 'nav.shop')}</button>
      {logo(lang)}
      <div className={s.actions}>{find(lang, nav)}{reach(lang, nav)}{cart(lang, false)}</div>
    </div>
    <div className={`${p.wrap} ${s.shelfRow}`}>{shelves(lang, nav, t(lang, 'nav.shop'))}</div>
  </header>
)
/* look-header:boutique:end */

/* look-header:tray,nested,step:start */
/* tray, nested, step — сборки шапки cbdin.bg (слово заказчика 25.09.2026:
   «шапки из cbdin.bg — в панель»; И425). Разметка одна: светлая полоса —
   обещание магазина и язык; под ней тёмная рабочая строка на полу палубы —
   меню (на узкой коробке), знак, полки, поиск, корзина. Сборки различает
   только то, как пара лежит на листе (Header.module.css): tray — полоса на
   белом листе, строка ложится на его нижний край; nested — один лист держит
   обе с полем вокруг; step — лист тоном, у строки свои плечи. Шторка полок
   открывается из тёмной строки и остаётся в её краске. */
const board = (lang: Lang, nav: Menu) => (
  <div className={p.wrap}>
    <div className={s.board}>
      <div className={s.util}>
        {topRow(lang, nav.top)}
      </div>
      <div className={`${s.bar} ${s.row}`} data-ground="deck">
        {menu(lang, nav)}
        {logo(lang)}
        {shelves(lang, nav, t(lang, 'nav.menu'))}
        <div className={s.actions}>{find(lang, nav)}{reach(lang, nav)}{cart(lang, false)}</div>
      </div>
    </div>
  </div>
)
/* look-header:tray,nested,step:end */
/* look-header:tray:start */
const tray = (lang: Lang, nav: Menu) => <header className={s.head} data-variant="tray">{board(lang, nav)}</header>
/* look-header:tray:end */
/* look-header:nested:start */
const nested = (lang: Lang, nav: Menu) => <header className={s.head} data-variant="nested">{board(lang, nav)}</header>
/* look-header:nested:end */
/* look-header:step:start */
const step = (lang: Lang, nav: Menu) => <header className={s.head} data-variant="step">{board(lang, nav)}</header>
/* look-header:step:end */

const DRAW: Record<HeaderVariant, (lang: Lang, nav: Menu) => ReactNode> = {
  classic, // look-header:classic
  search, // look-header:search
  boutique, // look-header:boutique
  tray, // look-header:tray
  nested, // look-header:nested
  step, // look-header:step
}

export function Header({ lang, nav, service, top, variant, idPrefix = '' }: Props) {
  return DRAW[variant](lang, { links: nav, service, top, at: idPrefix })
}

/* Шапка кассы — закрытая (разбор 24.09.2026, S2 и X5; Baymard «enclosed
   checkout»): знак ведёт домой, «назад в корзину» — единственный выход,
   полок, поиска и языка нет — на шагах оформления их не выбирают. Та же
   полоса и тот же знак, что у шапки магазина: рисунок один, меняется только
   состав строки. Вариантом вида она не является и снятию панелью не
   подлежит. */
export function CheckoutHeader({ lang }: { lang: Lang }) {
  return (
    <header className={s.head} data-variant="checkout">
      <div className={`${p.wrap} ${s.bar}`}>
        {logo(lang)}
        <div className={s.actions}>
          <a className={go.go} data-to="back" href={hrefFor(lang, { cart: true })}><Icon id="arrow-left" />{t(lang, 'checkout.back')}</a>
        </div>
      </div>
    </header>
  )
}
