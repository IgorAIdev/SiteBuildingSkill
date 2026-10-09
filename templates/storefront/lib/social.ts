import { createHash, randomBytes } from 'node:crypto'
import { DEFAULT_LANG, isLang, type Lang } from './locale.ts'
import { safeNext } from './account-form.ts'
import { hrefFor } from './href.ts'
import { sameSecret } from './same-secret.ts'
import { PROVIDERS, type AccountError, type Provider, type Signed, type SocialGrant, type SocialProvider } from './source/contract.ts'

/* Вход через Google и Facebook — ход по шагам без Next (И787): чистые функции,
   их меряет tests/social.test.ts; действие кнопки (lib/actions/account.ts) и
   адрес возврата (app/api/auth/[provider]/callback) — тонкие обёртки над
   `start` и `land`. Поток — переадресация с кодом (RFC 9700): кнопка уводит в
   окно поставщика со случайным `state` и PKCE (RFC 7636) — у обоих: украденный
   код без верификатора своего хода сервер не обменяет; поставщик возвращает на
   один адрес витрины без языка (`/api/auth/<поставщик>/callback`), код меняет
   на вход сервер источника — секреты приложения живут только у него. Язык,
   куда вернуться и с какой страницы ушли, едут в httpOnly cookie хода (10
   минут). */

export const isProvider = (v: unknown): v is Provider => (PROVIDERS as readonly unknown[]).includes(v)
/** Имя поставщика в словах — марка, не переводится. */
export const PROVIDER_NAME: Record<Provider, string> = { google: 'Google', facebook: 'Facebook' }

/** Cookie хода. На https — с приставкой `__Host-`: такую браузер принимает
 *  только от самого сайта (без `Domain`, путь `/`, `secure`), и соседний
 *  поддомен (сервер Vendure, админка) не подложит свой ход с чужим кодом. */
export const flowCookie = (secure: boolean) => (secure ? '__Host-shop_oauth' : 'shop_oauth')
export const FLOW_SECONDS = 600
/** Код образца: окна поставщика у образца нет — код `sample.<12 hex>` из
 *  `state` хода, по нему образец заводит своё подставное лицо на каждый ход
 *  (sample/account.ts): двое посетителей одним кабинетом не входят. */
export const SAMPLE_CODE = 'sample'
export const sampleCode = (state: string) => `${SAMPLE_CODE}.${createHash('sha256').update(state).digest('hex').slice(0, 12)}`

export const callbackPath = (provider: Provider) => `/api/auth/${provider}/callback`

/** С какой страницы ушли: туда же возвращается отказ. */
export type From = 'home' | 'register'
export type Flow = { provider: Provider; state: string; verifier: string; lang: Lang; next: string | null; from: From }

const b64 = (b: Buffer) => b.toString('base64url')
/** Новый ход: `state` — 32 случайных байта; верификатор PKCE — 48 байт (64 знака
 *  base64url, RFC 7636 §4.1 — 43…128 из `[A-Za-z0-9-._~]`). */
export function newFlow(provider: Provider, lang: Lang, next: string | null, from: From, random: (n: number) => Buffer = randomBytes): Flow {
  return { provider, state: b64(random(32)), verifier: b64(random(48)), lang, next, from }
}
/** `code_challenge` метода S256: base64url(SHA-256(верификатор)). */
export const challengeOf = (verifier: string) => b64(createHash('sha256').update(verifier).digest())

/** Адрес окна поставщика. Образец (`clientId: null`) окна не имеет — сразу свой
 *  адрес возврата с кодом образца, путём без хоста: порт проверки не тот, что
 *  в `SITE_URL`. Окно Facebook — без версии: версия Graph API живёт у сервера
 *  (`FACEBOOK_GRAPH_VERSION`), окно идёт версией приложения. */
export function dialogUrl(p: SocialProvider, flow: Flow, redirectUri: string): string {
  if (p.clientId === null) return `${callbackPath(p.provider)}?${new URLSearchParams({ code: sampleCode(flow.state), state: flow.state })}`
  const pkce = { code_challenge: challengeOf(flow.verifier), code_challenge_method: 'S256' }
  if (p.provider === 'google') {
    return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: p.clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state: flow.state, ...pkce, prompt: 'select_account',
    })}`
  }
  return `https://www.facebook.com/dialog/oauth?${new URLSearchParams({
    client_id: p.clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'email,public_profile', state: flow.state, ...pkce,
  })}`
}

export const packFlow = (f: Flow) => b64(Buffer.from(JSON.stringify(f)))
const VERIFIER = /^[A-Za-z0-9\-._~]{43,128}$/
/** Cookie хода обратно — только целым и своим: поставщик из списка, язык
 *  витрины, верификатор по RFC 7636, `next` — свой путь (`safeNext`), иначе
 *  хода нет. */
export function unpackFlow(raw: string | null | undefined): Flow | null {
  if (!raw) return null
  let f: Partial<Flow>
  try { f = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<Flow> } catch { return null }
  if (!f || typeof f !== 'object' || !isProvider(f.provider) || typeof f.lang !== 'string' || !isLang(f.lang)) return null
  if (typeof f.state !== 'string' || f.state.length < 43) return null
  if (typeof f.verifier !== 'string' || !VERIFIER.test(f.verifier)) return null
  const next = f.next === null ? null : safeNext(f.lang, f.next)
  if (f.next !== null && !next) return null
  if (f.from !== 'home' && f.from !== 'register') return null
  return { provider: f.provider, state: f.state, verifier: f.verifier, lang: f.lang, next, from: f.from }
}

/** Нажатая кнопка → ход и куда уйти: окно поставщика; поставщика нет в
 *  кнопках или источник его больше не называет (сервер сняли между показом и
 *  нажатием) — назад к форме, без хода. `inline` — окна нет (образец): код
 *  своего хода меняется сразу, в том же запросе (lib/social-entry.ts). */
export function start(lang: Lang, form: Pick<FormData, 'get'>, offered: SocialProvider[], redirectUri: (p: Provider) => string,
  random: (n: number) => Buffer = randomBytes): { flow: Flow | null; to: string; inline: boolean } {
  const from: From = form.get('from') === 'register' ? 'register' : 'home'
  const next = safeNext(lang, form.get('next'))
  const provider = form.get('provider')
  if (!isProvider(provider)) return { flow: null, to: hrefFor(lang, { account: from, ...(next ? { next } : {}) }), inline: false }
  const flow = newFlow(provider, lang, next, from, random)
  const p = offered.find((x) => x.provider === provider)
  if (!p) return { flow: null, to: backTo(lang, flow, { why: 'unavailable', via: provider }), inline: false }
  return { flow, to: dialogUrl(p, flow, redirectUri(provider)), inline: p.clientId === null }
}

/** Что пришло на адрес возврата: код своего хода — вход; «Отмена» у поставщика
 *  (`error=access_denied`) — тихо назад к форме; чужой или истёкший ход,
 *  другой поставщик, неверный `state`, нет кода — отказ. */
export type Returned =
  | { kind: 'grant'; flow: Flow; grant: SocialGrant }
  | { kind: 'cancelled'; flow: Flow }
  | { kind: 'refused'; flow: Flow | null }
export function returned(provider: string, flow: Flow | null, query: URLSearchParams, redirectUri: string): Returned {
  if (!flow || flow.provider !== provider) return { kind: 'refused', flow }
  if (query.get('error') === 'access_denied') return { kind: 'cancelled', flow }
  if (!sameSecret(query.get('state') ?? '', flow.state)) return { kind: 'refused', flow }
  const code = query.get('code') ?? ''
  if (!code || code.length > 4096 || query.get('error')) return { kind: 'refused', flow }
  return { kind: 'grant', flow, grant: { code, redirectUri, codeVerifier: flow.verifier } }
}

/** Адрес возврата до обмена кода: куда уйти сразу (чужой поставщик, отмена,
 *  отказ) — или с чем идти к источнику. */
export function land(provider: string, flow: Flow | null, query: URLSearchParams, redirectUri: (p: Provider) => string):
  { to: string } | { provider: Provider; flow: Flow; grant: SocialGrant } {
  const lang = flow?.lang ?? DEFAULT_LANG
  if (!isProvider(provider)) return { to: hrefFor(lang, { account: 'home' }) }
  const r = returned(provider, flow, query, redirectUri(provider))
  if (r.kind === 'cancelled') return { to: backTo(lang, r.flow) }
  if (r.kind === 'refused') return { to: backTo(lang, r.flow, { why: 'provider', via: provider }) }
  return { provider, flow: r.flow, grant: r.grant }
}

/** После обмена: вошёл — туда, откуда пришли (`next` хода), или в кабинет на
 *  языке хода; отказ источника — на форму его словами. */
export function landed(flow: Flow, provider: Provider, change: Signed<unknown>): string {
  return change.ok ? flow.next ?? hrefFor(flow.lang, { account: 'home' }) : backTo(flow.lang, flow, { why: change.error, via: provider })
}

/** Отказ входа через поставщика — в адрес формы (`?auth=…&via=…`): форма
 *  говорит его словами в своём слоте ошибки. */
export const SOCIAL_REFUSALS = ['provider', 'provider-email', 'provider-unverified', 'provider-taken', 'unavailable'] as const satisfies readonly AccountError[]
export type SocialRefusal = (typeof SOCIAL_REFUSALS)[number]
export const isRefusal = (v: unknown): v is SocialRefusal => (SOCIAL_REFUSALS as readonly unknown[]).includes(v)

/** Куда вернуть с адреса возврата: на форму, с которой ушли (`next` — с собой),
 *  с отказом — или без него. */
export function backTo(lang: Lang, flow: Flow | null, refusal: { why: AccountError; via: Provider } | null = null): string {
  const why = refusal && isRefusal(refusal.why) ? refusal.why : refusal ? 'provider' : null
  return hrefFor(flow?.lang ?? lang, {
    account: flow?.from ?? 'home', ...(flow?.next ? { next: flow.next } : {}), ...(why && refusal ? { auth: why, via: refusal.via } : {}),
  })
}
