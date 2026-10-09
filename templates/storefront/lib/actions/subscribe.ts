'use server'
import { content } from '../source/index.ts'
import { isLang } from '../locale.ts'
import { t } from '../i18n/index.ts'
import { EMAIL, LIMITS } from '../checkout-form.ts'

/** Ответ формы подписки: `done` — адрес принят; `message` — что не так;
 *  `email` — введённое остаётся в поле при отказе. */
export type NewsState = { done: boolean; message: string | null; email: string } | null

/** Подписка из подвала (И549): адрес уходит источнику содержания
 *  (`Content.subscribe`) — витрина список подписчиков не ведёт. */
export async function subscribe(rawLang: string, _prev: NewsState, form: FormData): Promise<NewsState> {
  if (!isLang(rawLang)) throw new Error(`subscribe: язык «${rawLang}» не из списка`)
  const lang = rawLang
  const raw = form.get('email')
  const email = typeof raw === 'string' ? raw.trim() : ''
  if (!EMAIL.test(email) || email.length > LIMITS.email) return { done: false, message: t(lang, 'news.bad'), email }
  const r = await content().subscribe(lang, email)
  if (!r.ok) return { done: false, message: t(lang, 'news.error'), email }
  return { done: true, message: null, email: '' }
}
