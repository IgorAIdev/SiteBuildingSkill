import type { Lang } from './locale.ts'
import type { Image, Post, PostTopic } from './source/contract.ts'
import { dayOf } from './format.ts'
import { hrefFor } from './href.ts'
import { t, tn } from './i18n/index.ts'
import { plainOf } from './doc-view.ts'

/** Статья, готовая к карточке (components/PostCard.tsx, И729): `meta` — строка
 *  «дата · N мин · рубрика» (И749, по блогу cbdshop.bg). */
export type PostCardView = {
  slug: string; title: string; summary: string; href: string; image: Image | null
  date: { iso: string; text: string }; meta: string | null; topic: string | null; featured: boolean
}

/** Сколько статей у ленты блога главной, если блок не назвал число. */
export const POSTS_LIMIT = 4

/** Последние статьи — первые `limit` из списка источника: он уже отдаёт
 *  новые первыми (`Content.posts`). Второго списка статей в коде нет. */
export const latestPosts = (posts: readonly Post[], limit: number = POSTS_LIMIT): Post[] => posts.slice(0, Math.max(0, limit))

/** Слов в минуту при чтении (И749): время чтения считается из текста, а не
 *  пишется руками — у cbdshop.bg 154 слова стояли «6 мин», 1031 — «7 мин».
 *  Medium берёт 265 для английского; румынские и венгерские слова длиннее. */
export const WORDS_PER_MINUTE = 220
const words = (s: string | null | undefined) => (s ? plainOf(s).split(/\s+/).filter(Boolean).length : 0)
export function readingMinutes(post: Pick<Post, 'tldr' | 'sections' | 'faq'>): number {
  const n = words(post.tldr)
    + post.sections.reduce((k, s) => k + words(s.heading) + words(s.body) + (s.list ?? []).reduce((m, x) => m + words(x), 0)
      + (s.table ? [...s.table.head, ...s.table.rows.flat()].reduce((m, x) => m + words(x), 0) : 0) + words(s.note), 0)
    + post.faq.reduce((k, f) => k + words(f.q) + words(f.a), 0)
  return Math.max(1, Math.ceil(n / WORDS_PER_MINUTE))
}

/** «Actualizat» — только когда правка позже публикации (у cbdshop.bg стояла и
 *  равная дата — шум). */
export const updatedOf = (post: Pick<Post, 'date' | 'updated'>): string | null => (post.updated && post.updated > post.date ? post.updated : null)

/** Шапка статьи (components/PostParts.tsx → PostHead): рубрика ссылкой, имя,
 *  подзаголовок, автор и строка данных «Publicat la … · actualizat la … · N min
 *  de citit». Одна на страницу статьи и дизайн-систему. */
export type PostHeadView = {
  topic: { href: string; name: string } | null; title: string; subtitle: string | null
  author: { line: string; role: string } | null; meta: string
}
export function postHeadView(lang: Lang, post: Post): PostHeadView {
  const updated = updatedOf(post)
  return {
    topic: post.topic ? { href: hrefFor(lang, { blogTopic: post.topic.slug }), name: post.topic.name } : null,
    title: post.title, subtitle: post.subtitle ?? post.summary,
    author: post.author ? { line: t(lang, 'blog.by', { name: post.author.name }), role: post.author.role } : null,
    meta: [t(lang, 'blog.published', { date: dayOf(lang, post.date) }), updated ? t(lang, 'blog.updated', { date: dayOf(lang, updated) }) : null, t(lang, 'blog.minutes', { n: readingMinutes(post) })].filter(Boolean).join(' · '),
  }
}

export const postCard = (lang: Lang, post: Post): PostCardView => {
  const date = { iso: post.date, text: dayOf(lang, post.date) }
  return {
    slug: post.slug, title: post.title, summary: post.subtitle ?? post.summary, image: post.image, featured: post.featured,
    href: hrefFor(lang, { post: post.slug }), date, topic: post.topic?.name ?? null,
    meta: [date.text, t(lang, 'blog.minutes', { n: readingMinutes(post) }), post.topic?.name].filter(Boolean).join(' · '),
  }
}

/** Список блога или рубрики: шапка со счётом и датой последней правки, рубрики
 *  ссылками (текущая отмечена), закреплённая «Începe de aici» первой — только на
 *  общем списке, остальное новыми первыми. */
export type BlogIndexView = {
  title: string; lede: string; count: string; topics: { href: string; label: string; current: boolean }[]
  featured: PostCardView | null; cards: PostCardView[]; startHere: string
}
export function blogIndexView(lang: Lang, posts: readonly Post[], topics: readonly PostTopic[], topic: PostTopic | null = null): BlogIndexView {
  const shown = topic ? posts.filter((p) => p.topic?.slug === topic.slug) : posts
  const featured = topic ? null : shown.find((p) => p.featured) ?? null
  const latest = shown.map((p) => updatedOf(p) ?? p.date).sort().at(-1)
  const used = topics.filter((x) => posts.some((p) => p.topic?.slug === x.slug))
  return {
    title: topic ? topic.name : t(lang, 'blog.title'),
    lede: topic ? topic.description : t(lang, 'blog.summary'),
    count: [tn(lang, 'blog.count', shown.length), latest ? t(lang, 'blog.latest', { date: dayOf(lang, latest) }) : null].filter(Boolean).join(' · '),
    topics: [
      { href: hrefFor(lang, { blog: true }), label: t(lang, 'blog.all'), current: !topic },
      ...used.map((x) => ({ href: hrefFor(lang, { blogTopic: x.slug }), label: x.name, current: x.slug === topic?.slug })),
    ],
    featured: featured ? postCard(lang, featured) : null,
    cards: shown.filter((p) => p !== featured).map((p) => postCard(lang, p)),
    startHere: t(lang, 'blog.startHere'),
  }
}

/** «Citește mai departe»: сначала та же рубрика, потом свежие — три. */
export function nextReads(post: Post, posts: readonly Post[], n = 3): Post[] {
  const others = posts.filter((p) => p.slug !== post.slug)
  const same = others.filter((p) => post.topic && p.topic?.slug === post.topic.slug)
  return [...same, ...others.filter((p) => !same.includes(p))].slice(0, n)
}
