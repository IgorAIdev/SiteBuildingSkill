import p from '@/styles/primitives.module.css'
import go from '@/styles/go.module.css'
import s from './Checkout.module.css'
import c from './Cart.module.css'
import type { OrderPageView } from '@/lib/account-view.ts'
import { OrderReview } from './OrderReview.tsx'
import { OrderTotals } from './OrderTotals.tsx'
import { Icon } from './Icon.tsx'

/* Заказ в кабинете (И771) — рама «спасибо» (OrderDone): номер именем
   страницы, под ним когда поставлен и в каком состоянии; слева — как
   приедет, чем платится, кому, товары со снимками; справа — итог и путь
   назад в кабинет. Детали — те же части, что у кассы: сверка, товары, итоги.
   `landmark={false}` — образцом в дизайн-системе, у которой свой `main`. */
export function OrderPage({ view, landmark = true }: { view: OrderPageView; landmark?: boolean }) {
  const Main = landmark ? 'main' : 'div'
  return (
    <Main id={landmark ? 'main' : undefined} className={`${p.wrap} ${p.section}`} data-air="head">
      <div className={p.pagehead}>
        <h1>{view.title}</h1>
        <p>{view.meta}</p>
      </div>
      <div className={`${p.sidebar} ${s.frame}`}>
        <div className={`${s.done} ${s.measure}`}>
          <OrderReview title={view.review} recaps={view.recaps} itemsTitle={view.itemsTitle} items={view.items} />
        </div>
        <aside className={p.aside}>
          <div className={`${p.stack} ${p.pinned} ${c.summary}`}>
            <OrderTotals totals={view.totals} />
            <a className={`${go.go} ${p.tap}`} data-to="back" href={view.back.href}><Icon id="arrow-left" />{view.back.label}</a>
          </div>
        </aside>
      </div>
    </Main>
  )
}
