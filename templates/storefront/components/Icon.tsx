import BOXES from '@/styles/icons.json'

/* Окна знаков не квадратом (знаки оплаты, И549) — справка листа
   (tools/icons.mjs → styles/icons.json): пропорция окна (`0 0 w h`) стоит
   и на самом `<svg>`, и тогда ширина знака идёт от его рисунка, а высоту
   задаёт место одним числом; обрезку делает знак в листе, не место (И560).
   У квадратных знаков окна на месте нет — размер задаёт место. */
const BOX: Record<string, string> = BOXES

/* Знак из листа основы (styles/icons.svg → public/icons.svg). Рисунок — в
   листе, имя — у кнопки или ссылки рядом (у безмолвной — aria-label). */
/* Знак с окном не квадратом рисуется без обрезки: его окно стоит по
   ГЛАВНОМУ рисунку (яблоко, «G», круги), и хвост ниже — «y» в Pay — выходит
   за окно (assets/icons/pay/LICENSE). Это свойство знака, а не места: пока
   его давала только пилюля подвала, на странице знаков «y» резался
   (заказчик 01.10.2026, И604). */
export function Icon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} viewBox={BOX[id]} overflow={BOX[id] ? 'visible' : undefined} aria-hidden="true" focusable="false">
      <use href={`/icons.svg#${id}`} />
    </svg>
  )
}
