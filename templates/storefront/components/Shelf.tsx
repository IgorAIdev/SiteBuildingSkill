import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import type { ShelfCard } from '@/lib/view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { ProductCard } from './ProductCard.tsx'
import { RailHead } from './RailHead.tsx'

type Cart = { submit: (form: FormData) => Promise<void>; call: (form: FormData) => Promise<Outcome> }

/* Полка товаров — одна на сайт (И481): полка главной, ходовые пустой
   корзины и «похожие» карты товара. До 27.09.2026 каждая писала свой
   заголовок и свою рельсу, и «смотреть всё» было у двух из трёх — у похожих
   выхода к полке не было вовсе.

   Слово выхода — одно у всех полок и живёт в шапке ряда (RailHead, «View all»): данные дают
   только адрес. Прежде слово несла каждая полка своё — «View all» у одних,
   «All products» у других (заказчик 28.09.2026: «должны иметь один источник
   и быть одинаковыми»; И536).

   Заголовок и выход ко всей полке — одной строкой, выход у правого края:
   он отвечает на другой вопрос; тесно — уходит под заголовок сам. Товары —
   рельсой (`rail`, `data-rail="goods"`): карточка крупнее сетки магазина, и
   соседняя выглядывает (И469). `id` — у заголовка, имя секции для чтеца;
   `className` — у секции (холст главной, воздух блока). */
export function Shelf({ title, lede, id, all, cards, cart, eager = 0, className = '', air }: {
  title: string; lede?: string; id: string; all: string | null; cards: ShelfCard[]; cart: Cart; eager?: number; className?: string; air?: string
}): ReactNode {
  if (!cards.length) return null
  return (
    <section className={`${p.section} ${className}`} aria-labelledby={id} data-air={air}>
      {/* Шапка ряда — общая (RailHead): заголовок и описание, кнопки
          листания и выход ко всей полке (`all`) — набор «Уголок» (рост 40) на место
          прежнего, снятого словом заказчика 02.10.2026. */}
      <RailHead id={id} title={title} lede={lede} all={all} lang={cards[0].lang} />
      <ul id={`${id}-rail`} className={p.rail} data-rail="goods">{cards.map((c, i) => <li key={c.id}><ProductCard card={c} eager={i < eager} cart={cart} /></li>)}</ul>
    </section>
  )
}
