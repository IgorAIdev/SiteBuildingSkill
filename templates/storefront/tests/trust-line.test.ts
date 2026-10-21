import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sloganLines } from '../lib/pledges.ts'

const NB = ' '

/* Ряд доверия главной — три слогана, не ссылки (слово заказчика 17.10.2026: «там было три слогана, а не
   два; это мотивационная вещь, а не ссылка»): лаборатория — словом блока, доставка и возврат — фактами
   магазина, а не способами доставки движка: у Vendure без корзины их нет, и слоган пропадал. */
test('trust slogans: free delivery and returns come from the shop facts, not from the engine delivery list', () => {
  const facts = { returnDays: 14, freeDeliveryFrom: { minor: 10000, currency: 'EUR' } }
  assert.equal(sloganLines('en', facts).length, 2, 'доставка и возврат; лаборатория — третьим, словом блока')
  assert.match(sloganLines('en', facts)[0], /^Free delivery from /)
  assert.equal(sloganLines('en', facts)[1], '14-day returns')
  assert.equal(sloganLines('ro', facts).length, 2, 'на каждом языке рынка — доставка и возврат')
  assert.deepEqual(sloganLines('en', { returnDays: null, freeDeliveryFrom: null }), [], 'нет факта — нет слогана')
  assert.deepEqual(sloganLines('en', null), [])
})

test('trust slogans are text, not links: no anchor, no hand response in the markup', () => {
  const tsx = readFileSync(new URL('../components/blocks/TrustLine.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(tsx, /<a[ >]|href=|b\.row|<Icon/)
  const css = readFileSync(new URL('../components/blocks/blocks.module.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /\.trustRow|\.trustIcon/)
})
