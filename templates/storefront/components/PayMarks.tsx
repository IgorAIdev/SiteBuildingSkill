import p from '@/styles/primitives.module.css'
import s from './PayMarks.module.css'
import { PAYMENTS } from '@/lib/company.ts'
import { Icon } from './Icon.tsx'
import { SIGN } from './marks.ts'

/* Знаки способов оплаты — одним рядом, без пилюль (слово заказчика 08.10.2026: «нужны ли
   пилюли (фон) у иконок платёжных систем… может убрать»). Пилюля — вид нажимаемой фишки
   (меню, грани, тихая кнопка), а знак оплаты не нажимают: плашка под ним обещала действие,
   которого нет, и вносила в подвал ещё одну форму кроме кнопок. Замер 08.10.2026 у
   Gymshark, Naturecan (CBD, Румыния), cbdin.bg: знаки в нижнем ярусе над строкой прав, у
   первых двух — без плашки, 24–25 в высоту. Один компонент на подвал и дизайн-систему
   (правило 10). Данные — `PAYMENTS`, знаки — лист (`marks.ts`). */
export function PayMarks({ label }: { label: string }) {
  return (
    <ul className={`${p.cluster} ${s.pay}`} aria-label={label}>
      {PAYMENTS.map((x) => <li key={x.key}><span className={s.mark} role="img" aria-label={x.label}><Icon id={SIGN[x.key]} /></span></li>)}
    </ul>
  )
}
