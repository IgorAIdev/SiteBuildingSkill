import type { Lang } from './locale.ts'
import type { Address, SignUp } from './source/contract.ts'
import { t } from './i18n/index.ts'
import { check, EMAIL, parseAddress, read, type Errors, type Parsed, type Values } from './checkout-form.ts'

/* Формы кабинета (И771) — тем же разбором, что касса: проверяет сервер,
   ошибка — у своего поля, введённое возвращается в поля. Кроме пароля: его
   страница назад не отдаёт никогда — ни в поле, ни в адрес. Пробелы в пароле
   — часть пароля, их не срезают. */

/** Не короче восьми знаков — NIST SP 800-63B, 3.1.1.2 (пароль, заданный
 *  человеком). Правило одно на форму и образец; у Vendure своё правило
 *  сервера, его отказ приходит ошибкой `password`. */
export const PASSWORD_MIN = 8

const secret = (form: FormData) => String(form.get('password') ?? '')
const emailRule = (lang: Lang) => (s: string) => (EMAIL.test(s) ? null : t(lang, 'field.emailShape'))
const strong = (lang: Lang) => (s: string) => (s.length >= PASSWORD_MIN ? null : t(lang, 'field.passwordShort', { n: PASSWORD_MIN }))
const any = () => null
/** Отказ без пароля в введённом. */
const refuse = <T,>(errors: Errors, values: Values): Parsed<T> => ({ ok: false, errors, values: { ...values, password: '' } })

/** Вход: почта формой адреса, пароль — любой непустой (правило длины — при
 *  создании, а не при входе: старый пароль мог быть задан до правила). */
export function parseSignIn(lang: Lang, form: FormData): Parsed<{ email: string; password: string }> {
  const v = { ...read(form, ['email']), password: secret(form) }
  const errors = check(lang, v, { email: emailRule(lang), password: any })
  if (Object.keys(errors).length) return refuse(errors, v)
  return { ok: true, value: { email: v.email ?? '', password: v.password } }
}

export function parseSignUp(lang: Lang, form: FormData): Parsed<SignUp> {
  const v = { ...read(form, ['email', 'firstName', 'lastName']), password: secret(form) }
  const errors = check(lang, v, { email: emailRule(lang), firstName: any, lastName: any, password: strong(lang) })
  if (Object.keys(errors).length) return refuse(errors, v)
  return { ok: true, value: { email: v.email ?? '', firstName: v.firstName ?? '', lastName: v.lastName ?? '', password: v.password } }
}

/** Почта для письма сброса. */
export function parseEmail(lang: Lang, form: FormData): Parsed<string> {
  const v = read(form, ['email'])
  const errors = check(lang, v, { email: emailRule(lang) })
  return Object.keys(errors).length ? refuse(errors, v) : { ok: true, value: v.email ?? '' }
}

/** Новый пароль по ссылке из письма. */
export function parseNewPassword(lang: Lang, form: FormData): Parsed<string> {
  const v = { password: secret(form) }
  const errors = check(lang, v, { password: strong(lang) })
  return Object.keys(errors).length ? refuse(errors, v) : { ok: true, value: v.password }
}

/** Адрес кабинета — тот же адрес, что на кассе (страна, индекс и уезды —
 *  рынка), плюс какой это адрес (`id`, пусто — новый) и «по умолчанию». */
export function parseSavedAddress(lang: Lang, form: FormData): Parsed<Address & { id: string | null; isDefault: boolean }> {
  const parsed = parseAddress(lang, form)
  if (!parsed.ok) return parsed
  const id = String(form.get('id') ?? '').trim()
  return { ok: true, value: { ...parsed.value, id: id || null, isDefault: form.get('isDefault') === 'on' } }
}

/** Куда вернуться после входа: только свой путь того же языка. Чужой адрес
 *  (`https://…`, `//host`, `/\host`) — открытый переход, его не исполняют:
 *  после входа — кабинет. */
export function safeNext(lang: Lang, raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  return new RegExp(`^/${lang}(/[^/\\\\][^\\\\]*)?$`).test(raw) && !raw.includes('//') ? raw : null
}
