import type { Metadata } from 'next'
import { langOf } from '@/lib/route.ts'
import { source, content, commerce } from '@/lib/source/index.ts'
import { shelfCard } from '@/lib/view.ts'
import { hrefFor } from '@/lib/href.ts'
import { toMetadata } from '@/lib/seo.ts'
import { organizationLd, websiteLd } from '@/lib/ld.ts'
import { COMPANY_IS_REAL } from '@/lib/flags.ts'
import { lookNow } from '@/lib/look.ts'
import { arrange } from '@/lib/homes.ts'
import { toneOf } from '@/lib/bands.ts'
import { pledgesView } from '@/lib/pledges.ts'
import { Blocks } from '@/components/blocks/registry.tsx'
import { JsonLd } from '@/components/JsonLd.tsx'
import { Unavailable } from '@/components/StateScreen.tsx'
import type { BlockCtx } from '@/components/blocks/types.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  const page = await content().page(lang, 'home')
  if (!page.ok) return {}
  return toMetadata(lang, { title: page.value.title, description: page.value.description, path: (l) => hrefFor(l, { home: true }) })
}

export default async function Home({ params }: Props) {
  const lang = await langOf(params)
  const page = await content().page(lang, 'home')
  if (!page.ok) return <Unavailable lang={lang} />
  const ids = page.value.blocks.flatMap((b) => (b.type === 'featured' ? b.ids : []))
  /* Способы доставки — тот же список, что выбор на оформлении (И95): из
     него обещание «доставка от» героя. Молчит источник покупки — обещание
     стоит без цены, а не падает. */
  /* Отзывы и статьи — лентам главной (И728, И729); молчит источник — лент
     нет, а главная стоит. */
  const [cols, effects, cards, methods, facts, look, reviews, posts] = await Promise.all([
    source().collections(lang), source().effects(lang), source().cards(lang, ids),
    commerce().deliveryMethods(null, lang), content().facts(), lookNow(), content().reviews(lang), content().posts(lang),
  ])
  if (!cols.ok || !cards.ok) return <Unavailable lang={lang} />
  /* Обещания покупки — из данных магазина, как у кнопки заказа (И332):
     доставка «от» из того же списка способов и срок возврата. Оплату при
     получении главная не обещает: её допустимость зависит от суммы корзины,
     а корзины у главной нет. */
  const pledges = pledgesView(lang, { payments: null, methods: methods.ok ? methods.value : null, returnDays: facts.ok ? facts.value.returnDays : null })
  /* Эффекты — ряд дверей под полками; источник их не дал — ряда нет, а
     главная стоит. */
  const shelf: BlockCtx['cards'] = Object.fromEntries(cards.value.map((c) => [c.id, shelfCard(lang, c)]))
  const ctx: BlockCtx = {
    lang, home: look.home, collections: cols.value, effects: effects.ok ? effects.value : [], pledges, cart: { submit: cartSubmit, call: cartCall }, cards: shelf,
    spotlight: ids.map((id) => shelf[id]).find(Boolean) ?? null,
    bands: Object.fromEntries(page.value.blocks.map((b) => [b.type, toneOf(look.vars, b.type)])),
    reviews: reviews.ok ? reviews.value : [], posts: posts.ok ? posts.value : [],
  }
  return (
    /* Порядок блоков — рецепт главной (lib/homes.ts); `data-home` — одежда
       плашек категорий из вида, по ней проверки видят, что нарисовано;
       `data-page` — ярус заголовков разделов главной (И727, base.css). */
    <main id="main" data-home={look.home} data-page="home">
      {/* Сведения об организации машина читает как факт: образец компании в
          них не публикуется (флаг настоящести COMPANY_IS_REAL). */}
      {COMPANY_IS_REAL && <JsonLd data={organizationLd()} />}
      {COMPANY_IS_REAL && <JsonLd data={websiteLd()} />}
      <Blocks placed={arrange(page.value.blocks)} ctx={ctx} />
    </main>
  )
}
