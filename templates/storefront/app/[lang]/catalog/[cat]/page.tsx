import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { langOf } from '@/lib/route.ts'
import { source } from '@/lib/source/index.ts'
import { frameTotal, readQuery, shownListing, type Params } from '@/lib/listing.ts'
import { catalogView, emptyFor } from '@/lib/catalog-view.ts'
import { hrefFor, type Query } from '@/lib/href.ts'
import { toMetadata } from '@/lib/seo.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { Catalog } from '@/components/Catalog.tsx'
import { CatalogCopy } from '@/components/CatalogCopy.tsx'
import { categoryCopy } from '@/lib/content/shop-copy.ts'
import { Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string; cat: string }>; searchParams: Promise<Params> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  const { cat } = await params
  const col = await source().collection(lang, cat)
  if (!col.ok) return {}
  const copy = categoryCopy(lang, cat)
  return toMetadata(lang, { title: copy?.title ?? col.value.name, description: copy?.description ?? col.value.description, path: (l) => hrefFor(l, { category: cat }) })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const { cat } = await params
  const asked = readQuery(await searchParams)
  const [col, r, all] = await Promise.all([source().collection(lang, cat), shownListing(source(), lang, { category: cat, ...asked }), frameTotal(source(), lang, asked, { category: cat })])
  if (!col.ok && col.reason === 'not-found') notFound()
  if (!r.ok && r.reason !== 'unavailable') notFound()
  if (!col.ok || !r.ok) return <Unavailable lang={lang} />
  const at = (q: Query) => hrefFor(lang, { category: cat, ...q })
  /* Полка — рамка страницы, а не галочка: её пилюля ведёт во все товары с
     теми же гранями (catalog-view.ts, `Scope`). */
  const scope = { name: col.value.name, wider: (q: Query) => hrefFor(lang, { catalog: true, ...q }) }
  const copy = categoryCopy(lang, cat)
  return <Catalog view={catalogView(lang, { title: copy?.heading ?? col.value.name, lede: copy?.lede ?? col.value.description, listing: r.value, asked, at, filters: true, empty: emptyFor(lang, asked, at), scope, counted: { category: cat }, all })} cart={{ submit: cartSubmit, call: cartCall }} after={copy ? <CatalogCopy copy={copy} lang={lang} /> : undefined} />
}
