import type { Lang } from './locale.ts'
import type { Block, Collection } from './source/contract.ts'
import { content, source } from './source/index.ts'
import { heroShelves } from './hero-shelves.ts'

/* Главные полки магазина — те, что стоят кнопками под абзацем героя (И673):
   какие и в каком порядке — данные главной (`shelves` блока героя), имя и
   знак — данные полки. Их же предлагает пустая корзина (И689). Молчит
   источник — полок нет, экран стоит без них. */
export async function mainShelves(lang: Lang): Promise<Collection[]> {
  const [page, cols] = await Promise.all([content().page(lang, 'home'), source().collections(lang)])
  if (!page.ok || !cols.ok) return []
  const hero = page.value.blocks.find((b): b is Extract<Block, { type: 'hero' }> => b.type === 'hero')
  return heroShelves(hero?.shelves, cols.value)
}
