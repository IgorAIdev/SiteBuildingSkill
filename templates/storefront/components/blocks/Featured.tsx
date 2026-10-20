import p from '@/styles/primitives.module.css'
import type { Block } from '@/lib/source/contract.ts'
import type { ShelfCard } from '@/lib/view.ts'
import { hrefFor } from '@/lib/href.ts'
import { Shelf } from '../Shelf.tsx'
import type { BlockCtx, Place } from './types.ts'

/* Карточки полки по списку блока — те, что источник ещё отдаёт. */
const picked = (ids: readonly string[], cards: BlockCtx['cards']): ShelfCard[] => ids.map((id) => cards[id]).filter((c): c is ShelfCard => Boolean(c))

export function Featured({ block, ctx, place }: { block: Extract<Block, { type: 'featured' }>; ctx: BlockCtx; place: Place }) {
  const cards = picked(block.ids, ctx.cards)
  if (!cards.length) return null
  /* Полка — общая (components/Shelf.tsx, И481); выход — ко всему каталогу. */
  const all = block.to ? hrefFor(ctx.lang, { category: block.to }) : hrefFor(ctx.lang, { catalog: true })
  return <Shelf title={block.title} lede={block.lede} id={`shelf-${block.to ?? block.ids[0] ?? 'top'}`} all={all} cards={cards} cart={ctx.cart} className={p.wrap} air={place.air ?? undefined} />
}
