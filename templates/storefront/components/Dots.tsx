'use client'
import type { MouseEvent } from 'react'
import sl from '@/styles/slides.module.css'

/* Указатель ленты — одна строка точек на сайт (styles/slides.module.css,
   И493). Точка — ссылка на свой слайд; `className` — место, которое ставит
   узел (галерея — под кадром или на нём, герой — у низа сцены). */
export function Dots({ slides, current, pick, className = '' }: {
  slides: readonly { id: string; show: string }[]; current: number; pick: (e: MouseEvent<HTMLAnchorElement>, i: number) => void; className?: string
}) {
  return (
    <ol className={`${sl.dots} ${className}`}>
      {slides.map((x, i) => (
        <li key={x.id}>
          <a className={sl.dot} href={`#${x.id}`} aria-label={x.show} aria-current={i === current ? 'true' : undefined} onClick={(e) => pick(e, i)} />
        </li>
      ))}
    </ol>
  )
}
