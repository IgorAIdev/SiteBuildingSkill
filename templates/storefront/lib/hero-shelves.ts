import type { Block, Collection } from './source/contract.ts'

/* Полки кнопками героя (И673, И735): `'all'` — все полки магазина в порядке
   каталога, список адресов — только эти в его порядке; полки нет у магазина —
   нет и кнопки. Одна выборка на героя и пустую корзину (`mainShelves`, И689). */
export function heroShelves(shelves: Extract<Block, { type: 'hero' }>['shelves'], collections: Collection[]): Collection[] {
  if (shelves === 'all') return collections
  return (shelves ?? []).flatMap((slug) => collections.filter((c) => c.slug === slug))
}
