'use client'
import { useRef, useState, type MouseEvent } from 'react'

/* Механика ленты слайдов — одна на сайт (styles/slides.module.css, И493):
   галерея товара и слайдер героя. Без скрипта лента листается пальцем и
   колесом, точка — якорь слайда; скрипт держит номер текущего и листает
   по точке на месте (без скрипта тот же адрес `#id` двигал бы и страницу).
   Помнит одно — номер слайда; `aim` — только куда лента едет сама.

   Пока лента едет к слайду сама (`show`), прокрутка по дороге номер не
   трогает: иначе он на миг возвращался к прежнему слайду и ползунок
   указателя дёргался назад (И584). Цель снимается, когда лента доехала,
   или через `AIM_MS`, если её перебил палец. */
const AIM_MS = 1200

export function useSlides(count: number) {
  const strip = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const aim = useRef<{ to: number; at: number } | null>(null)

  function show(i: number) {
    const el = strip.current
    if (!el) return
    const to = (i + count) % count
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    aim.current = still ? null : { to, at: performance.now() }
    el.scrollTo({ left: to * el.clientWidth, behavior: still ? 'instant' : 'smooth' })
    setCurrent(to)
  }
  function pick(e: MouseEvent<HTMLAnchorElement>, i: number) {
    e.preventDefault()
    show(i)
  }
  function onScroll() {
    const el = strip.current
    if (!el || !el.clientWidth) return
    const a = aim.current
    if (a) {
      const there = Math.abs(el.scrollLeft - a.to * el.clientWidth) < 1
      if (!there && performance.now() - a.at < AIM_MS) return
      aim.current = null
    }
    setCurrent(Math.round(el.scrollLeft / el.clientWidth))
  }
  return { strip, current, show, pick, onScroll: count > 1 ? onScroll : undefined }
}
