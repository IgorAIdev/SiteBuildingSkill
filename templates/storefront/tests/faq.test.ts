import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Вопросы раскрываются по одному (И761): открыл новый — прежний закрылся. */
test('FAQ questions are one exclusive group of details', () => {
  const faq = readFileSync(new URL('../components/blocks/Faq.tsx', import.meta.url), 'utf8')
  assert.match(faq, /<details [^>]*data-faq name="faq"/)
})
