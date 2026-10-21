import type { Metadata } from 'next'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { commerce } from '@/lib/source/index.ts'
import { readSession } from '@/lib/session.ts'
import { first, type Params } from '@/lib/listing.ts'
import { addressBookView } from '@/lib/account-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { AddressBook } from '@/components/AddressBook.tsx'
import { StateScreen, Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Params> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'addresses.title'), description: t(lang, 'addresses.lede'), path: (l) => hrefFor(l, { account: 'addresses' }), index: false })
}

/* Адреса кабинета (И771). Открытая правка — в адресе страницы (`?edit=`).
   Гость — «войдите» со входом, который вернёт его сюда. */
export default async function AddressesPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const who = await commerce().customer(await readSession(), lang)
  if (!who.ok) return <Unavailable lang={lang} />
  if (!who.value) {
    return (
      <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
        <StateScreen level={1} kind="none" title={t(lang, 'cabinet.signedOut')} step={t(lang, 'account.signIn')} href={hrefFor(lang, { account: 'home', next: hrefFor(lang, { account: 'addresses' }) })} />
      </main>
    )
  }
  const edit = first((await searchParams).edit)
  return <AddressBook lang={lang} view={addressBookView(lang, who.value, edit)} permalink={hrefFor(lang, { account: 'addresses', ...(edit ? { edit } : {}) })} />
}
