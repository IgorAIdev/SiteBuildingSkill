import p from '@/styles/primitives.module.css'
import type { Block } from '@/lib/source/contract.ts'
import type { ShelfCard } from '@/lib/view.ts'
import type { HomeVariant } from '@/lib/homes.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { Shelf } from '../Shelf.tsx'
import type { BlockCtx, Place } from './types.ts'

/* Сколько карточек полки грузится сразу, а не лениво: там, где вариант
   главной ставит полку в первый экран, её снимки — самое крупное на
   экране телефона, и ленивая загрузка задержала бы их. */
const EAGER: Partial<Record<HomeVariant, number>> = {
  counter: 2, // look-home:counter
}

/* Карточки полки по списку блока — те, что источник ещё отдаёт. */
const picked = (ids: readonly string[], cards: BlockCtx['cards']): ShelfCard[] => ids.map((id) => cards[id]).filter((c): c is ShelfCard => Boolean(c))

export function Featured({ block, ctx, place }: { block: Extract<Block, { type: 'featured' }>; ctx: BlockCtx; place: Place }) {
  const cards = picked(block.ids, ctx.cards)
  if (!cards.length) return null
  const eager = EAGER[ctx.home] ?? 0
  /* Полка — общая (components/Shelf.tsx, И481); выход — ко всему каталогу. */
  const all = block.to ? { label: t(ctx.lang, 'shelf.all'), href: hrefFor(ctx.lang, { category: block.to }) } : { label: t(ctx.lang, 'nav.catalog'), href: hrefFor(ctx.lang, { catalog: true }) }
  return <Shelf title={block.title} id={`shelf-${block.to ?? block.ids[0] ?? 'top'}`} all={all} cards={cards} cart={ctx.cart} eager={eager} className={p.wrap} air={place.air ?? undefined} />
}
