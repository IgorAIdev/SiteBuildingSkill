import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import s from './Price.module.css'
import type { WasView } from '@/lib/view.ts'

/* Цена — одна на сайт (И476): карта товара, карточка полки, витрина героя.
   Разбор 27.09.2026 нашёл три рисунка одной вещи — прежняя цена над новой
   на полке, после неё на карте товара, перед ней у героя. Теперь везде:
   цена сейчас, рядом по базовой линии прежняя — мельче, зачёркнутая,
   краской подписи (palette, roles.md: «прежняя цена» n11); вслух — словами
   (`p.said`), зачёркивание голосом не читается. Рост — `size`: `lead` у
   карты товара, `body` у полки. Рядом с ценой узел может поставить своё
   (наличие) — детьми. */
export function Price({ now, was, size = 'body', children }: { now: string; was: WasView | null; size?: 'lead' | 'body'; children?: ReactNode }) {
  return (
    <p className={s.price} data-size={size}>
      <span className={s.now}>{now}</span>
      {was ? <><s className={s.was} aria-hidden="true">{was.text}</s><span className={p.said}>{was.said}</span></> : null}
      {children}
    </p>
  )
}
