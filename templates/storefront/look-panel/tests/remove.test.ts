import { test } from 'node:test'
import assert from 'node:assert/strict'
import { squeeze } from '../scripts/remove.mjs'

/* Сверка отгружаемых стилей (`check:look`) сравнивает значение вида так, как его пишет
   сборщик. Пара `light-dark()` с равными половинами сжимается в одну краску — сверка
   ждёт её же (08.10.2026: ~35 ложных находок на краске палубы перед отрезанием панели). */
test('the shipped-style check reads a light-dark pair with equal halves as one colour', () => {
  assert.equal(squeeze('light-dark(#FFFFFF, #FFFFFF)'), '#fff')
  assert.equal(squeeze('light-dark(#1F1E1C15, #1F1E1C15)'), '#1f1e1c15')
  assert.equal(squeeze('light-dark(#FFFFFF, #000000)'), 'var(--lightningcss-light,#fff)var(--lightningcss-dark,#000)')
})

test('a file of one unchosen variant is removed whole, the chosen one stays', async () => {
  const { variantFile } = await import('../scripts/remove.mjs')
  const text = ['/* look-home:minimal:file */', 'export function MinimalHero() {}', ''].join('\n')
  assert.equal(variantFile(text, { 'look-header': 'classic', 'look-card': 'framed', 'look-home': 'caption' }), true)
  assert.equal(variantFile(text, { 'look-header': 'classic', 'look-card': 'framed', 'look-home': 'minimal' }), false)
  assert.equal(variantFile('export const x = 1', { 'look-home': 'caption' }), false)
})
