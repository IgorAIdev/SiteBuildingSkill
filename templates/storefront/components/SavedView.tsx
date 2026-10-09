import p from '@/styles/primitives.module.css'
import type { Lang } from '@/lib/locale.ts'
import { shelfCard, type ShelfCard } from '@/lib/view.ts'
import type { Card } from '@/lib/source/contract.ts'
import { t } from '@/lib/i18n/index.ts'
import type { CartActions } from './ProductCard.tsx'
import { ShelfGrid, FIRST_SCREEN } from './Catalog.tsx'

/** Карточки полки избранного из карточек источника — функцией, а не `.map` на
 *  месте: массив, собранный в теле страницы и переданный в проп, новый на
 *  каждый рендер (react-perf). */
export const savedCards = (lang: Lang, items: Card[]): ShelfCard[] => items.map((c) => shelfCard(lang, c))

/* Тело страницы избранного — имя, строка о ней и полка сохранённых карточек — та же, что у каталога (`ShelfGrid`).
   Одно на страницу сайта (app/[lang]/saved) и на образец в дизайн-системе
   (look-panel/design/CatalogPages.tsx): рисуется один раз (правило 10). Пустой
   список — экран состояния, его рисует сама страница. */
export function SavedView({ lang, cards, cart }: { lang: Lang; cards: ShelfCard[]; cart: CartActions }) {
  return (
    <>
      <div className={p.pagehead}><h1>{t(lang, 'saved.title')}</h1><p>{t(lang, 'saved.lede')}</p></div>
      <ShelfGrid cards={cards} eager={FIRST_SCREEN} cart={cart} />
    </>
  )
}
