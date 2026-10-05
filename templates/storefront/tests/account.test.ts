import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { sampleCommerce as c, resetSample, FIXTURES } from '../lib/source/sample/commerce.ts'
import { HISTORY, SAMPLE_EMAIL, SAMPLE_PASSWORD } from '../lib/source/sample/account.ts'
import { vendureEnv } from '../lib/source/vendure/catalog.ts'
import { vendureCommerce } from '../lib/source/vendure/commerce.ts'
import { statusOf } from '../lib/source/vendure/account.ts'
import { parseSavedAddress, parseSignIn, parseSignUp, PASSWORD_MIN, safeNext } from '../lib/account-form.ts'
import { hrefFor } from '../lib/href.ts'
import { addressBookView, cabinetView, signInView, signUpView } from '../lib/account-view.ts'

/* Кабинет покупателя (И771): договор — на образце и на подставном движке
   Vendure; формы — разбором; адреса — функцией адреса. */

beforeEach(() => resetSample())

const form = (fields: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

test('sample: a guest is no one; the sample buyer signs in with the sample password and keeps the guest cart', async () => {
  assert.deepEqual(await c.customer(null, 'ro'), { ok: true, value: null })
  const cart = await c.add(null, 'ro', 'uf-20-10', 1)
  assert.ok(cart.session)
  assert.deepEqual((await c.signIn(cart.session, 'ro', SAMPLE_EMAIL, 'wrong-password')).change, { ok: false, error: 'credentials' })
  assert.deepEqual((await c.signIn(cart.session, 'ro', 'nobody@example.com', SAMPLE_PASSWORD)).change, { ok: false, error: 'credentials' }, 'чужая почта — тот же ответ, что неверный пароль')
  const entry = await c.signIn(cart.session, 'ro', ` ${SAMPLE_EMAIL.toUpperCase()} `, SAMPLE_PASSWORD)
  assert.ok(entry.change.ok)
  assert.equal(entry.session, cart.session, 'живая сессия остаётся — корзина гостя не теряется')
  assert.equal(entry.change.value.firstName, 'Ana')
  const after = await c.checkout(entry.session, 'ro')
  assert.ok(after.ok && after.value)
  assert.equal(after.value.cart.lines.length, 1)
  assert.equal(after.value.contact?.email, SAMPLE_EMAIL, 'вошедший — уже клиент заказа: контакты кассы из кабинета')
})

test('sample: sign-up signs in at once; a taken address answers «check your mail», never «taken»', async () => {
  const fresh = await c.signUp(null, 'en', { email: 'ion@example.com', password: 'parola-lunga', firstName: 'Ion', lastName: 'Ionescu' })
  assert.deepEqual(fresh.change, { ok: true, value: 'signed-in' })
  assert.ok(fresh.session)
  const who = await c.customer(fresh.session, 'en')
  assert.ok(who.ok && who.value)
  assert.equal(who.value.email, 'ion@example.com')
  assert.deepEqual((await c.signUp(null, 'en', { email: SAMPLE_EMAIL, password: 'whatever-long', firstName: 'X', lastName: 'Y' })).change, { ok: true, value: 'verify' })
  assert.deepEqual((await c.signUp(null, 'en', { email: 'short@example.com', password: 'short', firstName: 'X', lastName: 'Y' })).change, { ok: false, error: 'password' })
  /* Писем образец не шлёт: ссылки из писем у него неверны всегда. */
  assert.deepEqual((await c.verify(null, 'en', 'any')).change, { ok: false, error: 'token' })
  assert.deepEqual(await c.forgotPassword('en', 'nobody@example.com'), { ok: true, value: null })
})

test('sample: the account fixture shows past orders newest first; an order outside the account is null', async () => {
  const orders = await c.orders(FIXTURES.account, 'ro')
  assert.ok(orders.ok)
  assert.deepEqual(orders.value.map((o) => [o.code, o.status]), HISTORY.map((h) => [h.code, h.status]))
  assert.ok(orders.value.every((o) => o.images.length && o.total.minor > 0))
  const one = await c.order(FIXTURES.account, 'ro', HISTORY[0].code)
  assert.ok(one.ok && one.value)
  assert.equal(one.value.status, 'shipped')
  assert.ok(one.value.cart.lines.length)
  assert.deepEqual(await c.order(FIXTURES.account, 'ro', 'EXEMPLU1'), { ok: true, value: null }, 'заказ заготовки «спасибо» — не её')
  assert.deepEqual(await c.orders(null, 'ro'), { ok: false, error: 'signed-out' })
  assert.deepEqual(await c.order(FIXTURES.cart, 'ro', HISTORY[0].code), { ok: false, error: 'signed-out' })
})

test('sample: an order placed while signed in lands in the account', async () => {
  const s = (await c.signIn(null, 'ro', SAMPLE_EMAIL, SAMPLE_PASSWORD)).session
  assert.ok(s)
  await c.add(s, 'ro', 'uf-20-10', 1)
  const d = await c.setDelivery(s, 'ro', { methodId: 'curier', address: { street: 'Str. A 1', city: 'Cluj-Napoca', region: 'Cluj', postalCode: '400001', country: 'RO' }, pointId: null })
  assert.ok(d.ok)
  const placed = await c.placeOrder(s, 'ro', 'ramburs', d.value.cart.total)
  assert.ok(placed.ok, 'контакты кассы — из кабинета, шага контактов не нужно')
  const orders = await c.orders(s, 'ro')
  assert.ok(orders.ok)
  assert.equal(orders.value[0].code, placed.value.code)
  assert.equal(orders.value[0].status, 'placed')
})

test('sample: addresses — the first is the default, a new default moves the mark, removing the default hands it on', async () => {
  const s = (await c.signUp(null, 'ro', { email: 'a@example.com', password: 'parola-lunga', firstName: 'A', lastName: 'B' })).session
  const place = { street: 'Str. A 1', city: 'Iași', region: 'Iași', postalCode: '700001', country: 'RO' }
  const one = await c.saveAddress(s, 'ro', { ...place, id: null, isDefault: false })
  assert.ok(one.ok)
  assert.deepEqual(one.value.addresses.map((a) => a.isDefault), [true])
  const two = await c.saveAddress(s, 'ro', { ...place, street: 'Str. B 2', id: null, isDefault: true })
  assert.ok(two.ok)
  assert.deepEqual(two.value.addresses.map((a) => [a.street, a.isDefault]), [['Str. A 1', false], ['Str. B 2', true]])
  const gone = await c.removeAddress(s, 'ro', two.value.addresses[1].id)
  assert.ok(gone.ok)
  assert.deepEqual(gone.value.addresses.map((a) => [a.street, a.isDefault]), [['Str. A 1', true]])
  assert.deepEqual(await c.saveAddress(null, 'ro', { ...place, id: null, isDefault: false }), { ok: false, error: 'signed-out' })
})

test('sample: the fixture account is read-only — a write lands on a copy, the next check sees it full', async () => {
  const before = await c.customer(FIXTURES.account, 'ro')
  assert.ok(before.ok && before.value)
  await c.removeAddress(FIXTURES.account, 'ro', before.value.addresses[0].id)
  const after = await c.customer(FIXTURES.account, 'ro')
  assert.deepEqual(after, before)
})

test('sample: sign-out ends the session at the source', async () => {
  const s = (await c.signIn(null, 'ro', SAMPLE_EMAIL, SAMPLE_PASSWORD)).session
  assert.ok(s)
  assert.deepEqual(await c.signOut(s), { ok: true, value: null })
  assert.deepEqual(await c.customer(s, 'ro'), { ok: true, value: null })
})

test('forms: email shape at the field, the password never travels back, the length rule is NIST 8', () => {
  const bad = parseSignIn('en', form({ email: 'ana', password: 'secret-pass' }))
  assert.ok(!bad.ok)
  assert.ok(bad.errors.email)
  assert.equal(bad.values.password, '', 'пароль не возвращается в поле')
  const ok = parseSignIn('en', form({ email: ' ana@example.com ', password: ' spaced pass ' }))
  assert.deepEqual(ok, { ok: true, value: { email: 'ana@example.com', password: ' spaced pass ' } }, 'пробелы — часть пароля')
  assert.equal(PASSWORD_MIN, 8)
  const short = parseSignUp('ro', form({ email: 'a@example.com', firstName: 'A', lastName: 'B', password: '1234567' }))
  assert.ok(!short.ok && short.errors.password)
  const address = parseSavedAddress('ro', form({ street: 'Str. A 1', city: 'Iași', region: 'Iași', postalCode: '700001', id: 'a2', isDefault: 'on' }))
  assert.ok(address.ok)
  assert.equal(address.value.id, 'a2')
  assert.equal(address.value.isDefault, true)
})

test('forms: «next» after sign-in is only a path of this shop and language', () => {
  assert.equal(safeNext('ro', '/ro/checkout/contact'), '/ro/checkout/contact')
  assert.equal(safeNext('ro', '/ro'), '/ro')
  for (const evil of ['https://evil.test/ro', '//evil.test', '/\\evil.test', '/ro//evil.test', '/en/cart', 'ro/cart', null]) assert.equal(safeNext('ro', evil), null, String(evil))
})

test('addresses of the account come from the one address function', () => {
  assert.equal(hrefFor('ro', { account: 'home' }), '/ro/account')
  assert.equal(hrefFor('en', { account: 'register', next: '/en/cart' }), '/en/account/register?next=%2Fen%2Fcart')
  assert.equal(hrefFor('hu', { account: 'password', token: 'a b' }), '/hu/account/password?token=a+b')
  assert.equal(hrefFor('ro', { account: 'addresses', edit: 'new' }), '/ro/account/addresses?edit=new')
  assert.equal(hrefFor('ro', { order: 'RO 1' }), '/ro/account/orders/RO%201')
})

test('views: sign-in asks for the current password, sign-up for a new one with its rule; names follow the language', () => {
  const tokens = (v: ReturnType<typeof signInView>) => v.rows.flat().map((f) => f.autoComplete)
  assert.deepEqual(tokens(signInView('ro', null)), ['email', 'current-password'])
  assert.deepEqual(tokens(signUpView('hu', null)), ['family-name', 'given-name', 'email', 'new-password'], 'по-венгерски фамилия первой')
  assert.match(signUpView('en', null).rows.flat().find((f) => f.type === 'password')?.hint ?? '', /8/)
  assert.deepEqual(signInView('ro', '/ro/cart').hidden, { next: '/ro/cart' })
})

test('views: the cabinet shows the default address; the address book opens the add form when there is none', async () => {
  const who = await c.customer(FIXTURES.account, 'ro')
  const orders = await c.orders(FIXTURES.account, 'ro')
  assert.ok(who.ok && who.value && orders.ok)
  const v = cabinetView('ro', who.value, orders.value)
  assert.equal(v.orders.rows.length, HISTORY.length)
  assert.match(v.orders.rows[0].status, /Expediată/)
  assert.deepEqual(v.addresses.lines, ['Str. Exemplului 1', '010011 București', 'București'])
  const empty = addressBookView('ro', { ...who.value, addresses: [] }, null)
  assert.equal(empty.add.open, true)
  const book = addressBookView('ro', who.value, 'a2')
  assert.deepEqual(book.cards.map((x) => x.editing), [false, true])
  assert.notEqual(book.cards[0].edit.form.at, book.cards[1].edit.form.at, 'поля двух форм не делят id')
})

/* ── Vendure: против подставного движка, как tests/vendure.test.ts ── */
const ENV = vendureEnv({ VENDURE_SHOP_API_URL: 'https://engine.test/shop-api', VENDURE_CHANNEL_TOKEN: 'shop' })
const CHANNEL = { activeChannel: { defaultLanguageCode: 'ro', availableLanguageCodes: ['ro', 'en'], defaultCurrencyCode: 'RON' } }
type Seen = { query: string; variables: Record<string, unknown>; auth: string | undefined }
function engine(answer: (query: string, auth: string | undefined) => unknown, token = 'tok-2') {
  const seen: Seen[] = []
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { query: string; variables: Record<string, unknown> }
    const auth = (init.headers as Record<string, string>).authorization
    seen.push({ ...body, auth })
    const data = body.query.includes('activeChannel') ? CHANNEL : answer(body.query, auth)
    return new Response(JSON.stringify(data && typeof data === 'object' && 'errors' in data ? data : { data }), { status: 200, headers: { 'content-type': 'application/json', 'vendure-auth-token': token } })
  }) as unknown as typeof fetch
  return { fetchImpl, seen }
}
const CUSTOMER = {
  emailAddress: 'ana@example.com', firstName: 'Ana', lastName: 'Pop', phoneNumber: null,
  addresses: [{ id: '7', streetLine1: 'Str. A 1', city: 'Cluj-Napoca', province: 'Cluj', postalCode: '400001', country: { code: 'RO' }, defaultShippingAddress: true }],
}

test('vendure: sign-in reads the union; success takes the NEW engine token as the session', async () => {
  const { fetchImpl, seen } = engine((q, auth) => {
    if (q.includes('login')) return { login: auth === 'Bearer guest' ? { __typename: 'CurrentUser', id: '1' } : { __typename: 'InvalidCredentialsError', errorCode: 'INVALID_CREDENTIALS_ERROR', message: '' } }
    if (q.includes('activeCustomer')) return { activeCustomer: auth === 'Bearer tok-2' ? CUSTOMER : null }
    return null
  })
  const v = vendureCommerce({ ...ENV, placeOrders: false }, fetchImpl)
  const r = await v.signIn('guest', 'ro', 'ana@example.com', 'parola-lunga')
  assert.equal(r.session, 'tok-2', 'вход — новый токен движка')
  assert.ok(r.change.ok)
  assert.deepEqual(r.change.value.addresses, [{ id: '7', street: 'Str. A 1', city: 'Cluj-Napoca', region: 'Cluj', postalCode: '400001', country: 'RO', isDefault: true }])
  assert.equal(r.change.value.phone, '')
  assert.ok(seen.find((x) => x.query.includes('login'))?.query.includes('ErrorResult'), 'мутация читает ErrorResult')
  assert.deepEqual((await v.signIn(null, 'ro', 'ana@example.com', 'x')).change, { ok: false, error: 'credentials' })
})

test('vendure: sign-up — verification needed or a taken address both answer «verify»; no verification signs in', async () => {
  const needs = engine((q) => (q.includes('registerCustomerAccount') ? { registerCustomerAccount: { __typename: 'Success' } }
    : q.includes('login') ? { login: { __typename: 'NotVerifiedError', errorCode: 'NOT_VERIFIED_ERROR', message: '' } } : null))
  const form = { email: 'ana@example.com', password: 'parola-lunga', firstName: 'Ana', lastName: 'Pop' }
  assert.deepEqual((await vendureCommerce({ ...ENV, placeOrders: false }, needs.fetchImpl).signUp(null, 'ro', form)).change, { ok: true, value: 'verify' })
  const taken = engine((q) => (q.includes('registerCustomerAccount') ? { registerCustomerAccount: { __typename: 'Success' } }
    : q.includes('login') ? { login: { __typename: 'InvalidCredentialsError', errorCode: 'INVALID_CREDENTIALS_ERROR', message: '' } } : null))
  assert.deepEqual((await vendureCommerce({ ...ENV, placeOrders: false }, taken.fetchImpl).signUp(null, 'ro', form)).change, { ok: true, value: 'verify' })
  const open = engine((q) => (q.includes('registerCustomerAccount') ? { registerCustomerAccount: { __typename: 'Success' } }
    : q.includes('login') ? { login: { __typename: 'CurrentUser', id: '1' } } : q.includes('activeCustomer') ? { activeCustomer: CUSTOMER } : null))
  const r = await vendureCommerce({ ...ENV, placeOrders: false }, open.fetchImpl).signUp(null, 'ro', form)
  assert.deepEqual(r, { session: 'tok-2', change: { ok: true, value: 'signed-in' } })
  const weak = engine((q) => (q.includes('registerCustomerAccount') ? { registerCustomerAccount: { __typename: 'PasswordValidationError', errorCode: 'PASSWORD_VALIDATION_ERROR', message: '' } } : null))
  assert.deepEqual((await vendureCommerce({ ...ENV, placeOrders: false }, weak.fetchImpl).signUp(null, 'ro', form)).change, { ok: false, error: 'password' })
})

test('vendure: sign-out calls logout WITH the token; orders skip the unplaced cart; a stranger’s order is null', async () => {
  const { fetchImpl, seen } = engine((q) => {
    if (q.includes('logout')) return { logout: { success: true } }
    if (q.includes('orders(')) return { activeCustomer: { orders: { items: [
      { code: 'CART', state: 'AddingItems', orderPlacedAt: null, totalQuantity: 1, totalWithTax: 100, currencyCode: 'RON', lines: [] },
      { code: 'OLD', state: 'Delivered', orderPlacedAt: '2026-09-01T10:00:00Z', totalQuantity: 2, totalWithTax: 9000, currencyCode: 'RON', lines: [] },
      { code: 'NEW', state: 'Shipped', orderPlacedAt: '2026-10-01T10:00:00Z', totalQuantity: 1, totalWithTax: 4500, currencyCode: 'RON', lines: [] },
    ] } } }
    if (q.includes('activeCustomer')) return { activeCustomer: CUSTOMER }
    if (q.includes('orderByCode')) return { orderByCode: { code: 'X', state: 'Shipped', customer: { emailAddress: 'other@example.com' } } }
    return null
  })
  const v = vendureCommerce({ ...ENV, placeOrders: false }, fetchImpl)
  assert.deepEqual(await v.signOut('tok-9'), { ok: true, value: null })
  assert.equal(seen.find((x) => x.query.includes('logout'))?.auth, 'Bearer tok-9', 'выход — с токеном, иначе сессия переживёт его на сервере')
  const orders = await v.orders('tok-9', 'ro')
  assert.ok(orders.ok)
  assert.deepEqual(orders.value.map((o) => [o.code, o.status]), [['NEW', 'shipped'], ['OLD', 'delivered']])
  assert.deepEqual(await v.order('tok-9', 'ro', 'X'), { ok: true, value: null })
  assert.deepEqual(await v.orders(null, 'ro'), { ok: false, error: 'signed-out' })
})

test('vendure: engine order states map onto the storefront list', () => {
  assert.deepEqual(['AddingItems', 'ArrangingPayment', 'PaymentAuthorized', 'PaymentSettled', 'PartiallyShipped', 'Shipped', 'PartiallyDelivered', 'Delivered', 'Cancelled', 'Custom'].map(statusOf),
    ['placed', 'placed', 'placed', 'paid', 'shipped', 'shipped', 'shipped', 'delivered', 'cancelled', 'placed'])
})
