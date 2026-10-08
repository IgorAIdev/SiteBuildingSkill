import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { cartView, priceOrFree } from '../lib/cart-view.ts'
import { pledgesView } from '../lib/pledges.ts'
import { sampleCommerce, resetSample, FIXTURES } from '../lib/source/sample/commerce.ts'
import { sampleContent } from '../lib/source/sample/content.ts'
import { sample } from '../lib/source/sample/catalog.ts'
import type { DeliveryMethod } from '../lib/source/contract.ts'

beforeEach(() => resetSample())
const NB = ' '

async function fixtureCart(lang: 'ro' | 'hu' = 'ro') {
  const r = await sampleCommerce.checkout(FIXTURES.cart, lang)
  assert.ok(r.ok && r.value)
  return r.value.cart
}

test('a cart line: link back to its variant, facts, unit price, one stepper, a worded remove', async () => {
  const v = cartView('ro', await fixtureCart(), null)
  assert.equal(v.count, '3 articole')
  const [oil, caps] = v.lines
  assert.equal(oil.href, '/ro/product/ulei-cbd-full-spectrum-20-10ml?option.putere=20&option.volum=10')
  assert.equal(oil.facts, `20${NB}% · 2000${NB}mg · 10${NB}ml`, 'опция силы, затем упаковка той же записью, что на карточке; «10 ml» из опции и из упаковки — один раз (И347, И671)')
  assert.equal(oil.unit, `64,90${NB}€`, 'цена за штуку — одним числом, без слова')
  assert.equal(oil.unitSay, `64,90${NB}€ / buc.`, 'слово — только чтецу экрана')
  assert.equal(oil.total, `64,90${NB}€`)
  assert.deepEqual([oil.stepper.less.op, oil.stepper.more.op, oil.remove.op], [null, 'set:l1:2', 'remove:l1'])
  assert.equal(oil.stepper.less.label, 'Scade cantitatea: Ulei CBD full spectrum', 'a step with nowhere to go is off, but still named')
  assert.deepEqual([caps.stepper.less.op, caps.stepper.value], ['set:l2:1', 2])
  assert.deepEqual([caps.remove.text, caps.remove.label], ['Șterge', 'Șterge din coș: Capsule CBD 25 mg'])
})

test('totals are the source’s, as ready strings', async () => {
  const v = cartView('ro', await fixtureCart(), null)
  assert.deepEqual(v.totals.rows, [
    { label: 'Subtotal', value: `144,70${NB}€` },
    { label: 'Reducere CBD10', value: `−14,47${NB}€` },
    { label: 'Livrare', value: 'Se alege la pasul următor' },
  ])
  assert.deepEqual(v.totals.total, { label: 'Total', value: `130,23${NB}€` })
  assert.equal(v.totals.note, 'TVA inclus')
  assert.deepEqual(v.coupon.applied, [{ code: 'CBD10', op: 'uncoupon:CBD10', label: 'Elimină codul CBD10' }])
  assert.equal(v.checkout.href, '/ro/checkout/contact')
  assert.equal(cartView('hu', await fixtureCart('hu'), null).count, '3 darab')
})

test('the notice comes from a known code only; an empty cart says what next', () => {
  const empty = cartView('ro', null, 'ok:remove')
  assert.deepEqual(empty.lines, [])
  assert.equal(empty.notice?.message, 'Produsul a fost scos din coș.')
  assert.deepEqual([empty.empty.title, empty.empty.step, empty.empty.href], ['Coșul este gol', 'Vedeți produsele', '/ro/catalog'])
  assert.equal(empty.empty.shelf, null, 'no data — no shelf')
  assert.equal(cartView('ro', null, 'nonsense').notice, null)
  assert.equal(priceOrFree('ro', { minor: 0, currency: 'EUR' }), 'Gratuit')
})

/* Код скидки свёрнут под вопросом (Baymard); раскрыт, когда о коде есть что
   сказать — ошибка кода. Исход кода и исход строки — в разных местах. */
test('a coupon outcome opens the folded code field; a line outcome shows by the lines', () => {
  const coupon = cartView('ro', null, 'e:coupon-expired')
  assert.equal(coupon.notice, null)
  assert.equal(coupon.couponNotice?.message, 'Codul a expirat — folosiți un cod valabil.')
  assert.equal(coupon.coupon.open, true)
  assert.equal(coupon.coupon.ask, 'Aveți un cod de reducere?')
  const line = cartView('ro', null, 'ok:remove')
  assert.equal(line.notice?.message, 'Produsul a fost scos din coș.')
  assert.equal(line.couponNotice, null)
  assert.equal(line.coupon.open, false)
  assert.equal(cartView('ro', null, 'ok:coupon').coupon.open, false, 'an applied code does not keep the field open')
})

/* Обещания у кнопки — из данных магазина (разбор 24.09.2026, K4): оплата
   при получении — если она допустима для этой корзины, доставка «от» — из
   списка способов, возврат — сроком из данных. Строки собирает `pledgesView`; на странице
   корзины голубой плашки с ними нет (слово заказчика 08.10.2026), они стоят на главной и у
   кнопки оплаты. */
test('pledges come from the shop data, not from words in code', async () => {
  const pay = await sampleCommerce.paymentMethods(FIXTURES.cart, 'en')
  const methods = await sampleCommerce.deliveryMethods(null, 'en')
  const facts = await sampleContent.facts()
  assert.ok(pay.ok && methods.ok && facts.ok)
  assert.deepEqual(pledgesView('en', { payments: pay.value, methods: methods.value, returnDays: facts.value.returnDays }).items, [
    { icon: 'package', text: 'Cash on delivery' },
    { icon: 'truck', text: 'Delivery from €3.49, pickup free' },
    { icon: 'check-shield', text: '14-day returns' },
  ])
  const over = pay.value.map((m) => (m.kind === 'on-delivery' ? { ...m, eligible: false } : m))
  assert.deepEqual(pledgesView('en', { payments: over, methods: null, returnDays: null }).items, [], 'COD not allowed for this cart — no line; nothing known — nothing said')
  const door: DeliveryMethod = { ...methods.value[0], price: { minor: 0, currency: 'EUR' } }
  assert.equal(pledgesView('ro', { payments: null, methods: [door, methods.value[1]], returnDays: 30 }).items.map((i) => i.text).join(' | '), 'Livrare gratuită | Retur în 30 de zile')
})

/* Запрет 10 (И331): количество на сайте меняется одним органом — корзина и
   карта товара берут QuantityStepper; поле числа не рисует больше никто. */
test('one quantity control on the site: the cart and the product page take the same stepper', () => {
  const dir = new URL('../components/', import.meta.url)
  const tsx = readdirSync(dir).filter((n) => n.endsWith('.tsx'))
  assert.deepEqual(tsx.filter((n) => /type="number"/.test(readFileSync(new URL(n, dir), 'utf8'))), ['QuantityStepper.tsx'])
  for (const user of ['CartLines.tsx', 'AddToCart.tsx']) assert.match(readFileSync(new URL(user, dir), 'utf8'), /<QuantityStepper /, user)
  /* Строки корзины — одни на страницу и на шторку (CartLines). */
  for (const user of ['CartView.tsx', 'CartPane.tsx']) assert.match(readFileSync(new URL(user, dir), 'utf8'), /<CartLines /, user)
})

test('the empty cart shows popular products from the source, as shelf cards', async () => {
  const shelf = await sample.listing('en', { facets: {}, sort: 'popular', page: null })
  assert.ok(shelf.ok)
  const v = cartView('en', null, null, { freeFrom: null, popular: shelf.value.items.slice(0, 4), shelves: [] })
  assert.equal(v.empty.shelf?.title, 'Popular products')
  assert.equal(v.empty.shelf?.cards.length, 4)
  assert.equal(v.empty.shelf?.all, '/en/catalog')
  assert.match(v.empty.shelf?.cards[0].href ?? '', /^\/en\/product\//)
})

/* Пустая корзина — не тупик (И689): главные полки кнопками категорий со знаком,
   в шторке и на странице одной разметкой (CartShelves). Полок нет — нет и ряда. */
test('the empty cart offers the main shelves as category buttons, in the pane and on the page', async () => {
  const cols = await sample.collections('en')
  assert.ok(cols.ok)
  const v = cartView('en', null, null, { freeFrom: null, popular: [], shelves: cols.value.slice(0, 3) })
  assert.equal(v.empty.shelves?.label, 'Categories')
  assert.equal(v.empty.shelves?.links.length, 3)
  assert.match(v.empty.shelves?.links[0].href ?? '', /^\/en\//)
  assert.equal(v.empty.shelves?.links[0].sign, cols.value[0].sign)
  assert.equal(cartView('en', null, null).empty.shelves, null)
  const dir = new URL('../components/', import.meta.url)
  for (const user of ['CartView.tsx', 'CartPane.tsx']) assert.match(readFileSync(new URL(user, dir), 'utf8'), /<CartShelves /, user)
})

/* Полоса до бесплатной доставки: порог — из данных магазина, набрано — товары
   за вычетом скидок и без доставки. Слова — тремя кусками, сумма отдельно (её
   выделяют весом, порядок слов — языка). Нет порога или корзины — полосы нет. */
test('the free-delivery strip says what is left, then that it is unlocked; no threshold, no strip', async () => {
  const cart = await fixtureCart('ro')
  const extras = (minor: number | null) => ({ payments: null, methods: null, returnDays: null, freeFrom: minor === null ? null : { minor, currency: 'EUR' as const }, popular: [], shelves: [] })
  const far = cartView('en', cart, null, extras(20000)).goal
  assert.deepEqual(far?.left, ['Add ', '€69.77', ' more for free delivery'])
  assert.deepEqual([far?.value, far?.max], [13023, 20000], 'набрано — 144,70 минус код 14,47')
  const done = cartView('en', cart, null, extras(10000)).goal
  assert.equal(done?.left, null)
  assert.deepEqual([done?.value, done?.max, done?.done], [10000, 10000, 'Free delivery unlocked'])
  assert.deepEqual(cartView('hu', cart, null, extras(20000)).goal?.left, ['Még ', `69,77${NB}€`, ', és a szállítás díjmentes'])
  assert.equal(cartView('en', cart, null).goal, null, 'порога у магазина нет')
  assert.equal(cartView('en', null, null, extras(10000)).goal, null, 'пустой корзине полоса не нужна')
})

/* Страница корзины — белый лист: итог, кнопка оформления, код скидки. Голубой плашки «оплата при
   получении · доставка от · возврат» под кнопкой нет (слово заказчика 08.10.2026: «это говно, зачем
   налепил»; плашка тоном внутри листа — И772), и данных на неё страница не собирает. */
test('the cart page has no pledges plate and gathers no data for one', async () => {
  const view = readFileSync(new URL('../components/CartView.tsx', import.meta.url), 'utf8')
  const page = readFileSync(new URL('../app/[lang]/cart/page.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(view, /Pledges/)
  assert.doesNotMatch(page, /paymentMethods|deliveryMethods|returnDays/)
  const v = cartView('en', await fixtureCart(), null)
  assert.ok(!('pledges' in v), 'в виде корзины нет обещаний')
})
