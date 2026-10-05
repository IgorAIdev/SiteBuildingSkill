'use server'
import { commerce } from '../source/index.ts'
import { isLang } from '../locale.ts'
import { t } from '../i18n/index.ts'
import { momentOf } from '../format.ts'
import { CONTACTS } from '../contacts.ts'
import { EMAIL, LIMITS } from '../checkout-form.ts'

/** Что введено: остаётся в полях при отказе. */
export type WithdrawValues = { name: string; order: string; email: string }
/** Ответ формы отказа: `done` — заявление принято, строка подтверждения с датой и
 *  временем; `message` — что не так; `values` — введённое. */
export type WithdrawState = { done: string | null; message: string | null; values: WithdrawValues } | null

const ORDER_MAX = 40
const text = (form: FormData, key: string) => { const v = form.get(key); return typeof v === 'string' ? v.trim() : '' }

/** Второй шаг отказа от договора — кнопка «Confirmați retragerea» (ст. 11a
 *  Директивы 2011/83, с 19.06.2026; И748): спрашивается только имя, номер
 *  заказа и адрес для подтверждения. Принял источник — строка с датой и
 *  временем приёма; нет — письмо на почту магазина, оно тоже действительно. */
export async function withdraw(rawLang: string, _prev: WithdrawState, form: FormData): Promise<WithdrawState> {
  if (!isLang(rawLang)) throw new Error(`withdraw: язык «${rawLang}» не из списка`)
  const lang = rawLang
  const values = { name: text(form, 'name'), order: text(form, 'order'), email: text(form, 'email') }
  const ok = values.name && values.name.length <= LIMITS.firstName + LIMITS.lastName && values.order && values.order.length <= ORDER_MAX && EMAIL.test(values.email) && values.email.length <= LIMITS.email
  if (!ok) return { done: null, message: t(lang, 'withdraw.bad'), values }
  const r = await commerce().withdraw(lang, values)
  if (!r.ok) return { done: null, message: t(lang, 'withdraw.error', { email: CONTACTS.email }), values }
  return { done: t(lang, 'withdraw.done', { at: momentOf(lang, r.value.at), email: values.email }), message: null, values: { name: '', order: '', email: '' } }
}
