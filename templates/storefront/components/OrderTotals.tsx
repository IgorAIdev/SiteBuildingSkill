import p from '@/styles/primitives.module.css'
import s from './Cart.module.css'
import type { TotalsView } from '@/lib/cart-view.ts'

/* Итоги — одни на корзину, оформление и «спасибо». Итог — самое крупное
   число, но не заголовок (скилл shop, И69); «с НДС» — сноской в строке
   итога, рядом с его подписью, а не своей строкой под ним (И49). */
export function OrderTotals({ totals }: { totals: TotalsView }) {
  return (
    <div className={s.tally}>
      <dl className={s.totals}>
        {totals.rows.map((r) => <div key={r.label} className={s.row}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
        <div className={`${s.row} ${s.grand}`}><dt>{totals.total.label} <span className={p.note}>{totals.note}</span></dt><dd>{totals.total.value}</dd></div>
      </dl>
    </div>
  )
}
