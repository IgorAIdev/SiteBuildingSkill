import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import s from './Cart.module.css'
import type { CartPageView } from '@/lib/cart-view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { CartForm } from './CartForm.tsx'
import { Icon } from './Icon.tsx'
import { Turn } from './Turn.tsx'

type Actions = { submit: (form: FormData) => Promise<void>; call: (form: FormData) => Promise<Outcome> }

/* Код скидки — один на страницу корзины и её шторку (правило 10): вынесен из
   CartView, чтобы шторка (клиентский модуль) брала его, не таща за собой страницу.
   В шторке он стоит в неподвижном низу над итогом (И693). */
/** Код скидки — последним в сводке, под волоском (И497): свёрнут под
 *  вопросом, применённый код — пилюлей снятия, видной и при свёрнутом
 *  вопросе. Волосок — у обёртки, а не у взятой формы: форма корзины одна на
 *  сайт, и место её не красит (check:system, placePaints). */
export function CartCoupon({ lang, view, submit, call }: { lang: string; view: Pick<CartPageView, 'coupon' | 'couponNotice' | 'messages'> } & Actions) {
  return (
    <div className={s.coupon}>
      <CartForm lang={lang} className={s.couponForm} submit={submit} call={call} initial={view.couponNotice} timeout={view.messages.timeout} failed={view.messages.failed}>
        <details className={s.promo} open={view.coupon.open}>
          <summary className={b.word}>{view.coupon.ask}<Turn /></summary>
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
  )
}
