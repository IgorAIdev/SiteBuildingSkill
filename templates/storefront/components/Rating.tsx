import s from './Rating.module.css'
import type { RatingView, Star } from '@/lib/product-view.ts'
import { Icon } from './Icon.tsx'

/* Оценка покупателей — строкой у имени товара (И512; слово заказчика
   28.09.2026: «отзывы — где-то расположить звёзды, но так, чтобы, если их
   не будет, дизайн не пострадал»). Отзывов нет — пять пустых звёзд и
   «пока нет отзывов» (слово заказчика 30.09.2026: «давай всем ставь
   звёзды»; И590): строка у каждого товара, имя стоит одинаково.

   Звезда — залитый знак листа (`star-fill`), заливка — половинами: пустая
   звезда краской кромки, поверх — залитая, срезанная до половины у
   `half`. Чтец слышит одну фразу (`label`), а не пять картинок. */
export function Rating({ rating }: { rating: RatingView }) {
  return (
    <p className={s.rating} role="img" aria-label={rating.label}>
      <StarRow stars={rating.stars} />
      {rating.value === null ? <span aria-hidden="true">{rating.label}</span> : <><span className={s.value}>{rating.value}</span><span>({rating.count})</span></>}
    </p>
  )
}

/* Звёзды одного отзыва — тот же ряд без числа и счёта (карточка отзыва,
   И728): рисунок звезды один на сайт, здесь. */
export function Stars({ stars, label }: { stars: readonly Star[]; label: string }) {
  return <p className={s.rating} role="img" aria-label={label}><StarRow stars={stars} /></p>
}

function StarRow({ stars }: { stars: readonly Star[] }) {
  return (
    <span className={s.stars}>
      {stars.map((on, i) => ({ on, place: i + 1 })).map(({ on, place }) => <span key={place} className={s.star} data-on={on}><Icon id="star-fill" /><Icon id="star-fill" /></span>)}
    </span>
  )
}
