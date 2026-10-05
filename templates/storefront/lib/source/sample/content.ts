import type { Lang } from '../../locale.ts'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Content, Doc, Post, PostTopic, Review } from '../contract.ts'
import type { Form } from '../details.ts'
import { PAGES } from '../../pages.ts'
import { PRODUCTS } from '../../products.ts'
import { hrefFor } from '../../href.ts'
import { shelfShot } from './shelf-shots.ts'
import { clipOf, isClip } from './review-clips.ts'
import DOCS from '../../docs.json' with { type: 'json' }
import BLOG from '../../blog.json' with { type: 'json' }
import BLOG_META from '../../blog-meta.json' with { type: 'json' }
import REVIEWS from '../../reviews.json' with { type: 'json' }

type L = Record<Lang, string>
type Ls = Record<Lang, string[]>
type RawSection = { id: string; heading: L; body: L; list?: Ls; table?: { head: Ls; rows: Record<Lang, string[][]> }; note?: L; form?: 'withdrawal' }
type RawDoc = { slug: string; updated?: string; title: L; summary: L; sections: RawSection[]; faq?: { q: L; a: L }[]; table?: 'delivery' }
const RAW = DOCS as RawDoc[]
/* `sampleShot` — снимок статьи образца: снимок полки образца по виду
   (shelf-shots.ts), имя поля говорит, что он образец (И729). Настоящий
   снимок статьи даёт Payload. */
type RawPost = {
  slug: string; date: string; updated?: string | null; topic?: string; featured?: boolean; sampleShot?: Form; shelf?: string | null
  title: L; subtitle?: L; summary: L; tldr?: L; sections: (Omit<RawSection, 'id' | 'form'> & { id?: string })[]; faq: { q: L; a: L }[]
  sources?: { title: string; url: string }[]
}
/* Рубрики и автор блога (И749) — данные магазина рядом со статьями. */
type RawMeta = { topics: { slug: string; name: L; description: L }[]; author: { name: L; role: L; bio: L } }
const META = BLOG_META as RawMeta
const topicOf = (slug: string | undefined, lang: Lang): PostTopic | null => {
  const x = META.topics.find((t) => t.slug === slug)
  return x ? { slug: x.slug, name: x.name[lang], description: x.description[lang] } : null
}
const sectionOf = (s: RawPost['sections'][number], lang: Lang) => ({
  ...(s.id ? { id: s.id } : {}), heading: s.heading[lang], body: s.body[lang],
  ...(s.list ? { list: s.list[lang] } : {}),
  ...(s.table ? { table: { head: s.table.head[lang], rows: s.table.rows[lang] } } : {}),
  ...(s.note ? { note: s.note[lang] } : {}),
})
/* Новые первыми: дата ISO сравнивается строкой. */
const POSTS = (BLOG as RawPost[]).toSorted((a, b) => b.date.localeCompare(a.date))
const postOf = (p: RawPost, lang: Lang): Post => ({
  slug: p.slug, date: p.date, updated: p.updated ?? null, title: p.title[lang], subtitle: p.subtitle?.[lang] ?? null,
  summary: p.summary[lang], tldr: p.tldr?.[lang] ?? null, topic: topicOf(p.topic, lang), featured: Boolean(p.featured),
  image: p.sampleShot ? shelfShot(p.sampleShot, p.title[lang]) : null,
  author: { name: META.author.name[lang], role: META.author.role[lang], bio: META.author.bio[lang] },
  sections: p.sections.map((s) => sectionOf(s, lang)),
  faq: p.faq.map((f) => ({ q: f.q[lang], a: f.a[lang] })),
  sources: p.sources ?? [], shelf: p.shelf ?? null,
})
/* Отзывы образца (И728): товар — адресом товара образца, имя — его имя на
   языке страницы; `clip` — ролик образца (review-clips.ts). Новые первыми. */
type RawReview = { id: string; product: string | null; rating: number; author: string; date: string; verified: boolean; clip?: string; title?: L; body: L }
const REVIEWED = (REVIEWS as RawReview[]).toSorted((a, b) => b.date.localeCompare(a.date))
const reviewOf = (r: RawReview, lang: Lang): Review => {
  const item = r.product ? PRODUCTS.find((x) => x.id === r.product) : undefined
  return {
    id: r.id, rating: r.rating, author: r.author, date: r.date, verified: r.verified, body: r.body[lang],
    ...(r.title ? { title: r.title[lang] } : {}),
    product: item ? { name: item.name[lang], href: hrefFor(lang, { product: item.id }) } : null,
    video: r.clip && isClip(r.clip) ? { ...clipOf(r.clip, item?.name[lang] ?? ''), captions: null } : null,
  }
}
/** Файл вида образца: опубликованный или черновик. */
const lookFile = (name: string) => join(process.cwd(), 'lib/source/sample', name)
const docOf = (d: RawDoc, lang: Lang): Doc => ({
  slug: d.slug, title: d.title[lang], summary: d.summary[lang], updated: d.updated ?? null,
  sections: d.sections.map((s) => ({
    id: s.id, heading: s.heading[lang], body: s.body[lang],
    ...(s.list ? { list: s.list[lang] } : {}),
    ...(s.table ? { table: { head: s.table.head[lang], rows: s.table.rows[lang] } } : {}),
    ...(s.note ? { note: s.note[lang] } : {}),
    ...(s.form ? { form: s.form } : {}),
  })),
  faq: (d.faq ?? []).map((f) => ({ q: f.q[lang], a: f.a[lang] })),
  table: d.table ?? null,
})

export const sampleContent: Content = {
  async page(lang, slug) {
    const p = PAGES[slug]
    return p ? { ok: true, value: { slug, title: p.title[lang], description: p.description[lang], blocks: p.blocks[lang] } } : { ok: false, reason: 'not-found' }
  },
  async docs(lang) {
    return { ok: true, value: RAW.map((d) => docOf(d, lang)) }
  },
  async posts(lang) {
    return { ok: true, value: POSTS.map((p) => postOf(p, lang)) }
  },
  async topics(lang) {
    return { ok: true, value: META.topics.map((x) => ({ slug: x.slug, name: x.name[lang], description: x.description[lang] })) }
  },
  async post(lang, slug) {
    const p = POSTS.find((x) => x.slug === slug)
    return p ? { ok: true, value: postOf(p, lang) } : { ok: false, reason: 'not-found' }
  },
  async reviews(lang) {
    return { ok: true, value: REVIEWED.map((r) => reviewOf(r, lang)) }
  },
  async doc(lang, slug) {
    const d = RAW.find((x) => x.slug === slug)
    return d ? { ok: true, value: docOf(d, lang) } : { ok: false, reason: 'not-found' }
  },
  /* Срок возврата образца — законный минимум ЕС, 14 дней. Настоящий срок
     назначает магазин (страница «Retur» — его текст); число здесь и число в
     его условиях обязаны совпасть — docs/open.md. */
  async facts() {
    return { ok: true, value: { returnDays: 14, freeDeliveryFrom: { minor: 10000, currency: 'EUR' } } }
  },
  /* Вид читается с диска при каждом промахе кэша, а не ввозится в сборку:
     правка look.json и запрос на /api/revalidate меняют вид живого сайта
     без сборки — так же придёт global «look» из Payload. Черновик — файл
     рядом (look.draft.json), как черновая версия global у Payload; его нет —
     черновой режим видит опубликованное. */
  async look(options) {
    const file = options?.draft && existsSync(lookFile('look.draft.json')) ? 'look.draft.json' : 'look.json'
    try {
      return { ok: true, value: JSON.parse(readFileSync(lookFile(file), 'utf8')) as unknown }
    } catch {
      return { ok: false, reason: 'unavailable' }
    }
  },
  /* Образец рассылки не ведёт: адрес принят, нигде не хранится. */
  async subscribe() {
    return { ok: true, value: null }
  },
}
