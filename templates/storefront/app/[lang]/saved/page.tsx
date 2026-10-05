import type { Metadata } from 'next'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { source } from '@/lib/source/index.ts'
import { first, type Params } from '@/lib/listing.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { SavedView, savedCards } from '@/components/SavedView.tsx'
import { StateScreen, Unavailable } from '@/components/StateScreen.tsx'
import { SavedSync } from '@/components/SavedSync.tsx'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<Params> }

/* Избранное (lib/saved.ts). Список живёт в складе браузера, а карточку
   рисует сервер — поэтому номера товаров идут в адресе (`?ids=`), и
   страница читает их у источника, со свежей ценой и наличием. Адрес с
   избранным держит в согласии SavedSync: снял сердце — адрес и полка
   меняются сами. Личное — `noindex`. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'saved.title'), description: t(lang, 'saved.lede'), path: (l) => hrefFor(l, { saved: [] }), index: false })
}

export default async function SavedPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const ids = (first((await searchParams).ids) ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  const r = ids.length ? await source().cards(lang, ids) : null
  if (r && !r.ok) return <Unavailable lang={lang} />
  const cards = savedCards(lang, r?.value ?? [])
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <SavedSync lang={lang} shown={ids.join(',')} />
      {cards.length ? (
        <SavedView lang={lang} cards={cards} cart={{ submit: cartSubmit, call: cartCall }} />
      ) : (
        <StateScreen level={1} kind="empty" title={t(lang, 'saved.empty')} step={t(lang, 'saved.emptyStep')} href={hrefFor(lang, { catalog: true })} icon="heart" loud />
      )}
    </main>
  )
}
