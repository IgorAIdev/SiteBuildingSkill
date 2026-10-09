import p from '@/styles/primitives.module.css'
import s from './PostParts.module.css'
import type { Image } from '@/lib/source/contract.ts'
import type { PostHeadView } from '@/lib/post-view.ts'
import { shot } from '@/lib/shot.ts'

/* Части статьи блога (И749; бриф docs/design/блог.md, образец — cbdshop.bg).
   Документ (DocView) даёт колонку текста, оглавление и разделы; здесь — то,
   что у статьи своё. */

/** Шапка: рубрика ссылкой, имя, подзаголовок, автор и строка данных
 *  («Publicat la … · actualizat la … · N min de citit»). */
export function PostHead({ view }: { view: PostHeadView }) {
  const { topic, title, subtitle, author, meta } = view
  return (
    <>
      {topic ? <p className={`${p.note} ${s.topic}`}><a href={topic.href}>{topic.name}</a></p> : null}
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {author ? <p className={p.note}>{author.line} · {author.role}</p> : null}
      <p className={p.note}>{meta}</p>
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
          <p className={p.chip} data-pill>{tldrLabel}</p>
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
        <section className={p.stack} aria-labelledby="post-sources">
          <h2 id="post-sources" className={s.heading}>{title}</h2>
          <ol className={s.sources}>
            {sources.map((x, i) => <li key={x.url} id={`source-${i + 1}`}><a href={x.url} rel="noopener">{x.title}</a></li>)}
          </ol>
        </section>
      ) : null}
      <aside className={s.important} aria-label={important}>
        <p><strong>{important}.</strong> {disclaimer}</p>
      </aside>
    </>
  )
}
