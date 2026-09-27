import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import go from '@/styles/go.module.css'
import s from './Cart.module.css'
import type { CartPageView, ShelfView } from '@/lib/cart-view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { CartForm } from './CartForm.tsx'
import { OrderTotals } from './OrderTotals.tsx'
import { Pledges } from './Pledges.tsx'
import { Shelf } from './Shelf.tsx'
import { QuantityStepper } from './QuantityStepper.tsx'
import { StateScreen } from './StateScreen.tsx'
import { Icon } from './Icon.tsx'
import { Turn } from './Turn.tsx'
import { shot } from '@/lib/shot.ts'

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
   варианта и цена за штуку, сумма строки у правого края; под именем —
   счётчик и «Удалить». Органы стоят под тем, что меняют: имя и его счётчик
   не разнесены на полстроки (разбор 24.09.2026, K2), и раскладка одна на
   все ширины. Строка ведёт на свой вариант целиком (И110): ссылка имени
   растянута на строку, органы подняты над ней одним родителем.

   Сводка — порядком решения: итоги, одна громкая кнопка, под ней обещания
   из данных (K4), и только потом код скидки, свёрнутый под вопросом (И497,
   разбор impeccable 27.09.2026): вопрос о купоне над итогом уводил
   покупателя искать код, не дойдя до кнопки (Baymard, «coupon field»). */
export function CartView({ lang, view, submit, call }: { lang: string; view: CartPageView } & Actions) {
  const msgs = { timeout: view.messages.timeout, failed: view.messages.failed }
  if (!view.lines.length) {
    return (
      <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
        {/* Строка исхода — та же, что у формы корзины (`f.say`, И476): одна на сайт. */}
        {view.notice ? <p className={f.say} data-state={view.notice.kind === 'error' ? 'error' : undefined} role="status">{view.notice.message}</p> : null}
        <StateScreen level={1} kind="empty" title={view.empty.title} step={view.empty.step} href={view.empty.href} icon="shopping-cart" loud />
        {view.empty.shelf ? <Popular shelf={view.empty.shelf} cart={{ submit, call }} /> : null}
      </main>
    )
  }
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <div className={p.pagehead}><h1>{view.title}</h1><p className={p.note}>{view.count}</p></div>
      <div className={p.sidebar}>
        <CartForm lang={lang} submit={submit} call={call} initial={view.notice} {...msgs}>
          <ul className={s.list}>
            {view.lines.map((l) => (
              <li key={l.id} className={s.line}>
                <div className={`${p.frame} ${s.thumb}`}><img {...shot(l.image, 'thumb', true)} alt="" decoding="async" /></div>
                <div className={s.what}>
                  <a className={s.name} href={l.href}>{l.name}</a>
                  {l.facts ? <p className={p.note}>{l.facts}</p> : null}
                  <p className={p.note}>{l.unit}</p>
                </div>
                <p className={s.sum}>{l.total}</p>
                <div className={s.act}>
                  <QuantityStepper ops={l.stepper} />
                  <button className={go.go} type="submit" name="op" value={l.remove.op} aria-label={l.remove.label} data-remove>{l.remove.text}</button>
                </div>
              </li>
            ))}
          </ul>
        </CartForm>
        <aside className={p.aside} aria-labelledby="cart-summary">
          <h2 id="cart-summary" className={p.said}>{view.summary}</h2>
          <div className={`${p.stack} ${p.pinned} ${s.summary}`}>
            <OrderTotals totals={view.totals} />
            <div className={s.decide}>
              <a className={b.btn} data-voice="loud" data-size="lg" data-wide href={view.checkout.href}>{view.checkout.label}</a>
              <Pledges pledges={view.pledges} />
            </div>
            <CartForm lang={lang} className={s.coupon} submit={submit} call={call} initial={view.couponNotice} {...msgs}>
              <details className={s.promo} open={view.coupon.open}>
                <summary>{view.coupon.ask}<Turn /></summary>
                <div className={`${f.send} ${s.code}`}>
                  <label className={f.field}>
                    <span className={p.said}>{view.coupon.label}</span>
                    <input className={f.box} name="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} />
                  </label>
                  <button className={b.btn} type="submit" name="op" value="coupon">{view.coupon.apply}</button>
                </div>
              </details>
              {view.coupon.applied.length ? (
                <div className={p.cluster}>
                  {view.coupon.applied.map((c) => (
                    <button key={c.code} className={p.chip} type="submit" name="op" value={c.op} aria-label={c.label}>{c.code}<Icon id="x" /></button>
                  ))}
                </div>
              ) : null}
            </CartForm>
          </div>
        </aside>
      </div>
    </main>
  )
}
