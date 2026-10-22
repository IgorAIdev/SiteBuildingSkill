import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { content, source } from '@/lib/source/index.ts'
import type { Lang } from '@/lib/locale.ts'
import type { Listing, Result } from '@/lib/source/contract.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { articleLd } from '@/lib/ld.ts'
import { docView, plainOf } from '@/lib/doc-view.ts'
import { nextReads, postCard, postHeadView, updatedOf } from '@/lib/post-view.ts'
import { shelfCard } from '@/lib/view.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { PageCrumbs } from '@/components/Breadcrumbs.tsx'
import { DocView } from '@/components/DocView.tsx'
import { JsonLd } from '@/components/JsonLd.tsx'
import { PostCard } from '@/components/PostCard.tsx'
import { RailHead } from '@/components/RailHead.tsx'
import { PostHead, PostIntro, PostSources } from '@/components/PostParts.tsx'
import { Shelf } from '@/components/Shelf.tsx'
import { Faq } from '@/components/blocks/Faq.tsx'
import { Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string; slug: string }> }

const NO_AIR = { air: null }
const CART = { submit: cartSubmit, call: cartCall }
/** Товаров на полке «Produse potrivite» под статьёй. */
const PRODUCTS_SHOWN = 4
/* Снаружи тела страницы: массив, собранный в её области и отданный пропу,
   ловит react-perf/jsx-no-new-array-as-prop (так же — docTrail в info/[doc]). */
const cardsOf = (lang: Lang, listing: Result<Listing> | null) => (listing?.ok ? listing.value.items.slice(0, PRODUCTS_SHOWN).map((c) => shelfCard(lang, c)) : [])

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  const { slug } = await params
  const r = await content().post(lang, slug)
  if (!r.ok) return {}
  return toMetadata(lang, { title: r.value.title, description: r.value.summary, path: (l) => hrefFor(l, { post: slug }) })
}

/* Статья (И749; бриф docs/design/блог.md, образец — блог cbdshop.bg): шапка
   (рубрика, имя, подзаголовок, автор, строка данных) → обложка с потолком →
   «Pe scurt» → [оглавление | текст, источники, «Important»] → вопросы с
   разметкой → «Produse potrivite» (после текста на любой ширине: у cbdshop.bg
   на телефоне товар стоял до текста, 1249 px) → «Citește mai departe» →
   «Înapoi la ghid». */
export default async function PostPage({ params }: Props) {
  const lang = await langOf(params)
  const { slug } = await params
  const [r, all, cols] = await Promise.all([content().post(lang, slug), content().posts(lang), source().collections(lang)])
  if (!r.ok) {
    if (r.reason === 'unavailable') return <Unavailable lang={lang} />
    notFound()
  }
  const post = r.value
  const href = hrefFor(lang, { post: slug })
  /* Полка вида товара статьи: у образца вид — поле полки (`form`), у движка
     cbdin вид совпадает с адресом полки. Нет такой полки — нет и ряда. */
  const shelf = post.shelf && cols.ok ? cols.value.find((c) => c.form === post.shelf || c.slug === post.shelf) ?? null : null
  const listing = shelf ? await source().listing(lang, { category: shelf.slug, facets: {}, sort: 'popular', page: null }) : null
  const cards = cardsOf(lang, listing)
  const reads = all.ok ? nextReads(post, all.value).map((x) => postCard(lang, x)) : []
  const faq = post.faq.length ? { type: 'faq' as const, title: t(lang, 'blog.faq'), items: post.faq.map((x) => ({ q: plainOf(x.q), a: plainOf(x.a) })) } : null
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <JsonLd data={articleLd({ title: post.title, summary: post.summary, date: post.date, updated: updatedOf(post), href, lang })} />
      <PageCrumbs lang={lang} blog name={post.title} href={href} />
      <DocView
        view={docView(lang, post)}
        head={<PostHead view={postHeadView(lang, post)} />}
        intro={<PostIntro image={post.image} tldr={post.tldr} tldrLabel={t(lang, 'blog.tldr')} />}
      >
        <PostSources title={t(lang, 'blog.sources')} sources={post.sources} important={t(lang, 'blog.important')} disclaimer={t(lang, 'blog.disclaimer')} />
      </DocView>
      {/* Вопросы — внутри коробки страницы (`inset`): своя коробка `wrap` удваивала поле, и заголовок вставал на 48 правее колонки (заказчик 22.10.2026: «FAQ почему не выровнен по левому краю»). */}
      {faq ? <Faq block={faq} place={NO_AIR} inset /> : null}
      {shelf && cards.length ? <Shelf title={t(lang, 'blog.products')} id="post-products" all={hrefFor(lang, { category: shelf.slug })} cards={cards} cart={CART} /> : null}
      {/* «Читать дальше» — шапкой ряда сайта (RailHead): заголовок, листание и выход
          «View all» в блог, как у ленты статей главной. Своя сборка «h2 + рельса»
          ставила рельсу вплотную к заголовку (0 при 44 у всех рядов: отрицательное
          поле рельсы съедало шаг стопки), а отдельная «Back to the guide» под ней
          вела туда же, что «View all», и стояла своей полосой (замер 22.10.2026).
          Карточки — видом списка блога: одна карточка статьи на всю ветку блога. */}
      {reads.length ? (
        <section className={p.section} aria-labelledby="post-next">
          <RailHead id="post-next" title={t(lang, 'blog.next')} all={hrefFor(lang, { blog: true })} lang={lang} />
          <ul id="post-next-rail" className={p.rail} data-rail="goods">{reads.map((c) => <li key={c.slug}><PostCard post={c} list /></li>)}</ul>
        </section>
      ) : null}
    </main>
  )
}
