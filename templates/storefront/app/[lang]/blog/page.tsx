import type { Metadata } from 'next'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { content } from '@/lib/source/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { blogIndexView } from '@/lib/post-view.ts'
import { BlogIndex } from '@/components/BlogIndex.tsx'
import { Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'blog.title'), description: t(lang, 'blog.summary'), path: (l) => hrefFor(l, { blog: true }) })
}

/* Блог — список статей (И749, бриф docs/design/блог.md; образец — cbdshop.bg):
   шапка со счётом, рубрики ссылками, «Începe de aici» первой, сетка карточек. */
export default async function BlogPage({ params }: Props) {
  const lang = await langOf(params)
  const [posts, topics] = await Promise.all([content().posts(lang), content().topics(lang)])
  if (!posts.ok || !topics.ok) return <Unavailable lang={lang} />
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <BlogIndex view={blogIndexView(lang, posts.value, topics.value)} label={t(lang, 'blog.topics')} />
    </main>
  )
}
