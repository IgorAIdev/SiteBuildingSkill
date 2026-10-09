import type { Lang } from './locale.ts'
import type { Image, Review } from './source/contract.ts'
import type { Star } from './product-view.ts'
import { REVIEWS_ARE_REAL } from './flags.ts'
import { dayOf } from './format.ts'
import { t } from './i18n/index.ts'

/** Отметка у имени: «Verified buyer» у отзыва, привязанного к заказу, или
 *  «Sample review» у образца; `verified` — ставить ли знак проверки. */
export type ReviewMark = { text: string; verified: boolean }
/** Отзыв, готовый к карточке (components/ReviewCard.tsx, И728): звёзды
 *  целыми и фраза для чтеца, дата словами и ISO, отметка, ролик со словами
 *  кнопки и окна. Компонент не считает и не решает, что честно. */
export type ReviewView = {
  id: string; stars: Star[]; label: string; title: string | null; body: string; author: string
  mark: ReviewMark | null; date: { iso: string; text: string }; product: { name: string; href: string } | null
  video: { src: string; poster: Image; captions: string | null; play: string; heading: string; close: string; lang: Lang } | null
}

/* Честность — флагом настоящести, а не словом в данных (И728): пока отзывы
   образцовые (`REVIEWS_ARE_REAL = false`), на месте отметки каждой карточки
   стоит «Sample review», и «Verified buyer» не печатается ни у одного, что бы
   ни стояло в `verified`. Настоящий отзыв: «Verified buyer» — только у
   привязанного к заказу (ЕС, Omnibus: «проверено» без проверки — обман);
   непривязанный стоит без отметки. */
const markOf = (lang: Lang, verified: boolean, real: boolean): ReviewMark | null =>
  !real ? { text: t(lang, 'review.sample'), verified: false } : verified ? { text: t(lang, 'review.verified'), verified: true } : null

/** Отзыв для карточки. `real` — флаг настоящести; параметром он только для
 *  проверки обеих веток (tests/reviews.test.ts). */
export function reviewView(lang: Lang, r: Review, real: boolean = REVIEWS_ARE_REAL): ReviewView {
  const n = Math.min(5, Math.max(1, Math.round(r.rating)))
  return {
    id: r.id, stars: [1, 2, 3, 4, 5].map((i): Star => (i <= n ? 'full' : 'none')), label: t(lang, 'review.stars', { n }),
    title: r.title?.trim() || null, body: r.body, author: r.author, mark: markOf(lang, r.verified, real),
    date: { iso: r.date, text: dayOf(lang, r.date) }, product: r.product,
    /* Видео без адреса ролика стоит текстом: кнопки, которая ничего не
       играет, нет. */
    video: r.video?.src ? {
      src: r.video.src, poster: r.video.poster, captions: r.video.captions ?? null, lang,
      play: t(lang, 'review.play', { author: r.author }), heading: t(lang, 'review.video', { author: r.author }), close: t(lang, 'review.close'),
    } : null,
  }
}

/** Лента отзывов главной: видео первыми, за ними текст, внутри — порядком
 *  источника (новые первыми). Отзывов нет — `null`, и блока нет: пустой ряд
 *  не висит (скилл shop, «Пустое состояние молчит»). */
export function reviewRail(lang: Lang, reviews: readonly Review[], real: boolean = REVIEWS_ARE_REAL): ReviewView[] | null {
  if (!reviews.length) return null
  const views = reviews.map((r) => reviewView(lang, r, real))
  return [...views.filter((v) => v.video), ...views.filter((v) => !v.video)]
}
