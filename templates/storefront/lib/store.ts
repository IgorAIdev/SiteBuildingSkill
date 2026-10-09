import { useSyncExternalStore } from 'react'

/* Склад браузера — единственное место, где витрина трогает `localStorage`
   (скилл code, правило 5). Он умеет две вещи, которых нет у прямого
   вызова: сказать подписчикам, что значение сменилось (сердце на карточке —
   число у знака в шапке сразу), и не упасть в приватном окне, где
   хранилище бросает исключение. Другие вкладки узнают о записи событием
   `storage`. Значение — JSON; не читается — умолчание. */
const listeners = new Map<string, Set<() => void>>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function raw(key: string): string | null {
  try { return window.localStorage.getItem(key) } catch { return null }
}

export function read<T>(key: string, fallback: T): T {
  const now = raw(key)
  const kept = cache.get(key)
  if (kept && kept.raw === now) return kept.value as T
  let value: T = fallback
  if (now !== null) { try { value = JSON.parse(now) as T } catch { value = fallback } }
  cache.set(key, { raw: now, value })
  return value
}

export function write<T>(key: string, value: T) {
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* приватное окно — живёт до перезагрузки */ }
  cache.set(key, { raw: raw(key) ?? JSON.stringify(value), value })
  listeners.get(key)?.forEach((f) => f())
}

function subscribe(key: string, f: () => void) {
  const set = listeners.get(key) ?? new Set()
  set.add(f)
  listeners.set(key, set)
  const other = (e: StorageEvent) => { if (e.key === key) f() }
  window.addEventListener('storage', other)
  return () => { set.delete(f); window.removeEventListener('storage', other) }
}

/** Значение склада как состояние компонента: сервер и первый кадр видят
 *  умолчание, дальше — склад. */
export function useStored<T>(key: string, fallback: T): T {
  return useSyncExternalStore((f) => subscribe(key, f), () => read(key, fallback), () => fallback)
}

const none = () => () => {}
/** Склад уже прочитан: первый кадр после сервера видит умолчание, и решать
 *  по нему (например, менять адрес) нельзя — это ещё не склад. */
export const useReady = (): boolean => useSyncExternalStore(none, () => true, () => false)
