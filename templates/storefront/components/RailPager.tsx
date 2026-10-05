'use client'
import { useEffect, useState } from 'react'
import b from '@/styles/btn.module.css'
import { Icon } from './Icon.tsx'

type Edge = { start: boolean; end: boolean }

/* Кнопки листания ряда (И502, И665) — вместо полосы прокрутки под рельсой.
   Набор — «Уголок» каталога кнопок (дизайн-система, Buttons → кнопки
   листания): круглая кнопка `data-pager` среднего роста, тихий стиль сайта
   (вид Look → кнопки, тихая ось; сейчас Outline); под рукой и при нажатии —
   заливка марки (`data-hand="pop"`, И704). Круг — при любом угле панели
   (`data-rail-nav`, И747). Уголок, а не стрелка:
   стрелка на сайте значит «куда ведёт» (View all, плашки), уголок —
   «листать здесь»; так у Allbirds (кружок 40 с кромкой, уголок; замер
   03.10.2026). Рост 40 — слово заказчика 03.10.2026: «48 чрезмерно большие,
   давай 40»; под пальцем средний рост сам встаёт на 48 (scale.css,
   `pointer: coarse`), цель пальца 44 не теряется.
   Шаг — до первой спрятанной плитки (слово заказчика 03.10.2026: «по одной
   плитке или несколько — как принято у профи?»): вперёд — первая плитка, у
   которой виден не весь край, встаёт в начало ряда; назад — последняя
   спрятанная слева встаёт в конец. Все видимые уходят, приходит столько
   новых, сколько помещается. Так у спецификации CSS: кнопка прокрутки ряда
   листает на одну «страницу», как PgDn (MDN, `::scroll-button()`); и у Мэтта
   Перри (Motion): «по одной плитке» — частый, но неверный способ, глаз уже
   прочёл все видимые, и шаг в одну плитку «тормозит». Allbirds и Shopify
   Dawn листают по одной (замер и код 03.10.2026) — это и есть тот частый
   случай. На
   краю кнопка гаснет (`aria-disabled`: фокус с неё не слетает), весь ряд
   помещается — кнопок нет. В узкой коробке шапки пары нет — ряд листают
   пальцем (И506; `.pager` в btn.module.css). Помнит компонент одно — где
   рельса стоит. */
export function RailPager({ rail, back, next }: { rail: string; back: string; next: string }) {
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
    if (!el || (dir < 0 ? edge.start : edge.end)) return
    const items = [...el.children] as HTMLElement[]
    const base = items[0]?.offsetLeft ?? 0
    const [from, to] = [el.scrollLeft, el.scrollLeft + el.clientWidth]
    const hidden = dir > 0
      ? items.find((it) => it.offsetLeft - base + it.offsetWidth > to + 1)
      : items.findLast((it) => it.offsetLeft - base < from - 1)
    const left = !hidden ? (dir > 0 ? el.scrollWidth : 0) : dir > 0 ? hidden.offsetLeft - base : hidden.offsetLeft - base + hidden.offsetWidth - el.clientWidth
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: Math.max(0, left), behavior: still ? 'auto' : 'smooth' })
  }
  return (
    <span className={b.pager}>
      <button type="button" className={b.btn} data-pager data-rail-nav data-hand="pop" data-to="back" aria-label={back} aria-controls={rail} aria-disabled={edge.start || undefined} onClick={() => step(-1)}><Icon id="chevron-left" /></button>
      <button type="button" className={b.btn} data-pager data-rail-nav data-hand="pop" aria-label={next} aria-controls={rail} aria-disabled={edge.end || undefined} onClick={() => step(1)}><Icon id="chevron-right" /></button>
    </span>
  )
}
