import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import go from '@/styles/go.module.css'
import type { ShelfCard } from '@/lib/view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { ProductCard } from './ProductCard.tsx'
import { Icon } from './Icon.tsx'
import { RailArrows } from './RailArrows.tsx'
import { t } from '@/lib/i18n/index.ts'

type Cart = { submit: (form: FormData) => Promise<void>; call: (form: FormData) => Promise<Outcome> }

/* Полка товаров — одна на сайт (И481): полка главной, ходовые пустой
   корзины и «похожие» карты товара. До 27.09.2026 каждая писала свой
   заголовок и свою рельсу, и «смотреть всё» было у двух из трёх — у похожих
   выхода к полке не было вовсе.

   Заголовок и выход ко всей полке — одной строкой, выход у правого края:
   он отвечает на другой вопрос; тесно — уходит под заголовок сам. Товары —
   рельсой (`rail`, `data-rail="goods"`): карточка крупнее сетки магазина, и
   соседняя выглядывает (И469). `id` — у заголовка, имя секции для чтеца;
   `className` — у секции (холст главной, воздух блока). */
export function Shelf({ title, id, all, cards, cart, eager = 0, className = '', air }: {
  title: string; id: string; all: { label: string; href: string } | null; cards: ShelfCard[]; cart: Cart; eager?: number; className?: string; air?: string
}): ReactNode {
  if (!cards.length) return null
  return (
    <section className={`${p.section} ${className}`} aria-labelledby={id} data-air={air}>
      <div className={p.sectionHead} data-row>
        <h2 id={id}>{title}</h2>
        {/* Выход ко всей полке и стрелки листания — одной группой у правого
            края (И502). */}
        <div className={p.cluster}>
          {all ? <a className={go.go} href={all.href}>{all.label}<Icon id="arrow-right" /></a> : null}
          <RailArrows rail={`${id}-rail`} back={t(cards[0].lang, 'shelf.prev')} next={t(cards[0].lang, 'shelf.next')} />
        </div>
      </div>
      <ul id={`${id}-rail`} className={p.rail} data-rail="goods">{cards.map((c, i) => <li key={c.id}><ProductCard card={c} eager={i < eager} cart={cart} /></li>)}</ul>
    </section>
  )
}
