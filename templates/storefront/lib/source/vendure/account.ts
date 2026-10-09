import type { Lang } from '../../locale.ts'
import type { Account, AccountError, Address, Customer, Entry, Order, OrderStatus, OrderSummary, Result, SavedAddress, Signed, SocialProvider } from '../contract.ts'
import { ORDERS_SHOWN, PROVIDERS } from '../contract.ts'
import { assetImage, type Asset } from './image.ts'

/* Кабинет через Vendure Shop API (И771; references/vendure.md, «Сессия»).
   Токен сессии один на корзину и вход: `login`, `verifyCustomerAccount` и
   `resetPassword` отдают НОВЫЙ токен заголовком `vendure-auth-token` — он и
   есть новая сессия витрины, корзина гостя движок переносит в кабинет сам
   (`OrderMergeStrategy`). Выход — `logout` С ТОКЕНОМ: без него сессия на
   сервере переживает выход (ошибка стартера Vendure). Каждая мутация
   выбирает `__typename` и `ErrorResult` — нечитанный union выглядел бы
   успехом. Вход через Google и Facebook (И787) — `authenticate` той же
   породы, что `login`; стратегии и `socialSignInProviders` даёт плагин
   сервера (assets/vendure/plugins/social-auth). */

type Fetched<T> = { ok: true; data: T; authToken?: string } | { ok: false; kind: string; message: string; status?: number; errors?: { extensions?: { code?: string } }[] }
type Ask = <T>(query: string, variables: Record<string, unknown>, session: string | null, languageCode?: string) => Promise<Fetched<T>>
type Union = { __typename: string; errorCode?: string; authenticationError?: string }
type VAddress = { id: string; streetLine1: string; city: string | null; province: string | null; postalCode: string | null; country: { code: string }; defaultShippingAddress: boolean | null }
type VCustomer = { emailAddress: string; firstName: string; lastName: string; phoneNumber: string | null; addresses: VAddress[] | null }
type VPlaced = {
  code: string; state: string; orderPlacedAt: string | null; totalQuantity: number; totalWithTax: number; currencyCode: string
  lines: { featuredAsset: Asset | null; productVariant: { product: { name: string; featuredAsset: Asset | null } } }[]
}
/** Что кабинету нужно от покупки (vendure/commerce.ts): запрос с каналом,
 *  язык движка, выборка заказа и его перевод в заказ витрины. */
export type AccountDeps<O> = { ask: Ask; speak: (lang: Lang) => Promise<string | undefined>; order: string; orderOf: (o: O, lang: Lang) => Promise<Order> }

const CUSTOMER = `emailAddress firstName lastName phoneNumber addresses { id streetLine1 city province postalCode country { code } defaultShippingAddress }`
const RESULT = `__typename ... on ErrorResult { errorCode message }`
const ASSET = `preview width height`
const PLACED = `code state orderPlacedAt totalQuantity totalWithTax currencyCode lines { featuredAsset { ${ASSET} } productVariant { product { name featuredAsset { ${ASSET} } } } }`

/** Ошибки движка → ошибки кабинета; неизвестная — «недоступно». */
const ERRORS: Record<string, AccountError> = {
  INVALID_CREDENTIALS_ERROR: 'credentials', NOT_VERIFIED_ERROR: 'unverified',
  PASSWORD_VALIDATION_ERROR: 'password', MISSING_PASSWORD_ERROR: 'password',
  VERIFICATION_TOKEN_INVALID_ERROR: 'token', VERIFICATION_TOKEN_EXPIRED_ERROR: 'token', PASSWORD_ALREADY_SET_ERROR: 'token',
  PASSWORD_RESET_TOKEN_INVALID_ERROR: 'token', PASSWORD_RESET_TOKEN_EXPIRED_ERROR: 'token',
}
const errorOf = (u: Union | null | undefined): AccountError => ERRORS[u?.errorCode ?? ''] ?? 'unavailable'
/** Отказ плагина входа — код в `InvalidCredentialsError.authenticationError`
 *  (README плагина); незнакомый код и пустой — «вход не завершился». */
const SOCIAL_ERRORS: Record<string, AccountError> = {
  EMAIL_MISSING: 'provider-email', EMAIL_UNVERIFIED: 'provider-unverified', EMAIL_IN_USE: 'provider-taken', PROVIDER_UNAVAILABLE: 'unavailable',
}
const socialErrorOf = (u: Union | null | undefined): AccountError =>
  u?.__typename === 'InvalidCredentialsError' ? SOCIAL_ERRORS[u.authenticationError ?? ''] ?? 'provider' : errorOf(u)
/** Список поставщиков живёт у сервера — спрашивается не чаще раза в пять
 *  минут: настроили ключи — кнопки встают без перезапуска витрины. */
const PROVIDERS_FOR_MS = 5 * 60 * 1000

/** Состояние заказа движка → закрытый список витрины. Своё состояние
 *  магазина (плагин) — «оформлен», пока его не назовут здесь. */
export function statusOf(state: string): OrderStatus {
  if (state === 'Cancelled') return 'cancelled'
  if (state === 'Delivered') return 'delivered'
  if (/^(Partially)?(Shipped|Delivered)$/.test(state)) return 'shipped'
  if (state === 'PaymentSettled') return 'paid'
  return 'placed'
}

const addressOf = (a: VAddress): SavedAddress => ({
  id: a.id, street: a.streetLine1, city: a.city ?? '', region: a.province ?? '', postalCode: a.postalCode ?? '',
  country: a.country.code, isDefault: !!a.defaultShippingAddress,
})
const customerOf = (c: VCustomer): Customer => ({
  email: c.emailAddress, firstName: c.firstName, lastName: c.lastName, phone: c.phoneNumber ?? '', addresses: (c.addresses ?? []).map(addressOf),
})
const summaryOf = (o: VPlaced): OrderSummary => ({
  code: o.code, placedAt: o.orderPlacedAt ?? '', status: statusOf(o.state), quantity: o.totalQuantity,
  total: { minor: o.totalWithTax, currency: o.currencyCode },
  images: o.lines.flatMap((l) => {
    const a = l.featuredAsset ?? l.productVariant.product.featuredAsset
    return a ? [assetImage(a, l.productVariant.product.name, 160)] : []
  }),
})
const input = (a: Address) => ({ streetLine1: a.street, city: a.city, province: a.region, postalCode: a.postalCode, countryCode: a.country })

export function vendureAccount<O extends { code: string; state: string; customer: { emailAddress: string } | null }>(d: AccountDeps<O>): Account {
  const me = async (session: string | null, languageCode?: string): Promise<Result<VCustomer | null>> => {
    if (!session) return { ok: true, value: null }
    const r = await d.ask<{ activeCustomer: VCustomer | null }>(`{ activeCustomer { ${CUSTOMER} } }`, {}, session, languageCode)
    return r.ok ? { ok: true, value: r.data.activeCustomer } : { ok: false, reason: 'unavailable' }
  }
  /** Вход по ответу движка: успех — новый токен и кабинет по нему. */
  const entered = async (r: Fetched<Record<string, Union>>, field: string, session: string | null, lang: Lang, refusal = errorOf): Promise<Entry<Customer>> => {
    if (!r.ok) return { session, change: { ok: false, error: 'unavailable' } }
    const u = r.data[field]
    if (u?.__typename !== 'CurrentUser') return { session, change: { ok: false, error: refusal(u) } }
    const next = r.authToken ?? session
    const c = await me(next, await d.speak(lang))
    return { session: next, change: c.ok && c.value ? { ok: true, value: customerOf(c.value) } : { ok: false, error: 'unavailable' } }
  }
  const signIn = async (session: string | null, lang: Lang, email: string, password: string) => entered(
    await d.ask<Record<string, Union>>(`mutation ($u: String!, $p: String!) { login(username: $u, password: $p, rememberMe: true) { ${RESULT} } }`, { u: email, p: password }, session, await d.speak(lang)),
    'login', session, lang)
  /** Вошедший или отказ `signed-out`: запись кабинета гостю движок не даст. */
  const signedIn = async (session: string | null, lang: Lang): Promise<Signed<VCustomer>> => {
    const c = await me(session, await d.speak(lang))
    if (!c.ok) return { ok: false, error: 'unavailable' }
    return c.value ? { ok: true, value: c.value } : { ok: false, error: 'signed-out' }
  }
  const fresh = async (session: string | null, lang: Lang): Promise<Signed<Customer>> => {
    const c = await signedIn(session, lang)
    return c.ok ? { ok: true, value: customerOf(c.value) } : c
  }
  /* Сервер ответил — список помнится; без плагина GraphQL не знает поля (ошибка
     GraphQL или 400 проверки запроса) — пусто, кнопок нет. Не ответил (сеть,
     5xx) — пусто сейчас и вопрос в следующий раз. */
  let offered: { at: number; list: SocialProvider[] } | null = null

  return {
    async customer(session, lang) {
      const c = await me(session, await d.speak(lang))
      return c.ok ? { ok: true, value: c.value ? customerOf(c.value) : null } : c
    },
    signIn,
    async signUp(session, lang, form) {
      const r = await d.ask<{ registerCustomerAccount: Union }>(`mutation ($input: RegisterCustomerInput!) { registerCustomerAccount(input: $input) { ${RESULT} } }`,
        { input: { emailAddress: form.email, firstName: form.firstName, lastName: form.lastName, password: form.password } }, session, await d.speak(lang))
      if (!r.ok) return { session, change: { ok: false, error: 'unavailable' } }
      if (r.data.registerCustomerAccount.__typename !== 'Success') return { session, change: { ok: false, error: errorOf(r.data.registerCustomerAccount) } }
      /* Подтверждение не требуется — вход сразу. Требуется (NOT_VERIFIED) или
         адрес уже занят (пароль не тот) — один ответ «проверьте почту». */
      const login = await signIn(session, lang, form.email, form.password)
      if (login.change.ok) return { session: login.session, change: { ok: true, value: 'signed-in' } }
      return { session, change: login.change.error === 'unavailable' ? login.change : { ok: true, value: 'verify' } }
    },
    async verify(session, lang, token) {
      return entered(await d.ask<Record<string, Union>>(`mutation ($t: String!) { verifyCustomerAccount(token: $t) { ${RESULT} } }`, { t: token }, session, await d.speak(lang)), 'verifyCustomerAccount', session, lang)
    },
    async forgotPassword(lang, email) {
      const r = await d.ask<{ requestPasswordReset: Union | null }>(`mutation ($e: String!) { requestPasswordReset(emailAddress: $e) { ${RESULT} } }`, { e: email }, null, await d.speak(lang))
      return r.ok ? { ok: true, value: null } : { ok: false, reason: 'unavailable' }
    },
    async resetPassword(session, lang, token, password) {
      return entered(await d.ask<Record<string, Union>>(`mutation ($t: String!, $p: String!) { resetPassword(token: $t, password: $p) { ${RESULT} } }`, { t: token, p: password }, session, await d.speak(lang)), 'resetPassword', session, lang)
    },
    async signOut(session) {
      const r = await d.ask<{ logout: { success: boolean } }>(`mutation { logout { success } }`, {}, session)
      return r.ok ? { ok: true, value: null } : { ok: false, reason: 'unavailable' }
    },
    async socialProviders() {
      if (offered && Date.now() - offered.at < PROVIDERS_FOR_MS) return offered.list
      const r = await d.ask<{ socialSignInProviders: { name: string; clientId: string }[] }>(`{ socialSignInProviders { name clientId } }`, {}, null)
      const named = r.ok ? r.data.socialSignInProviders : []
      /* Порядок — витрины (Google, затем Facebook), а не ответа сервера. */
      const list = PROVIDERS.flatMap((name): SocialProvider[] => {
        const p = named.find((x) => x.name === name && x.clientId)
        return p ? [{ provider: name, clientId: p.clientId }] : []
      })
      if (r.ok || r.kind === 'graphql' || (r.kind === 'http' && (r.status ?? 500) < 500)) offered = { at: Date.now(), list }
      return list
    },
    /* С токеном гостя: движок сливает его корзину с заказом покупателя, как
       при `login`. Ввод — код с адреса возврата и верификатор PKCE хода. */
    async signInWith(session, lang, provider, grant) {
      const given = { code: grant.code, redirectUri: grant.redirectUri, codeVerifier: grant.codeVerifier }
      return entered(await d.ask<Record<string, Union>>(`mutation ($i: AuthenticationInput!) { authenticate(input: $i, rememberMe: true) { ${RESULT} ... on InvalidCredentialsError { authenticationError } } }`,
        { i: { [provider]: given } }, session, await d.speak(lang)), 'authenticate', session, lang, socialErrorOf)
    },
    async orders(session, lang) {
      if (!session) return { ok: false, error: 'signed-out' }
      const r = await d.ask<{ activeCustomer: { orders: { items: VPlaced[] } } | null }>(`query ($take: Int!) { activeCustomer { orders(options: { take: $take, sort: { createdAt: DESC } }) { items { ${PLACED} } } } }`, { take: ORDERS_SHOWN }, session, await d.speak(lang))
      if (!r.ok) return { ok: false, error: 'unavailable' }
      if (!r.data.activeCustomer) return { ok: false, error: 'signed-out' }
      /* Корзина вошедшего — тоже заказ движка, ещё не поставленный: даты
         постановки у неё нет. */
      const placed = r.data.activeCustomer.orders.items.filter((o) => o.orderPlacedAt).map(summaryOf)
      return { ok: true, value: placed.toSorted((a, b) => b.placedAt.localeCompare(a.placedAt)) }
    },
    async order(session, lang, code) {
      const c = await signedIn(session, lang)
      if (!c.ok) return c
      /* Чужой заказ движок не отдаёт (ошибка доступа) — витрина говорит «нет
         такого», а не «сбой»: код угадывают, а не теряют. */
      const r = await d.ask<{ orderByCode: O | null }>(`query ($code: String!) { orderByCode(code: $code) { ${d.order} } }`, { code }, session, await d.speak(lang))
      const o = r.ok ? r.data.orderByCode : null
      if (!o || o.customer?.emailAddress !== c.value.emailAddress) return { ok: true, value: null }
      return { ok: true, value: { ...(await d.orderOf(o, lang)), status: statusOf(o.state) } }
    },
    async saveAddress(session, lang, a) {
      const c = await signedIn(session, lang)
      if (!c.ok) return c
      const body = { ...input(a), fullName: `${c.value.firstName} ${c.value.lastName}`.trim(), defaultShippingAddress: a.isDefault, defaultBillingAddress: a.isDefault }
      const r = a.id
        ? await d.ask<{ updateCustomerAddress: { id: string } }>(`mutation ($input: UpdateAddressInput!) { updateCustomerAddress(input: $input) { id } }`, { input: { id: a.id, ...body } }, session)
        : await d.ask<{ createCustomerAddress: { id: string } }>(`mutation ($input: CreateAddressInput!) { createCustomerAddress(input: $input) { id } }`, { input: body }, session)
      return r.ok ? fresh(session, lang) : { ok: false, error: 'unavailable' }
    },
    async removeAddress(session, lang, id) {
      const c = await signedIn(session, lang)
      if (!c.ok) return c
      const r = await d.ask<{ deleteCustomerAddress: { success: boolean } }>(`mutation ($id: ID!) { deleteCustomerAddress(id: $id) { success } }`, { id }, session)
      return r.ok ? fresh(session, lang) : { ok: false, error: 'unavailable' }
    },
  }
}
