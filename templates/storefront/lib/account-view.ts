import { NAME_ORDER, type Lang } from './locale.ts'
import type { Address, Customer, Image, OrderSummary, PastOrder, SavedAddress } from './source/contract.ts'
import type { Empty } from './catalog-view.ts'
import { t, tn } from './i18n/index.ts'
import { hrefFor } from './href.ts'
import { money } from './money.ts'
import { momentOf } from './format.ts'
import { MARKET } from './market.ts'
import { PRIVACY_DOC } from './company.ts'
import { PASSWORD_MIN } from './account-form.ts'
import { totalsView, type TotalsView } from './cart-view.ts'
import { addressRows, contactLines, countryName, field, itemsOf, methodHead, NAME_FIELD, personName, placeLines, type FieldRow, type ItemView, type Recap } from './checkout-view.ts'

/* Кабинет покупателя готовыми строками (И771): страницы только собирают.
   Поля — тем же `field`, что касса: подпись, токен автозаполнения WHATWG,
   предел длины; пароль — `current-password` при входе и `new-password` при
   создании и сбросе (менеджер паролей предлагает новый только там). */

export type Link = { label: string; href: string }
/** Форма входа, создания, сброса и подтверждения. `forgot` — тихое слово под
 *  паролем; `links` — пути под кнопкой («нет кабинета — создать»); `hidden` —
 *  поля, которые форма несёт молча (куда вернуться, ссылка из письма). */
export type AuthView = {
  title: string; lede: string; rows: FieldRow[]; submit: string; forgot: Link | null
  links: { text: string | null; link: Link }[]; note: string | null; policy: Link | null; hidden: Record<string, string>
}
export type OrderRow = { code: string; title: string; href: string; placed: string; status: string; count: string; total: string; images: Image[] }
export type CabinetView = {
  title: string; signOut: string
  orders: { title: string; rows: OrderRow[]; empty: Empty | null }
  details: { title: string; lines: string[] }
  addresses: { title: string; lines: string[] | null; none: string; manage: Link }
}
export type OrderPageView = { title: string; meta: string; back: Link; review: string; recaps: Recap[]; itemsTitle: string; items: ItemView[]; totals: TotalsView }
export type AddressFormView = { id: string | null; at: string; rows: FieldRow[]; isDefault: { label: string; checked: boolean }; country: { label: string; value: string }; submit: string }
/** `editing` — у этого адреса открыта правка (адрес страницы `?edit=<id>`). */
export type AddressCard = { id: string; lines: string[]; isDefault: boolean; editing: boolean; edit: { label: string; aria: string; href: string; form: AddressFormView }; remove: { label: string; aria: string } }
export type AddressBookView = { title: string; lede: string; cards: AddressCard[]; add: { label: string; href: string; open: boolean; form: AddressFormView }; cancel: Link; back: Link; mark: string }

const email = (lang: Lang) => field(lang, 'email', '', { key: 'field.email', type: 'email', auto: 'email' })
const password = (lang: Lang, fresh: boolean) => field(lang, 'password', '', {
  key: fresh ? 'field.passwordNew' : 'field.password', type: 'password', auto: fresh ? 'new-password' : 'current-password',
  show: t(lang, 'field.passwordShow'), ...(fresh ? { hint: t(lang, 'field.passwordHint', { n: PASSWORD_MIN }) } : {}),
})
const home = (lang: Lang, next?: string) => hrefFor(lang, { account: 'home', ...(next ? { next } : {}) })

/** Вход: почта, пароль и «забыли пароль» под ним; ниже — «нет кабинета —
 *  создать» и что заказать можно и без кабинета (касса гостю не закрыта). */
export function signInView(lang: Lang, next: string | null): AuthView {
  return {
    title: t(lang, 'account.title'), lede: t(lang, 'account.lede'),
    rows: [[email(lang)], [password(lang, false)]], submit: t(lang, 'account.signIn'),
    forgot: { label: t(lang, 'account.forgot'), href: hrefFor(lang, { account: 'password' }) },
    links: [{ text: t(lang, 'account.new'), link: { label: t(lang, 'account.create'), href: hrefFor(lang, { account: 'register', ...(next ? { next } : {}) }) } }],
    note: t(lang, 'account.guest'), policy: null, hidden: next ? { next } : {},
  }
}

/** Создание: имя парой в порядке языка (`NAME_ORDER`), почта, пароль с
 *  правилом под полем; как магазин обращается с данными — ссылкой. */
export function signUpView(lang: Lang, next: string | null): AuthView {
  return {
    title: t(lang, 'register.title'), lede: t(lang, 'register.lede'),
    rows: [
      NAME_ORDER[lang].map((part) => { const f = NAME_FIELD[part]; return field(lang, f.name, '', { key: f.key, auto: f.auto }) }),
      [email(lang)], [password(lang, true)],
    ],
    submit: t(lang, 'register.submit'), forgot: null,
    links: [{ text: t(lang, 'register.have'), link: { label: t(lang, 'account.signIn'), href: home(lang, next ?? undefined) } }],
    note: null, policy: { label: t(lang, 'account.policy'), href: hrefFor(lang, { doc: PRIVACY_DOC }) }, hidden: next ? { next } : {},
  }
}

/** Сброс: без ссылки из письма — почта для письма; со ссылкой — новый пароль. */
export function passwordView(lang: Lang, token: string | null): AuthView {
  const back = [{ text: null, link: { label: t(lang, 'password.back'), href: home(lang) } }]
  /* Ссылка истекла — «попросите новую ниже» ведёт сюда же, без ссылки. */
  const again = { text: null, link: { label: t(lang, 'password.title'), href: hrefFor(lang, { account: 'password' }) } }
  return token
    ? { title: t(lang, 'password.newTitle'), lede: t(lang, 'password.newLede'), rows: [[password(lang, true)]], submit: t(lang, 'password.save'), forgot: null, links: [again, ...back], note: null, policy: null, hidden: { token } }
    : { title: t(lang, 'password.title'), lede: t(lang, 'password.lede'), rows: [[email(lang)]], submit: t(lang, 'password.send'), forgot: null, links: back, note: null, policy: null, hidden: {} }
}

/** Подтверждение адреса — одна кнопка: ссылку из письма открывают и
 *  проверщики почты, и подтверждать само открытие страницы нельзя. */
export function verifyView(lang: Lang, token: string): AuthView {
  return { title: t(lang, 'verify.title'), lede: t(lang, 'verify.lede'), rows: [], submit: t(lang, 'verify.submit'), forgot: null, links: [], note: null, policy: null, hidden: { token } }
}

/** Адрес строками конверта: улица; индекс и город; уезд. */
export const addressLines = (lang: Lang, a: Address): string[] =>
  [a.street, t(lang, 'order.cityLine', { postal: a.postalCode, city: a.city }), a.region].filter(Boolean)

const statusWord = (lang: Lang, s: OrderSummary['status']) => t(lang, `status.${s}`)

const rowOf = (lang: Lang, o: OrderSummary): OrderRow => ({
  code: o.code, title: t(lang, 'cabinet.order', { code: o.code }), href: hrefFor(lang, { order: o.code }),
  placed: momentOf(lang, o.placedAt), status: statusWord(lang, o.status), count: tn(lang, 'cart.count', o.quantity),
  total: money(o.total, lang), images: o.images.slice(0, 3),
})

/** Кабинет: заказы главной колонкой; сбоку — кто я, адрес по умолчанию и
 *  выход (Dawn, `customers/account.liquid`). */
export function cabinetView(lang: Lang, c: Customer, orders: OrderSummary[]): CabinetView {
  const main = c.addresses.find((a) => a.isDefault) ?? c.addresses[0]
  return {
    title: t(lang, 'cabinet.title'), signOut: t(lang, 'cabinet.signOut'),
    orders: {
      title: t(lang, 'cabinet.orders'), rows: orders.map((o) => rowOf(lang, o)),
      empty: orders.length ? null : { title: t(lang, 'cabinet.noOrders'), step: t(lang, 'cabinet.noOrdersStep'), href: hrefFor(lang, { catalog: true }) },
    },
    details: { title: t(lang, 'cabinet.details'), lines: [personName(lang, c), c.email, c.phone].filter(Boolean) },
    addresses: {
      title: t(lang, 'cabinet.addresses'), lines: main ? addressLines(lang, main) : null, none: t(lang, 'cabinet.noAddress'),
      manage: { label: t(lang, 'cabinet.manage'), href: hrefFor(lang, { account: 'addresses' }) },
    },
  }
}

/** Заказ в кабинете — как «спасибо», но о прошлом: номер, когда и в каком он
 *  состоянии; кому, куда и чем платится; товары; итог. */
export function orderPageView(lang: Lang, o: PastOrder): OrderPageView {
  const d = o.delivery
  return {
    title: t(lang, 'cabinet.order', { code: o.code }),
    meta: [t(lang, 'cabinet.placed', { date: momentOf(lang, o.placedAt) }), statusWord(lang, o.status)].join(' · '),
    back: { label: t(lang, 'cabinet.back'), href: hrefFor(lang, { account: 'home' }) },
    review: t(lang, 'done.summary'),
    recaps: [
      { title: t(lang, 'checkout.step.delivery'), lines: [methodHead(d), ...placeLines(lang, d)].filter(Boolean), change: null },
      { title: t(lang, 'checkout.step.payment'), lines: [o.payment.name], change: null },
      { title: t(lang, 'checkout.step.contact'), lines: contactLines(lang, o.contact).filter(Boolean), change: null },
    ],
    itemsTitle: t(lang, 'order.items'), items: itemsOf(lang, o.cart), totals: totalsView(lang, o.cart),
  }
}

function addressForm(lang: Lang, a: SavedAddress | null, first: boolean): AddressFormView {
  return {
    id: a?.id ?? null, at: `ad-${a?.id ?? 'new'}-`, rows: addressRows(lang, a),
    /* Первый адрес — по умолчанию сам: другого нет. */
    isDefault: { label: t(lang, 'addresses.makeDefault'), checked: a ? a.isDefault : first },
    country: { label: t(lang, 'field.country'), value: countryName(lang, MARKET.country) }, submit: t(lang, 'addresses.save'),
  }
}

/** Адреса: каждый — строками конверта, «по умолчанию» словом, правка и
 *  удаление словами под ним; новый — кнопкой внизу. Открытая правка — в
 *  адресе страницы (`?edit=<id>`, `new` — новый): без скрипта, «назад» её
 *  закрывает. Адресов нет — форма нового открыта сразу. Действия названы с
 *  адресом (`aria`): «Modificați» трижды подряд чтецу неразличимы. */
export function addressBookView(lang: Lang, c: Customer, editing: string | null): AddressBookView {
  const at = (edit: string) => hrefFor(lang, { account: 'addresses', edit })
  return {
    title: t(lang, 'addresses.title'), lede: t(lang, 'addresses.lede'), mark: t(lang, 'cabinet.default'),
    cards: c.addresses.map((a) => {
      const lines = addressLines(lang, a)
      const one = lines.join(', ')
      return {
        id: a.id, lines, isDefault: a.isDefault, editing: editing === a.id,
        edit: { label: t(lang, 'addresses.edit'), aria: t(lang, 'addresses.editOf', { address: one }), href: at(a.id), form: addressForm(lang, a, false) },
        remove: { label: t(lang, 'addresses.remove'), aria: t(lang, 'addresses.removeOf', { address: one }) },
      }
    }),
    add: { label: t(lang, 'addresses.add'), href: at('new'), open: editing === 'new' || !c.addresses.length, form: addressForm(lang, null, !c.addresses.length) },
    cancel: { label: t(lang, 'addresses.cancel'), href: hrefFor(lang, { account: 'addresses' }) },
    back: { label: t(lang, 'cabinet.back'), href: hrefFor(lang, { account: 'home' }) },
  }
}
