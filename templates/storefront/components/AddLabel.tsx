'use client'
import { useLayoutEffect, useRef } from 'react'
import b from '@/styles/btn.module.css'
import { Icon } from './Icon.tsx'
import { useInCart } from '@/lib/in-cart.ts'

/* Надпись кнопки «в корзину» со знаком корзины — одна на сайт (И469): пока
   варианта в корзине нет — слово действия, лежит хоть одна штука — «Added»
   и сколько штук этого варианта в корзине («Added · 3 in cart», на карточке
   полки — «Added · 3»). Слово заказчика 27.09.2026: «кнопка должна менять
   состояние на Added и показывать количество добавленного в корзину». Число
   — из списка страницы (lib/in-cart.ts), а не из исхода своей формы: товар,
   положенный раньше, показан уже при загрузке (заказчик 05.10.2026: «после
   нажатия Add показала, что в корзине уже 5, а что было 4 — не показывала»).
   Шаблон с `{n}` — из данных языка. Вслух исход читает строка формы
   (`role="status"`), надпись — для глаза.
   `short` — слово действия для узкой карточки полки: «Add to cart» со знаком
   корзины в кнопку телефонной карточки не помещается (слово заказчика
   01.10.2026: «Add to cart + корзина»); какое из двух видно, решает
   карточка по своей ширине (ProductCard.module.css).

   Надпись не переносится никогда (И763, слово заказчика 05.10.2026: «перенос
   на две строки — это непозволительно… если не помещается, можно убирать
   иконку, чтоб поместилась цифра количества»). Надпись меряет место в своей
   кнопке и уступает по порядку (`data-fit`, styles/btn.module.css): 0 — всё,
   1 — без знака, 2 — число со знаком, без слов. Число не уходит никогда.
   Мерка — как у «Ещё» в меню полок (NavLinks): длина слова зависит от
   языка, числа — от корзины, и порог в rem угадал бы только один язык. */
export function AddLabel({ variant, add, short, added }: { variant?: string | null; add: string; short?: string; added: string }) {
  const n = useInCart(variant)
  const box = useRef<HTMLSpanElement>(null)
  const [before = '', after = ''] = added.split('{n}')
  useLayoutEffect(() => {
    const el = box.current
    const btn = el?.parentElement
    if (!el || !btn) return
    const put = () => fit(el, btn)
    const watch = new ResizeObserver(put)
    watch.observe(btn)
    put()
    /* Шрифт сайта приходит после первого кадра и меняет ширину слова, а не
       кнопки: наблюдатель кнопки этого не видит. */
    document.fonts?.ready.then(put).catch(() => {})
    return () => watch.disconnect()
  }, [n, add, short, added])
  return (
    <span ref={box} className={b.fit}>
      {n ? <span><span data-part="word">{before}</span><span data-part="n">{n}</span><span data-part="word">{after}</span></span>
        : short ? <span><span data-add="long">{add}</span><span data-add="short">{short}</span></span>
        : <span>{add}</span>}
      <Icon id="shopping-cart" />
    </span>
  )
}

/* Сколько надписи помещается в кнопку. Меряется всё показанным (уровень 0),
   потом ставится уровень: знак, слово и число меряются там, где стоят, —
   кегль, поле и знак кнопки решает её модуль, а не эта мерка. Кнопка не
   видна (свёрнутая полка) — мерить нечего: наблюдатель позовёт, когда
   появится. */
const width = (x: Element | null) => x?.getBoundingClientRect().width ?? 0
function fit(el: HTMLElement, btn: HTMLElement) {
  if (!btn.clientWidth) return
  el.dataset.fit = '0'
  const cs = getComputedStyle(btn)
  const room = btn.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd) + 0.5
  const gap = parseFloat(getComputedStyle(el).columnGap) || 0
  const label = width(el.firstElementChild), sign = width(el.lastElementChild)
  const n = el.querySelector('[data-part="n"]')
  el.dataset.fit = label + gap + sign <= room ? '0' : label <= room || !n ? '1' : '2'
}
