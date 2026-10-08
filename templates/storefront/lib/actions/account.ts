'use server'
import { redirect } from 'next/navigation'
import { commerce } from '../source/index.ts'
import { clearSession, enterSession, readSession, sessionChanged, writeFlow } from '../session.ts'
import { isLang, type Lang } from '../locale.ts'
import { hrefFor } from '../href.ts'
import { t, type Key } from '../i18n/index.ts'
import { parseEmail, parseNewPassword, parseSavedAddress, parseSignIn, parseSignUp, PASSWORD_MIN, safeNext } from '../account-form.ts'
import { callbackPath, land, packFlow, start } from '../social.ts'
import { enterWith } from '../social-entry.ts'
import { absolute } from '../seo.ts'
import type { Errors, Values } from '../checkout-form.ts'
import type { AccountError, Entry, Provider } from '../source/contract.ts'

/** Ответ формы кабинета — как у кассы (ошибки у полей, введённое, слово
 *  формы) и `done`: дело сделано без перехода — письмо ушло, — слова встают
 *  на место формы. */
export type AccountState = { errors: Errors; values: Values; message: string | null; done: string | null } | null

/* Отказы входа через поставщика приходят не сюда, а на адрес возврата
   (app/api/auth/[provider]/callback) и говорятся формой словами `social.*`
   (account-view.ts, `socialAlert`); у входа паролем их не бывает. */
const MESSAGE: Record<AccountError, Key> = {
  'unavailable': 'account.error', 'credentials': 'account.credentials', 'unverified': 'account.unverified',
  'password': 'field.passwordShort', 'token': 'password.token', 'signed-out': 'cabinet.signedOut',
  'provider': 'account.error', 'provider-email': 'account.error', 'provider-unverified': 'account.error', 'provider-taken': 'account.error',
}

function langFrom(raw: string): Lang {
  if (!isLang(raw)) throw new Error(`account: язык «${raw}» не из списка`)
  return raw
}
const said = (message: string, values: Values = {}, errors: Errors = {}): AccountState => ({ errors, values, message, done: null })
/** Отказ источника словами; правило пароля — у поля пароля. */
function refused(lang: Lang, error: AccountError, values: Values = {}, token: Key = 'password.token'): AccountState {
  if (error === 'password') return said(t(lang, 'checkout.fix'), values, { password: t(lang, 'field.passwordShort', { n: PASSWORD_MIN }) })
  return said(t(lang, error === 'token' ? token : MESSAGE[error]), values)
}

/** Вход сделан: новая сессия — в cookie, личные страницы — заново, переход
 *  туда, откуда пришли (свой путь), или в кабинет. */
async function enter(lang: Lang, before: string | null, entry: Entry<unknown>, next: string | null): Promise<never> {
  await enterSession(before, entry.session)
  redirect(next ?? hrefFor(lang, { account: 'home' }))
}

/** Адрес возврата поставщика — от `SITE_URL` (не от заголовка Host). */
const back = (p: Provider) => absolute(callbackPath(p))

/** Вход через поставщика — первый шаг (И787): одна форма на все кнопки,
 *  поставщик — значение нажатой. Решает `start` (lib/social.ts): ход
 *  (`state`, PKCE, язык, куда вернуться) — в cookie, дальше окно поставщика
 *  (чужой адрес — браузер уходит документом); его ответ ловит адрес возврата
 *  (app/api/auth/[provider]/callback). Поставщика источник больше не
 *  называет — назад к форме словами. Образец окна не имеет — код своего хода
 *  меняется здесь же: переход действия на свой адрес роутер Next со скриптом
 *  берёт запросом данных страницы, а не документом, и сессия с адреса
 *  возврата до браузера не доходила (сборка + клик, 08.10.2026). */
export async function socialSignIn(rawLang: string, form: FormData): Promise<void> {
  const lang = langFrom(rawLang)
  const s = start(lang, form, await commerce().socialProviders(), back)
  if (!s.flow) redirect(s.to)
  if (s.inline) {
    const l = land(s.flow.provider, s.flow, new URL(s.to, 'http://local').searchParams, back)
    redirect('to' in l ? l.to : await enterWith(l))
  }
  await writeFlow(packFlow(s.flow))
  redirect(s.to)
}

export async function signIn(rawLang: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const lang = langFrom(rawLang)
  const parsed = parseSignIn(lang, form)
  if (!parsed.ok) return said(t(lang, 'checkout.fix'), parsed.values, parsed.errors)
  const before = await readSession()
  const r = await commerce().signIn(before, lang, parsed.value.email, parsed.value.password)
  if (!r.change.ok) return refused(lang, r.change.error, { email: parsed.value.email })
  return enter(lang, before, r, safeNext(lang, form.get('next')))
}

/** Создание: вход сразу — в кабинет; ждёт подтверждения (или адрес занят) —
 *  слова «проверьте почту» на месте формы, одни на оба случая. */
export async function signUp(rawLang: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const lang = langFrom(rawLang)
  const parsed = parseSignUp(lang, form)
  if (!parsed.ok) return said(t(lang, 'checkout.fix'), parsed.values, parsed.errors)
  const { password: _secret, ...values } = parsed.value
  const before = await readSession()
  const r = await commerce().signUp(before, lang, parsed.value)
  if (!r.change.ok) return refused(lang, r.change.error, values)
  if (r.change.value === 'verify') return { errors: {}, values: {}, message: null, done: t(lang, 'register.verify', { email: parsed.value.email }) }
  return enter(lang, before, r, safeNext(lang, form.get('next')))
}

/** Письмо сброса: ответ один, есть кабинет с этой почтой или нет. */
export async function forgotPassword(rawLang: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const lang = langFrom(rawLang)
  const parsed = parseEmail(lang, form)
  if (!parsed.ok) return said(t(lang, 'checkout.fix'), parsed.values, parsed.errors)
  const r = await commerce().forgotPassword(lang, parsed.value)
  if (!r.ok) return said(t(lang, 'account.error'), { email: parsed.value })
  return { errors: {}, values: {}, message: null, done: t(lang, 'password.sent', { email: parsed.value }) }
}

export async function resetPassword(rawLang: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const lang = langFrom(rawLang)
  const parsed = parseNewPassword(lang, form)
  if (!parsed.ok) return said(t(lang, 'checkout.fix'), parsed.values, parsed.errors)
  const before = await readSession()
  const r = await commerce().resetPassword(before, lang, String(form.get('token') ?? ''), parsed.value)
  if (!r.change.ok) return refused(lang, r.change.error)
  return enter(lang, before, r, null)
}

export async function verifyEmail(rawLang: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const lang = langFrom(rawLang)
  const before = await readSession()
  const r = await commerce().verify(before, lang, String(form.get('token') ?? ''))
  if (!r.change.ok) return refused(lang, r.change.error, {}, 'verify.token')
  return enter(lang, before, r, null)
}

/** Выход: сессия закрыта у источника, cookie снята, личные страницы —
 *  заново; дальше страница входа. */
export async function signOut(rawLang: string): Promise<void> {
  const lang = langFrom(rawLang)
  const session = await readSession()
  if (session) await commerce().signOut(session)
  await clearSession()
  sessionChanged()
  redirect(hrefFor(lang, { account: 'home' }))
}

/** Сессии нет или вход истёк — на вход, с возвратом к адресам. */
const toSignIn = (lang: Lang): never => redirect(hrefFor(lang, { account: 'home', next: hrefFor(lang, { account: 'addresses' }) }))

export async function saveAddress(rawLang: string, _prev: AccountState, form: FormData): Promise<AccountState> {
  const lang = langFrom(rawLang)
  const parsed = parseSavedAddress(lang, form)
  if (!parsed.ok) return said(t(lang, 'checkout.fix'), parsed.values, parsed.errors)
  const r = await commerce().saveAddress(await readSession(), lang, parsed.value)
  if (!r.ok && r.error === 'signed-out') toSignIn(lang)
  if (!r.ok) return said(t(lang, 'account.error'), parsed.value)
  sessionChanged()
  redirect(hrefFor(lang, { account: 'addresses' }))
}

export async function removeAddress(rawLang: string, form: FormData): Promise<void> {
  const lang = langFrom(rawLang)
  const r = await commerce().removeAddress(await readSession(), lang, String(form.get('id') ?? ''))
  if (!r.ok && r.error === 'signed-out') toSignIn(lang)
  sessionChanged()
  redirect(hrefFor(lang, { account: 'addresses' }))
}
