'use client'
import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { FoldView } from '@/lib/catalog-view.ts'

/* Полка телефона шагами (И754): сколько показано — одно на полку и её строку
   листания. Полка (FoldGrid) прячет карточки за шагом, строка листания —
   номера страниц, «Показать ещё» (`FoldMore`) и счёт «24 of 85» (`FoldCount`):
   так же, как на широком, только «Показать ещё» добавляет 24, а не страницу
   (заказчик 05.10.2026: «давай как в десктопе — и страницы покажет, и show more,
   и количество: просто 24 of 85»). Каждое нажатие — ровно шаг: 24 → 48 → 72 →
   85; кончились загруженные — шаг дописывает следующую страницу мягким
   переходом (`next`, `?page=2&from=1`). Фокус встаёт на первую добавленную
   карточку. Обёртка разметки не рисует: полка и строка листания остаются
   соседями в ритме области. Новая полка — новая свёртка (`key` у места). */
type Fold = { count: number; seen: number; done: boolean; busy: boolean; more: () => void; grid: string }
const FoldCtx = createContext<Fold | null>(null)

export function FoldShelf({ fold, grid, children }: { fold: FoldView; grid: string; children: ReactNode }) {
  const [count, setCount] = useState(fold.start)
  const [busy, load] = useTransition()
  const router = useRouter()
  const value = useMemo<Fold>(() => {
    const seen = Math.min(count, fold.loaded)
    const more = () => {
      const want = count + fold.step
      flushSync(() => setCount(want))
      document.getElementById(grid)?.children[count]?.querySelector('a')?.focus({ preventScroll: true })
      const next = fold.next
      if (want > fold.loaded && next) load(() => router.push(next, { scroll: false }))
    }
    return { count, seen, done: seen >= fold.total, busy, more, grid }
  }, [count, busy, fold, grid, router])
  return <FoldCtx.Provider value={value}>{children}</FoldCtx.Provider>
}

/** Сколько карточек полки показано на телефоне; без свёртки — все. */
export function useFoldCount(): number {
  return useContext(FoldCtx)?.count ?? Number.POSITIVE_INFINITY
}

/** «Показать ещё» свёртки — ещё шаг; показано всё — кнопки нет. */
export function FoldMore({ className, label }: { className: string; label: string }) {
  const f = useContext(FoldCtx)
  if (!f || f.done) return null
  return <button className={className} data-hand="pop" type="button" aria-controls={f.grid} aria-busy={f.busy || undefined} disabled={f.busy} onClick={f.more}>{label}</button>
}

/** Счёт свёрнутой полки — «24 of 85»: `{k}` — показанное. */
export function FoldCount({ className, shown }: { className: string; shown: string }) {
  const f = useContext(FoldCtx)
  if (!f) return null
  return <p className={className} aria-live="polite">{shown.replace('{k}', String(f.seen))}</p>
}
