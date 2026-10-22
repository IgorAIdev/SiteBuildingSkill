import type { Block, Collection } from './source/contract.ts'
import type { Lang } from './locale.ts'
import { hrefFor } from './href.ts'

/* Полки кнопками героя (И673, И735): `'all'` — все полки магазина в порядке
   каталога, список адресов — только эти в его порядке; полки нет у магазина —
   нет и кнопки. Одна выборка на героя и пустую корзину (`mainShelves`, И689). */
export function heroShelves(shelves: Extract<Block, { type: 'hero' }>['shelves'], collections: Collection[]): Collection[] {
  if (shelves === 'all') return collections
  return (shelves ?? []).flatMap((slug) => collections.filter((c) => c.slug === slug))
}

/** Полки героя путями кнопок (`CategoryPaths`): имя, знак и адрес полки — одна запись на
 *  все виды героя (Hero, SportHero), а не `.map` на месте у каждого. */
export const shelfPaths = (lang: Lang, shelves: Collection[]): { label: string; sign: string | null; href: string }[] =>
  shelves.map((c) => ({ label: c.name, sign: c.sign, href: hrefFor(lang, { category: c.slug }) }))
