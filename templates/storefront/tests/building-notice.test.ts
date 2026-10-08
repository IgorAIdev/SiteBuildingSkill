import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { LOCALES } from '../lib/locale.ts'
import { t } from '../lib/i18n/index.ts'
import { ordersOpen } from '../lib/source/index.ts'

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

/* Заказы не принимаются — сайт говорит об этом заранее, полосой над шапкой
   (И792; заказчик 08.10.2026: «напиши… что сайт в режиме создания, заказы пока
   не принимаются»), а не только отказом у кнопки заказа. */
test('orders are open with the sample and with the engine only by its word', () => {
  const was = { source: process.env.SOURCE, place: process.env.VENDURE_PLACE_ORDERS }
  try {
    delete process.env.SOURCE; delete process.env.VENDURE_PLACE_ORDERS
    assert.equal(ordersOpen(), true)
    process.env.SOURCE = 'vendure'
    assert.equal(ordersOpen(), false)
    process.env.VENDURE_PLACE_ORDERS = 'on'
    assert.equal(ordersOpen(), true)
  } finally {
    if (was.source === undefined) delete process.env.SOURCE; else process.env.SOURCE = was.source
    if (was.place === undefined) delete process.env.VENDURE_PLACE_ORDERS; else process.env.VENDURE_PLACE_ORDERS = was.place
  }
})

test('the notice stands above the header in both frames while orders are closed, and stays out of the search snippet', () => {
  const shell = read('components/Shell.tsx')
  const notice = shell.indexOf('<BuildingNotice'), header = shell.indexOf('<CheckoutHeader')
  assert.ok(notice > 0 && notice < header, 'полоса — до шапки, в обеих рамах')
  assert.match(shell, /ordersOpen\(\) \? null : <BuildingNotice/)
  assert.match(read('components/BuildingNotice.tsx'), /data-nosnippet/)
  for (const lang of LOCALES) assert.ok(t(lang, 'notice.building').length > 20, lang)
})
