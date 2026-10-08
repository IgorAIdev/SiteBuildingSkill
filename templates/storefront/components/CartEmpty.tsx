import type { CartPageView } from '@/lib/cart-view.ts'
import { ShelfRows } from './ShelfRows.tsx'
import { StateScreen } from './StateScreen.tsx'

/* Пустая корзина — слово и пути, ничего больше (слово заказчика 08.10.2026: «в пустой
   корзине предложи посмотреть категории примерно как в поиске: текст «ваша корзина
   пуста» и категории, не наляписто, минималистично»; И689). Заголовок экрана и под
   ним тихие строки со знаком — те же, что в окне поиска под пустым полем
   (`ShelfRows`): «все товары» первой, дальше главные полки. Ни знака в круге, ни
   громкой кнопки: путь — текст. Одна разметка на шторку, страницу корзины и образец
   в дизайн-системе. */
export function CartEmpty({ view, level }: { view: Pick<CartPageView, 'empty'>; level: 1 | 2 }) {
  const { title, shelves } = view.empty
  return <StateScreen level={level} kind="empty" title={title} after={<ShelfRows label={shelves.label} rows={shelves.links} />} />
}
