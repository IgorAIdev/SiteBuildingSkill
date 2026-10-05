import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { sampleContent } from '../lib/source/sample/content.ts'
import { reviewRail, reviewView } from '../lib/review-view.ts'
import { latestPosts, postCard } from '../lib/post-view.ts'
import { claimsIn } from '../lib/claims.ts'
import { dayOf } from '../lib/format.ts'
import { t } from '../lib/i18n/index.ts'
import { RECIPE } from '../lib/homes.ts'
import type { Review } from '../lib/source/contract.ts'
import RAW from '../lib/reviews.json' with { type: 'json' }

const LANGS = ['ro', 'en', 'hu'] as const
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

/* Цитату показывает магазин — она его утверждение (И728; Регламент
   1924/2006, ст. 10): ни в одном отзыве образца нет слов о действии. */
test('reviews: no sample review text says what CBD does to the body', async () => {
  for (const lang of LANGS) {
    const r = await sampleContent.reviews(lang)
    assert.ok(r.ok, lang)
    for (const x of r.value) {
      const said = claimsIn(lang, `${x.title ?? ''} ${x.body}`)
      assert.deepEqual(said, [], `${lang}/${x.id}: слова о действии ${said.join(', ')}`)
    }
  }
})

test('reviews: the claim sieve catches the obvious in every language', () => {
  assert.deepEqual(claimsIn('en', 'Helps me sleep and eases the pain'), ['sleep', 'pain'])
  assert.deepEqual(claimsIn('ro', 'Mă ajută la somn și la anxietate'), ['somn', 'anxi'])
  assert.ok(claimsIn('hu', 'Segít az alvásban és a szorongás ellen').length >= 2)
  /* Основа — с начала слова: «secure» не «cure», «teach» не «ache». */
  assert.deepEqual(claimsIn('en', 'A secure box; they teach you how to dose'), [])
})

test('reviews: an empty list draws no block', () => {
  assert.equal(reviewRail('en', []), null)
  /* Блок спрашивает ленту и молчит на null — не рисует ни рамки, ни «будьте первым». */
  assert.match(read('components/blocks/Reviews.tsx'), /const rail = reviewRail\([^)]*\)\s*\n\s*if \(!rail\) return null/)
})

test('reviews: a sample never says «Verified buyer»; a real one says it only when tied to an order', async () => {
  for (const lang of LANGS) {
    const r = await sampleContent.reviews(lang)
    assert.ok(r.ok)
    const sample = reviewRail(lang, r.value, false) ?? []
    assert.equal(sample.length, r.value.length)
    for (const v of sample) {
      assert.deepEqual(v.mark, { text: t(lang, 'review.sample'), verified: false }, `${lang}/${v.id}`)
    }
    const real = reviewRail(lang, r.value, true) ?? []
    for (const v of real) {
      const raw: Review | undefined = r.value.find((x) => x.id === v.id)
      assert.deepEqual(v.mark, raw?.verified ? { text: t(lang, 'review.verified'), verified: true } : null, `${lang}/${v.id}`)
    }
  }
})

test('reviews: videos first, stars whole, a video without a clip stands as text', async () => {
  const r = await sampleContent.reviews('en')
  assert.ok(r.ok)
  const rail = reviewRail('en', r.value) ?? []
  const firstText = rail.findIndex((v) => !v.video)
  assert.ok(firstText > 0 && rail.slice(firstText).every((v) => !v.video), 'видео первыми')
  assert.ok(rail.filter((v) => v.video).length >= 2 && rail.length >= 6 && rail.length <= 8, `в ленте ${rail.length}`)
  for (const v of rail) assert.equal(v.stars.filter((s) => s === 'full').length, r.value.find((x) => x.id === v.id)?.rating)
  const one = r.value.find((x) => x.video) as Review
  assert.equal(reviewView('en', { ...one, video: { ...one.video!, src: null } }).video, null)
  assert.equal(reviewView('en', { ...one, rating: 9 }).stars.filter((s) => s === 'full').length, 5)
})

/* Описание ряда — раскрытие (ЕС, Omnibus): у образца — что это образцы, у
   настоящего магазина — как он проверяет отзывы. Пустым не бывает. */
test('reviews: the home block stands after the shelves and says what the reviews are', async () => {
  const order = RECIPE.map(([slot]) => slot)
  assert.ok(order.indexOf('reviews') === order.indexOf('featured') + 1, 'отзывы — сразу за полками')
  assert.ok(order.indexOf('posts') === order.indexOf('faq') - 1, 'статьи — перед справкой')
  for (const lang of LANGS) {
    const home = await sampleContent.page(lang, 'home')
    assert.ok(home.ok)
    const b = home.value.blocks.find((x) => x.type === 'reviews')
    assert.ok(b?.type === 'reviews' && b.title.trim() && b.lede?.trim(), `${lang}: у ряда отзывов заголовок и описание`)
  }
  /* Разметки отзывов на главной нет: звёзды для поиска — только у товара. */
  assert.doesNotMatch(read('components/blocks/Reviews.tsx') + read('components/ReviewCard.tsx'), /JsonLd|aggregateRating|"@type": "Review"/)
})

test('reviews: every sample review names a real sample product or none', async () => {
  const ids = new Set((RAW as { product: string | null }[]).map((x) => x.product).filter(Boolean))
  const r = await sampleContent.reviews('ro')
  assert.ok(r.ok)
  assert.equal(r.value.filter((x) => x.product).length, ids.size, 'у каждого названного товара есть имя и адрес')
})

/* Лента блога — первые `limit` того же списка, что страница блога (И729). */
test('posts: the home rail takes the newest posts of the one list, no more than the limit', async () => {
  for (const lang of LANGS) {
    const r = await sampleContent.posts(lang)
    assert.ok(r.ok)
    assert.deepEqual(latestPosts(r.value, 2).map((p) => p.slug), r.value.slice(0, 2).map((p) => p.slug))
    assert.equal(latestPosts(r.value).length, Math.min(4, r.value.length))
    for (const p of r.value) assert.ok(p.image, `${lang}/${p.slug}: у статьи образца есть снимок`)
    const card = postCard(lang, r.value[0])
    assert.equal(card.href, `/${lang}/blog/${r.value[0].slug}`)
  }
  assert.equal(latestPosts([], 4).length, 0)
  assert.match(read('components/blocks/Posts.tsx'), /if \(!posts\.length\) return null/)
})

/* Дата — один писатель, порядок рынка (И729). */
test('dates: one writer, in the market order', () => {
  assert.equal(dayOf('ro', '2026-09-20'), '20 septembrie 2026')
  assert.equal(dayOf('en', '2026-09-20'), '20 September 2026')
  assert.equal(dayOf('hu', '2026-09-20'), '2026. szeptember 20.')
  for (const page of ['app/[lang]/blog/page.tsx', 'app/[lang]/blog/[slug]/page.tsx', 'lib/product-view.ts', 'lib/review-view.ts', 'lib/post-view.ts']) {
    assert.doesNotMatch(read(page), /DateTimeFormat/, `${page}: дату пишет dayOf`)
  }
})
