import { Fragment, type ReactNode } from 'react'
import type { Block } from '@/lib/source/contract.ts'
import type { Placed } from '@/lib/homes.ts'
import type { BlockCtx, Place } from './types.ts'
import { Hero } from './Hero.tsx'
import { Effects } from './Effects.tsx'
import { Featured } from './Featured.tsx'
import { Faq } from './Faq.tsx'
import { Story } from './Story.tsx'
import { Reviews } from './Reviews.tsx'
import { Posts } from './Posts.tsx'
import s from './blocks.module.css'

type Renderers = { [K in Block['type']]: (props: { block: Extract<Block, { type: K }>; ctx: BlockCtx; place: Place }) => ReactNode }

/* Реестр блоков (references/payload.md): тип блока → отрисовка. Новый тип
   в договоре без строки здесь — ошибка сборки через satisfies; строка без
   типа в данных — красный tests/blocks.test.ts. */
export const RENDERERS = {
  hero: Hero,
  effects: Effects,
  featured: Featured,
  story: Story,
  reviews: Reviews,
  posts: Posts,
  faq: Faq,
} satisfies Renderers

/** Блоки, которым вид может дать подложку, — все, что есть в реестре, кроме первого экрана: новый блок в реестре получает выключатель в панели сам (scripts/band-blocks.mjs). */
const BANDED = new Set<string>(Object.keys(RENDERERS).filter((type) => type !== 'hero'))

/* Порядок и воздух — у рецепта главной (lib/homes.ts, `arrange`); здесь
   только отрисовка места. Ключ — место рецепта, а не индекс массива
   (check:lint, react/no-array-index-key). */
export function Blocks({ placed, ctx }: { placed: Placed[]; ctx: BlockCtx }) {
  return placed.map(({ block, air, key }, at) => {
    const Render = RENDERERS[block.type] as (props: { block: Block; ctx: BlockCtx; place: Place }) => ReactNode
    const one = <Render block={block} ctx={ctx} place={{ air }} />
    const tone = ctx.bands[block.type] ?? 'none'
    if (!BANDED.has(block.type) || tone === 'none') return <Fragment key={key}>{one}</Fragment>
    /* Подложка (И591): обёртка одна, цвет — роль по слову вида. Соседи одного
       типа (две полки ходовых) — одна подложка без шва между ними. */
    const join = [placed[at - 1]?.block.type === block.type ? 'prev' : '', placed[at + 1]?.block.type === block.type ? 'next' : ''].filter(Boolean).join(' ')
    return <div key={key} className={s.band} data-tone={tone} data-join={join || undefined} data-ground={tone === 'dark' ? 'deck' : undefined}>{one}</div>
  })
}
