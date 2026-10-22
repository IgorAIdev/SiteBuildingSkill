import p from '@/styles/primitives.module.css'
import s from './PostParts.module.css'
import type { Image } from '@/lib/source/contract.ts'
import type { PostHeadView } from '@/lib/post-view.ts'
import { shot } from '@/lib/shot.ts'
import { SiteLink } from './SiteLink.tsx'

/* Части статьи блога (И749; бриф docs/design/блог.md, образец — cbdshop.bg).
   Документ (DocView) даёт колонку текста, оглавление и разделы; здесь — то,
   что у статьи своё. */

/** Шапка: имя, подзаголовок и подпись — автор и строка данных («Published on … ·
 *  updated on … · N min read · рубрика»). Рубрика — ссылкой в конце строки данных,
 *  как у карточки списка, а не строкой над именем: над именем она стояла вплотную,
 *  её черта наезжала на заглавные, а сверху её отбивало поле строки сноски — от
 *  крошек 40 при 0 до имени (заказчик 22.10.2026: «что за пиздец в блоге»).
 *  Подпись — одна группа в две строки: автор и даты читаются вместе, а не двумя
 *  блоками через воздух строки. */
export function PostHead({ view }: { view: PostHeadView }) {
  const { topic, title, subtitle, author, meta } = view
  return (
    <>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {/* Подпись — две группы, как у Healthline, Ritual и cbdshop.bg: кто написал (имя
          голосом текста, роль под ним тихо) и строка данных (дата, время чтения, рубрика).
          Было — две строки сноски подряд, «свалено в кучу» (заказчик 22.10.2026). */}
      <div className={s.byline}>
        {author ? <span className={s.who}>{author.line}<span className={s.role}>{author.role}</span></span> : null}
        <span className={`${s.facts} ${p.prose}`}>{meta}{topic ? <> · <SiteLink className={s.topic} href={topic.href}>{topic.name}</SiteLink></> : null}</span>
      </div>
    </>
  )
}

/** Обложка с потолком высоты (правило 4: у cbdshop.bg 685 px без потолка, и
 *  «Коротко» начиналось на 1325) и «Pe scurt» — ответ первым (перевёрнутая
 *  пирамида, NN/g; Healthline «Key takeaways»). */
export function PostIntro({ image, tldr, tldrLabel }: { image: Image | null; tldr: string | null; tldrLabel: string }) {
  if (!image && !tldr) return null
  return (
    <div className={p.stack}>
      {image ? <div className={`${p.frame} ${s.cover}`}><img {...shot(image, 'wide')} alt={image.alt} fetchPriority="high" /></div> : null}
      {tldr ? (
        <aside className={s.tldr} aria-label={tldrLabel}>
          <p className={s.tldrHead}>{tldrLabel}</p>
          <p>{tldr}</p>
        </aside>
      ) : null}
    </div>
  )
}

/** Источники нумерованным списком — первоисточники наружу (cbdshop.bg,
 *  Healthline; GEO — Aggarwal и др., KDD 2024), и оговорка «Important» — одна
 *  на все статьи, из словаря. */
export function PostSources({ title, sources, important, disclaimer }: { title: string; sources: { title: string; url: string }[]; important: string; disclaimer: string }) {
  return (
    <>
      {sources.length ? (
        <section className={s.sourcesPart} aria-labelledby="post-sources">
          <h2 id="post-sources" className={s.heading}>{title}</h2>
          <ol className={s.sources}>
            {sources.map((x, i) => <li key={x.url} id={`source-${i + 1}`}><SiteLink href={x.url} rel="noopener">{x.title}</SiteLink></li>)}
          </ol>
        </section>
      ) : null}
      <aside className={s.important} aria-label={important}>
        <p><strong>{important}.</strong> {disclaimer}</p>
      </aside>
    </>
  )
}
