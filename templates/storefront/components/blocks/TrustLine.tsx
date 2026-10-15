import p from '@/styles/primitives.module.css'
import s from './blocks.module.css'
import b from '@/styles/btn.module.css'
import type { Block } from '@/lib/source/contract.ts'
import { hrefFor } from '@/lib/href.ts'
import type { BlockCtx } from './types.ts'

type Row = { key: string; title: string; href: string | null }

/** Факты доверия блока `trust` строками: лаборатория — словом
 *  блока, возврат — теми же фактами магазина, что у кнопки заказа
 *  (`ctx.pledges`, lib/pledges.ts), а не числом в слове: изменился срок —
 *  изменилась главная. Три факта, не два (слово владельца 15.10.2026: «два
 *  факта мало, обычно дают три»): лаборатория, доставка «от», возврат; доставка —
 *  тот же факт, что в верхней строке шапки, из тех же способов. Нет факта — нет строки. */
export function trustRows(block: Extract<Block, { type: 'trust' }>, ctx: BlockCtx): Row[] {
  const doc = (slug?: string) => (slug ? hrefFor(ctx.lang, { doc: slug }) : null)
  return [
    ...(block.lab ? [{ key: 'lab', title: block.lab.title, href: doc(block.lab.doc) }] : []),
    ...ctx.pledges.items.map((x, at) => ({ key: `pledge-${at}`, title: x.text, href: doc(x.icon === 'check-shield' ? block.returnsDoc : block.deliveryDoc) })),
  ]
}

/* Ряд доверия — одна линия: факты словами, без значков (слово владельца 16.10.2026:
   «иконки убирай, текст оставь»), рядом, тесно — переносятся целиком (примитив `cluster`). Стоит в первом окне
   над рядом кнопок героя (слово владельца 15.10.2026: «выше кнопки магазина») и там, где рецепт ставит блок отдельным
   местом (Trust.tsx). Факт со страницей-доказательством — ссылка целиком. Нет ни
   одного факта — нет и ряда. */
export function TrustLine({ block, ctx }: { block: Extract<Block, { type: 'trust' }>; ctx: BlockCtx }) {
  const rows = trustRows(block, ctx)
  if (!rows.length) return null
  return (
    <ul className={`${p.cluster} ${s.trustLine}`} aria-label={block.title || undefined}>
      {rows.map((row) => {
        const body = <span className={s.trustTitle}>{row.title}</span>
        return <li key={row.key}>{row.href ? <a className={`${b.row} ${s.trustRow}`} href={row.href}>{body}</a> : <span className={s.trustRow}>{body}</span>}</li>
      })}
    </ul>
  )
}
