import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PAGES } from '../lib/pages.ts'

/* Блок владельца: у него есть отрисовщик и место в рецепте главной, а данных у шаблона нет —
   слово магазина пишет владелец (docs/open.md, «Слово магазина пусто»). */
const OWNER_BLOCKS = ['story']

test('every block type in the data has a renderer and every renderer has a block type', () => {
  const src = readFileSync(new URL('../components/blocks/registry.tsx', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('export const RENDERERS = {'), src.indexOf('} satisfies Renderers'))
  const rendered = [...body.matchAll(/^\s+([a-z]+): [A-Z]\w+,$/gm)].map((m) => m[1]).sort()
  const used = [...new Set(Object.values(PAGES).flatMap((p) => Object.values(p.blocks).flat().map((b) => b.type)))].sort()
  assert.deepEqual(rendered.filter((t) => !OWNER_BLOCKS.includes(t)), used)
  assert.ok(OWNER_BLOCKS.every((t) => rendered.includes(t)), 'the owner block keeps its renderer')
})
