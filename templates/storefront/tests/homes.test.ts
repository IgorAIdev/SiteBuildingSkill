import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { arrange, HOMES, RECIPE, type HomeVariant } from '../lib/homes.ts'
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
  assert.match(read('app/[site]/[lang]/page.tsx'), /data-home=\{look\.home\}/)
  const slots = RECIPE.map(([slot]) => slot)
  assert.equal(new Set(slots).size, slots.length, 'место не повторяется')
  for (const type of ['hero', 'effects', 'featured', 'faq', 'story']) assert.ok(slots.includes(type as never), type)
})

/* Одежда `sport` ставит полку товаров сразу за героем — первое окно показывает
   заголовок и товар вместе. Блок остаётся один раз, порядок остальных прежний. */
test('home: the sport dress puts the best sellers right after the hero, every block still once', { skip: !(HOMES as readonly string[]).includes('sport') }, () => {
  for (const lang of ['ro', 'en', 'hu'] as const) {
    const blocks = PAGES.home.blocks[lang]
    const placed = arrange(blocks, 'sport' as HomeVariant)
    assert.deepEqual(placed.map((x) => x.slot).slice(0, 2), ['hero', 'featured'], `${lang}: полка сразу за героем`)
    assert.deepEqual([...placed.map((x) => x.block)].sort((a, b) => blocks.indexOf(a) - blocks.indexOf(b)), blocks, `${lang}: каждый блок — один раз`)
  }
})

/* Ряд доверия стоит после товара, а не над ним. Исследование главной советовало
   поставить его под героя; заказчик, увидев, сказал: «наверху товар, а не
   политика возврата; доверие ниже, перед футером» (13.10.2026,
   `.claude/memory/home-product-first.md`). Решение не оставляет следа в
   поведении, и «доказательство рядом с героем» хочется вернуть из лучших
   побуждений — поэтому падает. Снимается словом заказчика, одной работой с
   записью. */
test('home: the trust row stands last, after every product shelf, in every recipe', () => {
  const fail = 'Ряд доверия стоит выше товара. Заказчик 13.10.2026: «наверху товар, а не политика возврата; доверие ниже, перед футером». Верни его последним.'
  const recipes: Array<[string, readonly (readonly [string, ...unknown[]])[]]> = [['общий', RECIPE], ...HOMES.map((h) => [h, arrange(PAGES.home.blocks.en, h).map((x) => [x.slot] as const)] as [string, readonly (readonly [string])[]])]
  for (const [name, steps] of recipes) {
    const slots = steps.map(([slot]) => slot)
    assert.equal(slots.at(-1), 'trust', `${name}: ${fail}`)
    assert.ok(slots.lastIndexOf('featured') < slots.indexOf('trust'), `${name}: ${fail}`)
  }
})
