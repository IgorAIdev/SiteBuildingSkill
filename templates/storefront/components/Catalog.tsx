import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import f from '@/styles/form.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import s from './Catalog.module.css'
import type { CatalogView } from '@/lib/catalog-view.ts'
import type { ShelfCard } from '@/lib/view.ts'
import { ProductCard, type CartActions } from './ProductCard.tsx'
import { StateScreen } from './StateScreen.tsx'
import { Filters } from './Filters.tsx'
import { SortMenu } from './SortMenu.tsx'
import { Pagination } from './Pagination.tsx'
import { Icon } from './Icon.tsx'
import { Shelf } from './Shelf.tsx'
import { FoldGrid } from './FoldGrid.tsx'
import { FoldShelf } from './FoldShelf.tsx'

/* Снимки первого экрана не ленивые: полка на ноутбуке держит в нём два ряда
   по четыре (Catalog.module.css, `--cols:4`). Снимок первого экрана, стоящий
   ленивым, стоит в нём пустым, пока браузер не дошёл до ленивых (check:craft,
   `broken`, 1440). */
export const FIRST_SCREEN = 8

/* Полка товаров — одна на каталог, поиск и избранное (SavedView берёт её же,
   а не пишет `p.grid` на месте: там остались маркеры списка и три колонки) —
   договор товарного каталога (shop, «Каталог и полка»):
   `data-catalog-grid` без панели сбоку — 4–5 карточек по 260–325px; меряет
   отрисованная семья `catalogueColumns`.
   `fold` — адрес полки телефона шагами по 24 (И754, FoldGrid): сколько
   показано, знает свёртка вокруг полки и её строки листания (FoldShelf). */
export function ShelfGrid({ cards, eager, cart, fold }: { cards: ShelfCard[]; eager: number; cart: CartActions; fold?: string }) {
  const items = cards.map((c, i) => <li key={c.id}><ProductCard card={c} eager={i < eager} cart={cart} /></li>)
  const shelf = `${p.grid} ${s.shelf}`
  return fold
    ? <FoldGrid id={fold} className={shelf}>{items}</FoldGrid>
    : <ul className={shelf} data-catalog-grid="">{items}</ul>
}

/* Полка каталога, категории и поиска — одна раскладка (разбор 24.09.2026,
   пространственный тезис пакета B):

   1. Шапка страницы — имя, лид и, у поиска, поле поиска: поле спрашивает то
      же, что называет заголовок, и стоит с ним одной группой. Стояло между
      шапкой и полкой вне всякого столбика и упиралось в карточки без воздуха
      (разбор, Q2).
   2. Органы полки — одной полосой над ней, ближе к полке, чем к тексту (И740):
      «Filtre» словом слева, за ним выбранное пилюлями и «сбросить», порядок
      словом справа. Полку называет заголовок, в фильтре — имя его окна. Колонки фильтров
      сбоку больше нет: при двух гранях она отнимала у полки четвёртую
      колонку и растягивала первый экран одной колонкой на полтора окна
      (check:detect, `firstScreen`). На узком полоса — две равные кнопки:
      «Фильтры» (шторка) и порядок.
   3. Полка — вся ширина холста.
   4. Листание, а у пустого поиска — лучшее магазина, куда идти дальше.

   `inset` — каталог стоит образцом внутри другой страницы (дизайн-система,
   И605): корень — раздел, а не второй `main` со вторым якорем `#main`;
   главное на странице одно. `ids` — свои адреса формы граней и порядка у
   второго образца на той же странице. */
export function Catalog({ view, search, cart, inset = false, ids, after }: { view: CatalogView; search?: ReactNode; cart: CartActions; inset?: boolean; ids?: { filters: string; sort: string }; after?: ReactNode }) {
  const tools = Boolean(view.filters || view.sort || view.chips.length)
  const Root = inset ? 'section' : 'main'
  /* Адрес полки для «Показать ещё» свёртки — свой у образца в дизайн-системе (И754). */
  const grid = ids ? `${ids.filters}-grid` : 'shelf-grid'
  return (
    <Root id={inset ? undefined : 'main'} className={`${p.wrap} ${p.section}`} data-air="head">
      <div className={`${p.pagehead} ${s.head}`}>
        <h1>{view.title}</h1>
        {view.lede ? <p>{view.lede}</p> : null}
        {search ? <div className={s.search}>{search}</div> : null}
      </div>
      <div className={`${p.stack} ${s.area}`}>
        {tools || view.invalid ? (
          <div className={`${p.stack} ${s.tools}`}>
            {tools ? (
              <div className={`${p.cluster} ${s.bar}`}>
                {view.filters ? <Filters f={view.filters} id={ids?.filters} /> : null}
                {/* Счёт — сразу за «Filters», её размером и толщиной (слово заказчика
                    05.10.2026: «количество товаров передвинь левее к фильтру, размеры
                    должны быть одинаковы»; cbdshop.bg: «Намерени 16 продукта» в
                    строке фильтра): стоит на месте, сколько бы пилюль ни было;
                    читается вслух при смене выбора (`status`). Размер — роль
                    обычной кнопки, как у «Filters» и порядка (И758). */}
                {view.count ? <p className={s.count} role="status">{view.count}</p> : null}
                {/* Выбранное — пилюлями в той же строке, «сбросить» — словом (И740):
                    своей строки у выбранного нет — место по высоте у полки. */}
                {view.chips.length || view.clear ? <div className={`${p.cluster} ${s.picked}`}>
                  {view.chips.map((c) => <a key={c.href} className={p.chip} data-pill href={c.href} aria-label={c.said}>{c.label}<Icon id="x" /></a>)}
                  {view.clear ? <a className={b.btn} data-voice="bare" data-size="sm" href={view.clear.href}>{view.clear.label}</a> : null}
                </div> : null}
                {view.sort ? <SortMenu sort={view.sort} id={ids?.sort} /> : null}
              </div>
            ) : null}
            {view.invalid ? <p className={f.say} role="status">{view.invalid}</p> : null /* строка сообщения — одна на сайт (f.say, И476) */}
          </div>
        ) : null}
        {/* Полку подписывает заголовок страницы, второй на экране не нужен, но
            лестница для чтения вслух не прыгает с h1 на h3 имён товаров
            (check:craft, heads): h2 говорится и не рисуется (`said`). Одной
            коробкой со списком — чтобы ритм `stack` не лёг между невидимым
            заголовком и полкой. */}
        {/* Полка телефона шагами (И754): полка и строка листания — под одной
            свёрткой; новая полка (грани, порядок) — новая свёртка (`key`). */}
        {view.fold ? (
          <FoldShelf key={view.fold.at} fold={view.fold} grid={grid}>
            <div><h2 className={p.said}>{view.shelf}</h2><ShelfGrid cards={view.cards} eager={FIRST_SCREEN} cart={cart} fold={grid} /></div>
            <Pagination pages={view.pages} fold={view.fold} />
          </FoldShelf>
        ) : (
          <>
            {view.cards.length
              ? <div><h2 className={p.said}>{view.shelf}</h2><ShelfGrid cards={view.cards} eager={FIRST_SCREEN} cart={cart} /></div>
              : view.empty.title
                ? <StateScreen level={2} kind="none" title={view.empty.title} step={view.empty.step} href={view.empty.href} />
                : <div>{view.empty.hint ? <p className={p.muted}>{view.empty.hint}</p> : null}<p><a className={go.go} href={view.empty.href}>{view.empty.step}<Icon id="arrow-right" /></a></p></div>}
            {view.pages ? <Pagination pages={view.pages} /> : null}
          </>
        )}
        {view.more ? (
          <Shelf title={view.more.title} id="shelf-more" all={view.more.all} cards={view.more.cards} cart={cart} className={s.more} />
        ) : null}
      </div>
      {after}
    </Root>
  )
}
