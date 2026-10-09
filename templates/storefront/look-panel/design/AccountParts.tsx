import p from '@/styles/primitives.module.css'
import f from '@/styles/form.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { AccountState } from '@/lib/actions/account.ts'
import { sampleCommerce, FIXTURES } from '@/lib/source/sample/commerce.ts'
import { PROVIDERS } from '@/lib/source/contract.ts'
import { addressBookView, cabinetView, orderPageView, passwordView, signInView, signUpView } from '@/lib/account-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { AuthPage } from '@/components/AuthPage.tsx'
import { AuthForm } from '@/components/AuthForm.tsx'
import { PasswordBox } from '@/components/PasswordBox.tsx'
import { Cabinet } from '@/components/Cabinet.tsx'
import { OrderPage } from '@/components/OrderPage.tsx'
import { AddressBook } from '@/components/AddressBook.tsx'
import { AddressEdit } from '@/components/AddressEdit.tsx'
import { lookNow } from '@/lib/look.ts'
import { Part, Worn, cssVar } from './parts.tsx'
import s from './design.module.css'

/* Магазин → «Кабинет» (И771): настоящие страницы кабинета на покупательнице
   образца (заготовка `sample-account`: два прошлых заказа, два адреса) —
   те же компоненты и тот же вид, что на сайте. Данные — образца при любом
   источнике, как у корзины образца: заводить вход в живом магазине
   дизайн-система не должна. Формы получают действие-пустышку: кнопки
   отвечают руке, но никто не входит и ничего не пишется. */

async function still(): Promise<AccountState> {
  'use server'
  return null
}
/* Кнопки поставщиков — тоже пустышкой: окна Google и Facebook отсюда не
   открываются. Показаны оба поставщика при любом источнике (И787): на сайте
   кнопка стоит только у того, кого называет сервер. */
async function stillSocial(): Promise<void> {
  'use server'
}
const ALL = [...PROVIDERS]

const Missing = ({ what }: { what: string }) => <p className={p.note}>{what}</p>

/* Форма входа — оба вида (`--auth-look`, панель Look → Admin → Sign in; И780) той
   же страницей входа, что на сайте, одна под другой: страница — целиком, рядом её
   не поставить. Метка «на сайте» — по опубликованному виду. Формы входа, присланные
   24.09.2026, жили в каталоге элементов (56, 57) и перенесены сюда; вход через
   Google и Facebook под формой — как в них (И787). */
const AUTH_LOOKS = [
  ['plain', 'На полу страницы', 'колонка по центру на цвете страницы — Dawn, Gymshark, Allbirds'],
  ['card', 'На листе', 'та же колонка на белом листе с краем волоском — как присланные формы'],
] as const

export async function AccountParts({ lang }: { lang: Lang }) {
  const [who, orders] = await Promise.all([sampleCommerce.customer(FIXTURES.account, lang), sampleCommerce.orders(FIXTURES.account, lang)])
  const customer = who.ok ? who.value : null
  const list = orders.ok ? orders.value : []
  const first = list[0] ? await sampleCommerce.order(FIXTURES.account, lang, list[0].code) : null
  const order = first?.ok ? first.value : null
  const here = hrefFor(lang, { account: 'home' })
  const { names } = await lookNow()
  return (
    <>
      <Part title="Вход" lede="Знак человека в шапке ведёт сюда гостя. Стандартная форма входа: колонка по центру, имя страницы, почта, пароль с глазом «показать», «забыли пароль» тихим словом под паролем, кнопка во всю колонку; под ней «или» между волосками и «Continue with Google», «Continue with Facebook» — тихие кнопки ростом главной, знаки самих Google и Facebook; ниже — «нет кабинета — создать» и что заказать можно и без кабинета. Кнопка поставщика стоит на сайте, только когда сервер магазина его называет (плагин входа). Два вида — на полу страницы и на листе; сменить — в панели Look → Admin → Sign in.">
        {AUTH_LOOKS.map(([look, name, line]) => (
          <div key={look} className={s.group} style={cssVar('--auth-look', look)}>
            <h3>{name} <Worn on={look === (names['auth-look'] ?? 'plain')} /></h3>
            <p className={p.note}>{line}</p>
            <AuthPage view={signInView(lang, null, ALL)} action={still} social={stillSocial} permalink={here} landmark={false} at={`in-${look}-`} />
          </div>
        ))}
      </Part>
      <Part title="Создание кабинета" lede="Имя и фамилия парой (по-венгерски фамилия первой), почта, пароль с правилом под полем; под кнопкой те же «или» и кнопки Google и Facebook — поставщик и заводит кабинет; как магазин обращается с данными — ссылкой. Создан — сразу вход; движок ждёт подтверждения — слова «проверьте почту» на месте формы.">
        <AuthPage view={signUpView(lang, null, ALL)} action={still} social={stillSocial} permalink={here} landmark={false} at="up-" />
      </Part>
      <Part title="Новый пароль по ссылке из письма" lede="Ссылка из письма сброса открывает одну форму: новый пароль с правилом под полем и кнопка; после неё — сразу вход.">
        <div className={p.wrap}><AuthForm view={passwordView(lang, 'design')} action={still} permalink={here} at="pw-" /></div>
      </Part>
      <Part title="Поле пароля" lede="Тот же ввод, что у всех полей, и тихий знак глаза у его конца: нажат — пароль виден, глаз залит краской марки, как отмеченное сердце.">
        <div className={f.field}>
          <label className={f.label} htmlFor="design-password">{t(lang, 'field.password')}</label>
          <PasswordBox id="design-password" name="design-password" autoComplete="off" show={t(lang, 'field.passwordShow')} />
        </div>
      </Part>
      <Part title="Кабинет" lede="Вошедший видит заказы карточками — снимок первого товара, номер, дата и состояние словом, сумма и число штук; карточка ведёт на заказ. Справа — кто я, адрес по умолчанию со ссылкой на все адреса и выход.">
        {customer ? <Cabinet lang={lang} view={cabinetView(lang, customer, list)} landmark={false} /> : <Missing what="Кабинета образца нет." />}
      </Part>
      <Part title="Заказ в кабинете" lede="Заказ целиком — рама «спасибо»: номер именем страницы, под ним дата и состояние; как приедет, чем платится, кому, товары; справа итог и путь назад в кабинет.">
        {order ? <OrderPage view={orderPageView(lang, order)} landmark={false} /> : <Missing what="Заказов образца нет." />}
      </Part>
      <Part title="Адреса" lede="Адреса карточками: строки конверта, «адрес по умолчанию» словом, «изменить» и «удалить» тихими словами; новый адрес — кнопкой внизу.">
        {customer ? <AddressBook lang={lang} view={addressBookView(lang, customer, null)} permalink={hrefFor(lang, { account: 'addresses' })} landmark={false} /> : <Missing what="Кабинета образца нет." />}
      </Part>
      <Part title="Правка адреса" lede="«Изменить» открывает поля адреса на месте карточки: те же, что на кассе, — улица, индекс рядом с городом, уезд списком; галочка «адрес по умолчанию», кнопка и «отменить».">
        {customer ? (
          <div className={p.wrap}>
            <AddressEdit form={addressBookView(lang, customer, null).cards[0].edit.form} action={still} permalink={hrefFor(lang, { account: 'addresses' })} cancel={{ label: t(lang, 'addresses.cancel'), href: hrefFor(lang, { account: 'addresses' }) }} />
          </div>
        ) : <Missing what="Кабинета образца нет." />}
      </Part>
    </>
  )
}
