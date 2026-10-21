import type { Metadata } from 'next'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { source } from '@/lib/source/index.ts'
import { first, type Params } from '@/lib/listing.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { shelfCard } from '@/lib/view.ts'
import { SavedView, savedCards } from '@/components/SavedView.tsx'
import { StateScreen, Unavailable } from '@/components/StateScreen.tsx'
import { Shelf } from '@/components/Shelf.tsx'
import { SavedSync } from '@/components/SavedSync.tsx'

const BEST = 4

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
  /* Пусто — слово, строка о сердце и полка ходовых товаров (сортировка источника «popular», как у
     пустого поиска). Категорий здесь нет: они и так в меню над страницей — слово заказчика
     20.10.2026: «в избранном не нужно повторять категории… если нет товаров, предложи best sale». */
  const best = cards.length ? null : await source().listing(lang, { facets: {}, sort: 'popular', page: null })
  const popular = best?.ok ? best.value.items.slice(0, BEST).map((card) => shelfCard(lang, card)) : []
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <SavedSync lang={lang} shown={ids.join(',')} />
      {cards.length ? (
        <SavedView lang={lang} cards={cards} cart={{ submit: cartSubmit, call: cartCall }} />
      ) : (
        <>
          <StateScreen level={1} kind="empty" title={t(lang, 'saved.empty')} lead={t(lang, 'saved.emptyLead')} flush />
          <Shelf title={t(lang, 'shelf.popular')} id="saved-popular" all={hrefFor(lang, { catalog: true })} cards={popular} cart={{ submit: cartSubmit, call: cartCall }} />
        </>
      )}
    </main>
  )
}
