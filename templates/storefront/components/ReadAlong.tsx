'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'
import m from '@/styles/menu.module.css'
import s from './ReadAlong.module.css'

/* Товар у чтения — одна карточка в колонке статьи, которая едет с колонкой и сменяется
   по разделам (слово заказчика 22.10.2026: «блог у нас для продаж; слева нужны карточки
   товара, чтоб они двигались, показывались с движением чтения статьи»). Устройство — по
   замеру пятнадцати лент (shop, blocks.md, «Товар у статьи»): одна вещь за раз, смена
   по ходу чтения (mindbodygreen), без прокрутки внутри колонки (у cbdshop.bg вторая из
   двух карточек пряталась в ней). Раздел, чей заголовок поднялся выше 40 % окна, —
   текущий; его номер по кругу выбирает карточку. Без скрипта стоит первая. Карточки
   рисует ProductCard — одна карточка товара на сайт (правило 10); неактивные скрыты
   `visibility`, их кнопки не ловят ни руку, ни таб. */
export function ReadAlong({ ids, label, children }: { ids: string[]; label: string; children: ReactNode }) {
  const cards = Children.toArray(children)
  const [on, setOn] = useState(0)
  useEffect(() => {
    if (cards.length < 2) return
    const heads = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => Boolean(e))
    if (!heads.length) return
    /* Текущий раздел — последний, чей заголовок поднялся выше 40 % окна. Считается по
       прокрутке, а не пересечением: быстрый скачок (колесо, ссылка оглавления) проносил
       заголовок мимо полосы, и смена не случалась (замер 22.10.2026). */
    /* Прямо в обработчике прокрутки, без кадра анимации: замеров — по заголовку раздела
       (шесть-семь), а состояние с тем же номером React не перерисовывает. Кадр не
       приходил в фоновой странице, и смена не случалась вовсе. */
    const pick = () => {
      const line = window.innerHeight * 0.4
      let at = 0
      heads.forEach((h, i) => { if (h.getBoundingClientRect().top < line) at = i })
      setOn(at % cards.length)
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    return () => window.removeEventListener('scroll', pick)
  }, [ids, cards.length])
  return (
    <aside className={s.read} aria-label={label}>
      <p className={m.group}>{label}</p>
      <div className={s.slots}>
        {cards.map((c, i) => <div key={i} className={s.slot} data-on={i === on ? '' : undefined} aria-hidden={i === on ? undefined : true}>{c}</div>)}
      </div>
    </aside>
  )
}
