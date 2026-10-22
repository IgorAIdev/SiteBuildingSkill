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
   текущий; его номер по кругу выбирает тройку. Товары — строками `ProductRow` по три
   (заказчик 22.10.2026: «и 2 и 3 продукта можно показывать, одного маловато»): целая
   карточка помещалась в колонку одна (451 при 636 под колонку на 800), три строки — с
   запасом. Без скрипта стоит первая тройка; неактивные скрыты `visibility`, их ссылки
   не ловят ни руку, ни таб. */
export function ReadAlong({ ids, label, children }: { ids: string[]; label: string; children: ReactNode }) {
  const rows = Children.toArray(children)
  /* Тройки по порядку; последняя добирается с начала — в колонке всегда три строки. */
  const cards = Array.from({ length: Math.ceil(rows.length / 3) }, (_, g) => [0, 1, 2].map((k) => rows[(g * 3 + k) % rows.length]))
  const [on, setOn] = useState(0)
  /* Ушедшая тройка помнится одну смену: она уезжает вверх, новая въезжает снизу
     (заказчик 22.10.2026: «лучше пусть меняется сама карточка — уходила вверх и приходила
     другая», а не подмена на месте). */
  const [gone, setGone] = useState<number | null>(null)
  const show = (next: number) => setOn((was) => { if (was !== next) setGone(was); return next })
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
      show(at % cards.length)
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    return () => window.removeEventListener('scroll', pick)
  }, [ids, cards.length])
  return (
    <aside className={s.read} aria-label={label}>
      {/* Подпись — заголовком второго уровня видом подписи группы: имя товара в карточке —
          h3, а колонка стоит в разметке раньше разделов статьи, и лестница прыгала с h1
          на h3 (check:craft heads, 22.10.2026). */}
      <h2 className={`${m.group} ${s.head}`}>{label}</h2>
      <div className={s.slots}>
        {cards.map((trio, i) => <ul key={i} className={s.slot} data-on={i === on ? '' : undefined} data-gone={i === gone && i !== on ? '' : undefined} aria-hidden={i === on ? undefined : true}>{trio.map((r, k) => <li key={k}>{r}</li>)}</ul>)}
      </div>
    </aside>
  )
}
