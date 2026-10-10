import { useMemo } from 'react'
import { read, useStored, write } from './store.ts'
import { SAVED_KEY } from './saved-key.ts'

/* Избранное — список товаров, отмеченных сердцем (слово заказчика
   28.09.2026: «иконки поиск, контакты, кабинет, избранное добавляй в
   меню»; образец — «Запазени» в шапке cbdin.bg). Хранится в складе
   браузера номерами товаров, новые — первыми; товары читает страница
   избранного у источника (`/api/cards`), так цена и наличие всегда
   свежие. */
export { SAVED_KEY }
const KEY = SAVED_KEY
const NONE: string[] = []

/* Образцы страницы дизайн-системы (`design-…` у `SaveToggle`) нажимаются по-
   настоящему, но в своей строке склада: счётчик шапки и страница избранного
   считают товары, а не образцы (И667). До 03.10.2026 образцы писали в общий список:
   после нескольких нажатий на странице кнопок в шапке стояло «8», а адрес
   избранного вёл на `?ids=design-pair-…`. Что туда уже попало, из списка
   товаров не читается и при первой записи уходит. */
const SAMPLE = 'design-'
const SAMPLES = 'saved-samples'
const isSample = (id: string) => id.startsWith(SAMPLE)
const keyOf = (id: string) => (isSample(id) ? SAMPLES : KEY)

export function useSaved(): string[] {
  const all = useStored<string[]>(KEY, NONE)
  return useMemo(() => (all.some(isSample) ? all.filter((id) => !isSample(id)) : all), [all])
}

/** Отмечен ли этот номер: товар — в списке избранного, образец — в своей строке. */
export const useIsSaved = (id: string): boolean => useStored<string[]>(keyOf(id), NONE).includes(id)

export function toggleSaved(id: string) {
  const key = keyOf(id)
  const now = read<string[]>(key, NONE).filter((x) => key === SAMPLES || !isSample(x))
  write(key, now.includes(id) ? now.filter((x) => x !== id) : [id, ...now])
}
