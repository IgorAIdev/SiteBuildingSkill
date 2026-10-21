import type { Metadata } from 'next'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { commerce } from '@/lib/source/index.ts'
import { readSession } from '@/lib/session.ts'
import { orderPageView } from '@/lib/account-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { OrderPage } from '@/components/OrderPage.tsx'
import { StateScreen, Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string; code: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  const { code } = await params
  return toMetadata(lang, { title: t(lang, 'cabinet.order', { code }), description: t(lang, 'done.summary'), path: (l) => hrefFor(l, { order: code }), index: false })
}

/* Заказ в кабинете (И771) — только вошедшему и только свой: гость видит
   «войдите» со входом, который вернёт его сюда; чужой или неизвестный код —
   «заказа нет в кабинете», без различия между ними (код угадывают). */
export default async function AccountOrderPage({ params }: Props) {
  const lang = await langOf(params)
  const { code } = await params
  const r = await commerce().order(await readSession(), lang, code)
  if (!r.ok && r.error === 'unavailable') return <Unavailable lang={lang} />
  if (r.ok && r.value) return <OrderPage view={orderPageView(lang, r.value)} />
  const signedOut = !r.ok
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      {signedOut
        ? <StateScreen level={1} kind="none" title={t(lang, 'cabinet.signedOut')} step={t(lang, 'account.signIn')} href={hrefFor(lang, { account: 'home', next: hrefFor(lang, { order: code }) })} />
        : <StateScreen level={1} kind="not-found" title={t(lang, 'cabinet.noOrder')} step={t(lang, 'cabinet.back')} href={hrefFor(lang, { account: 'home' })} />}
    </main>
  )
}
