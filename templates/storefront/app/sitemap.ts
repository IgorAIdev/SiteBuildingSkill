import type { MetadataRoute } from 'next'
import { LOCALES, DEFAULT_LANG } from '@/lib/locale.ts'
import { hrefFor } from '@/lib/href.ts'
import { absolute } from '@/lib/seo.ts'
import { source, content } from '@/lib/source/index.ts'

/* Обещанное — каждая страница для поиска на всех языках, из того же
   источника, что и сами страницы (check:urls сверяет в обе стороны).
   Источник не ответил — карта не пишется пустой: это была бы ложь. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cols, effects, ids, docs, posts] = await Promise.all([source().collections(DEFAULT_LANG), source().effects(DEFAULT_LANG), source().productIds(), content().docs(DEFAULT_LANG), content().posts(DEFAULT_LANG)])
  if (!cols.ok || !effects.ok || !ids.ok || !docs.ok || !posts.ok) throw new Error('sitemap: источник не ответил — карта не пишется пустой')
  const paths = LOCALES.flatMap((lang) => [
    hrefFor(lang, { home: true }),
    hrefFor(lang, { catalog: true }),
  ]
    .concat(cols.value.map((c) => hrefFor(lang, { category: c.slug })))
    .concat(effects.value.map((e) => hrefFor(lang, { effect: e.code })))
    .concat(ids.value.map((id) => hrefFor(lang, { product: id })))
    .concat(docs.value.map((d) => hrefFor(lang, { doc: d.slug })))
    .concat(posts.value.length ? [hrefFor(lang, { blog: true }), ...posts.value.map((x) => hrefFor(lang, { post: x.slug }))] : []))
  return paths.map((path) => ({ url: absolute(path) }))
}
