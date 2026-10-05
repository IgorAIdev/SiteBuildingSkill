import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { Lang } from '../../locale.ts'
import type { Account, Contact, Customer, Order, OrderStatus, PastOrder, SavedAddress } from '../contract.ts'
import { ORDERS_SHOWN } from '../contract.ts'
import { MARKET } from '../../market.ts'
/* Правило пароля образца — то же, что у формы (lib/account-form.ts). */
import { PASSWORD_MIN } from '../../account-form.ts'

/* Кабинет образца (И771): кабинеты живут в памяти процесса, как корзины, и
   пропадают при перезапуске. Пароль хранится солью и хешем scrypt — даже у
   образца не строкой. Цена хеша снижена (N = 1024): образец меряют тесты, а
   не взломщик; у живого магазина пароль хранит источник (Vendure — bcrypt). */
export type SampleAccount = {
  email: string; firstName: string; lastName: string; phone: string
  salt: string; hash: string; addresses: SavedAddress[]; orders: string[]; seq: number
}
/** Что кабинету нужно от хранилища образца (sample/commerce.ts): сессия по
 *  ключу (заготовка — свежей копией), живёт ли запись в ней (`kept`: у
 *  заготовки — нет), новая сессия, конец сессии, кабинеты, заказ по коду. */
export type AccountDeps = {
  state(session: string | null): { customer: string | null } | null
  kept(session: string | null): boolean
  open(customer: string): string
  close(session: string): void
  accounts(): Map<string, SampleAccount>
  placed(code: string): { status: OrderStatus } | null
  order(code: string, lang: Lang): Order | null
}

const COST = { N: 1024 }
const keyOf = (email: string) => email.trim().toLowerCase()
const hashOf = (password: string, salt: string) => scryptSync(password, salt, 32, COST).toString('hex')
const matches = (a: SampleAccount, password: string) => timingSafeEqual(Buffer.from(hashOf(password, a.salt), 'hex'), Buffer.from(a.hash, 'hex'))

export function newAccount(email: string, password: string, name: { firstName: string; lastName: string }, phone = ''): SampleAccount {
  const salt = randomBytes(16).toString('hex')
  return { email: email.trim(), ...name, phone, salt, hash: hashOf(password, salt), addresses: [], orders: [], seq: 0 }
}

/** Заготовленная покупательница образца: два прошлых заказа и два адреса —
 *  по ней отрисованные проверки меряют кабинет полным (сессия `sample-account`).
 *  Войти ею можно и руками: почта и пароль ниже — данные образца. */
export const SAMPLE_EMAIL = 'ana.popescu@example.com'
export const SAMPLE_PASSWORD = 'exemplu-cbd-2026'
export const HISTORY = [
  { code: 'EXEMPLU3', days: 3, status: 'shipped' },
  { code: 'EXEMPLU2', days: 41, status: 'delivered' },
] as const satisfies readonly { code: string; days: number; status: OrderStatus }[]

export function sampleAccount(): SampleAccount {
  const a = newAccount(SAMPLE_EMAIL, SAMPLE_PASSWORD, { firstName: 'Ana', lastName: 'Popescu' }, '0722 123 456')
  a.addresses = [
    { id: 'a1', street: 'Str. Exemplului 1', city: 'București', region: 'București', postalCode: '010011', country: MARKET.country, isDefault: true },
    { id: 'a2', street: 'Bd. Eroilor 12, ap. 4', city: 'Cluj-Napoca', region: 'Cluj', postalCode: '400129', country: MARKET.country, isDefault: false },
  ]
  a.orders = HISTORY.map((h) => h.code)
  a.seq = 2
  return a
}

const customerOf = (a: SampleAccount): Customer => ({ email: a.email, firstName: a.firstName, lastName: a.lastName, phone: a.phone, addresses: a.addresses.map((x) => ({ ...x })) })
/** Контакт вошедшего — для шага контактов кассы: у Vendure клиент заказа
 *  вошедшего уже стоит в заказе. */
export const contactOf = (a: SampleAccount): Contact => ({ email: a.email, firstName: a.firstName, lastName: a.lastName, phone: a.phone })

/* Ссылок из писем образец не шлёт: подтверждать и сбрасывать нечем. */
const noToken = (session: string | null) => ({ session, change: { ok: false as const, error: 'token' as const } })

export function accountOf(d: AccountDeps): Account {
  const signedIn = (session: string | null): SampleAccount | null => {
    const key = d.state(session)?.customer
    return key ? d.accounts().get(key) ?? null : null
  }
  /* Запись в кабинет заготовки ложится на копию, как запись в её корзину:
     следующая проверка снова видит кабинет полным. */
  const mine = (session: string | null): SampleAccount | null => {
    const a = signedIn(session)
    return a && !d.kept(session) ? structuredClone(a) : a
  }
  /* Вход: у живой сессии покупатель встаёт в неё же (корзина гостя остаётся,
     как у Vendure после слияния); без сессии или у заготовки — новая. */
  const enter = (session: string | null, a: SampleAccount) => {
    const s = d.kept(session) ? d.state(session) : null
    if (s) s.customer = keyOf(a.email)
    return { session: s ? session : d.open(keyOf(a.email)), change: { ok: true as const, value: customerOf(a) } }
  }
  const signedOut = { ok: false as const, error: 'signed-out' as const }
  return {
    async customer(session) {
      const a = signedIn(session)
      return { ok: true, value: a ? customerOf(a) : null }
    },
    async signIn(session, _lang, email, password) {
      const a = d.accounts().get(keyOf(email))
      if (!a || !matches(a, password)) return { session, change: { ok: false, error: 'credentials' } }
      return enter(session, a)
    },
    async signUp(session, _lang, form) {
      if (form.password.length < PASSWORD_MIN) return { session, change: { ok: false, error: 'password' } }
      /* Занятый адрес — тот же ответ «проверьте почту», что у Vendure. */
      if (d.accounts().has(keyOf(form.email))) return { session, change: { ok: true, value: 'verify' } }
      const a = newAccount(form.email, form.password, { firstName: form.firstName, lastName: form.lastName })
      d.accounts().set(keyOf(a.email), a)
      const r = enter(session, a)
      return { session: r.session, change: { ok: true, value: 'signed-in' } }
    },
    async verify(session) { return noToken(session) },
    async forgotPassword() { return { ok: true, value: null } },
    async resetPassword(session) { return noToken(session) },
    async signOut(session) { d.close(session); return { ok: true, value: null } },
    async orders(session, lang) {
      const a = signedIn(session)
      if (!a) return signedOut
      const list = a.orders.flatMap((code) => {
        const o = d.order(code, lang)
        const p = d.placed(code)
        return o && p ? [{
          code: o.code, placedAt: o.placedAt, status: p.status, quantity: o.cart.quantity, total: o.cart.total,
          images: o.cart.lines.map((l) => l.image),
        }] : []
      })
      return { ok: true, value: list.toSorted((x, y) => y.placedAt.localeCompare(x.placedAt)).slice(0, ORDERS_SHOWN) }
    },
    async order(session, lang, code) {
      const a = signedIn(session)
      if (!a) return signedOut
      const o = a.orders.includes(code) ? d.order(code, lang) : null
      const p = o ? d.placed(code) : null
      return { ok: true, value: o && p ? ({ ...o, status: p.status } satisfies PastOrder) : null }
    },
    async saveAddress(session, _lang, address) {
      const a = mine(session)
      if (!a) return signedOut
      const { id, isDefault, ...place } = address
      const known = id ? a.addresses.find((x) => x.id === id) : undefined
      if (id && !known) return { ok: false, error: 'unavailable' }
      const first = !a.addresses.length
      const saved: SavedAddress = { ...place, id: known?.id ?? `a${++a.seq}`, isDefault: isDefault || first }
      a.addresses = known ? a.addresses.map((x) => (x.id === saved.id ? saved : x)) : [...a.addresses, saved]
      if (saved.isDefault) a.addresses = a.addresses.map((x) => ({ ...x, isDefault: x.id === saved.id }))
      return { ok: true, value: customerOf(a) }
    },
    async removeAddress(session, _lang, id) {
      const a = mine(session)
      if (!a) return signedOut
      const gone = a.addresses.find((x) => x.id === id)
      a.addresses = a.addresses.filter((x) => x.id !== id)
      /* Ушёл адрес по умолчанию — им становится первый оставшийся. */
      if (gone?.isDefault && a.addresses.length) a.addresses = a.addresses.map((x, i) => ({ ...x, isDefault: i === 0 }))
      return { ok: true, value: customerOf(a) }
    },
  }
}
