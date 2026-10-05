'use client'
import { useEffect, useRef } from 'react'

/* Число рядом с образцом — ЗАМЕР отрисованного, а не значение из файла
   (слово заказчика: «выбор показывается глазами… числа рядом»): образец
   `[data-sample]` в той же строке `[data-row]` меряется в браузере, и число
   меняется вместе с шириной окна, темой и выбором вида — ровно так, как их видит
   покупатель. Что мерить — `what`:
     size   кегль · насыщенность · межстрочье
     face   первая гарнитура стека
     inline ширина образца (ступень ритма, поле, воздух)
     block  высота образца (рост органа)
     radius угол
     paint  краска фона — #RRGGBB
     time   длительность перехода
     hit    высота органа и его цель: «32 · цель 44», если вокруг рисунка
            лежит невидимый запас пальца (`::after`, И764), иначе высота
   Образец — `[data-sample]`, а у настоящего компонента, которому этот признак
   не передать, — первый узел по селектору `pick` в той же строке. */
type What = 'size' | 'face' | 'inline' | 'block' | 'radius' | 'paint' | 'time' | 'hit'

const px = (v: string) => `${Math.round(parseFloat(v) * 10) / 10}`
const hex = (c: string) => {
  const m = c.match(/[\d.]+/g)
  if (!m || m.length < 3) return c
  const [r, g, b, a] = m.map(Number)
  const h = `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase()}`
  return a !== undefined && a < 1 ? `${h} · ${Math.round(a * 100)}%` : h
}

function read(el: HTMLElement, what: What): string {
  const s = getComputedStyle(el)
  if (what === 'size') return `${px(s.fontSize)} · ${s.fontWeight} · ${s.lineHeight === 'normal' ? 'normal' : px(s.lineHeight)}`
  if (what === 'face') return s.fontFamily.split(',')[0].replace(/["']/g, '')
  if (what === 'inline') return px(String(el.getBoundingClientRect().width))
  if (what === 'block') return px(String(el.getBoundingClientRect().height))
  if (what === 'radius') return px(s.borderTopLeftRadius)
  if (what === 'paint') return hex(s.backgroundColor)
  if (what === 'hit') {
    const h = el.getBoundingClientRect().height
    const reserve = getComputedStyle(el, '::after')
    const aim = reserve.content !== 'none' && reserve.position === 'absolute' ? parseFloat(reserve.height) : 0
    return aim > h ? `${px(String(h))} · цель ${px(String(aim))}` : px(String(h))
  }
  return `${Math.round(parseFloat(s.transitionDuration) * 1000)} мс`
}

export function Probe({ what, pick = '[data-sample]' }: { what: What; pick?: string }) {
  const out = useRef<HTMLElement>(null)
  useEffect(() => {
    const me = out.current
    const el = me?.closest('[data-row]')?.querySelector<HTMLElement>(pick)
    if (!me || !el) return
    const put = () => { me.textContent = read(el, what) }
    put()
    const size = new ResizeObserver(put)
    size.observe(document.documentElement)
    const theme = new MutationObserver(put)
    theme.observe(document.documentElement, { attributes: true })
    /* Предпросмотр выбора (studio.mjs) пишет роли блоком `#look-preview` в head. */
    theme.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => { size.disconnect(); theme.disconnect() }
  }, [what, pick])
  return <code ref={out} aria-live="off" />
}
