/**
 * Вход через Google и Facebook — правила плагина Vendure без сервера
 * (skills/site-building/assets/vendure/plugins/social-auth/rules.ts; И787):
 * ввод `authenticate` — только код с PKCE и адресом возврата из списка сервера;
 * человек поставщика — с адресом, Google — с подтверждённым; найденный кабинет —
 * вход, привязка, перехват доказанным адресом или отказ; недоказанные связи
 * уходят, когда адрес доказан; кнопок без настроек нет.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appSecretProof, decide, grantOf, normalizeEmail, optionsOf, personOf, publicProviders, refusalOfError, toDrop } from '../skills/site-building/assets/vendure/plugins/social-auth/rules.ts'

const BACK = ['https://shop.example/api/auth/google/callback', 'https://shop.example/api/auth/facebook/callback']
const VERIFIER = 'a'.repeat(43)

test('authenticate input: a code, a return address the server knows and a PKCE verifier — for both providers; no ready tokens', () => {
  assert.deepEqual(grantOf({ code: ' c ', codeVerifier: VERIFIER, redirectUri: BACK[0] }, BACK), { ok: true, value: { code: 'c', redirectUri: BACK[0], codeVerifier: VERIFIER } })
  assert.deepEqual(grantOf({ code: 'c', codeVerifier: 'a'.repeat(42), redirectUri: BACK[1] }, BACK), { ok: false, reason: 'INPUT_INVALID' }, 'верификатор короче 43 — RFC 7636')
  assert.deepEqual(grantOf({ code: 'c', redirectUri: BACK[1] }, BACK), { ok: false, reason: 'INPUT_INVALID' }, 'код без PKCE не входит — и у Facebook (RFC 9700 §4.5)')
  assert.deepEqual(grantOf({ code: 'c', codeVerifier: VERIFIER, redirectUri: 'https://evil.test/cb' }, BACK), { ok: false, reason: 'REDIRECT_NOT_ALLOWED' })
  assert.deepEqual(grantOf({ idToken: 't' }, BACK), { ok: false, reason: 'INPUT_INVALID' }, 'готовый ID-токен Google не принимается')
  assert.deepEqual(grantOf({ accessToken: 't' }, BACK), { ok: false, reason: 'INPUT_INVALID' }, 'готовый токен Facebook не принимается')
  assert.deepEqual(grantOf({}, BACK), { ok: false, reason: 'INPUT_INVALID' })
  assert.deepEqual(grantOf({ code: 'x'.repeat(4097), codeVerifier: VERIFIER, redirectUri: BACK[0] }, BACK), { ok: false, reason: 'INPUT_INVALID' }, 'мусорная длина')
})

test('the person: an address is required, Google’s must be confirmed; Google vouches only for gmail and Workspace', () => {
  const google = (o = {}) => personOf({ provider: 'google', subject: '1', email: 'Ana@Gmail.com', emailVerified: true, hostedDomain: null, firstName: 'Ana', lastName: 'Pop', ...o })
  assert.deepEqual(google(), { ok: true, value: { subject: '1', email: 'ana@gmail.com', proven: true, firstName: 'Ana', lastName: 'Pop' } })
  assert.equal(google({ email: 'ana@yahoo.com' }).value.proven, false, 'чужой домен: Google не отвечает за адрес')
  assert.equal(google({ email: 'ana@firma.ro', hostedDomain: 'firma.ro' }).value.proven, true, 'Workspace')
  assert.deepEqual(google({ emailVerified: false }), { ok: false, reason: 'EMAIL_UNVERIFIED' })
  assert.deepEqual(google({ subject: '' }), { ok: false, reason: 'PROVIDER_REJECTED' })
  const facebook = (o = {}) => personOf({ provider: 'facebook', subject: '9', email: 'a@gmail.com', emailVerified: true, hostedDomain: null, firstName: '', lastName: '', ...o })
  assert.equal(facebook().value.proven, false, 'Facebook адрес не доказывает никогда')
  assert.deepEqual(facebook({ email: null }), { ok: false, reason: 'EMAIL_MISSING' })
  assert.deepEqual(facebook({ email: 'not-an-address' }), { ok: false, reason: 'EMAIL_MISSING' })
  assert.equal(facebook().value.firstName, '', 'без имени — пусто, а не отказ')
  assert.equal(normalizeEmail(' Ana@Example.COM '), 'ana@example.com')
})

test('a found account: proven Google links to a confirmed one, claims an unconfirmed one; unproven never touches it', () => {
  const f = (o) => decide({ linkedUser: false, existingUser: false, existingHasThisLink: false, proven: false, existingVerified: false, requireVerification: true, ...o })
  assert.equal(f({ linkedUser: true }), 'enter-linked')
  assert.equal(f({}), 'create', 'нового адреса нет — кабинет заводится и Facebook')
  assert.equal(f({ existingUser: true, existingHasThisLink: true }), 'enter-existing', 'связь уже на найденном кабинете — без второй')
  assert.equal(f({ existingUser: true, existingVerified: true }), 'EMAIL_IN_USE', 'недоказанный адрес к чужому кабинету не привязывается')
  assert.equal(f({ existingUser: true, proven: true, existingVerified: true }), 'link', 'адрес кабинета доказан письмом — пароль владельца остаётся')
  assert.equal(f({ existingUser: true, proven: true }), 'claim', 'адрес никто не доказывал — Google доказал: прежнее уходит')
  assert.equal(f({ existingUser: true, proven: true, existingVerified: true, requireVerification: false }), 'EMAIL_IN_USE',
    'без подтверждения письмом verified ничего не значит: чужой пароль не оставляем и свой не снимаем')
})

test('what goes when the address is proven: claim — everything; link and a confirmed email — the unproven links only', () => {
  const ways = [{ native: true, strategy: null }, { native: false, strategy: 'facebook' }, { native: false, strategy: 'google' }]
  assert.deepEqual(toDrop('claim', ways), [0, 1, 2])
  assert.deepEqual(toDrop('link', ways), [1])
  assert.deepEqual(toDrop('verified', ways), [1], 'владелец подтвердил адрес письмом — связь Facebook, заведённая до него, снята')
  assert.deepEqual(toDrop('verified', [{ native: true, strategy: null }]), [])
})

test('appsecret_proof and provider trouble: network and 5xx say «unavailable», the rest «rejected»', () => {
  assert.equal(appSecretProof('user-token', 'app-secret'), 'b5a94d985eb7b68467d28ca5375162d12b9ca8fe238615acc927c8a9c08d2e95')
  assert.equal(refusalOfError({ code: 'ECONNRESET' }), 'PROVIDER_UNAVAILABLE')
  assert.equal(refusalOfError({ name: 'TimeoutError' }), 'PROVIDER_UNAVAILABLE')
  assert.equal(refusalOfError({ cause: { code: 'ENOTFOUND' } }), 'PROVIDER_UNAVAILABLE')
  assert.equal(refusalOfError({ response: { status: 503 } }), 'PROVIDER_UNAVAILABLE')
  assert.equal(refusalOfError({ status: 400 }), 'PROVIDER_REJECTED')
  assert.equal(refusalOfError(new Error('Wrong recipient')), 'PROVIDER_REJECTED')
})

test('settings: a provider without its secret is off; return addresses are https (http only on localhost); no address — no buttons', () => {
  const env = { GOOGLE_CLIENT_ID: 'g-id', GOOGLE_CLIENT_SECRET: '', FACEBOOK_APP_ID: '1', FACEBOOK_APP_SECRET: 's', FACEBOOK_GRAPH_VERSION: 'bad',
    SOCIAL_AUTH_REDIRECT_URIS: 'http://shop.example/a, http://localhost:3001/api/auth/google/callback ,https://shop.example/api/auth/facebook/callback' }
  const o = optionsOf(env)
  assert.equal(o.google, null, 'нет секрета — поставщик выключен')
  assert.equal(o.facebook.graphVersion, 'v26.0', 'кривая версия Graph — своя по умолчанию')
  assert.deepEqual(o.redirectUris, ['http://localhost:3001/api/auth/google/callback', 'https://shop.example/api/auth/facebook/callback'])
  assert.deepEqual(publicProviders(o), [{ name: 'facebook', clientId: '1' }], 'наружу — открытый id, без секрета')
  assert.ok(!JSON.stringify(publicProviders(o)).includes('"s"'))
  assert.deepEqual(publicProviders(optionsOf({ ...env, GOOGLE_CLIENT_SECRET: 'x', SOCIAL_AUTH_REDIRECT_URIS: '' })), [], 'без адреса возврата кнопки не войдут — их нет')
  assert.deepEqual(publicProviders(optionsOf({ ...env, GOOGLE_CLIENT_SECRET: 'x' })).map((p) => p.name), ['google', 'facebook'])
})
