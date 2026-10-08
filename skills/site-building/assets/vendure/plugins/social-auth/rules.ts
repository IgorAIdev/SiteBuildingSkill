/* Вход через Google и Facebook — правила без Vendure (И787). Отдельным файлом
   без декораторов и без `@vendure/*`, чтобы его проверял тест набора
   (selftest/vendure-social-auth.test.mjs) без сервера: что принимается вводом
   `authenticate`, кого поставщик назвал, что делать с найденным кабинетом и
   какие способы входа уходят, когда владение адресом доказано.

   Основание: гайд Vendure «Authentication» (стратегии внешнего входа); Google
   «Verify the Google ID token» (когда Google отвечает за адрес); Meta «Manual
   login flow» и «OIDC code flow with PKCE» (`code_verifier`); RFC 7636 (PKCE),
   RFC 9700 §4.5 (подмена кода); Firebase Auth «one account per email»
   (доказанный вход снимает недоказанные). */
import { createHmac } from 'node:crypto'

export type Provider = 'google' | 'facebook'
export type Refusal = 'INPUT_INVALID' | 'REDIRECT_NOT_ALLOWED' | 'PROVIDER_REJECTED' | 'PROVIDER_UNAVAILABLE'
  | 'EMAIL_MISSING' | 'EMAIL_UNVERIFIED' | 'EMAIL_IN_USE'
export type Checked<T> = { ok: true; value: T } | { ok: false; reason: Refusal }
const fail = (reason: Refusal) => ({ ok: false, reason }) as const

/** Ввод `authenticate` — только код с адреса возврата витрины и верификатор PKCE.
 *  Готовых токенов поставщика (ID-токен Google, токен Facebook) мутация не
 *  принимает: чужой токен того же приложения входил бы весь свой срок. */
export type Grant = { code: string; redirectUri: string; codeVerifier: string }

const VERIFIER = /^[A-Za-z0-9\-._~]{43,128}$/          // RFC 7636 §4.1
const MAX = 4096

/** Код, адрес возврата из списка сервера и верификатор PKCE — у обоих
 *  поставщиков: украденный код без верификатора своего хода не войдёт. */
export function grantOf(input: Record<string, unknown> | null | undefined, redirects: readonly string[]): Checked<Grant> {
  const s = (k: string) => (typeof input?.[k] === 'string' ? (input[k] as string).trim() : '')
  const code = s('code'), redirectUri = s('redirectUri'), codeVerifier = s('codeVerifier')
  if (!code || code.length > MAX || !redirectUri) return fail('INPUT_INVALID')
  if (!redirects.includes(redirectUri)) return fail('REDIRECT_NOT_ALLOWED')
  if (!VERIFIER.test(codeVerifier)) return fail('INPUT_INVALID')
  return { ok: true, value: { code, redirectUri, codeVerifier } }
}

/** Как `normalizeEmailAddress` ядра 3.7: похожее на адрес — trim + нижний регистр. */
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const normalizeEmail = (raw: string) => (EMAIL_LIKE.test(raw.trim()) ? raw.trim().toLowerCase() : raw.trim())

export type Profile = { provider: Provider; subject: string; email: string | null; emailVerified: boolean; hostedDomain: string | null; firstName: string; lastName: string }
export type Person = { subject: string; email: string; proven: boolean; firstName: string; lastName: string }
const clip = (v: string) => v.trim().slice(0, 100)

/** Ответ поставщика → человек для кабинета. `proven` — поставщик доказал владение
 *  адресом: Google только для @gmail.com или Workspace (hd) при email_verified
 *  (developers.google.com/identity/gsi/web/guides/verify-google-id-token);
 *  Facebook признака подтверждения не даёт — никогда. */
export function personOf(p: Profile): Checked<Person> {
  if (!p.subject) return fail('PROVIDER_REJECTED')
  const email = p.email ? normalizeEmail(p.email) : ''
  if (!EMAIL_LIKE.test(email) || email.length > 255) return fail('EMAIL_MISSING')
  if (p.provider === 'google' && !p.emailVerified) return fail('EMAIL_UNVERIFIED')
  const proven = p.provider === 'google' && p.emailVerified && (email.endsWith('@gmail.com') || !!p.hostedDomain)
  return { ok: true, value: { subject: p.subject, email, proven, firstName: clip(p.firstName), lastName: clip(p.lastName) } }
}

/** Способы входа, которые адрес не доказывают: связь с Facebook. Кабинет,
 *  заведённый через них, — ничей, пока владелец адреса не докажет его письмом
 *  магазина или Google; тогда такие связи снимаются (`toDrop`). */
export const UNPROVEN: readonly string[] = ['facebook']

/** Что найдено по человеку поставщика. `existingVerified` — у найденного
 *  кабинета `verified` (адрес кто-то уже доказал: письмом магазина или Google);
 *  `requireVerification` — настройка сервера: без неё ядро ставит `verified`
 *  при создании паролем сразу, и признак ничего не доказывает. */
export type Found = {
  linkedUser: boolean; existingUser: boolean; existingHasThisLink: boolean; proven: boolean
  existingVerified: boolean; requireVerification: boolean
}
/** `link` — дописать связь к кабинету, адрес которого уже доказан (недоказанные
 *  связи с него снимаются); `claim` — Google доказал адрес кабинета, который
 *  никто не доказывал: уходит всё прежнее — неподтверждённый пароль, другие
 *  связи, сессии, — кабинет становится подтверждённым и связанным с этим входом. */
export type Decision = 'enter-linked' | 'enter-existing' | 'link' | 'claim' | 'create' | 'EMAIL_IN_USE'
export function decide(f: Found): Decision {
  if (f.linkedUser) return 'enter-linked'
  if (!f.existingUser) return 'create'
  if (f.existingHasThisLink) return 'enter-existing'   // связь есть, но Customer в другом канале
  if (!f.proven) return 'EMAIL_IN_USE'
  if (!f.existingVerified) return 'claim'
  /* Без подтверждения письмом `verified` ставится паролем сразу: кто ставил
     пароль — неизвестно, а снять его — запереть владельца. Войти паролем. */
  if (!f.requireVerification) return 'EMAIL_IN_USE'
  return 'link'
}

/** Способ входа кабинета: пароль (`native`) или связь с поставщиком. */
export type Way = { native: boolean; strategy: string | null }
/** Какие способы входа снять (номера в списке):
 *  `claim` — все (новый вход ставит вызывающий);
 *  `link` и `verified` (владелец подтвердил адрес письмом магазина) — связи,
 *  которые адрес не доказывали (`UNPROVEN`). Снято хоть что-то — сессии
 *  кабинета закрываются (вызывающий). */
export function toDrop(why: 'claim' | 'link' | 'verified', ways: readonly Way[]): number[] {
  return ways.flatMap((w, i) => (why === 'claim' || (!w.native && w.strategy !== null && UNPROVEN.includes(w.strategy)) ? [i] : []))
}

/** appsecret_proof: HMAC-SHA256 токена ключом секрета приложения, hex. */
export const appSecretProof = (token: string, secret: string) => createHmac('sha256', secret).update(token).digest('hex')

/** Ошибка вызова поставщика → код: сеть, тайм-аут, 5xx — «недоступен», прочее — «отклонён». */
const NETWORK = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'])
export function refusalOfError(e: unknown): Refusal {
  const x = e as { name?: string; code?: string; status?: number; response?: { status?: number }; cause?: { code?: string } }
  const status = x?.response?.status ?? x?.status
  if (x?.name === 'TimeoutError' || NETWORK.has(x?.code ?? '') || NETWORK.has(x?.cause?.code ?? '')) return 'PROVIDER_UNAVAILABLE'
  if (typeof status === 'number' && status >= 500) return 'PROVIDER_UNAVAILABLE'
  return 'PROVIDER_REJECTED'
}

/** Настройки из окружения: пустой id или секрет — поставщик выключен (кнопки нет,
 *  а не пустышка); адрес возврата — https (http — только localhost для разработки). */
export type Options = { google: { clientId: string; clientSecret: string } | null; facebook: { appId: string; appSecret: string; graphVersion: string } | null; redirectUris: string[] }
export function optionsOf(env: Record<string, string | undefined>): Options {
  const v = (k: string) => (env[k] ?? '').trim()
  const redirectUris = v('SOCIAL_AUTH_REDIRECT_URIS').split(',').map((u) => u.trim())
    .filter((u) => /^https:\/\/[^/\s]+\/\S*$/.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/\S*$/.test(u))
  return {
    google: v('GOOGLE_CLIENT_ID') && v('GOOGLE_CLIENT_SECRET') ? { clientId: v('GOOGLE_CLIENT_ID'), clientSecret: v('GOOGLE_CLIENT_SECRET') } : null,
    facebook: v('FACEBOOK_APP_ID') && v('FACEBOOK_APP_SECRET')
      ? { appId: v('FACEBOOK_APP_ID'), appSecret: v('FACEBOOK_APP_SECRET'), graphVersion: /^v\d+\.\d+$/.test(v('FACEBOOK_GRAPH_VERSION')) ? v('FACEBOOK_GRAPH_VERSION') : 'v26.0' }
      : null,
    redirectUris,
  }
}

/** Кнопки витрины (`socialSignInProviders`): настроенные поставщики с открытым
 *  id для адреса их окна; секрет наружу не уходит. Без адреса возврата в списке
 *  сервера ни один код не войдёт (`REDIRECT_NOT_ALLOWED`) — кнопок тогда нет
 *  вовсе, а не пустышки. */
export function publicProviders(o: Options): { name: Provider; clientId: string }[] {
  if (!o.redirectUris.length) return []
  return [
    ...(o.google ? [{ name: 'google' as const, clientId: o.google.clientId }] : []),
    ...(o.facebook ? [{ name: 'facebook' as const, clientId: o.facebook.appId }] : []),
  ]
}
