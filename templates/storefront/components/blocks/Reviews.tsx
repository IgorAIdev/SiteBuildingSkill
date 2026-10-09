import p from '@/styles/primitives.module.css'
import type { Block } from '@/lib/source/contract.ts'
import { reviewRail } from '@/lib/review-view.ts'
import { RailHead } from '../RailHead.tsx'
import { ReviewCard } from '../ReviewCard.tsx'
import type { BlockCtx, Place } from './types.ts'

/* Отзывы покупателей — после «Best sellers» (И728; docs/open.md, «Отзывы
   покупателей»): шапка ряда общая (RailHead), лента — рельса товаров, видео
   первыми, за ними текст. Отзывы — у источника (`ctx.reviews`), блок данных
   называет ряд. Отзывов нет — блока нет. Описание ряда — раскрытие: у образца —
   что это образцы, у настоящего магазина — как он проверяет отзывы (ЕС, Omnibus).
   Разметки отзывов на главной нет: звёзды в выдаче — только у товара и только
   настоящие (lib/ld.ts). */
export function Reviews({ block, ctx, place }: { block: Extract<Block, { type: 'reviews' }>; ctx: BlockCtx; place: Place }) {
  const rail = reviewRail(ctx.lang, ctx.reviews)
  if (!rail) return null
  return (
    <section className={`${p.wrap} ${p.section}`} data-air={place.air ?? undefined} aria-labelledby="reviews">
      <RailHead id="reviews" title={block.title} lede={block.lede} all={block.all ?? null} lang={ctx.lang} />
      <ul id="reviews-rail" className={p.rail} data-rail="goods">{rail.map((r) => <li key={r.id}><ReviewCard review={r} /></li>)}</ul>
    </section>
  )
}
