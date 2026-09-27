'use client'
import { useEffect } from 'react'

/* Окно за пальцем — одно на сайт (styles/pane.module.css, И488). Слово
   заказчика 27.09.2026: «формы, боковые меню, выскакивающие формы должны
   свайпом закрываться и двигаться пальцем плавно — прилипать к пальцу, как
   у Apple, и указатель, что форма свайпится».

   Жест вешается один раз на документ и работает у любого открытого окна
   `pane`: шторка от края (`data-pane="start" | "end"`) уезжает к своему
   краю, окно посреди экрана на телефоне — вниз (оно там нижняя шторка).
   Окно идёт за пальцем без задержки; отпустил дальше трети или быстрым
   движением — закрывается тем же путём, что крестик (`hidePopover`,
   `close`), иначе возвращается. Затемнение гаснет по мере хода (`--pull`).
   Жест ловится только в своём направлении: вертикальная прокрутка тела
   шторки остаётся прокруткой; вниз окно тянется, только когда тело у
   верха. Поля ввода жест не трогает. Мышь — без жеста: у неё есть крестик
   и Escape. Не рисует ничего и ничего не помнит между жестами. */
const LOCK = 8
const SHUT = 0.3
const FLICK = 0.5

type Way = 'start' | 'end' | 'down'

function wayOf(pane: HTMLElement): Way | null {
  const kind = pane.dataset.pane
  if (kind === 'start' || kind === 'end') {
    const rtl = getComputedStyle(pane).direction === 'rtl'
    return rtl ? (kind === 'start' ? 'end' : 'start') : kind
  }
  if (kind === 'dialog' && getComputedStyle(pane).getPropertyValue('--pane-sheet').trim() === '1') return 'down'
  return null
}

function shut(pane: HTMLElement) {
  if (pane instanceof HTMLDialogElement) pane.close()
  else if (pane.matches(':popover-open')) pane.hidePopover()
}

export function PaneSwipe() {
  useEffect(() => {
    let pane: HTMLElement | null = null
    let way: Way | null = null
    let x0 = 0, y0 = 0, t0 = 0, pull = 0
    let lock: 'x' | 'y' | null = null

    const reset = (el: HTMLElement) => {
      el.style.removeProperty('transition')
      el.style.removeProperty('translate')
      el.style.removeProperty('--pull')
    }
    const start = (e: TouchEvent) => {
      const t = e.target instanceof Element ? e.target : null
      const el = t?.closest<HTMLElement>('[data-pane]') ?? null
      if (!el || !el.matches('[open], :popover-open') || t?.closest('input, textarea, select')) return
      way = wayOf(el)
      if (!way) return
      pane = el
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = e.timeStamp; pull = 0; lock = null
    }
    const move = (e: TouchEvent) => {
      if (!pane || !way) return
      const dx = e.touches[0].clientX - x0
      const dy = e.touches[0].clientY - y0
      if (!lock) {
        if (Math.hypot(dx, dy) < LOCK) return
        lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        const scroller = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-pane] > *') : null
        const mine = way === 'down' ? lock === 'y' && dy > 0 && !(scroller && scroller.scrollTop > 0) : lock === 'x'
        if (!mine) { pane = null; return }
      }
      e.preventDefault()
      const along = way === 'down' ? dy : way === 'start' ? -dx : dx
      pull = Math.max(0, along)
      const size = way === 'down' ? pane.offsetHeight : pane.offsetWidth
      pane.style.transition = 'none'
      pane.style.translate = way === 'down' ? `0 ${pull}px` : `${way === 'start' ? -pull : pull}px 0`
      pane.style.setProperty('--pull', String(Math.min(1, pull / size)))
    }
    const end = (e: TouchEvent) => {
      const el = pane
      pane = null
      if (!el || !way || !lock) return
      const size = way === 'down' ? el.offsetHeight : el.offsetWidth
      const fast = pull / Math.max(1, e.timeStamp - t0) > FLICK
      el.style.removeProperty('transition')
      if (pull > size * SHUT || (fast && pull > LOCK)) {
        el.style.translate = way === 'down' ? '0 100%' : way === 'start' ? '-100% 0' : '100% 0'
        el.style.setProperty('--pull', '1')
        const done = () => { shut(el); reset(el) }
        const ms = parseFloat(getComputedStyle(el).transitionDuration) * 1000 || 0
        if (ms > 0) window.setTimeout(done, ms)
        else done()
      } else reset(el)
    }
    document.addEventListener('touchstart', start, { passive: true })
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end)
    document.addEventListener('touchcancel', end)
    return () => {
      document.removeEventListener('touchstart', start)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', end)
      document.removeEventListener('touchcancel', end)
    }
  }, [])
  return null
}
