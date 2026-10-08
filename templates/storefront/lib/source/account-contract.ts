import type { Lang } from '../locale.ts'
import type { Address, Image, Money, Order, Result } from './contract.ts'

/* Договор кабинета покупателя — своим файлом, чтобы договор источника
   (contract.ts) читался целиком (check:code, порог файла). Снаружи его берут
   через contract.ts: тот передаёт всё отсюда (`export *`), и `Commerce =
   Account & …` стоит там. */

/* ── Кабинет покупателя (И771) ───────────────────────────────────────────
   Сессия та же, что у корзины: у Vendure один токен держит и корзину, и
   вход. Вход меняет токен (корзина гостя переходит в кабинет), поэтому
   запись входа возвращает сессию, как первое добавление в корзину. Есть ли
   уже такой адрес почты, наружу не говорится ответом входа, создания и сброса:
   у Vendure создание на занятый адрес — тот же успех, что на новый.
   Исключение одно (И787): вход через поставщика с адресом, которого поставщик
   не доказал (Facebook), на занятый адрес отвечает `provider-taken` — это
   узнаёт только тот, кто вошёл к поставщику с этим адресом. Скрыть нельзя:
   иначе человек не узнал бы, почему вход не прошёл и как войти. */
export type SavedAddress = Address & { id: string; isDefault: boolean }
export type Customer = { email: string; firstName: string; lastName: string; phone: string; addresses: SavedAddress[] }
/** Состояние заказа закрытым списком; у Vendure — по `Order.state`. */
export type OrderStatus = 'placed' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type OrderSummary = { code: string; placedAt: string; status: OrderStatus; quantity: number; total: Money; images: Image[] }
export type PastOrder = Order & { status: OrderStatus }
/** `credentials` — почта или пароль не те (какое из двух — не говорится);
 *  `unverified` — адрес не подтверждён письмом; `password` — пароль не
 *  принят правилом источника; `token` — ссылка из письма неверна или
 *  истекла; `signed-out` — нужен вход. Вход через поставщика (И787):
 *  `provider` — вход не завершился (код не принят, чужое приложение);
 *  `provider-email` — поставщик не дал адрес почты; `provider-unverified` —
 *  адрес у поставщика не подтверждён; `provider-taken` — кабинет с этим
 *  адресом уже есть, а поставщик владение адресом не доказал. */
export type AccountError = 'unavailable' | 'credentials' | 'unverified' | 'password' | 'token' | 'signed-out'
  | 'provider' | 'provider-email' | 'provider-unverified' | 'provider-taken'
export type Signed<T> = { ok: true; value: T } | { ok: false; error: AccountError }
/** Запись, после которой у сессии может стать другой ключ. */
export type Entry<T> = { session: string | null; change: Signed<T> }
export type SignUp = { email: string; password: string; firstName: string; lastName: string }
/** Вход через поставщика (И787): Google и Facebook — по слову заказчика
 *  08.10.2026, в этом порядке. */
export const PROVIDERS = ['google', 'facebook'] as const
export type Provider = (typeof PROVIDERS)[number]
/** Поставщик, которого источник принимает, и открытый id приложения для адреса
 *  его окна. `clientId: null` — окна нет: образец (только при
 *  `SAMPLE_SOCIAL=on`) входит подставным лицом поставщика сразу
 *  (sample/account.ts). */
export type SocialProvider = { provider: Provider; clientId: string | null }
/** Что поставщик вернул на адрес возврата: одноразовый код, сам этот адрес
 *  (поставщик сверяет его при обмене) и верификатор PKCE своего хода. */
export type SocialGrant = { code: string; redirectUri: string; codeVerifier: string }

export type Account = {
  /** Кто вошёл в этой сессии; `null` — гость. */
  customer(session: string | null, lang: Lang): Promise<Result<Customer | null>>
  signIn(session: string | null, lang: Lang, email: string, password: string): Promise<Entry<Customer>>
  /** `signed-in` — кабинет заведён и вход сделан; `verify` — источник ждёт
   *  подтверждения по письму (или адрес уже занят — ответ тот же). */
  signUp(session: string | null, lang: Lang, form: SignUp): Promise<Entry<'signed-in' | 'verify'>>
  /** Подтверждение адреса по ссылке из письма — и вход. */
  verify(session: string | null, lang: Lang, token: string): Promise<Entry<Customer>>
  /** Письмо со ссылкой сброса; ответ один, есть такой кабинет или нет. */
  forgotPassword(lang: Lang, email: string): Promise<Result<null>>
  resetPassword(session: string | null, lang: Lang, token: string, password: string): Promise<Entry<Customer>>
  /** Выход завершает сессию у источника (у Vendure — `logout` с токеном). */
  signOut(session: string): Promise<Result<null>>
  /** Поставщики входа, которых источник принимает (И787): у Vendure — те,
   *  кого называет плагин сервера; нет плагина — пусто, и кнопок нет. */
  socialProviders(): Promise<SocialProvider[]>
  /** Вход через поставщика по коду с адреса возврата — и вход, и создание
   *  кабинета; новая сессия, как у `signIn`. */
  signInWith(session: string | null, lang: Lang, provider: Provider, grant: SocialGrant): Promise<Entry<Customer>>
  /** Заказы вошедшего, новые первыми (не больше `ORDERS_SHOWN`). */
  orders(session: string | null, lang: Lang): Promise<Signed<OrderSummary[]>>
  /** Заказ вошедшего по коду; чужой или неизвестный код — `null`. */
  order(session: string | null, lang: Lang, code: string): Promise<Signed<PastOrder | null>>
  /** Новый адрес (`id` нет) или правка; `isDefault` — адрес по умолчанию. */
  saveAddress(session: string | null, lang: Lang, address: Address & { id: string | null; isDefault: boolean }): Promise<Signed<Customer>>
  removeAddress(session: string | null, lang: Lang, id: string): Promise<Signed<Customer>>
}
/** Сколько заказов кабинет показывает списком. */
export const ORDERS_SHOWN = 50
