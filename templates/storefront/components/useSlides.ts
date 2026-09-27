'use client'
import { useRef, useState, type MouseEvent } from 'react'

/* Механика ленты слайдов — одна на сайт (styles/slides.module.css, И493):
   галерея товара и слайдер героя. Без скрипта лента листается пальцем и
   колесом, точка — якорь слайда; скрипт держит номер текущего и листает
   по точке на месте (без скрипта тот же адрес `#id` двигал бы и страницу).
   Помнит одно — номер слайда. */
export function useSlides(count: number) {
  const strip = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)

  function show(i: number) {
    const el = strip.current
    if (!el) return
    const to = (i + count) % count
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: to * el.clientWidth, behavior: still ? 'instant' : 'smooth' })
    setCurrent(to)
  }
  function pick(e: MouseEvent<HTMLAnchorElement>, i: number) {
    e.preventDefault()
    show(i)
  }
  function onScroll() {
    const el = strip.current
    if (el && el.clientWidth) setCurrent(Math.round(el.scrollLeft / el.clientWidth))
  }
  return { strip, current, show, pick, onScroll: count > 1 ? onScroll : undefined }
}
