import { useSyncExternalStore } from 'react'

/* Сколько штук каждого варианта лежит в корзине — для надписи кнопки «в
   корзину» (AddLabel, И469): «Added · 4» стоит уже при загрузке страницы, а
   не только после своего нажатия. Слово заказчика 05.10.2026: «кнопка не
   показывала то, что товар уже в корзине: после нажатия Add показала, что в
   корзине уже 5, а то, что было 4, — не показывала». Число знала только
   форма, которая сама писала.

   Страницы каталога общие и статичные — сервер корзины покупателя не знает.
   Её читает знак корзины в шапке (CartLink, `/api/cart`) после загрузки,
   каждого перехода и каждой записи — и кладёт сюда весь список; удачное
   добавление кладёт своё число сразу (CartForm), не дожидаясь перечтения.
   Первый кадр с сервера — «в корзину»: корзину ещё не спросили. */
let held: Readonly<Record<string, number>> = {}
const listeners = new Set<() => void>()
const tell = () => listeners.forEach((f) => f())

export function holdAll(next: Record<string, number>) { held = next; tell() }
export function holdOne(variant: string, n: number) { held = { ...held, [variant]: n }; tell() }

const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
export const useInCart = (variant: string | null | undefined): number =>
  useSyncExternalStore(subscribe, () => (variant ? held[variant] ?? 0 : 0), () => 0)
