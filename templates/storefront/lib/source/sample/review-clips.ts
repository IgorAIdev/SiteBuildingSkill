import type { Image } from '../contract.ts'

/* Ролики видеоотзывов образца (И728). Настоящих роликов у шаблона нет, и
   выдуманный человек в кадре был бы выдуманным отзывом; ролик образца — немой
   медленный наплыв на снимок полки образца того же товара (public/sample/
   shelves/), 7 секунд. Режет их scripts/sample-clips.mjs из этого же списка:
   один список на файлы и на адреса.

   WebM VP8 — потому что единственный кодировщик на машине набора — ffmpeg,
   который ставит Playwright (VP8 и WebM, без H.264). Настоящий магазин даёт
   MP4 H.264: его играет каждый браузер (docs/open.md). */

/** Имя ролика → снимок полки образца, из которого он нарезан. */
export const CLIPS = { oil: 'oil', cream: 'cosmetics', capsules: 'capsules' } as const
export type Clip = keyof typeof CLIPS

/** Кадр ролика и постера — 2 : 3, как кадр карточки отзыва. */
export const CLIP = { width: 540, height: 810, seconds: 7, fps: 25 } as const
/** Постер — оригиналом 720 × 1080 и копией 400: карточка в 240–340 px берёт
 *  400 или 720 по плотности экрана (lib/shot.ts). */
export const POSTER = { width: 720, height: 1080, cuts: [400] } as const

const at = (name: string) => `/sample/reviews/${name}`

export const isClip = (name: string): name is Clip => name in CLIPS

/** Ролик и постер образца; `alt` постера — пустой у карточки (имя несёт
 *  кнопка), здесь — что на снимке, для окна ролика. */
export const clipOf = (name: Clip, alt: string): { src: string; poster: Image } => ({
  src: `${at(name)}.webm`,
  poster: {
    src: `${at(name)}.webp`, alt, width: POSTER.width, height: POSTER.height,
    srcset: [...POSTER.cuts.map((w) => `${at(name)}-${w}.webp ${w}w`), `${at(name)}.webp ${POSTER.width}w`].join(', '),
  },
})
