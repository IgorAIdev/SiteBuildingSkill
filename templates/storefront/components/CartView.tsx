import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import s from './Cart.module.css'
import type { CartPageView, ShelfView } from '@/lib/cart-view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { CartForm } from './CartForm.tsx'
import { CartCoupon } from './CartCoupon.tsx'
import { OrderTotals } from './OrderTotals.tsx'
import { Shelf } from './Shelf.tsx'
import { CartEmpty } from './CartEmpty.tsx'
import { CartFresh } from './CartFresh.tsx'
import { CartLines } from './CartLines.tsx'
import { GoalMeter } from './GoalMeter.tsx'

type Actions = { submit: (form: FormData) => Promise<void>; call: (form: FormData) => Promise<Outcome> }

/* Полка пустой корзины — ходовые товары из данных (сортировка источника
   «popular»), той же карточкой и сеткой, что полка главной: пустая корзина —
   не тупик, а следующий шаг (разбор 24.09.2026, K5). */
function Popular({ shelf, cart }: { shelf: ShelfView; cart: Actions }) {
  return <Shelf title={shelf.title} id="cart-popular" all={shelf.all} cards={shelf.cards} cart={cart} />
}

/* Корзина: строки товара слева, сводка — листом рядом, что едет с
   прокруткой (pinned).

   Строка — товар, а не сводка (И49, И63): снимок в колодце, имя, факты
   варианта и цена за штуку вверху справа; под именем — счётчик, и в его
   ряду, у правого края, сумма строки; под снимком, по его левому краю, —
   «Удалить» (И551, И668). Органы стоят под тем, что меняют: имя и его
   счётчик не разнесены на полстроки (разбор 24.09.2026, K2), и раскладка
   одна на все ширины. Строка ведёт на свой вариант
   целиком (И110): ссылка имени растянута на строку, органы подняты над ней.

   Сводка — порядком решения: итоги, одна громкая кнопка, под ней обещания
   из данных (K4), и только потом код скидки, свёрнутый под вопросом (И497,
   разбор impeccable 27.09.2026): вопрос о купоне над итогом уводил
   покупателя искать код, не дойдя до кнопки (Baymard, «coupon field»).

   `landmark={false}` — корзина образцом внутри чужой страницы (дизайн-
   система): у той уже есть свой `main` и его адрес `#main`. */
export function CartView({ lang, view, submit, call, landmark = true }: { lang: string; view: CartPageView; landmark?: boolean } & Actions) {
  const msgs = { timeout: view.messages.timeout, failed: view.messages.failed }
  const Main = landmark ? 'main' : 'div'
  const main = landmark ? 'main' : undefined
  if (!view.lines.length) {
    return (
      <Main id={main} className={`${p.wrap} ${p.section}`} data-air="head">
        {/* Строка исхода — та же, что у формы корзины (`f.say`, И476): одна на сайт. */}
        {view.notice ? <p className={f.say} data-state={view.notice.kind === 'error' ? 'error' : undefined} role="status">{view.notice.message}</p> : null}
        <CartFresh lang={lang} stamp={view.stamp} />
        <CartEmpty level={1} view={view} />
        {view.empty.shelf ? <Popular shelf={view.empty.shelf} cart={{ submit, call }} /> : null}
      </Main>
    )
  }
  return (
    <Main id={main} className={`${p.wrap} ${p.section}`} data-air="head">
      <CartFresh lang={lang} stamp={view.stamp} />
      <div className={p.pagehead}><h1>{view.title}</h1><p className={p.note}>{view.count}</p></div>
      <div className={p.sidebar}>
        <div className={s.sheet}>
          <CartForm lang={lang} submit={submit} call={call} initial={view.notice} {...msgs}>
            <CartLines lines={view.lines} />
          </CartForm>
        </div>
        <aside className={p.aside} aria-labelledby="cart-summary">
          <h2 id="cart-summary" className={p.said}>{view.summary}</h2>
          <div className={`${p.stack} ${p.pinned} ${s.summary}`}>
            {view.goal ? <GoalMeter goal={view.goal} /> : null}
            <OrderTotals totals={view.totals} />
            <a className={b.btn} data-voice="loud" data-size="lg" data-wide href={view.checkout.href}>{view.checkout.label}</a>
            <CartCoupon lang={lang} view={view} submit={submit} call={call} />
          </div>
        </aside>
      </div>
    </Main>
  )
}
