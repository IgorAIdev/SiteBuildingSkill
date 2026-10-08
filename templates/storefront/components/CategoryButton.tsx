import type { CSSProperties } from 'react'
import b from '@/styles/btn.module.css'
import { Icon } from './Icon.tsx'

/* Кнопка категории — одна на сайт: ряд категорий на снимке героя (Hero.tsx)
   и вкладка «Кнопки» дизайн-системы берут её отсюда, а не рисуют вторую.
   «Кружок со стрелкой», в кружке знак товара полки (styles/btn.module.css,
   `data-cat`, `signDot`); знака нет — в кружке стрелка. Со ссылкой — ссылка
   на полку; без неё — образец кнопкой. `style` — краски образца (Fill,
   Gradient) на самой кнопке.
   Кнопка — плашка со своим полом (`data-plate`, styles/base.css): на палубе
   героя и на снимке она та же, что на листе дизайн-системы, — тихая плашка,
   чернила, кружок цвета листа; роли палубы сделали бы её тёмным пятном. */
/* Главной среди кнопок пути нет (слово заказчика 04.10.2026: «в херо блоке все
   кнопки сделать одинаковыми, а Shop выделить, написав Shop all»; как у Allbirds —
   «Shop Men» и «Shop Women» равными пилюлями): «Shop all» отличает слово, а не
   заливка. До того «В магазин» стоял громкой заливкой марки (`lead`, И697). */
export function CategoryButton({ name, sign, href, size, style }: { name: string; sign: string | null; href?: string; size?: 'lg'; style?: CSSProperties }) {
  const inner = <><span className={b.catName}>{name}</span>{sign ? <Icon id={sign} className={b.signDot} /> : null}</>
  return href
    ? <a className={b.btn} data-voice="loud" data-shape data-cat data-plate="" data-size={size} href={href} style={style}>{inner}</a>
    : <button className={b.btn} data-voice="loud" data-shape data-cat data-plate="" data-size={size} type="button" style={style}>{inner}</button>
}
