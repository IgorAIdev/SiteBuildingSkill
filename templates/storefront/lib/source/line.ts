import type { LineMember, OptionGroup, Stock } from './contract.ts'

/** Товар, как его отдаёт каталог магазина: адрес, имя, марка, сила и мера
 *  строками полей товара («1000mg», «10ml»). */
export type LineMate = { id: string; name: string; brand: string | null; strength: string | null; volume: string | null; stock: Stock }

const clean = (x: string | null) => x?.trim() || null
const num = (x: string) => Number.parseFloat(x.replace(',', '.')) || 0
/* Сила и мера в имени — «CBD масло 10% пълен спектър», «… 900mg …»: у
   магазина они часть имени, и имя линейки — имя без них. */
const MEASURE = /\s*\d+(?:[.,]\d+)?\s*(?:%|mg|мг|ml|мл|g|г)(?=\s|$)/giu
export const lineName = (name: string) => name.replace(MEASURE, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase()
const percentIn = (name: string) => name.match(/(\d+(?:[.,]\d+)?)\s*%/)?.[1]?.replace(',', '.') ?? null

/** Линейка товара (И503) — у магазина отдельный товар на каждую силу и
 *  меру, а покупатель выбирает силу и меру на одной карте. Соседи — товары
 *  той же марки и того же имени без силы и меры. Группа выбора — поле, по
 *  которому соседи различаются: сила (процент из имени, иначе поле силы) и
 *  мера; значение — строка, как её записал магазин, она же код: выбор ведёт
 *  на соседа, а не в параметр. Соседей меньше двух или они ничем не
 *  различаются — линейки нет. Чистая функция. */
export function lineOf(self: LineMate, all: readonly LineMate[], names: { strength: string; volume: string }): { axes: OptionGroup[]; members: LineMember[] } | null {
  const key = lineName(self.name)
  const mates = all.filter((m) => m.brand === self.brand && lineName(m.name) === key)
  if (mates.length < 2 || !mates.some((m) => m.id === self.id)) return null
  const value = (m: LineMate, code: 'strength' | 'volume') => (code === 'strength' ? (percentIn(m.name) ? `${percentIn(m.name)}%` : clean(m.strength)) : clean(m.volume))
  const axes: OptionGroup[] = (['strength', 'volume'] as const).flatMap((code) => {
    const values = [...new Set(mates.map((m) => value(m, code)).filter((x): x is string => x !== null))].sort((a, b) => num(a) - num(b))
    return values.length > 1 ? [{ code, name: names[code], options: values.map((v) => ({ code: v, name: v })) }] : []
  })
  if (!axes.length) return null
  const members = mates.map((m) => ({ id: m.id, stock: m.stock, options: Object.fromEntries(axes.flatMap((g) => { const v = value(m, g.code as 'strength' | 'volume'); return v ? [[g.code, v]] : [] })) }))
  return { axes, members }
}
