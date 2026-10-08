import { test } from 'node:test'
import assert from 'node:assert/strict'
import { backTo, callbackPath, challengeOf, dialogUrl, flowCookie, isRefusal, land, landed, newFlow, packFlow, returned, sampleCode, start, unpackFlow, type Flow } from '../lib/social.ts'
import { socialAlert, signInView, signUpView } from '../lib/account-view.ts'

/* Вход через Google и Facebook — ход по шагам (И787): окно поставщика с state
   и PKCE у обоих, cookie хода только целой и своей, возврат — код своего хода,
   «Отмена» — тихо, остальное — отказ словами на той же форме. Действие кнопки
   и адрес возврата — тонкие обёртки над `start`, `land` и `landed`. */

const BACK = 'https://cbdin.ro/api/auth/google/callback'
const back = (p: string) => `https://cbdin.ro/api/auth/${p}/callback`
const flow = (o: Partial<Flow> = {}): Flow => ({ ...newFlow('google', 'ro', '/ro/cart', 'home'), ...o })
const query = (q: Record<string, string>) => new URLSearchParams(q)
const form = (q: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(q)) f.set(k, v); return f }
const PKCE = /^[A-Za-z0-9\-._~]{43,128}$/

test('a new flow: 32 random bytes of state and a PKCE verifier within RFC 7636 — for both providers', () => {
  const g = newFlow('google', 'en', null, 'register')
  assert.ok(g.state.length >= 43, 'state — 32 байта base64url')
  assert.match(g.verifier, PKCE)
  assert.notEqual(newFlow('google', 'en', null, 'home').state, g.state, 'state каждый раз новый')
  assert.match(newFlow('facebook', 'en', null, 'home').verifier, PKCE, 'у Facebook тоже PKCE: украденный код без верификатора не войдёт (RFC 9700 §4.5)')
  /* RFC 7636, приложение B: эталонная пара верификатор → вызов S256. */
  assert.equal(challengeOf('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
})

test('the provider window: both ask with S256; Google — openid email profile; Facebook — email, without a version; the sample has no window', () => {
  const f = flow()
  const g = new URL(dialogUrl({ provider: 'google', clientId: 'g-id' }, f, BACK))
  assert.equal(g.origin + g.pathname, 'https://accounts.google.com/o/oauth2/v2/auth')
  assert.equal(g.searchParams.get('client_id'), 'g-id')
  assert.equal(g.searchParams.get('redirect_uri'), BACK)
  assert.equal(g.searchParams.get('response_type'), 'code')
  assert.equal(g.searchParams.get('scope'), 'openid email profile')
  assert.equal(g.searchParams.get('state'), f.state)
  assert.equal(g.searchParams.get('code_challenge'), challengeOf(f.verifier))
  assert.equal(g.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(g.searchParams.get('code_verifier'), null, 'верификатор не уходит в адрес — только вызов')
  const ff = newFlow('facebook', 'ro', null, 'home')
  const fb = new URL(dialogUrl({ provider: 'facebook', clientId: '123' }, ff, back('facebook')))
  assert.equal(fb.origin + fb.pathname, 'https://www.facebook.com/dialog/oauth', 'версия Graph живёт у сервера — окно без версии')
  assert.equal(fb.searchParams.get('scope'), 'email,public_profile')
  assert.equal(fb.searchParams.get('code_challenge'), challengeOf(ff.verifier))
  assert.equal(fb.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(dialogUrl({ provider: 'google', clientId: null }, f, BACK), `${callbackPath('google')}?code=${sampleCode(f.state)}&state=${f.state}`, 'образец — сразу свой адрес возврата, путём')
  assert.match(sampleCode(f.state), /^sample\.[0-9a-f]{12}$/, 'код образца — свой на каждый ход')
  assert.notEqual(sampleCode(flow().state), sampleCode(f.state))
  assert.equal(callbackPath('facebook'), '/api/auth/facebook/callback', 'адрес возврата — один на поставщика, без языка')
})

test('the flow cookie comes back only whole and ours; on https its name carries __Host-', () => {
  const f = flow()
  assert.deepEqual(unpackFlow(packFlow(f)), f)
  assert.equal(unpackFlow(null), null)
  assert.equal(unpackFlow('not-base64-json'), null)
  assert.equal(unpackFlow(packFlow({ ...f, next: 'https://evil.test/ro' })), null, 'открытый переход')
  assert.equal(unpackFlow(packFlow({ ...f, next: '/en/cart' })), null, 'путь другого языка')
  assert.equal(unpackFlow(packFlow({ ...f, lang: 'de' as Flow['lang'] })), null)
  assert.equal(unpackFlow(packFlow({ ...f, verifier: 'short' })), null)
  assert.equal(unpackFlow(packFlow({ ...newFlow('facebook', 'ro', null, 'home'), verifier: null as unknown as string })), null, 'ход Facebook без верификатора — не наш')
  assert.equal(unpackFlow(packFlow({ ...f, provider: 'apple' as Flow['provider'] })), null)
  assert.equal(unpackFlow(packFlow({ ...f, from: 'cart' as Flow['from'] })), null)
  assert.equal(flowCookie(true), '__Host-shop_oauth', 'соседний поддомен такую cookie не подложит')
  assert.equal(flowCookie(false), 'shop_oauth', 'http://localhost — без приставки: её браузер требует только с secure')
})

test('the button: a flow and the provider window; a provider the source no longer names or a strange one — back to the form', () => {
  const offered = [{ provider: 'google' as const, clientId: 'g-id' }]
  const s = start('ro', form({ provider: 'google', from: 'register', next: '/ro/cart' }), offered, back)
  assert.equal(s.flow?.provider, 'google')
  assert.equal(s.flow?.from, 'register')
  assert.equal(s.flow?.next, '/ro/cart')
  assert.equal(new URL(s.to).searchParams.get('state'), s.flow?.state, 'окно несёт state своего хода')
  assert.equal(new URL(s.to).searchParams.get('redirect_uri'), back('google'))
  assert.equal(start('ro', form({ provider: 'google', next: 'https://evil.test' }), offered, back).flow?.next, null, 'чужой next не едет')
  assert.equal(s.inline, false, 'у поставщика с окном — документом в окно')
  assert.deepEqual(start('ro', form({ provider: 'facebook', from: 'register' }), offered, back), { flow: null, to: '/ro/account/register?auth=unavailable&via=facebook', inline: false }, 'сервер поставщика больше не называет')
  assert.deepEqual(start('en', form({ provider: 'apple', next: '/en/cart' }), offered, back), { flow: null, to: '/en/account?next=%2Fen%2Fcart', inline: false })
  /* Образец окна не имеет: код своего хода меняется в том же запросе — тем же
     `land`, что у адреса возврата (переход действия на свой адрес Next со
     скриптом берёт запросом данных, и сессия не доходила — клик на сборке). */
  const sample = start('ro', form({ provider: 'google' }), [{ provider: 'google', clientId: null }], back)
  assert.equal(sample.inline, true)
  const l = sample.flow ? land('google', sample.flow, new URL(sample.to, 'http://local').searchParams, back) : null
  assert.ok(l && 'grant' in l && l.grant.code === sampleCode(sample.flow?.state ?? ''), 'код образца проходит тот же разбор возврата')
})

test('the return: a code with our state goes to the source; «Cancel» goes back quietly; anything else is refused', () => {
  const f = flow()
  assert.deepEqual(returned('google', f, query({ code: 'c-1', state: f.state }), BACK), { kind: 'grant', flow: f, grant: { code: 'c-1', redirectUri: BACK, codeVerifier: f.verifier } })
  assert.deepEqual(returned('google', f, query({ error: 'access_denied', state: f.state }), BACK), { kind: 'cancelled', flow: f })
  assert.equal(returned('google', f, query({ code: 'c-1', state: 'x'.repeat(43) }), BACK).kind, 'refused', 'чужой state — подделка или старая вкладка')
  assert.equal(returned('google', f, query({ code: 'c-1', state: 'ă'.repeat(f.state.length) }), BACK).kind, 'refused', 'state той же длины в буквах, но не латиницей — отказ, а не исключение')
  assert.equal(returned('facebook', f, query({ code: 'c-1', state: f.state }), BACK).kind, 'refused', 'ход другого поставщика')
  assert.equal(returned('google', null, query({ code: 'c-1', state: f.state }), BACK).kind, 'refused', 'хода нет — истёк или не наш')
  assert.equal(returned('google', f, query({ state: f.state }), BACK).kind, 'refused', 'нет кода')
  assert.equal(returned('google', f, query({ error: 'server_error', state: f.state }), BACK).kind, 'refused')
})

test('the return address end to end: what goes to the source, where a refusal and a success land', () => {
  const f = flow({ from: 'register' })
  assert.deepEqual(land('google', f, query({ code: 'c', state: f.state }), back), { provider: 'google', flow: f, grant: { code: 'c', redirectUri: back('google'), codeVerifier: f.verifier } })
  assert.deepEqual(land('apple', f, query({ code: 'c', state: f.state }), back), { to: '/ro/account' }, 'чужой поставщик — к входу на языке хода')
  assert.deepEqual(land('google', null, query({ code: 'c' }), back), { to: '/en/account?auth=provider&via=google' }, 'хода нет — язык по умолчанию')
  assert.deepEqual(land('google', f, query({ error: 'access_denied' }), back), { to: '/ro/account/register?next=%2Fro%2Fcart' }, '«Отмена» — тихо назад')
  assert.equal(landed(f, 'google', { ok: true, value: null }), '/ro/cart', 'вошёл — туда, откуда пришёл')
  assert.equal(landed({ ...f, next: null }, 'google', { ok: true, value: null }), '/ro/account', 'в кабинет на языке хода')
  assert.equal(landed(f, 'facebook', { ok: false, error: 'provider-taken' }), '/ro/account/register?next=%2Fro%2Fcart&auth=provider-taken&via=facebook')
})

test('back to the form it came from, with next, and the refusal in the address', () => {
  assert.equal(backTo('en', flow({ from: 'register' })), '/ro/account/register?next=%2Fro%2Fcart', 'язык — хода, а не умолчания')
  assert.equal(backTo('en', flow(), { why: 'provider-taken', via: 'google' }), '/ro/account?next=%2Fro%2Fcart&auth=provider-taken&via=google')
  assert.equal(backTo('en', null, { why: 'credentials', via: 'facebook' }), '/en/account?auth=provider&via=facebook', 'чужой для входа через поставщика отказ — «не завершился»')
  assert.ok(isRefusal('provider-email') && !isRefusal('credentials') && !isRefusal('<script>'))
})

test('refusals in words of the page language, naming the provider; strange values say nothing', () => {
  assert.match(socialAlert('en', 'provider', 'google') ?? '', /Google did not finish/)
  assert.match(socialAlert('ro', 'provider-taken', 'facebook') ?? '', /Există deja un cont/)
  assert.match(socialAlert('en', 'provider-taken', 'facebook') ?? '', /the way you created it/, 'не тупик: кабинет из Google паролем не входит')
  assert.match(socialAlert('hu', 'provider-email', 'facebook') ?? '', /Facebook nem adta meg/)
  assert.match(socialAlert('en', 'unavailable', 'google') ?? '', /not answering/)
  assert.equal(socialAlert('en', 'provider', 'apple'), null)
  assert.equal(socialAlert('en', 'credentials', 'google'), null)
  assert.equal(socialAlert('en', null, null), null)
})

test('views: the row stands only for providers the source names; labels are the providers’ own strings; the data line comes with the row', () => {
  assert.equal(signInView('en', null).social, null, 'никого не назвали — ряда нет, а не пустышка')
  assert.equal(signInView('en', null).policy, null, 'без кнопок поставщиков вход данных не собирает — ссылки нет')
  assert.equal(signUpView('ro', null, []).social, null)
  const en = signInView('en', '/en/cart', ['google', 'facebook'])
  assert.deepEqual(en.social, { or: 'or', from: 'home', next: '/en/cart', buttons: [{ provider: 'google', label: 'Continue with Google' }, { provider: 'facebook', label: 'Continue with Facebook' }] })
  assert.equal(en.policy?.href, signUpView('en', null).policy?.href, 'кнопка поставщика на входе заводит кабинет — ссылка на данные, как на создании')
  assert.deepEqual(signUpView('ro', null, ['google', 'facebook']).social?.buttons.map((x) => x.label), ['Continuă cu Google', 'Continuă cu Facebook'])
  assert.equal(signUpView('ro', null, ['google']).social?.from, 'register', 'отказ вернётся на создание')
  assert.deepEqual(signInView('hu', null, ['google', 'facebook']).social?.buttons.map((x) => x.label), ['Folytatás a Google-lal', 'Folytatás a Facebookkal'])
  assert.equal(signInView('hu', null, ['google']).social?.or, 'vagy')
  assert.equal(signInView('ro', null, ['google'], 'x').alert, 'x', 'отказ — в слот ошибки формы')
})
