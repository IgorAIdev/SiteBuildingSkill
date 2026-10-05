import type { CSSProperties } from 'react'
import p from '@/styles/primitives.module.css'
import h from '@/components/Header.module.css'
import type { Lang } from '@/lib/locale.ts'
import { t } from '@/lib/i18n/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { shellData } from '@/lib/shell.ts'
import { HEADERS, type HeaderVariant } from '@/lib/headers.ts'
import { reachRows, supportHref, SUPPORT } from '@/lib/contacts.ts'
import { subscribe } from '@/lib/actions/subscribe.ts'
import { CheckoutHeader, Header } from '@/components/Header.tsx'
import { Footer } from '@/components/Footer.tsx'
import { Logo } from '@/components/Logo.tsx'
import { DropBody, NavLinks } from '@/components/NavLinks.tsx'
import { LangSwitch } from '@/components/LangSwitch.tsx'
import { SavedLink } from '@/components/SavedLink.tsx'
import { AccountLink } from '@/components/AccountLink.tsx'
import { CartLink } from '@/components/CartLink.tsx'
import { SearchForm } from '@/components/SearchForm.tsx'
import { SearchPane } from '@/components/SearchPane.tsx'
import { Newsletter } from '@/components/Newsletter.tsx'
import { ReachList } from '@/components/ReachList.tsx'
import { MenuFoot } from '@/components/MenuFoot.tsx'
import { Part, Worn } from './parts.tsx'
import { lookNow } from '@/lib/look.ts'
import s from './siteframe.module.css'

/* Блоки → «Шапка и подвал»: настоящие компоненты рамы сайта на данных
   магазина — тех же, что берёт макет языка (lib/shell.ts, Shell.tsx), а не
   копии (И605, check:system). Сборки шапки и знаки — все, какие есть в
   наборе, а не выбранное в панели: выбор — в панели Look. Окна образцов
   (меню, поиск, корзина, помощь) — свои: id у них не совпадают с окнами
   шапки страницы. */

/** Сборки шапки — словами заказчику (имена — как в панели Look → Header). */
const HEADS: Record<HeaderVariant, [string, string]> = {
  classic: ['Classic', 'Знак, рядом полки строкой; справа поиск, связь, избранное и корзина.'],
  search: ['Search first', 'Широкое поле поиска в строке знака, корзина со словом; полки — строкой ниже.'],
  boutique: ['Boutique', 'Знак по центру, слева «Магазин», справа поиск и корзина; полки — строкой под знаком.'],
  tray: ['Tray', 'Как у cbdin.bg: обещание на светлой полосе, тёмная рабочая строка лежит на её нижнем крае.'],
  nested: ['Nested', 'Как у cbdin.bg: одна светлая полоса держит обещание и тёмную строку, с полем вокруг.'],
  step: ['Step', 'Как у cbdin.bg: полоса тоном, тёмная строка сидит в ней на своих плечах.'],
}

/** Знак магазина — четыре рисунка (имена — как в панели Look). */
const LOGOS = [
  ['pill', 'Word + country', 'CBDin, страна — плашкой краски марки.'],
  ['word', 'Word', 'cbdin строчными, «.ro» — краской марки.'],
  ['split', 'CBD + in', 'CBD прописными, «in» краской марки, страна мелко сверху.'],
  ['leaf', 'Leaf dot', 'Точка над «i» — лист конопли краской марки.'],
] as const

/** Знак корзины — тележка или сумка (имена — как в панели Look). */
const CARTS = [
  ['cart', 'Cart', 'Иконка тележки; число товаров — на его углу.'],
  ['bag', 'Bag', 'Иконка сумки (как у cbdin.bg); число — на углу.'],
] as const

const vars = (name: string, value: string) => ({ [name]: value }) as CSSProperties

export async function SiteFrame({ lang }: { lang: Lang }) {
  const data = await shellData(lang)
  const look = await lookNow()
  const rows = reachRows({ phone: t(lang, 'reach.phone'), email: t(lang, 'reach.email') })
  const cart = (labelled: boolean) => <CartLink lang={lang} title={t(lang, 'cart.title')} close={t(lang, 'nav.close')} href={hrefFor(lang, { cart: true })} label={t(lang, 'nav.cart')} added={t(lang, 'cart.added')} countUrl={`/api/cart?lang=${lang}`} labelled={labelled} />
  return (
    <>
      <Part title="Шапка" lede="Полоса вверху каждой страницы магазина: знак, полки, поиск, связь, избранное и корзина. Сборок шесть — каждая здесь настоящей шапкой; какая стоит на сайте, выбирается в панели Look → Header.">
        <ul className={`${p.stack} ${s.column}`} role="list">
          {HEADERS.map((v) => (
            <li key={v} className={s.sample}>
              <h3>{HEADS[v][0]}</h3>
              <Worn on={v === look.header} />
              <p className={p.note}>{HEADS[v][1]}</p>
              <div className={s.frame}>
                <Header lang={lang} nav={data.nav} service={data.service} top={data.top} variant={v} idPrefix={`design-${v}-`} />
              </div>
            </li>
          ))}
        </ul>
      </Part>

      <Part title="Подвал" lede="Низ каждой страницы магазина: подписка на новости, знак, связь, полки, «о нас» и помощь; ниже — правила, продавец и оговорка о CBD.">
        <Footer lang={lang} docs={data.docs} shelves={data.nav} idPrefix="design-" />
      </Part>

      <Part title="Шапка и подвал кассы" lede="На шагах оформления заказа рама закрытая: знак и «назад в корзину» сверху, строка закона и телефон помощи снизу — уйти с кассы можно только обратно в корзину.">
        <div className={`${p.stack} ${s.column}`}>
          <div className={s.frame}><CheckoutHeader lang={lang} /></div>
          <Footer lang={lang} docs={data.docs} shelves={data.nav} variant="legal" />
        </div>
      </Part>

      <Part title="Логотип" lede="Знак магазина — один на шапку и подвал. Рисунков четыре; какой стоит на сайте, выбирается в панели Look.">
        <ul className={`${p.cluster} ${s.row}`} role="list">
          {LOGOS.map(([id, name, line]) => (
            <li key={id} className={s.sample}>
              <h3>{name}</h3>
              <Worn on={id === (look.names.logo ?? LOGOS[0][0])} />
              <span className={s.logo} style={vars('--logo', id)}><Logo /></span>
              <p className={p.note}>{line}</p>
            </li>
          ))}
        </ul>
      </Part>

      <Part title="Меню полок" lede="Полки магазина строкой в шапке, первой — все товары. Не влезли в строку — крайние уходят под «Ещё»; на телефоне полки — в шторке меню.">
        <nav className={h.nav} aria-label={t(lang, 'nav.categories')}>
          <NavLinks links={data.nav} className={`${p.rail} ${h.links}`} more={t(lang, 'nav.params', { name: '{name}' })} overflow={t(lang, 'nav.more')} />
        </nav>
      </Part>

      <Part title="Поиск" lede="Поле поиска — одно на сайт: тихим полем в шапке Search first и полем с подписью на странице поиска. Отправка — иконкой лупы внутри поля.">
        <div className={`${p.stack} ${s.column}`}>
          <div className={s.sample}>
            <h3>В шапке</h3>
            <SearchForm action={hrefFor(lang, { search: '' })} q="" label={t(lang, 'search.label')} submit={t(lang, 'nav.search')} id="design-head-q" quiet />
          </div>
          <div className={s.sample}>
            <h3>На странице поиска</h3>
            <SearchForm action={hrefFor(lang, { search: '' })} q="" label={t(lang, 'search.label')} submit={t(lang, 'search.submit')} id="design-search-q" />
          </div>
        </div>
      </Part>

      <Part title="Окно поиска" lede="Иконка лупы в шапке открывает окно сверху: поле сразу в фокусе, под ним полки, с двух букв — первые товары и ссылка на все результаты. Нажмите — откроется настоящее.">
        <SearchPane
          lang={lang} action={hrefFor(lang, { search: '' })} trigger={h.glyph}
          shelves={data.nav}
          words={{ open: t(lang, 'search.open'), close: t(lang, 'search.close'), label: t(lang, 'search.label'), submit: t(lang, 'search.submit'), all: t(lang, 'search.all', { q: '{q}' }), found: t(lang, 'search.found'), none: t(lang, 'search.none', { q: '{q}' }), shelves: t(lang, 'nav.categories') }}
        />
      </Part>

      <Part title="Смена языка" lede="Выбор языка — один на сайт. В верхней строке шапки — раскрытием (языков три), в шторке меню — кодами на одной подложке; выбранный приподнят.">
        <ul className={`${p.cluster} ${s.row}`} role="list">
          <li className={s.sample}>
            <h3>В верхней строке</h3>
            <LangSwitch lang={lang} label={t(lang, 'nav.lang')} drop trigger={h.glyph} />
          </li>
          <li className={s.sample}>
            <h3>В шторке меню</h3>
            <LangSwitch lang={lang} label={t(lang, 'nav.lang')} />
          </li>
        </ul>
      </Part>

      <Part title="Низ шторки меню" lede="Под полками, за чертой: куда ещё (о нас, блог, доставка, контакты) — строками меню со знаком, тише полок; и моё — избранное с числом, кабинет и тема знаками-кнопками, справа язык кодами на подложке.">
        <div className={`${p.menu} ${s.paper}`} data-wide><MenuFoot lang={lang} top={data.top.links} service={data.service} /></div>
      </Part>

      <Part title="Меню связи" lede="Пути к магазину одним списком: телефон, почта, Viber, Telegram, WhatsApp. Открывается трубкой в шапке; тот же список — в окне помощи, первой строкой там — кто отвечает.">
        <ul className={`${p.cluster} ${s.row}`} role="list">
          <li className={s.sample}>
            <h3>Под трубкой в шапке</h3>
            <div className={`${p.menu} ${s.paper}`}><ReachList rows={rows} /></div>
          </li>
          <li className={s.sample}>
            <h3>В окне помощи</h3>
            <div className={`${p.menu} ${s.paper}`} data-wide><ReachList rows={rows} lead={{ role: t(lang, 'reach.online'), name: SUPPORT.name, href: supportHref() }} /></div>
          </li>
        </ul>
      </Part>

      <Part title="Избранное в шапке" lede="Сердце рядом с корзиной: ведёт на страницу избранного, число сохранённых — на его углу.">
        <SavedLink lang={lang} label={t(lang, 'nav.saved')} />
      </Part>

      <Part title="Кабинет в шапке" lede="Знак человека — сразу за сердцем, перед корзиной, как на cbdshop.bg: гостя ведёт ко входу, вошедшего — в кабинет. На телефоне знака в строке нет — кабинет строкой в низу шторки меню.">
        <AccountLink lang={lang} label={t(lang, 'nav.account')} />
      </Part>

      <Part title="Подменю шапки" lede="Раскрывается под словом меню: у «All products» — полки со знаком, у «Oil» — грани столбцами (концентрация, тип, эффект). На сайте открывается наведением мыши или стрелкой рядом со словом; здесь оба стоят раскрытыми, чтобы их было видно без мыши. Подменю — только у этих двух: остальные полки в строке — ссылки.">
        <ul className={`${p.cluster} ${s.row}`} role="list">
          {data.nav.filter((l) => l.menu || l.kids.length).map((l) => (
            <li key={l.href} className={s.sample} lang={lang}>
              <h3 className={h.name}>{l.label}</h3>
              <div className={`${p.menu} ${h.dropPanel} ${s.dropOpen}`}><DropBody link={l} id={`design-drop-${l.href}`} /></div>
            </li>
          ))}
        </ul>
      </Part>

      <Part title="Корзина в шапке" lede="Иконка корзины открывает шторку корзины справа; число товаров — на углу иконки, когда в корзине что-то есть. Иконка — тележка или сумка — выбирается в панели Look.">
        <ul className={`${p.cluster} ${s.row}`} role="list">
          {CARTS.map(([id, name, line]) => (
            <li key={id} className={s.sample} style={vars('--cart-sign', id)}>
              <h3>{name}</h3>
              <Worn on={id === (look.names['cart-sign'] ?? CARTS[0][0])} />
              {cart(false)}
              <p className={p.note}>{line}</p>
            </li>
          ))}
          <li className={s.sample}>
            <h3>Со словом</h3>
            {cart(true)}
            <p className={p.note}>{`Иконка и слово «${t(lang, 'nav.cart')}» — в шапке Search first.`}</p>
          </li>
        </ul>
      </Part>


      <Part title="Подписка на новости" lede="Верх подвала: зачем подписываться — слева, одно поле почты и кнопка — справа, под ними — что отписаться можно всегда.">
        <Newsletter
          action={subscribe.bind(null, lang)} policy={hrefFor(lang, { doc: 'confidentialitate' })}
          words={{ title: t(lang, 'news.title'), lead: t(lang, 'news.lead'), label: t(lang, 'news.label'), hint: t(lang, 'news.hint'), submit: t(lang, 'news.submit'), consent: t(lang, 'news.consent'), policy: t(lang, 'news.policy'), done: t(lang, 'news.done') }}
        />
      </Part>
    </>
  )
}
