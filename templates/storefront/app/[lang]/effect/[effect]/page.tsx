import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { langOf } from '@/lib/route.ts'
import type { Lang } from '@/lib/locale.ts'
import { source } from '@/lib/source/index.ts'
import { EFFECT_FACET } from '@/lib/source/effect.ts'
import { frameTotal, readQuery, shownListing, type Params } from '@/lib/listing.ts'
import { catalogView, emptyFor } from '@/lib/catalog-view.ts'
import { hrefFor, type Query } from '@/lib/href.ts'
import { toMetadata } from '@/lib/seo.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { Catalog } from '@/components/Catalog.tsx'
import { CatalogCopy } from '@/components/CatalogCopy.tsx'
import { effectCopy } from '@/lib/content/shop-copy.ts'
import { Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string; effect: string }>; searchParams: Promise<Params> }

/* Страница эффекта (shop, catalog.md: «Признак, вынесенный в навигацию,
   обязан быть страницей»): плитка эффекта на главной ведёт сюда, а не к
   галочке фильтра. Свой адрес, заголовок, описание и место в карте сайта;
   полка — весь каталог с выбором этого эффекта, остальные грани — как в
   каталоге. Сам эффект среди граней не стоит: снять его здесь — значит
   уйти со страницы, и выход — его пилюля первой в строке выбранного
   (`Scope`, catalog-view.ts). */
const effectOf = async (lang: Lang, code: string) => {
  const r = await source().effects(lang)
  return r.ok ? { ok: true as const, value: r.value.find((e) => e.code === code) ?? null } : r
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  const { effect } = await params
  const e = await effectOf(lang, effect)
  if (!e.ok || !e.value) return {}
  const copy = effectCopy(lang, effect)
  return toMetadata(lang, { title: copy?.title ?? e.value.name, description: copy?.description ?? e.value.description, path: (l) => hrefFor(l, { effect: e.value!.code }) })
}

export default async function EffectPage({ params, searchParams }: Props) {
  const lang = await langOf(params)
  const code = (await params).effect
  const asked = readQuery(await searchParams)
  const own = { ...asked, facets: Object.fromEntries(Object.entries(asked.facets).filter(([k]) => k !== EFFECT_FACET)) }
  const [e, r, all] = await Promise.all([effectOf(lang, code), shownListing(source(), lang, { ...own, facets: { ...own.facets, [EFFECT_FACET]: [code] } }), frameTotal(source(), lang, own, { facets: { [EFFECT_FACET]: [code] } })])
  if (e.ok && !e.value) notFound()
  if (!r.ok && r.reason !== 'unavailable') notFound()
  if (!e.ok || !e.value || !r.ok) return <Unavailable lang={lang} />
  const listing = { ...r.value, facets: r.value.facets.filter((f) => f.code !== EFFECT_FACET) }
  const at = (q: Query) => hrefFor(lang, { effect: code, ...q })
  const scope = { name: e.value.name, wider: (q: Query) => hrefFor(lang, { catalog: true, ...q }) }
  const copy = effectCopy(lang, code)
  return <Catalog view={catalogView(lang, { title: copy?.heading ?? e.value.name, lede: copy?.lede ?? (e.value.description || null), listing, asked: own, at, filters: true, empty: emptyFor(lang, own, at), scope, counted: { effect: code }, all })} cart={{ submit: cartSubmit, call: cartCall }} after={copy ? <CatalogCopy copy={copy} lang={lang} /> : undefined} />
}
