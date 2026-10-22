import p from '@/styles/primitives.module.css'
import s from './ProductRow.module.css'
import type { ShelfCard } from '@/lib/view.ts'
import { shot } from '@/lib/shot.ts'
import { SiteLink } from './SiteLink.tsx'

/* Строка товара — снимок, марка и имя, факты, цена; вся строка — одна ссылка, ответ на
   руку — вида «строка» (`row`). Одна на сайт (правило 10): находки окна поиска и товар у
   чтения статьи (ReadAlong). Была собрана на месте в окне поиска; колонке статьи нужна
   та же строка — три товара в окно, где целая карточка помещалась одна (заказчик
   22.10.2026: «в статье и 2 и 3 продукта можно показывать, одного маловато»). Факты
   («1000 mg · 10 ml») различают товары одного имени — у образца все масла зовутся
   одинаково. */
export function ProductRow({ card, facts = false }: { card: ShelfCard; facts?: boolean }) {
  return (
    <SiteLink className={s.hit} href={card.href}>
      <span className={`${p.frame} ${s.thumb}`}><img {...shot(card.image, 'thumb', true)} alt="" decoding="async" /></span>
      <span className={s.what}>
        {card.brand ? <span className={s.brand} translate="no">{card.brand}</span> : null}
        <span className={s.name}>{card.name}</span>
        {facts && card.facts ? <span className={s.facts}>{card.facts}</span> : null}
      </span>
      <span className={s.price}>{card.price}</span>
    </SiteLink>
  )
}
