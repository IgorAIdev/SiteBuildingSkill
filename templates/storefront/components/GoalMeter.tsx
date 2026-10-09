import s from './GoalMeter.module.css'
import type { GoalView } from '@/lib/cart-view.ts'
import { Icon } from './Icon.tsx'

/* Полоса до бесплатной доставки: «добавьте ещё 12,40 €» над полосой; взят
   порог — грузовик и «доставка бесплатна», полоса краской успеха. Слова,
   сумма и порог приходят готовыми (`goalView`): компонент не считает деньги.
   Вид живёт в `GoalMeter.module.css`; образцы и выбор вида — дизайн-система,
   «Поля и индикаторы». Живая область: на шаге счётчика слова меняются, и
   чтец экрана их проговаривает. */
export function GoalMeter({ goal }: { goal: GoalView }) {
  const done = goal.left === null
  return (
    <div className={s.goal} aria-live="polite">
      <p className={s.say}>{goal.left ? <span>{goal.left[0]}<b>{goal.left[1]}</b>{goal.left[2]}</span> : <><Icon id="truck" /><span>{goal.done}</span></>}</p>
      <progress className={s.meter} data-tone={done ? 'ok' : undefined} value={goal.value} max={goal.max} aria-label={goal.label} />
    </div>
  )
}
