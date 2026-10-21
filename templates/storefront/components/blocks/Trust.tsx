import p from '@/styles/primitives.module.css'
import type { Block } from '@/lib/source/contract.ts'
import type { BlockCtx, Place } from './types.ts'
import { TrustLine, trustRows } from './TrustLine.tsx'

/* Ряд доказательств отдельным местом страницы — там, где рецепт главной его
   называет (одежда `sport`, lib/homes.ts). У остальных одежд ряд несёт герой над
   рядом кнопок (Hero.tsx, `carried`), и этого места нет. Ряд — подпись, а не
   раздел: заголовка на странице нет, имя ряда для чтеца с экрана несёт
   `aria-label` (TrustLine.tsx). */
export function Trust({ block, ctx, place }: { block: Extract<Block, { type: 'trust' }>; ctx: BlockCtx; place: Place }) {
  if (!trustRows(block, ctx).length) return null
  return (
    <section className={`${p.wrap} ${p.section}`} data-air={place.air ?? undefined}>
      <TrustLine block={block} ctx={ctx} />
    </section>
  )
}
