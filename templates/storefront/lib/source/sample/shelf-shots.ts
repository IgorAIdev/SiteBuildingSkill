import type { Form } from '../details.ts'
import type { Image } from '../contract.ts'

/* Кадр полки образца — по виду полки. Снимки — из cbdin
   (`apps/cbdin/components/Categories.tsx`, CBD_ecommerce_eu), слово
   заказчика 01.10.2026: «возьми изображения для плашек у cbdin». Ими стоят
   полки образца, а у движка — полка без своего снимка (lib/source/index.ts):
   свой кадр полки в движке или в Payload главнее (план 4). */
const SHOTS: Record<Form, [string, number, number]> = {
  oil: ['oil', 1100, 1200],
  capsules: ['capsules', 1100, 1200],
  cosmetics: ['cosmetics', 1100, 1200],
  edibles: ['edibles', 1100, 1200],
  topicals: ['topicals', 760, 760],
  pets: ['pets', 760, 760],
  vape: ['vape', 760, 760],
  paste: ['paste', 760, 760],
  flowers: ['flowers', 760, 760],
}

/** Ширины копий рядом с оригиналом (`scripts/sample-cuts.mjs`, И663): у
 *  файла образца нет сервера снимков, поэтому копии нарезаны заранее, а
 *  место выбирает браузер (`sizes`, lib/shot.ts). Оригинал — последней
 *  шириной: плитка в 240 px берёт 400, значок меню — 160. */
export const CUTS = [160, 400, 800]

const shot = ([name, width, height]: [string, number, number], alt: string): Image => {
  const base = `/sample/shelves/${name}`
  const srcset = [...CUTS.filter((w) => w < width).map((w) => `${base}-${w}.webp ${w}w`), `${base}.jpg ${width}w`].join(', ')
  return { src: `${base}.jpg`, alt, width, height, srcset }
}

export const shelfShot = (form: Form, alt: string): Image => shot(SHOTS[form], alt)

/* Кадр эффекта образца — по коду эффекта (грань `effect`). Снимки — из cbdin
   (`apps/cbdin/lib/tiles.ts`, `public/looking/*.jpg`), слово заказчика
   30.09.2026: «картинки для плиток эффектов скопируй из cbdin». Коды — те же,
   что у грани движка cbdin там, где смысл совпал (`sleep`, `relax`,
   `recovery`): ими стоит и эффект движка без своего снимка
   (lib/source/index.ts). Нет кода здесь — эффект стоит без снимка. */
const EFFECT_SHOTS: Record<string, [string, number, number]> = {
  sleep: ['effect-sleep', 900, 620],
  relief: ['effect-relief', 900, 620],
  relax: ['effect-relax', 900, 620],
  skin: ['effect-skin', 1100, 1200],
  recovery: ['effect-recovery', 900, 620],
  dogs: ['effect-dogs', 900, 620],
}

export const effectShot = (code: string, alt: string): Image | null => (EFFECT_SHOTS[code] ? shot(EFFECT_SHOTS[code], alt) : null)
