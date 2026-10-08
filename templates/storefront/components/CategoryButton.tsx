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
/* Главная в ряду пути — одна: «Shop all» стоит заливкой основного цвета, кнопки
   полок — `quiet`, тихие, как все тихие кнопки сайта (слово заказчика 08.10.2026:
   «только Shop all с заливкой и яркой главной, остальные кнопки категорий тихие»;
   прежде, 04.10.2026, все были равны и заливкой, И746). Тихая берёт роли тихой
   кнопки каталога (`--ctrl-btn-fill/ink/edge`, ось «Тихая» панели), а не свои, и
   перекрашивается вместе с ними; форма и кружок со знаком — те же. */
export function CategoryButton({ name, sign, href, size, style, quiet }: { name: string; sign: string | null; href?: string; size?: 'lg'; style?: CSSProperties; quiet?: boolean }) {
  const inner = <><span className={b.catName}>{name}</span>{sign ? <Icon id={sign} className={b.signDot} /> : null}</>
  return href
    ? <a className={b.btn} data-voice="loud" data-shape data-cat={quiet ? 'quiet' : ''} data-plate="" data-size={size} href={href} style={style}>{inner}</a>
    : <button className={b.btn} data-voice="loud" data-shape data-cat={quiet ? 'quiet' : ''} data-plate="" data-size={size} type="button" style={style}>{inner}</button>
}
