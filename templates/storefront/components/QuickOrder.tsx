'use client'
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import pn from '@/styles/pane.module.css'
import s from './QuickOrder.module.css'
import type { QuickView } from '@/lib/product-view.ts'
import { chatHref } from '@/lib/chat.ts'
import { Icon } from './Icon.tsx'
import { PaneHead } from './PaneHead.tsx'
import { ReachList } from './ReachList.tsx'
import { OrderItems } from './OrderItems.tsx'


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
  /* Имена заголовка и поля окна — свои у каждого окна: на странице
     дизайн-системы быстрый заказ стоит не один (как CartLink, SearchPane). */
  const id = `quick-${useId().replace(/:/g, '')}`
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
  /* Строки путей и строка товара — по тексту сообщения и количеству: пересобираются,
     только когда меняются они. */
  const rows = useMemo(() => view.rows.map((r) => ({ key: r.key, name: r.name, value: r.value, href: chatHref(r, text) })), [view.rows, text])
  const call = rows.find((r) => r.href)?.href ?? null
  const items = useMemo(() => [{
    id: 'quick', name: view.item.name, brand: view.item.brand, image: view.item.image,
    facts: [view.item.facts, `${qty} ${view.qty}`].filter(Boolean).join(' · '),
    total: view.item.totals[Math.min(qty, view.item.totals.length) - 1] ?? '',
  }], [view.item, view.qty, qty])

  return (
    <>
      <button className={`${b.btn} ${s.trigger}`} data-size="lg" type="button" aria-haspopup="dialog" onClick={open}>{view.open}</button>
      {/* Окно — тройка общего модуля (styles/pane.module.css, И460): шапка
          стоит, прокручивается только тело. */}
      <dialog ref={ref} className={pn.pane} data-pane="dialog" aria-labelledby={`${id}-title`}>
        <PaneHead title={view.title} titleId={`${id}-title`} close={view.close} onClose={() => ref.current?.close()} />
        <div className={`${pn.body} ${s.body}`}>
          <div className={s.intro}>
            <p className={s.lead}>{view.lead}</p>
            {/* Что заказывают — строкой товара сводки кассы (OrderItems: снимок, марка, имя,
                упаковка с количеством, сумма), а не голой строкой текста (слово заказчика
                23.10.2026: «дизайн система не использовалась»). Видно в окне, а не только в
                набранном сообщении: у Viber и Instagram текста в ссылке нет, и человеку
                нужно, что написать. */}
            <OrderItems items={items} />
          </div>
          {/* Мессенджеры — тем же списком путей, что окно помощи и меню трубки (ReachList,
              правило 10): знак краской своей марки, имя, под ним адрес. До 23.10.2026 у окна
              были свои кнопки с обводкой, потом своя плашка с плитками — вида, которого на
              сайте нет нигде больше (слово заказчика: «дизайн система не использовалась»).
              Вид панели `--quick-look` решает только число колонок: строки — одна, плитки —
              две. */}
          <div className={s.rows}><ReachList rows={rows} /></div>
          <div className={f.field}>
            <label className={f.label} htmlFor={`${id}-phone`}>{view.phone.label}</label>
            <input className={f.box} id={`${id}-phone`} type="tel" inputMode="tel" autoComplete="tel" placeholder={view.phone.hint} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className={pn.foot}>
          <div className={pn.acts}>
            {call
              ? <a className={b.btn} data-voice="loud" href={call} target="_blank" rel="noopener noreferrer">{view.call}<Icon id="arrow-right" /></a>
              : <span className={b.btn} data-voice="loud" aria-disabled="true">{view.call}<Icon id="arrow-right" /></span>}
          </div>
        </div>
      </dialog>
    </>
  )
}
