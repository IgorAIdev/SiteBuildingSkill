import p from '@/styles/primitives.module.css'
import s from './Cart.module.css'
import type { ShelvesView } from '@/lib/cart-view.ts'
import { CategoryButton } from './CategoryButton.tsx'

/* Пустая корзина — не тупик (слово заказчика 03.10.2026: «корзина если пустая,
   то нужно предложить товар категории»; И689): под «к покупкам» — главные
   полки магазина кнопками категорий сайта со знаком товара, теми же, что под
   абзацем героя и в окне поиска. Какие полки — данные главной (`mainShelves`);
   одна разметка на шторку и страницу корзины. */
export function CartShelves({ view }: { view: ShelvesView }) {
  return (
    <nav className={s.shelves} aria-label={view.label}>
      <ul className={p.cluster}>
        {view.links.map((x) => <li key={x.href}><CategoryButton name={x.name} sign={x.sign} href={x.href} /></li>)}
      </ul>
    </nav>
  )
}
