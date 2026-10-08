import type { Lang } from './locale.ts'
import type { Card, Cart, CartLine, Collection, Image, Money } from './source/contract.ts'
import { outcomeOf, type Outcome } from './cart-ops.ts'
import { t, tn } from './i18n/index.ts'
import { money } from './money.ts'
import { hrefFor } from './href.ts'
import { MARKET } from './market.ts'
import { shelfCard, type ShelfCard } from './view.ts'
import { factsLine } from './facts.ts'
import { shelvesView, type ShelvesView } from './shelves-view.ts'

export type TotalsView = { rows: { label: string; value: string }[]; total: { label: string; value: string }; note: string }
/** Шаг счётчика строки корзины: «−» и «+» — кнопки записи (`op`), без
 *  скрипта обычная отправка формы; `op: null` — шага в эту сторону нет (1 и
 *  99): кнопка выключена, но названа. */
export type StepView = { op: string | null; label: string }
export type CartLineView = {
  id: string; href: string; name: string; facts: string; image: Image
  /** `unit` — цена за штуку, одним числом (на глаз); `unitSay` — она же со словом
   *  «за штуку», для чтеца экрана. */
  unit: string; unitSay: string; total: string
  stepper: { label: string; value: number; less: StepView; more: StepView }
  remove: { op: string; label: string; text: string }
}
export type ShelfView = { title: string; all: string; cards: ShelfCard[] }
/** Полоса до бесплатной доставки. `value` и `max` — копейки (родной `progress`); `left` — слова
 *  тремя кусками «до · сумма · после»: сумма выделяется весом, а порядок слов — языка; `null` —
 *  порог взят, говорит `done`. Порог назначает магазин (`ShopFacts.freeDeliveryFrom`). */
export type GoalView = { label: string; value: number; max: number; left: [string, string, string] | null; done: string }
export type CartPageView = {
  title: string; count: string; summary: string; lines: CartLineView[]; totals: TotalsView; goal: GoalView | null
  checkout: { label: string; href: string }
  open: { label: string; href: string }
  coupon: { ask: string; label: string; apply: string; open: boolean; applied: { code: string; op: string; label: string }[] }
  notice: Outcome | null; couponNotice: Outcome | null
  empty: { title: string; lead: string; shelf: ShelfView | null; shelves: ShelvesView }
  messages: { timeout: string; failed: string }
  /** Отметка корзины (`cartStamp`): страница сверяет её с корзиной (CartFresh, И696). */
  stamp: string
}
/** Что страница корзины собрала у источника сверх самой корзины: порог бесплатной
 *  доставки — для полосы цели; ходовые товары и главные полки — для пустой корзины.
 *  Нет — строки нет. Обещаний у кнопки на странице корзины нет (слово заказчика 08.10.2026). */
export type CartExtras = { freeFrom: Money | null; popular: Card[]; shelves: Collection[] }

/** Предел количества в строке — один на корзину и карту товара (в договоре
 *  его пока нет, docs/open.md, «Предел количества»). */
export const QTY_MAX = 99
const zero = (): Money => ({ minor: 0, currency: MARKET.currency })
const EMPTY: Cart = { lines: [], quantity: 0, subtotal: zero(), discounts: [], delivery: null, total: zero() }
const NO_EXTRAS: CartExtras = { freeFrom: null, popular: [], shelves: [] }

/* Исход кода скидки живёт у поля кода, а не у списка товаров: по имени
   исхода (после «:») — свой блок кодов купона, остальное — линии корзины. */
const COUPON_CODES = new Set(['coupon', 'uncoupon', 'coupon-invalid', 'coupon-expired', 'coupon-empty'])
const isCouponCode = (code: string): boolean => COUPON_CODES.has(code.split(':')[1] ?? '')

/** Ноль у доставки — словом «бесплатно», а не «0,00 lei». */
export const priceOrFree = (lang: Lang, m: Money): string => (m.minor === 0 ? t(lang, 'delivery.free') : money(m, lang))

/** Итоги готовыми строками — одни на корзину, оформление и «спасибо».
 *  Складывает их источник; здесь только слова. */
export function totalsView(lang: Lang, cart: Cart): TotalsView {
  return {
    rows: [
      { label: t(lang, 'cart.subtotal'), value: money(cart.subtotal, lang) },
      ...cart.discounts.map((d) => ({ label: t(lang, 'cart.discount', { code: d.code }), value: t(lang, 'cart.minus', { amount: money(d.amount, lang) }) })),
      { label: t(lang, 'cart.delivery'), value: cart.delivery === null ? t(lang, 'cart.deliveryLater') : priceOrFree(lang, cart.delivery) },
    ],
    total: { label: t(lang, 'cart.total'), value: money(cart.total, lang) },
    note: t(lang, 'cart.vat'),
  }
}

/** Полоса по числам: `basis` — набрано (копейки), `from` — порог. Одна на корзину и на образцы
 *  дизайн-системы: слова и «до · сумма · после» собираются здесь, а не в компоненте. */
export function goalOf(lang: Lang, basis: number, from: Money): GoalView {
  const rest = from.minor - basis
  const amount = money({ minor: Math.max(rest, 0), currency: from.currency }, lang)
  const text = t(lang, 'cart.goal.left', { amount })
  const at = text.indexOf(amount)
  const left: GoalView['left'] = rest <= 0 ? null : at < 0 ? [text, '', ''] : [text.slice(0, at), amount, text.slice(at + amount.length)]
  return { label: t(lang, 'cart.goal.label'), value: Math.min(Math.max(basis, 0), from.minor), max: from.minor, left, done: t(lang, 'cart.goal.done') }
}

/** Полоса до бесплатной доставки: набрано — товары за вычетом скидок, без доставки (выбор доставки
 *  порог не двигает). Нет порога у магазина или корзина пуста — полосы нет. */
export function goalView(lang: Lang, cart: Cart, from: Money | null): GoalView | null {
  if (!from || from.minor <= 0 || !cart.lines.length || from.currency !== cart.total.currency) return null
  return goalOf(lang, cart.total.minor - (cart.delivery?.minor ?? 0), from)
}

const DIGITS = /\d+(?:[.,]\d+)?/g

/** Факты строки одной тихой строкой под именем: «3000 mg · 10 ml» — упаковка той же записью, что на
 *  карточке полки и странице товара (`factsLine`), и выбранные опции, которых упаковка не говорит
 *  («20 %», когда имя без процента). Опция, повторяющая слово упаковки («10 ml»), печатается один раз.
 *  Процента упаковка не печатает: он в имени товара (слово заказчика 30.09.2026). */
export function lineFacts(lang: Lang, l: CartLine): string {
  const pack = (l.pack ? factsLine(lang, { packs: [l.pack] }) : null)?.split('·').map((x) => x.trim()).filter(Boolean) ?? []
  /* Опция, все числа которой уже в упаковке («10 ml», «30 buc.» при «30 × 25 mg»), ничего не добавляет. */
  const said = new Set(pack.flatMap((x) => x.match(DIGITS) ?? []))
  const picked = l.options.map((o) => o.name).filter((name) => {
    const own = name.match(DIGITS) ?? []
    return name && !(own.length && own.every((n) => said.has(n)))
  })
  return [...picked, ...pack].join(' · ')
}

/* Строка ведёт на свой вариант: адрес с опциями, как у выбора на карте
   товара (скилл shop, «Строка, повторяющая карточку, ведёт на товар»). */
function lineView(lang: Lang, l: CartLine): CartLineView {
  const options = Object.fromEntries(l.options.map((o) => [o.group, o.code]))
  return {
    id: l.id, href: hrefFor(lang, { product: l.productId, options }), name: l.name,
    facts: lineFacts(lang, l), image: l.image,
    unit: money(l.unit, lang), unitSay: t(lang, 'cart.unit', { price: money(l.unit, lang) }), total: money(l.total, lang),
    stepper: {
      label: t(lang, 'cart.quantity'), value: l.quantity,
      less: { op: l.quantity > 1 ? `set:${l.id}:${l.quantity - 1}` : null, label: t(lang, 'cart.less', { name: l.name }) },
      more: { op: l.quantity < QTY_MAX ? `set:${l.id}:${l.quantity + 1}` : null, label: t(lang, 'cart.more', { name: l.name }) },
    },
    remove: { op: `remove:${l.id}`, text: t(lang, 'cart.remove'), label: t(lang, 'cart.removeName', { name: l.name }) },
  }
}

/** Корзина готовыми строками. `result` — код исхода из адреса (без
 *  скрипта: запись → переход → корзина); чужой код не показывается.
 *  Поле кода скидки свёрнуто под вопросом (Baymard: открытое поле уводит
 *  искать коды); открыто, когда о коде есть что сказать — ошибка. */
/** Отметка корзины — что меняет её запись: штуки, сумма товаров, коды скидок.
 *  Одна запись на страницу корзины и на счётчик шапки (CartFresh, И696). */
export const cartStamp = (cart: Cart | null): string => (cart ? `${cart.quantity}:${cart.subtotal.minor}:${cart.discounts.map((d) => d.code).join(',')}` : '0:0:')

export function cartView(lang: Lang, cart: Cart | null, result: string | null, extras: CartExtras = NO_EXTRAS): CartPageView {
  const c = cart ?? EMPTY
  const outcome = result ? outcomeOf(lang, result) : null
  const coupon = outcome !== null && isCouponCode(outcome.code)
  const popular = extras.popular.map((card) => shelfCard(lang, card))
  return {
    title: t(lang, 'cart.title'),
    // Штуки, а не товары: одна строка в три штуки — «3 items», не «3 products».
    count: tn(lang, 'cart.count', c.quantity),
    summary: t(lang, 'cart.summary'),
    lines: c.lines.map((l) => lineView(lang, l)),
    totals: totalsView(lang, c),
    goal: goalView(lang, c, extras.freeFrom),
    checkout: { label: t(lang, 'cart.checkout'), href: hrefFor(lang, { checkout: 'contact' }) },
    open: { label: t(lang, 'cart.open'), href: hrefFor(lang, { cart: true }) },
    coupon: {
      ask: t(lang, 'cart.promo'), label: t(lang, 'cart.coupon'), apply: t(lang, 'cart.apply'),
      open: coupon && outcome.kind === 'error',
      applied: c.discounts.map((d) => ({ code: d.code, op: `uncoupon:${d.code}`, label: t(lang, 'cart.couponRemove', { code: d.code }) })),
    },
    notice: outcome && !coupon ? outcome : null,
    couponNotice: outcome && coupon ? outcome : null,
    empty: {
      title: t(lang, 'cart.empty'), lead: t(lang, 'cart.emptyLead'),
      shelf: popular.length ? { title: t(lang, 'cart.popular'), all: hrefFor(lang, { catalog: true }), cards: popular } : null,
      shelves: shelvesView(lang, extras.shelves),
    },
    messages: { timeout: t(lang, 'cart.error.timeout'), failed: t(lang, 'cart.error.unavailable') },
    stamp: cartStamp(cart),
  }
}
