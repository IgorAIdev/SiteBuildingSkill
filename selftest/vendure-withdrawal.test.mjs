/**
 * Заявление об отказе от договора — правила плагина Vendure без сервера
 * (skills/site-building/assets/vendure/plugins/withdrawal/rules.ts; И748):
 * спрашивается ровно разрешённое (ст. 11a(2) Директивы 2011/83), заявление с
 * незнакомым номером заказа принимается, письмо называет содержание, дату и
 * время (ст. 11a(4)) на языке заявления.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkStatement, letterOf, momentOf, LIMITS } from '../skills/site-building/assets/vendure/plugins/withdrawal/rules.ts'

test('a statement needs a name, an order number and an address for the confirmation — nothing else', () => {
  assert.deepEqual(checkStatement({ name: ' Ana Pop ', orderCode: ' ABC123 ', emailAddress: 'ana@example.com ' }), { ok: true, value: { name: 'Ana Pop', orderCode: 'ABC123', emailAddress: 'ana@example.com' } })
  assert.deepEqual(checkStatement({ name: '', orderCode: 'A', emailAddress: 'a@b.ro' }), { ok: false, reason: 'name' })
  assert.deepEqual(checkStatement({ name: 'A', orderCode: '', emailAddress: 'a@b.ro' }), { ok: false, reason: 'orderCode' })
  assert.deepEqual(checkStatement({ name: 'A', orderCode: 'B', emailAddress: 'not-an-address' }), { ok: false, reason: 'emailAddress' })
  assert.deepEqual(checkStatement({ name: 'A'.repeat(LIMITS.name + 1), orderCode: 'B', emailAddress: 'a@b.ro' }), { ok: false, reason: 'name' })
})

test('the confirmation names the content, the date and the time, in the language of the statement', () => {
  const at = new Date('2026-10-04T19:05:00Z')
  const s = { name: 'Ana Pop', orderCode: 'ABC123', emailAddress: 'ana@example.com', receivedAt: at, orderFound: true }
  const ro = letterOf('ro', s)
  assert.match(ro.subject, /ABC123/)
  assert.deepEqual(ro.rows.map((r) => r[1]).slice(0, 3), ['Ana Pop', 'ABC123', 'ana@example.com'])
  assert.match(ro.at, /22:05/, 'ora Bucureștiului (UTC+3 în octombrie)')
  assert.match(ro.at, /octombrie 2026/)
  assert.equal(ro.warning, null)
  assert.match(letterOf('hu', s).subject, /elállás/i)
  assert.match(letterOf('en', s).hello, /Hello Ana Pop/)
  assert.match(letterOf('xx', s).subject, /retragerii/, 'незнакомый язык — румынский')
  assert.ok(letterOf('ro', { ...s, orderFound: false }).warning, 'номер не найден — магазину пометка «проверьте вручную»')
  assert.match(momentOf('en', at), /2026/)
})
