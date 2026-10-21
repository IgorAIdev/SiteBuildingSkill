import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { content } from '@/lib/source/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { breadcrumbLd } from '@/lib/ld.ts'
import { blogIndexView } from '@/lib/post-view.ts'
import { BlogIndex } from '@/components/BlogIndex.tsx'
import { Breadcrumbs, trailTo } from '@/components/Breadcrumbs.tsx'
import { JsonLd } from '@/components/JsonLd.tsx'
import { Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string; topic: string }> }


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  const { topic } = await params
  const r = await content().topics(lang)
  const x = r.ok ? r.value.find((y) => y.slug === topic) : undefined
  if (!x) return {}
  return toMetadata(lang, { title: `${x.name} — ${t(lang, 'blog.title')}`, description: x.description, path: (l) => hrefFor(l, { blogTopic: topic }) })
}

/* Рубрика блога — своя страница с адресом (И749): у cbdshop.bg рубрики были
   кнопками без адресов, и поиск их не видел. Рубрика без статей — 404. */
export default async function TopicPage({ params }: Props) {
  const lang = await langOf(params)
  const { topic } = await params
  const [posts, topics] = await Promise.all([content().posts(lang), content().topics(lang)])
  if (!posts.ok || !topics.ok) return <Unavailable lang={lang} />
  const x = topics.value.find((y) => y.slug === topic)
  if (!x || !posts.value.some((post) => post.topic?.slug === topic)) notFound()
  const home = { name: t(lang, 'crumb.home'), href: hrefFor(lang, { home: true }) }
  const blog = { name: t(lang, 'blog.title'), href: hrefFor(lang, { blog: true }) }
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <JsonLd data={breadcrumbLd([home, blog, { name: x.name, href: hrefFor(lang, { blogTopic: topic }) }])} />
      <Breadcrumbs trail={trailTo([home, blog], x.name)} label={t(lang, 'crumb.label')} />
      <BlogIndex view={blogIndexView(lang, posts.value, topics.value, x)} label={t(lang, 'blog.topics')} />
    </main>
  )
}
