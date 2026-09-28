'use client'
import { useEffect, useState } from 'react'
import { Arrows } from './Arrows.tsx'

type Edge = { start: boolean; end: boolean }

/* Стрелки полки (И502) — вместо полосы прокрутки под рельсой: слово
   заказчика 28.09.2026 «индикатор прокрутки из восьмидесятых, предлагай
   современные». Пара стрелок в строке заголовка полки, у «смотреть всё»
   (Apple, Nike, Zalando, cbdin.bg): шаг — почти ширина рельсы, край
   соседней карточки остаётся на месте. На краю стрелка гаснет; весь ряд
   помещается — стрелок нет. Помнит компонент одно — где рельса стоит. */
export function RailArrows({ rail, back, next }: { rail: string; back: string; next: string }) {
  const [edge, setEdge] = useState<Edge | null>(null)
  useEffect(() => {
    const el = document.getElementById(rail)
    if (!el) return
    const read = () => setEdge({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 })
    read()
    el.addEventListener('scroll', read, { passive: true })
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', read); ro.disconnect() }
  }, [rail])
  if (!edge || (edge.start && edge.end)) return null
  const step = (dir: 1 | -1) => {
    const el = document.getElementById(rail)
    if (!el) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * .8, behavior: still ? 'auto' : 'smooth' })
  }
  return <Arrows back={back} next={next} onBack={() => step(-1)} onNext={() => step(1)} atStart={edge.start} atEnd={edge.end} />
}
