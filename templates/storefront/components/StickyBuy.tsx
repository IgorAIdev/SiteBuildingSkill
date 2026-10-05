'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import b from '@/styles/btn.module.css'
import s from './ProductView.module.css'
import { Icon } from './Icon.tsx'

/* Строка покупки у низа окна на телефоне (отложенное заказчиком 27.09.2026
   «в корзину, приклеенная к низу на телефоне», взято по «делай всё»
   28.09.2026; И509). Появляется, когда строка покупки ушла вверх за край
   окна, и стоит над полосой низа (`--dock`). Своей покупки у неё нет: её
   кнопка нажимает главную кнопку строки покупки (`buy`) — выбор варианта,
   количество и ответ корзины остаются в одном месте (правило 10). Помнит
   компонент одно — видна ли строка покупки. */
export function StickyBuy({ buy, label, children }: { buy: string; label: string; children: ReactNode }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = document.getElementById(buy)
    if (!el) return
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [buy])
  /* Рост строки — корню (`--bottom-bar`): окно помощи у края экрана
     (HelpDock.tsx, И547) встаёт над строкой, а не на её кнопку. Спрятанная
     строка — рост ноль. */
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const root = document.documentElement.style
    const ro = new ResizeObserver(() => root.setProperty('--bottom-bar', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => { ro.disconnect(); root.removeProperty('--bottom-bar') }
  }, [])
  const press = () => document.getElementById(buy)?.querySelector<HTMLButtonElement>('button[type="submit"][data-voice="loud"]')?.click()
  return (
    <div ref={bar} className={s.bar} data-shown={shown ? '' : undefined} inert={!shown}>
      {children}
      <button className={b.btn} data-voice="loud" type="button" onClick={press}>{label}<Icon id="shopping-cart" /></button>
    </div>
  )
}
