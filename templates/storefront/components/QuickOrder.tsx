'use client'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import pn from '@/styles/pane.module.css'
import p from '@/styles/primitives.module.css'
import s from './QuickOrder.module.css'
import type { QuickView } from '@/lib/product-view.ts'
import { chatHref, type Messenger } from '@/lib/contacts.ts'
import { Icon } from './Icon.tsx'

/* Знак строки — из листа: марки силуэтами (brands/), Telegram — самолётик
   нашим пером, без круга (решение заказчика на cbdin.bg). */
const MARK: Record<Messenger, string> = { viber: 'viber', telegram: 'send', whatsapp: 'whatsapp', instagram: 'instagram' }

/* Быстрый заказ — одно сообщение в мессенджер вместо оформления (слово
   заказчика 25.09.2026: «быстрый заказ вызывает всплывающее меню с
   мессенджерами», образец — окно cbdin.bg; И442).

   Окно — `<dialog>` с `showModal()` (правило 8): Escape, возврат фокуса,
   затемнение и верхний слой приходят от браузера. Кнопка стоит в форме
   покупки рядом с «в корзину» и берёт количество из её счётчика в миг
   открытия — сообщение говорит, сколько штук.

   Телефон уезжает тем же путём, что заказ: номер ложится в текст сообщения,
   «Call me back» открывает первый мессенджер с готовой ссылкой. Сервера
   под звонок нет, и поле, молча теряющее номер, было бы человеком,
   уверенным, что заказал (прежний проект, lib/contacts.ts `orderText`).

   Строка без адреса стоит надписью, нажатие прячется (И111 прежнего
   проекта): заказчик видит, что канал есть и ждёт номера. */
export function QuickOrder({ view }: { view: QuickView }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [qty, setQty] = useState(1)
  const [phone, setPhone] = useState('')

  /* Нажатие мимо окна закрывает его: цель — сам `<dialog>`, а не его
     содержимое. Клавиатурный путь у окна свой — Escape. */
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const miss = (e: globalThis.MouseEvent) => { if (e.target === d) d.close() }
    d.addEventListener('click', miss)
    return () => d.removeEventListener('click', miss)
  }, [])

  function open(e: MouseEvent<HTMLButtonElement>) {
    const field = e.currentTarget.form?.elements.namedItem('quantity')
    const n = field instanceof HTMLInputElement ? Number.parseInt(field.value, 10) : 1
    setQty(Number.isFinite(n) && n > 0 ? n : 1)
    ref.current?.showModal()
  }

  const what = `${view.what} × ${qty} ${view.qty}`
  const text = `${view.greet} ${what}${phone.trim() ? `. ${view.myPhone}: ${phone.trim()}` : ''}`
  const rows = view.rows.map((r) => ({ ...r, href: chatHref(r, text) }))
  const call = rows.find((r) => r.href)?.href ?? null

  return (
    <>
      <button className={`${b.btn} ${s.trigger}`} data-size="lg" type="button" aria-haspopup="dialog" onClick={open}>{view.open}</button>
      {/* Окно — тройка общего модуля (styles/pane.module.css, И460): шапка
          стоит, прокручивается только тело. */}
      <dialog ref={ref} className={pn.pane} data-pane="dialog" aria-labelledby="quick-title">
        <div className={pn.bar}>
          <h2 className={pn.title} id="quick-title">{view.title}</h2>
          <button className={`${b.btn} ${pn.close}`} type="button" aria-label={view.close} onClick={() => ref.current?.close()}><Icon id="x" /></button>
        </div>
        <div className={`${pn.body} ${s.body}`}>
          <div className={s.intro}>
            <p className={s.lead}>{view.lead}</p>
            {/* Что заказывают — видно в окне, а не только в набранном
                сообщении: у Viber и Instagram текста в ссылке нет, и человеку
                нужно, что написать. */}
            <p className={s.what}>{what}</p>
          </div>
          {/* Мессенджеры — вид панели (`--quick-look`, И470): плитками по две
              в ряд — знак над именем — или строками «Order via …». Строка —
              тихая кнопка сайта, знак — краской своей марки (`data-mark`,
              И471: cbdin.bg, WhatsApp Brand Guidelines). Имя ссылки для
              чтеца — полное «Order via …», видимое слово в нём есть
              (WCAG 2.5.3). */}
          <ul className={`${p.grid} ${s.rows}`}>
            {rows.map((r) => (
              <li key={r.key}>
                {r.href
                  ? <a className={`${b.btn} ${s.row}`} data-size="lg" data-mark={r.key} href={r.href} target="_blank" rel="noopener noreferrer" aria-label={r.label}><Icon id={MARK[r.key]} /><span className={s.name}>{r.name}</span><span className={s.via}>{r.label}</span></a>
                  : <span className={`${b.btn} ${s.row}`} data-size="lg" data-mark={r.key} aria-disabled="true" aria-label={r.label}><Icon id={MARK[r.key]} /><span className={s.name}>{r.name}</span><span className={s.via}>{r.label}</span></span>}
              </li>
            ))}
          </ul>
          <div className={f.field}>
            <label className={f.label} htmlFor="quick-phone">{view.phone.label}</label>
            {/* Номер и «перезвоните» — общая пара поля и кнопки (`f.send`,
                И481); не помещаются — кнопка встаёт под полем. */}
            <div className={f.send}>
              <input className={f.box} id="quick-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={view.phone.hint} value={phone} onChange={(e) => setPhone(e.target.value)} />
              {call
                ? <a className={b.btn} data-voice="loud" href={call} target="_blank" rel="noopener noreferrer"><Icon id="arrow-right" />{view.call}</a>
                : <span className={b.btn} data-voice="loud" aria-disabled="true"><Icon id="arrow-right" />{view.call}</span>}
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
