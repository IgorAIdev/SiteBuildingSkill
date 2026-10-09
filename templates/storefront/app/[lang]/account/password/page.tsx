import type { Metadata } from 'next'
import { langOf } from '@/lib/route.ts'
import { first, type Params } from '@/lib/listing.ts'
import { passwordView } from '@/lib/account-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { forgotPassword, resetPassword } from '@/lib/actions/account.ts'
import { AuthPage } from '@/components/AuthPage.tsx'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Params> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'password.title'), description: t(lang, 'password.lede'), path: (l) => hrefFor(l, { account: 'password' }), index: false })
}

/* Пароль (И771): без ссылки из письма — почта для письма сброса; со ссылкой
   (`?token=`, адрес из письма движка — INTEGRATION.md) — новый пароль, и
   после него вход. Ссылку проверяет источник при записи, не страница. */
export default async function PasswordPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const token = first((await searchParams).token)
  return token
    ? <AuthPage view={passwordView(lang, token)} action={resetPassword.bind(null, lang)} permalink={hrefFor(lang, { account: 'password', token })} />
    : <AuthPage view={passwordView(lang, null)} action={forgotPassword.bind(null, lang)} permalink={hrefFor(lang, { account: 'password' })} />
}
