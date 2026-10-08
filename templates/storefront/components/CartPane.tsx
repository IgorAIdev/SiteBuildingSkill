'use client'
import { useCallback, useEffect, useState, type RefObject } from 'react'
import b from '@/styles/btn.module.css'
import pn from '@/styles/pane.module.css'
import s from './Cart.module.css'
import type { CartPageView } from '@/lib/cart-view.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { CartForm } from './CartForm.tsx'
import { CartLines } from './CartLines.tsx'
import { CartCoupon } from './CartCoupon.tsx'
import { GoalMeter } from './GoalMeter.tsx'
import { OrderTotals } from './OrderTotals.tsx'
import { EmptyPaths } from './EmptyPaths.tsx'
import { PaneHead } from './PaneHead.tsx'

type View = Pick<CartPageView, 'title' | 'count' | 'lines' | 'totals' | 'goal' | 'coupon' | 'couponNotice' | 'checkout' | 'open' | 'empty' | 'messages'>

/* Шторка корзины — знак корзины в шапке открывает её, не уводя со
   страницы (слово заказчика 28.09.2026: «иконка корзины должна открывать
   боковое меню корзины, см. как в cbdin сделано»; бриф
   docs/design/шторки.md). Окно — общий модуль (styles/pane.module.css):
   шапка стоит, строки прокручиваются, низ с итогом и кнопками стоит.
   Строки — те же, что на странице корзины (CartLines), вид корзины
   считает страница (`/api/cart?view`), а не шторка: деньги и слова — в
   данных. Запись из шторки шлёт `cart:count` (CartForm), и шторка
   перечитывает корзину. Без скрипта знак — ссылка на страницу корзины.

   Число штук — в шапке рядом с заголовком, тихо (слово заказчика 03.10.2026:
   «количество товара может в другом месте разместить лучше»; Allbirds —
   «Cart (1)» в шапке). Полоса до бесплатной доставки стоит под шапкой и не
   прокручивается с товарами: она отвечает на каждый шаг счётчика, и
   человек, меняющий количество в конце длинного списка, её видит (И668).

   Шторка — тот же лист, что меню и фильтры (И772; слово заказчика 05.10.2026: «в
   корзине несколько оттенков, а в меню нет»): палуба шапки, один белый лист,
   черта над низом. До этого корзина шла слоями (03.10.2026, И671) — полоса
   доставки на тоне, тело на подложке `--band`, строки карточками, — и была
   единственным окном, где пять заливок. Низ — пара окна (`pn.acts`): тихая
   «открыть корзину» слева, громкая «к оформлению» справа.
   Код скидки — раскрывающийся, в стоящем низу над итогом, а не в конце
   прокручиваемых строк (слово заказчика 03.10.2026: «дискаунт код не должен
   быть там же, где и товары, он не должен скролиться»; И693): он меняет итог
   и стоит рядом с ним.

   `shown` — вид дан готовым (образец в дизайн-системе): шторка за корзиной
   не ходит и чужую корзину не показывает; открывать её снаружи нечем, и
   ручка окна (`pane`) ей не нужна. */
export function CartPane({ lang, id, src, title, close, pane, shown }: { lang: string; id: string; src: string; title: string; close: string; pane?: RefObject<HTMLDivElement | null>; shown?: View }) {
  const [view, setView] = useState<View | null>(shown ?? null)
  const load = useCallback(() => {
    fetch(`${src}&view=1`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ view?: View | null }>) : null))
      .then((d) => { if (d?.view) setView(d.view) })
      .catch(() => {})
  }, [src])
  useEffect(() => {
    const el = pane?.current
    if (!el || shown) return
    const open = (e: Event) => { if ((e as ToggleEvent).newState === 'open') load() }
    const count = () => { if (el.matches(':popover-open')) load() }
    el.addEventListener('toggle', open)
    window.addEventListener('cart:count', count)
    return () => { el.removeEventListener('toggle', open); window.removeEventListener('cart:count', count) }
  }, [pane, load, shown])
  const filled = Boolean(view?.lines.length)
  return (
    <div ref={pane} id={id} popover="auto" className={`${pn.pane} ${s.pane}`} data-pane="end" aria-labelledby={`${id}-title`}>
      <PaneHead title={view?.title ?? title} titleId={`${id}-title`} aside={view && filled ? view.count : null} close={close} target={id} />
      {view && filled && view.goal ? <div className={s.paneGoal}><GoalMeter goal={view.goal} /></div> : null}
      <div className={pn.body} aria-busy={view ? undefined : true}>
        {!view ? null : filled ? (
          <>
            <CartForm lang={lang} quiet submit={cartSubmit} call={cartCall} initial={null} timeout={view.messages.timeout} failed={view.messages.failed}>
              <CartLines lines={view.lines} />
            </CartForm>
          </>
        ) : (
          <EmptyPaths level={2} title={view.empty.title} lead={view.empty.lead} shelves={view.empty.shelves} />
        )}
      </div>
      {view && filled ? (
        <div className={`${pn.foot} ${s.paneFoot}`}>
          <CartCoupon lang={lang} view={view} submit={cartSubmit} call={cartCall} />
          <OrderTotals totals={view.totals} />
          <div className={pn.acts}>
            <a className={b.btn} href={view.open.href}>{view.open.label}</a>
            <a className={b.btn} data-voice="loud" href={view.checkout.href}>{view.checkout.label}</a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
