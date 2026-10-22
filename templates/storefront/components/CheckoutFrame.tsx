import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import s from './Checkout.module.css'
import type { StepsView, SummaryView } from '@/lib/checkout-view.ts'
import type { Empty } from '@/lib/catalog-view.ts'
import { OrderItems } from './OrderItems.tsx'
import { OrderTotals } from './OrderTotals.tsx'
import { CheckoutSteps } from './CheckoutSteps.tsx'
import { StateScreen } from './StateScreen.tsx'
import { Turn } from './Turn.tsx'

/* Сводка шага: товары и итоги. Одна разметка на два места — колонку рядом
   (широкая коробка) и раскрывашку сверху (узкая): видно ровно одно, второе
   снято швом 820 целиком, и чтение вслух не слышит сводку дважды. */
function Summary({ summary }: { summary: SummaryView }) {
  return <><OrderItems items={summary.items} /><OrderTotals totals={summary.totals} /></>
}

/* Оформление — коридор (разбор 24.09.2026, X5): своя шапка без полок
   (корневой макет группы `(checkout)`), шаги, имя шага — заголовком
   страницы, один раз. Под ними ряд: шаг слева, мерой строки — поле не шире
   ожидаемого ввода; сводка с товарами — справа на полосе до края окна
   (Shopify Checkout), едет с прокруткой.

   На узкой коробке (шов 820, «телефон») колонки нет: сводка встаёт
   раскрывашкой над шагами, итог — в её строке («Sumarul comenzii · 130 €»),
   и сумма видна до кнопки, которой шаг продолжают. На шаге оплаты сводки у
   рамки нет (`summary={null}`): итог, условия и кнопку заказа ставит форма
   оплаты своей колонкой — выбор способа и кнопка уходят одной отправкой.

   `landmark={false}` — рамка образцом внутри чужой страницы (дизайн-
   система): у той уже есть свой `main` и его адрес `#main`. */
export function CheckoutFrame({ steps, summary, children, landmark = true }: { steps: StepsView; summary: SummaryView | null; children: ReactNode; landmark?: boolean }) {
  const Main = landmark ? 'main' : 'div'
  return (
    <Main id={landmark ? 'main' : undefined} className={`${p.wrap} ${p.section} ${s.corridor}`} data-air="head" data-sample={landmark ? undefined : ''}>
      {summary ? (
        <details className={s.peek}>
          <summary><span className={s.peekName}>{summary.show}<Turn /></span><b>{summary.total}</b></summary>
          <div className={s.peekBody}><Summary summary={summary} /></div>
        </details>
      ) : null}
      <div className={s.lead}>
        <CheckoutSteps steps={steps} />
        <h1 id="step-title">{steps.title}</h1>
      </div>
      {summary ? (
        <div className={`${p.sidebar} ${s.frame}`}>
          <div className={`${p.stack} ${s.step} ${s.measure}`}>{children}</div>
          <aside className={`${p.aside} ${s.side} ${s.band}`} aria-labelledby="summary-title">
            <h2 id="summary-title" className={p.said}>{summary.label}</h2>
            <div className={`${p.pinned} ${s.pin}`}><Summary summary={summary} /></div>
          </aside>
        </div>
      ) : children}
    </Main>
  )
}

/** Шаг без корзины или «спасибо» без заказа — экран «почему и куда дальше»
 *  с кодом 200: адрес из дерева открывается всегда (check:open). */
/* Пустое оформление — заголовок и одна кнопка в магазин, без знака в круге, как пустая
   корзина (EmptyPaths; слово заказчика 08.10.2026: «ни знака в круге»). Круг ростом
   84 стоял над именем страницы, и имя вставало на 141 от шапки при верхе страницы 35
   (check:craft pageTop, 22.10.2026). */
export function CheckoutEmpty({ empty }: { empty: Empty }) {
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <StateScreen level={1} kind="empty" title={empty.title} step={empty.step} href={empty.href} loud />
    </main>
  )
}
