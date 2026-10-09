'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import b from '@/styles/btn.module.css'
import s from './ProductView.module.css'
import { AddLabel } from './AddLabel.tsx'

/* Строка покупки у низа окна на телефоне (отложенное заказчиком 27.09.2026
   «в корзину, приклеенная к низу на телефоне», взято по «делай всё»
   28.09.2026; И509). Появляется, когда строка покупки ушла вверх за край
   окна, и стоит над полосой низа (`--dock`). Своей покупки у неё нет: её
   кнопка нажимает главную кнопку строки покупки (`buy`) — выбор варианта,
   количество и ответ корзины остаются в одном месте (правило 10). Помнит
   компонент одно — видна ли строка покупки. */
export function StickyBuy({ buy, label, variant, added, children }: { buy: string; label: string; variant?: string | null; added: string; children: ReactNode }) {
  const [shown, setShown] = useState(false)
  /* Строка покупки целиком над краем окна — по положению при каждой прокрутке (не
     чаще кадра), а не по пересечению края: переход по якорю («128 отзывов» →
     отзывы) или открытие страницы уже прокрученной перепрыгивает строку, края она
     не пересекает, и наблюдатель пересечений молчал — полоса не появлялась
     (замер 08.10.2026, И778). */
  useEffect(() => {
    const el = document.getElementById(buy)
    if (!el) return
    let frame = 0
    const check = () => { frame = 0; setShown(el.getBoundingClientRect().bottom < 0) }
    const ask = () => { if (!frame) frame = requestAnimationFrame(check) }
    check()
    addEventListener('scroll', ask, { passive: true })
    addEventListener('resize', ask)
    return () => { removeEventListener('scroll', ask); removeEventListener('resize', ask); cancelAnimationFrame(frame) }
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
      <button className={b.btn} data-voice="loud" type="button" onClick={press}><AddLabel variant={variant} add={label} added={added} /></button>
    </div>
  )
}
