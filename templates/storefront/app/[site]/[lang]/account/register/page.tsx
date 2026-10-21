import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { langOf } from '@/lib/route.ts'
import { commerce } from '@/lib/source/index.ts'
import { readSession } from '@/lib/session.ts'
import { first, type Params } from '@/lib/listing.ts'
import { safeNext } from '@/lib/account-form.ts'
import { signUpView, socialAlert } from '@/lib/account-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { signUp, socialSignIn } from '@/lib/actions/account.ts'
import { AuthPage } from '@/components/AuthPage.tsx'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Params> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'register.title'), description: t(lang, 'register.lede'), path: (l) => hrefFor(l, { account: 'register' }), index: false })
}

/* Создание кабинета (И771). Вошедшему создавать нечего — в кабинет. Те же
   кнопки поставщиков, что на входе (И787): поставщик и заводит кабинет. */
export default async function RegisterPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const who = await commerce().customer(await readSession(), lang)
  if (who.ok && who.value) redirect(hrefFor(lang, { account: 'home' }))
  const query = await searchParams
  const next = safeNext(lang, first(query.next))
  const providers = (await commerce().socialProviders()).map((x) => x.provider)
  const view = signUpView(lang, next, providers, socialAlert(lang, first(query.auth), first(query.via)))
  return <AuthPage view={view} action={signUp.bind(null, lang)} social={socialSignIn.bind(null, lang)} permalink={hrefFor(lang, { account: 'register', ...(next ? { next } : {}) })} />
}
