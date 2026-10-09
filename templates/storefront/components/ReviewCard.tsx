import p from '@/styles/primitives.module.css'
import go from '@/styles/go.module.css'
import s from './ReviewCard.module.css'
import type { ReviewView } from '@/lib/review-view.ts'
import { Stars } from './Rating.tsx'
import { Icon } from './Icon.tsx'
import { ReviewPlay } from './ReviewPlay.tsx'

/* Карточка отзыва — одна на сайт (И728): лента отзывов главной и образцы
   дизайн-системы. Устройство — по образцу HyperUI «Reviews with Star Rating»
   (MIT, Mark Mead; звёзды, отметка покупки, заголовок, текст, имя, время) и
   daisyUI Rating (MIT; звёзды только для чтения одной фразой для чтеца); взято
   устройство, не код — формы и роли сайта.

   Две карточки одной меры: кадр 2 : 3 и подпись под ним. У видео в кадре
   постер с кругом «пуск» (ReviewPlay), под ним звёзды и цитата в две строки; у
   текста кадр — тихий лист с кромкой: звёзды, заголовок, цитата до шести строк.
   Кадры одной меры — ряд ровный по верху и низу кадров, сколько бы слов ни
   было (бриф docs/design/home.md §9). Подпись у обеих одна: имя и отметка,
   дата, товар.

   Отметку («Verified buyer» или «Sample review») решает вид (lib/review-view.ts),
   а не карточка; разметки отзывов здесь нет — главная её не несёт. */
export function ReviewCard({ review: r }: { review: ReviewView }) {
  if (r.video) {
    return (
      <article className={s.card} data-review="video">
        <ReviewPlay video={r.video}>
          <div className={s.say}>
            <Stars stars={r.stars} label={r.label} />
            {r.title ? <p className={s.title}>{r.title}</p> : null}
            <blockquote className={s.quote}><p>{r.body}</p></blockquote>
          </div>
          {r.product ? <Product product={r.product} /> : null}
        </ReviewPlay>
        <div className={s.caption}>
          <div className={s.say}>
            <Stars stars={r.stars} label={r.label} />
            <blockquote className={s.gist}><p>{r.body}</p></blockquote>
          </div>
          <Byline r={r} />
        </div>
      </article>
    )
  }
  return (
    <article className={s.card} data-review="text">
      <div className={`${p.frame} ${s.plate}`}>
        <Stars stars={r.stars} label={r.label} />
        {r.title ? <h3 className={s.title}>{r.title}</h3> : null}
        <blockquote className={s.quote} data-clamp=""><p>{r.body}</p></blockquote>
      </div>
      <div className={s.caption}><Byline r={r} /></div>
    </article>
  )
}

/* Кто, когда, о чём. Отметка — словом, знак проверки — только у проверенного:
   у образца знака нет, есть слово «образец». */
function Byline({ r }: { r: ReviewView }) {
  return (
    <div className={s.by}>
      <p className={s.who}>
        <span className={s.name}>{r.author}</span>
        {r.mark ? <span className={s.mark}>{r.mark.verified ? <Icon id="check-badge" /> : null}{r.mark.text}</span> : null}
      </p>
      <p className={p.note}><time dateTime={r.date.iso}>{r.date.text}</time></p>
      {r.product ? <Product product={r.product} /> : null}
    </div>
  )
}

function Product({ product }: { product: NonNullable<ReviewView['product']> }) {
  return <a className={`${go.go} ${s.product}`} href={product.href}>{product.name}<Icon id="arrow-right" /></a>
}
