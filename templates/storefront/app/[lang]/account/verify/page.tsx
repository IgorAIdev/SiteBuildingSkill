import type { Metadata } from 'next'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { first, type Params } from '@/lib/listing.ts'
import { verifyView } from '@/lib/account-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { verifyEmail } from '@/lib/actions/account.ts'
import { AuthPage } from '@/components/AuthPage.tsx'
import { StateScreen } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Params> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'verify.title'), description: t(lang, 'verify.lede'), path: (l) => hrefFor(l, { account: 'verify' }), index: false })
}

/* Подтверждение адреса по ссылке из письма (И771): кнопкой, а не самим
   открытием страницы — ссылки из писем открывают и проверщики почты, и
   подтверждение съедалось бы до покупателя. Ссылки нет — куда её взять. */
export default async function VerifyPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const token = first((await searchParams).token)
  if (!token) {
    return (
      <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
        <StateScreen level={1} kind="none" title={t(lang, 'verify.missing')} step={t(lang, 'password.back')} href={hrefFor(lang, { account: 'home' })} />
      </main>
    )
  }
  return <AuthPage view={verifyView(lang, token)} action={verifyEmail.bind(null, lang)} permalink={hrefFor(lang, { account: 'verify', token })} />
}
