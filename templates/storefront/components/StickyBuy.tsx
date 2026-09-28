'use client'
import { useEffect, useState, type ReactNode } from 'react'
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
  const press = () => document.getElementById(buy)?.querySelector<HTMLButtonElement>('button[type="submit"][data-voice="loud"]')?.click()
  return (
    <div className={s.bar} data-shown={shown ? '' : undefined} inert={!shown}>
      {children}
      <button className={b.btn} data-voice="loud" type="button" onClick={press}><Icon id="shopping-cart" />{label}</button>
    </div>
  )
}
