'use client'
import { createContext, useContext } from 'react'

/** Исход записи формы корзины — для надписи её кнопки (CartForm кладёт). */
export const SaidContext = createContext<{ kind: string; inCart?: number | null } | null>(null)

/* Надпись кнопки «в корзину» — одна на сайт (И469): до записи — слово
   действия, после удачной — «Added» и сколько штук этого товара теперь в
   корзине («Added · 3 in cart», на карточке полки — «Added · 3»). Слово
   заказчика 27.09.2026: «кнопка должна менять состояние на Added и
   показывать количество добавленного в корзину… и кнопки [полки] меняют
   состояние?». До того полка меняла надпись своей парой спанов и CSS, а
   карта товара не меняла никак: две кнопки одной вещи. Исход берётся из
   формы (`SaidContext`), шаблон с `{n}` — из данных языка. Вслух исход
   читает строка формы (`role="status"`), надпись — для глаза. */
export function AddLabel({ add, added }: { add: string; added: string }) {
  const said = useContext(SaidContext)
  if (!said || said.kind === 'error') return <span>{add}</span>
  return <span>{said.inCart ? added.replace('{n}', String(said.inCart)) : added.replace(/\s*·\s*\{n\}.*$/, '')}</span>
}
