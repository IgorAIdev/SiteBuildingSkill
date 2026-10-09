import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { arrange, RECIPE } from '../lib/homes.ts'
import { PAGES } from '../lib/pages.ts'
import type { Block } from '../lib/source/contract.ts'

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

/* Рецепт главной решает, ГДЕ стоит блок, а не ЕСТЬ ли он: блок владельца не
   пропадает, и ни один не встаёт дважды. Раскладка одна (И596). */
test('home: every block of the page stands once, in the recipe order', () => {
  for (const lang of ['ro', 'en', 'hu'] as const) {
    const blocks = PAGES.home.blocks[lang]
    const placed = arrange(blocks)
    assert.deepEqual([...placed.map((x) => x.block)].sort((a, b) => blocks.indexOf(a) - blocks.indexOf(b)), blocks, `${lang}: каждый блок — один раз`)
    const order = RECIPE.map(([slot]) => slot)
    const at = placed.map((x) => order.indexOf(x.slot))
    assert.deepEqual(at, [...at].sort((a, b) => a - b), `${lang}: порядок рецепта`)
    assert.equal(new Set(placed.map((x) => x.key)).size, placed.length, `${lang}: ключи мест различны`)
  }
})

test('home: a block type the recipe does not name still stands, at the end, in data order', () => {
  /* Тип, которого договор ещё не знает, — как придёт из админки раньше
     витрины: рецепт его не называет, место у него — в конце. */
  const later = [{ type: 'banner' }, { type: 'banner' }] as unknown as Block[]
  const blocks: Block[] = [later[0], ...PAGES.home.blocks.en, later[1]]
  assert.deepEqual(arrange(blocks).slice(-2).map((x) => x.block), later)
})

test('home: the page marks the tile dress it draws, and the recipe names every block once', () => {
  assert.match(read('app/[lang]/page.tsx'), /data-home=\{look\.home\}/)
  const slots = RECIPE.map(([slot]) => slot)
  assert.equal(new Set(slots).size, slots.length, 'место не повторяется')
  for (const type of ['hero', 'effects', 'featured', 'faq', 'story']) assert.ok(slots.includes(type as never), type)
})
