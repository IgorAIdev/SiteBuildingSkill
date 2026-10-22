'use client'

import { Children, isValidElement, useEffect, useMemo, useState, type ReactNode } from 'react'
import m from '@/styles/menu.module.css'
import p from '@/styles/primitives.module.css'
import s from './ReadAlong.module.css'
import { Dots } from './Dots.tsx'

/* Товар у чтения — одна карточка в колонке статьи, которая едет с колонкой и сменяется
   по разделам (слово заказчика 22.10.2026: «блог у нас для продаж; слева нужны карточки
   товара, чтоб они двигались, показывались с движением чтения статьи»). Устройство — по
   замеру пятнадцати лент (shop, blocks.md, «Товар у статьи»): одна вещь за раз, смена
   по ходу чтения (mindbodygreen), без прокрутки внутри колонки (у cbdshop.bg вторая из
   двух карточек пряталась в ней). Раздел, чей заголовок поднялся выше 40 % окна, —
   текущий; его номер выбирает карточку своей части статьи. Карточка — та же, что на главной
   (`ProductCard` в виде карточки сайта, с ценой и «в корзину»), одна за раз: заказчик
   22.10.2026: «тут карточка товара нужна одна полная с ценой как на главной, а когда
   скролишь страницу — чтоб карточка сменялась на другую» (тройки строк `ProductRow`
   сняты). Без скрипта стоит первая; неактивные скрыты `visibility`, их ссылки и кнопки
   не ловят ни руку, ни таб.

   Под карточкой — точки разделов и имя текущего раздела (вариант «Б» из четырёх,
   показанных живой страницей; заказчик 22.10.2026: «поставь вариант Б — с точками
   разделов»). Точки — указатель ленты сайта (`Dots`, тот же, что под галереей товара):
   точка — карточка, её ссылка ведёт к разделу, с которого карточка стоит; имя раздела —
   сноской под точками. `heads` — разделы статьи из оглавления (id и имя). */
export function ReadAlong({ heads, label, children }: { heads: { id: string; label: string }[]; label: string; children: ReactNode }) {
  /* `Children.toArray` даёт каждой карточке свой ключ — по нему слот и держится. */
  const cards = Children.toArray(children).filter(isValidElement)
  const n = cards.length
  const [on, setOn] = useState(0)
  const [at, setAt] = useState(0)
  /* Смена — на месте, проявлением (ReadAlong.module.css). Прежде ушедшая уезжала вверх, а
     новая въезжала снизу, пока сама статья ехала вверх, — заказчик 22.10.2026: «смена
     карточек странно происходит, предложи другие варианты». */
  /* Товары делят статью на равные части по порядку разделов (1-1-2-2-3-3), а не идут по
     кругу (1-2-3-1-2-3): точки идут вперёд вместе с чтением и не прыгают назад. Точка
     ведёт к первому разделу своей части. */
  const dots = useMemo(() => heads.length
    ? Array.from({ length: n }, (_, i) => {
      const h = heads[Math.ceil((i * heads.length) / n)] ?? heads[heads.length - 1]
      return { id: h.id, show: `${i + 1} · ${h.label}` }
    })
    : [], [heads, n])
  useEffect(() => {
    if (n < 2) return
    const els = heads.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => Boolean(e))
    if (!els.length) return
    /* Текущий раздел — последний, чей заголовок поднялся выше 40 % окна. Считается по
       прокрутке, а не пересечением: быстрый скачок (колесо, ссылка оглавления) проносил
       заголовок мимо полосы, и смена не случалась (замер 22.10.2026). */
    /* Прямо в обработчике прокрутки, без кадра анимации: замеров — по заголовку раздела
       (шесть-семь), а состояние с тем же номером React не перерисовывает. Кадр не
       приходил в фоновой странице, и смена не случалась вовсе. */
    const pick = () => {
      const line = window.innerHeight * 0.4
      let section = 0
      els.forEach((h, i) => { if (h.getBoundingClientRect().top < line) section = i })
      setAt(section)
      setOn(Math.min(n - 1, Math.floor((section * n) / Math.max(1, heads.length))))
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    return () => window.removeEventListener('scroll', pick)
  }, [heads, n])
  return (
    <aside className={s.read} aria-label={label}>
      {/* Подпись — заголовком второго уровня видом подписи группы: имя товара в карточке —
          h3, а колонка стоит в разметке раньше разделов статьи, и лестница прыгала с h1
          на h3 (check:craft heads, 22.10.2026). */}
      <h2 className={`${m.group} ${s.head}`}>{label}</h2>
      <div className={s.slots}>
        {cards.map((card, i) => <div key={String(card.key)} className={s.slot} data-on={i === on ? '' : undefined} aria-hidden={i === on ? undefined : true}>{card}</div>)}
      </div>
      {/* Точка ведёт ссылкой к своему разделу: прокрутка сама сменит карточку. */}
      {n > 1 && dots.length ? (
        <div className={s.where}>
          <Dots slides={dots} current={on} pick={() => {}} plain />
          <p className={`${p.note} ${s.section}`}>{heads[at]?.label}</p>
        </div>
      ) : null}
    </aside>
  )
}
