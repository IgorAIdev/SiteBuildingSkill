import type { Stock } from './contract.ts'

/** Наличие товара на полке — по наличию его вариантов: все распроданы —
 *  «нет»; есть хоть один в наличии — «есть»; иначе — «мало». Одно правило на
 *  все источники (образец, Vendure): иначе одна и та же полка говорила бы о
 *  наличии по-разному в зависимости от того, откуда пришла. */
export const overallStock = (stocks: Stock[]): Stock => (stocks.every((s) => s === 'out') ? 'out' : stocks.some((s) => s === 'in') ? 'in' : 'low')

/** Стандартный вариант (И468, И473) — одно правило на карту товара и полку,
 *  на оба источника: вариант магазина (`standard`), если он в наличии; нет —
 *  первый в наличии по порядку данных; всё распродано — null. Слово
 *  заказчика 27.09.2026: «у всех категорий карточек должен быть какой-то по
 *  умолчанию стандартный вариант». */
export const standardOf = <V extends { id: string; stock: Stock }>(variants: readonly V[], standard: string | null): V | null =>
  variants.find((v) => v.id === standard && v.stock !== 'out') ?? variants.find((v) => v.stock !== 'out') ?? null
