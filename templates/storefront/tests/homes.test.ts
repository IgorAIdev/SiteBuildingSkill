import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { arrange, carried, HOMES, RECIPE, type HomeVariant } from '../lib/homes.ts'
import { PAGES } from '../lib/pages.ts'
import type { Block } from '../lib/source/contract.ts'

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

/* Рецепт главной решает, ГДЕ стоит блок, а не ЕСТЬ ли он: блок владельца не
   пропадает, и ни один не встаёт дважды. Раскладка одна (И596). */
test('home: every block of the page stands once, in the recipe order', () => {
  for (const lang of ['ro', 'en', 'hu'] as const) {
    const blocks = PAGES.home.blocks[lang]
    const placed = arrange(blocks)
    /* Блок доверия несёт герой (`carried`): в потоке его нет, и он — ровно один. */
    assert.deepEqual([...placed.map((x) => x.block), ...[carried(blocks)].filter((b) => b !== null)].sort((a, b) => blocks.indexOf(a) - blocks.indexOf(b)), blocks, `${lang}: каждый блок — один раз`)
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

/* Ряд доверия — в первом окне, над рядом кнопок героя: значок и слово в одной
   строке. Слово владельца 15.10.2026 заменило прежнее («тонкая строка под героем»):
   «выше кнопки магазина, чтобы иконки и текст были в одной строке». Блок несёт
   герой (`carried`), а не отдельное место рецепта, и не стоит дважды; одежда,
   чей рецепт называет `trust` сам, ставит его там, где сказано. Решение не
   оставляет следа в поведении, и «доверие отдельной полосой» хочется вернуть из
   лучших побуждений — поэтому падает. Снимается словом владельца, одной работой
   с записью. */
test('home: the trust row rides in the hero above the shop buttons, and stands nowhere else unless the recipe names it', () => {
  const fail = 'Ряд доверия стоит не в первом окне над кнопками героя. Владелец 15.10.2026: «выше кнопки магазина, чтобы иконки и текст были в одной строке».'
  const blocks = PAGES.home.blocks.en
  const trust = blocks.find((b) => b.type === 'trust')
  assert.ok(trust, 'в данных главной есть блок доверия')
  assert.ok(!RECIPE.some(([slot]) => slot === 'trust'), `общий рецепт: ${fail}`)
  assert.equal(carried(blocks), trust, `общий рецепт: герой несёт блок доверия. ${fail}`)
  assert.ok(!arrange(blocks).some((x) => x.slot === 'trust'), 'в потоке страницы блока нет — он в герое, второй раз не стоит')
  for (const home of HOMES) {
    const placed = arrange(blocks, home).filter((x) => x.slot === 'trust').length
    assert.equal(placed + (carried(blocks, home) ? 1 : 0), 1, `${home}: блок доверия стоит ровно один раз — в потоке или в герое`)
  }
  const hero = read('components/blocks/Hero.tsx')
  assert.ok(hero.indexOf('<TrustLine') > 0 && hero.indexOf('<TrustLine') < hero.indexOf('<nav aria-label'), `Hero.tsx: ряд доверия идёт раньше ряда кнопок. ${fail}`)
})
