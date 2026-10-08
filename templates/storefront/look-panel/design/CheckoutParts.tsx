import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { Address, Cart, CartLine, Contact, Delivery, DeliveryMethod, Money, Order, PaymentMethod, PickupPoint } from '@/lib/source/contract.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { parseContact, type FormState } from '@/lib/checkout-form.ts'
import { content, source } from '@/lib/source/index.ts'
import { sampleCommerce } from '@/lib/source/sample/commerce.ts'
import { cartView } from '@/lib/cart-view.ts'
import { mainShelves } from '@/lib/main-shelves.ts'
import { contactView, deliveryView, doneView, paymentView, stepsView, summaryView } from '@/lib/checkout-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { money } from '@/lib/money.ts'
import { MARKET } from '@/lib/market.ts'
import { TERMS_DOC } from '@/lib/company.ts'
import { COUPONS, PAYMENTS } from '@/lib/shipping.ts'
import { CartView } from '@/components/CartView.tsx'
import { CartCoupon } from '@/components/CartCoupon.tsx'
import { CartPane } from '@/components/CartPane.tsx'
import { CartLines } from '@/components/CartLines.tsx'
import { CartForm } from '@/components/CartForm.tsx'
import { EmptyPaths } from '@/components/EmptyPaths.tsx'
import { CheckoutFrame } from '@/components/CheckoutFrame.tsx'
import { CheckoutSteps } from '@/components/CheckoutSteps.tsx'
import { MethodForm } from '@/components/MethodForm.tsx'
import { AddressForm } from '@/components/AddressForm.tsx'
import { PointPicker } from '@/components/PointPicker.tsx'
import { PointForm } from '@/components/PointForm.tsx'
import { PaymentForm } from '@/components/PaymentForm.tsx'
import { OrderReview } from '@/components/OrderReview.tsx'
import { OrderItems } from '@/components/OrderItems.tsx'
import { OrderTotals } from '@/components/OrderTotals.tsx'
import { OrderDone } from '@/components/OrderDone.tsx'
import { Field } from '@/components/Field.tsx'
import { Part } from './parts.tsx'

/* Блоки → «Корзина и заказ»: настоящие компоненты корзины и оформления на
   данных, собранных так же, как их собирают страницы сайта (И605).

   Корзина образца собирается в памяти из настоящих товаров каталога — ни
   корзина, ни сессия посетителя не пишутся. Формы получают действия-пустышки:
   кнопки отвечают руке, но корзину не меняют и заказа не ставят.

   Службы доставки, пункты и оплата — образца рынка (lib/shipping.ts через
   источник образца): у движка они есть только у живой корзины, а заводить
   корзину дизайн-система не должна. */

/* Покупатель и адрес образца — в памяти страницы, как у заготовки образца
   (lib/source/sample/commerce.ts): данные показа, а не чей-то заказ. */
const CONTACT: Contact = { email: 'ana.popescu@example.com', firstName: 'Ana', lastName: 'Popescu', phone: '0722 123 456' }
const ADDRESS: Address = { street: 'Str. Exemplului 1', city: 'București', region: 'București', postalCode: MARKET.postal.example, country: MARKET.country }
const ORDER_CODE = 'EXEMPLU1'
/* Строк в корзине образца — две: одна в штуку, вторая в две. */
const LINES = 2

/* Действия-пустышки: форма уходит, ответ — «ничего не изменилось». */
export async function stillSubmit(): Promise<void> {
  'use server'
}
export async function stillCall(): Promise<Outcome> {
  'use server'
  return { kind: 'ok', code: 'ok:design', message: '', count: null, inCart: null }
}
async function stillStep(): Promise<FormState> {
  'use server'
  return null
}

const sum = (a: Money, minor: number): Money => ({ minor, currency: a.currency })

/** Строки корзины из первых ходовых товаров каталога: вариант — тот, что
 *  карта товара выбирает сама (`standard`), иначе первый в наличии. */
export async function sampleLines(lang: Lang): Promise<CartLine[]> {
  const shelf = await source().listing(lang, { facets: {}, sort: 'popular', page: null })
  if (!shelf.ok) return []
  const found = await Promise.all(shelf.value.items.slice(0, LINES).map((c) => source().product(lang, c.id)))
  return found.flatMap((r, i) => {
    if (!r.ok) return []
    const pr = r.value
    const v = pr.variants.find((x) => x.id === pr.standard) ?? pr.variants.find((x) => x.stock !== 'out') ?? pr.variants[0]
    if (!v || !pr.images[0]) return []
    const quantity = i + 1
    return [{
      id: `design-${i + 1}`, productId: pr.id, variantId: v.id, name: pr.name,
      options: pr.optionGroups.map((g) => {
        const code = v.options[g.code] ?? ''
        return { group: g.code, code, name: g.options.find((o) => o.code === code)?.name ?? code }
      }),
      pack: v.pack, image: pr.images[0], unit: v.price, quantity, total: sum(v.price, v.price.minor * quantity),
    }]
  })
}

/** Корзина так, как её считает источник образца: код скидки — первый
 *  действующий код образца, доставка — цена выбранного способа. */
export function cartOf(lines: CartLine[], delivery: Money | null): Cart {
  const zero: Money = { minor: 0, currency: lines[0]?.unit.currency ?? MARKET.currency }
  const subtotal = sum(zero, lines.reduce((n, l) => n + l.total.minor, 0))
  const coupon = [...COUPONS].find(([, c]) => !c.expired)
  const discounts = coupon ? [{ code: coupon[0], amount: sum(zero, Math.round((subtotal.minor * coupon[1].percent) / 100)) }] : []
  const off = discounts.reduce((n, d) => n + d.amount.minor, 0)
  return {
    lines, quantity: lines.reduce((n, l) => n + l.quantity, 0), subtotal, discounts, delivery,
    total: sum(zero, subtotal.minor - off + (delivery?.minor ?? 0)),
  }
}

/** Способы оплаты образца для этого итога: способ с пределом выше итога —
 *  выключен с причиной, как у источника образца. */
const paymentsFor = (lang: Lang, total: Money): PaymentMethod[] =>
  PAYMENTS.map((x) => {
    const eligible = x.limit === null || total.minor <= x.limit
    const reason = eligible || !x.reason || x.limit === null ? null : x.reason[lang].replace('{limit}', money({ minor: x.limit, currency: total.currency }, lang))
    return { code: x.code, kind: x.kind, name: x.name[lang], description: x.description[lang], eligible, reason }
  })

/** Пункты способа — как их ищет шаг доставки: мало — без города, много — по
 *  городу адреса образца. */
async function pointsOf(lang: Lang, m: DeliveryMethod): Promise<{ listed: boolean; city: string; points: PickupPoint[] }> {
  const listed = await sampleCommerce.pickupPoints(lang, m.id, '')
  const all = listed.ok ? listed.value : []
  if (all.length) return { listed: true, city: '', points: all }
  const found = await sampleCommerce.pickupPoints(lang, m.id, ADDRESS.city)
  return { listed: false, city: ADDRESS.city, points: found.ok ? found.value : [] }
}

const Missing = ({ what }: { what: string }) => <p className={p.note}>{what}</p>

export async function CheckoutParts({ lang }: { lang: Lang }) {
  const [lines, methodsR, facts, terms, shelves] = await Promise.all([sampleLines(lang), sampleCommerce.deliveryMethods(null, lang), content().facts(), content().doc(lang, TERMS_DOC), mainShelves(lang)])
  if (!lines.length) return <Part title="Корзина и заказ" lede="Каталог сейчас не отвечает — собрать корзину образца не из чего."><Missing what="Товаров нет." /></Part>
  const methods = methodsR.ok ? methodsR.value : []
  const door = methods.find((m) => m.kind === 'address') ?? null
  const pickups = methods.filter((m) => m.kind === 'pickup')
  const returnDays = facts.ok ? facts.value.returnDays : null

  /* Корзина до оформления: доставка ещё не выбрана. */
  const cart = cartOf(lines, null)
  const view = cartView(lang, cart, null, { freeFrom: facts.ok ? facts.value.freeDeliveryFrom : null, popular: [], shelves: [] })
  const msgs = { timeout: view.messages.timeout, failed: view.messages.failed }
  /* Пустая корзина: «к покупкам» и главные полки кнопками (И689). */
  const empty = cartView(lang, null, null, { freeFrom: null, popular: [], shelves }).empty

  /* Оформление: курьер на адрес образца. */
  const delivery: Delivery | null = door ? { method: door, address: ADDRESS, point: null } : null
  const chosen = cartOf(lines, door?.price ?? null)
  const payments = paymentsFor(lang, chosen.total)
  const firstArrival = deliveryView(lang, { methods, delivery: null, pickup: null })
  const atDoor = deliveryView(lang, { methods, delivery, pickup: null })
  const address = atDoor.details?.kind === 'address' ? atDoor.details : null

  /* Пункты выдачи: первый способ, где ищут по городу, — выбором с поиском;
     способ с малым списком — самими пунктами. */
  const pickupViews = await Promise.all(pickups.map(async (m) => {
    const found = await pointsOf(lang, m)
    const v = deliveryView(lang, { methods, delivery: { method: m, address: null, point: found.points[0] ?? null }, pickup: found })
    return { listed: found.listed, details: v.details?.kind === 'pickup' ? v.details : null }
  }))
  const searched = pickupViews.find((x) => !x.listed)?.details ?? pickupViews[0]?.details ?? null
  const listed = pickupViews.find((x) => x.listed)?.details ?? searched

  const pay = delivery ? paymentView(lang, {
    methods: payments, checkout: { cart: chosen, contact: CONTACT, delivery },
    terms: { title: terms.ok ? terms.value.title : t(lang, 'footer.legal'), href: hrefFor(lang, { doc: TERMS_DOC }) },
    returnDays,
  }) : null
  const paidBy = payments.find((x) => x.eligible) ?? null
  const order: Order | null = delivery && paidBy ? { code: ORDER_CODE, placedAt: new Date().toISOString(), contact: CONTACT, delivery, payment: paidBy, cart: chosen } : null

  /* Поле формы — в трёх состояниях: пустое, заполненное, с ошибкой. Ошибку
     говорит та же проверка, что у шага контактов. */
  const contactFields = contactView(lang, null).rows.flat()
  const fieldOf = (name: string) => contactFields.find((x) => x.name === name)
  const wrong = new FormData()
  wrong.set('phone', '07')
  const checked = parseContact(lang, wrong)
  const phoneError = checked.ok ? null : checked.errors.phone ?? null
  const email = fieldOf('email')
  const given = fieldOf('firstName')
  const phone = fieldOf('phone')
  const summary = summaryView(lang, cart)

  return (
    <>
      <Part title="Корзина" lede="Страница корзины: слева строки товаров, справа лист с итогом, кнопкой оформления, обещаниями магазина и кодом скидки под вопросом.">
        <CartView lang={lang} view={view} submit={stillSubmit} call={stillCall} landmark={false} />
      </Part>
      <Part title="Шторка корзины" lede="Открывается иконкой корзины в шапке, не уводя со страницы: те же строки, внизу итог и две кнопки. Нажмите — откроется настоящая.">
        <div className={p.cluster}>
          <button className={b.btn} type="button" popoverTarget="design-cart-pane">Открыть шторку корзины</button>
        </div>
        <CartPane lang={lang} id="design-cart-pane" src={`/api/cart?lang=${lang}`} title={t(lang, 'cart.title')} close={t(lang, 'nav.close')} shown={view} />
      </Part>
      <Part title="Пустая корзина" lede="Так выглядит шторка и страница корзины, когда в ней ничего нет: слово и тихие строки категорий, те же, что в окне поиска под пустым полем.">
        <EmptyPaths level={2} title={empty.title} lead={empty.lead} shelves={empty.shelves} />
      </Part>
      <Part title="Строки корзины" lede="Строка товара — одна на страницу корзины и её шторку: снимок, имя, вариант и цена за штуку, сумма строки, под ними счётчик и «Удалить».">
        <CartForm lang={lang} submit={stillSubmit} call={stillCall} initial={null} {...msgs}>
          <CartLines lines={view.lines} />
        </CartForm>
      </Part>
      <Part title="Промокод" lede="Код скидки внизу листа корзины под тонкой чертой: свёрнут под вопросом, применённый код стоит пилюлей, крестик его снимает.">
        <CartCoupon lang={lang} view={view} submit={stillSubmit} call={stillCall} />
      </Part>
      <Part title="Рамка оформления" lede="Общая рамка шагов оформления: шаги сверху, имя шага заголовком, слева сам шаг, справа сводка заказа. Здесь — шаг доставки, когда способ ещё не выбран.">
        <CheckoutFrame steps={stepsView(lang, 'delivery')} summary={summary} landmark={false}>
          <MethodForm view={firstArrival} action={stillStep} permalink={hrefFor(lang, { checkout: 'delivery' })} />
        </CheckoutFrame>
      </Part>
      <Part title="Шаги оформления" lede="Путь из трёх шагов над заголовком: пройденные — с галочкой и ссылкой назад, текущий отмечен, будущие — просто текстом.">
        <div className={p.stack}>
          <CheckoutSteps steps={stepsView(lang, 'contact')} />
          <CheckoutSteps steps={stepsView(lang, 'delivery')} />
          <CheckoutSteps steps={stepsView(lang, 'payment')} />
        </div>
      </Part>
      <Part title="Способ доставки" lede="Выбор способа на шаге доставки: имя, цена, служба и срок, под ними пара слов; способ уже выбран, поэтому кнопки «выбрать» нет.">
        <MethodForm view={atDoor} action={stillStep} permalink={hrefFor(lang, { checkout: 'delivery' })} />
      </Part>
      <Part title="Адрес доставки" lede="Адрес под выбранным курьером: улица, индекс рядом с городом, уезд из списка, страна словом и кнопка дальше, к оплате.">
        {address ? <AddressForm details={address} action={stillStep} permalink={hrefFor(lang, { checkout: 'delivery' })} /> : <Missing what="У магазина нет доставки на адрес." />}
      </Part>
      <Part title="Выбор пункта выдачи" lede="Под способом с пунктами выдачи: поиск по городу, найденные пункты и кнопка дальше. Пунктов мало — поиска нет, пункты сразу.">
        {searched ? <PointPicker details={searched} action={stillStep} permalink={hrefFor(lang, { checkout: 'delivery' })} /> : <Missing what="У магазина нет способа с пунктами выдачи." />}
      </Part>
      <Part title="Пункт выдачи" lede="Сам список пунктов: имя, вид, адрес и часы работы, отмеченный пункт и кнопка дальше. Стоит внутри выбора пункта выдачи.">
        {listed ? <PointForm details={listed} action={stillStep} permalink={hrefFor(lang, { checkout: 'delivery' })} /> : <Missing what="У магазина нет способа с пунктами выдачи." />}
      </Part>
      <Part title="Оплата и проверка заказа" lede="Последний шаг: слева способы оплаты и проверка — кому, куда и что; справа лист с итогом, условиями и кнопкой заказа.">
        {pay ? (
          <>
            <h3 id="design-pay-title" className={p.said}>{t(lang, 'checkout.step.payment')}</h3>
            <PaymentForm view={pay} action={stillStep} permalink={hrefFor(lang, { checkout: 'payment' })} labelledBy="design-pay-title">
              <OrderReview id="design-review" title={pay.review} recaps={pay.recaps} itemsTitle={pay.itemsTitle} items={pay.items} />
            </PaymentForm>
          </>
        ) : <Missing what="У магазина нет доставки на адрес — проверки заказа не из чего собрать." />}
      </Part>
      <Part title="Товары заказа" lede="Товары со снимками в сводке оформления, в проверке перед оплатой и на странице «спасибо»: имя, вариант и количество, сумма.">
        <OrderItems items={summary.items} />
      </Part>
      <Part title="Итоги заказа" lede="Итоги — одни на корзину, оформление и «спасибо»: товары, скидка, доставка, крупно итог и строка про НДС.">
        <OrderTotals totals={summaryView(lang, chosen).totals} />
      </Part>
      <Part title="Заказ принят" lede="Страница «спасибо»: иконка успеха, номер заказа крупно, что будет дальше, детали заказа и лист с итогом и ссылкой в каталог.">
        {order ? <OrderDone view={doneView(lang, order)} landmark={false} /> : <Missing what="Заказа образца не из чего собрать." />}
      </Part>
      <Part title="Поле формы" lede="Поле оформления — подпись, ввод и строка под ним: пустое, заполненное и с ошибкой, которая стоит у своего поля.">
        <div className={f.rows}>
          {email ? <Field field={email} value="" error={null} /> : null}
          {given ? <Field field={given} value={CONTACT.firstName} error={null} /> : null}
          {phone ? <Field field={phone} value="07" error={phoneError} /> : null}
        </div>
      </Part>
    </>
  )
}
