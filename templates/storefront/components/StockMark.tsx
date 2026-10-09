import type { ReactNode } from 'react'
import s from './StockMark.module.css'
import { Icon } from './Icon.tsx'

/* Строка наличия: слово краской сигнала, перед ним — знак в круге или
   точка, как выбрано в виде (`--stock-look`, панель Look → Product page →
   Stock; слово заказчика 02.10.2026). Оба рисунка стоят в разметке, видит
   один — выбирает стиль (`@container style(...)`, как знак корзины), сборки
   не нужно. Знак и точка — знаки листа; смысл несёт форма, не один цвет:
   зелёное слово без знака не читается дальтонику (WCAG 1.4.1). */
export type StockLevel = 'in' | 'low' | 'out'

const SIGN: Record<StockLevel, string> = { in: 'check-circle', low: 'alert-circle', out: 'x-circle' }
const DOT: Record<StockLevel, string> = { in: 'dot-full', low: 'dot-half', out: 'dot-empty' }

export function StockMark({ level, children }: { level: StockLevel | null; children: ReactNode }) {
  return (
    <span className={s.stock} data-level={level ?? undefined}>
      {level ? <span className={s.sign}><Icon id={SIGN[level]} /></span> : null}
      {level ? <span className={s.dot}><Icon id={DOT[level]} /></span> : null}
      {children}
    </span>
  )
}
