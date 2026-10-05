import type { Metadata } from 'next'
import { langOf } from '@/lib/route.ts'
import { commerce } from '@/lib/source/index.ts'
import { readSession } from '@/lib/session.ts'
import { first, type Params } from '@/lib/listing.ts'
import { safeNext } from '@/lib/account-form.ts'
import { cabinetView, signInView } from '@/lib/account-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { signIn } from '@/lib/actions/account.ts'
import { AuthPage } from '@/components/AuthPage.tsx'
import { Cabinet } from '@/components/Cabinet.tsx'
import { Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Params> }

/* Кабинет (И771): гостю — вход, вошедшему — заказы, данные и адреса. Адрес
   один: знак шапки ведёт сюда и гостя, и вошедшего — шапка сессию не
   читает. Личное: `noindex`, в карте сайта нет; без сессии — вход с кодом
   200 (check:open). `next` — куда вернуться после входа (свой путь). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'cabinet.title'), description: t(lang, 'account.lede'), path: (l) => hrefFor(l, { account: 'home' }), index: false })
}

export default async function AccountPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const session = await readSession()
  const who = await commerce().customer(session, lang)
  if (!who.ok) return <Unavailable lang={lang} />
  if (!who.value) {
    const next = safeNext(lang, first((await searchParams).next))
    return <AuthPage view={signInView(lang, next)} action={signIn.bind(null, lang)} permalink={hrefFor(lang, { account: 'home', ...(next ? { next } : {}) })} />
  }
  const orders = await commerce().orders(session, lang)
  if (!orders.ok && orders.error === 'unavailable') return <Unavailable lang={lang} />
  return <Cabinet lang={lang} view={cabinetView(lang, who.value, orders.ok ? orders.value : [])} />
}
