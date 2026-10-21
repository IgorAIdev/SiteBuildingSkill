import p from '@/styles/primitives.module.css'
import s from './BlogIndex.module.css'
import type { BlogIndexView } from '@/lib/post-view.ts'
import { PostCard } from './PostCard.tsx'
import { SiteLink } from './SiteLink.tsx'

/* Список блога и страница рубрики — одна разметка (И749; бриф
   docs/design/блог.md, образец — блог cbdshop.bg): шапка страницы (имя,
   вводная, «N articole · actualizat la …»), рубрики ссылками — у каждой свой
   адрес; вид — строка слов, как ряд полок шапки: тихое слово, текущее —
   полное и подчёркнутое (BlogIndex.module.css, `topics`), кеглем тела
   (check:design navSmall), —
   закреплённая «Începe de aici»
   во всю ширину, затем сетка карточек. Колонок — сколько влезет
   (`grid`, auto-fit: правило 5). */
export function BlogIndex({ view, label }: { view: BlogIndexView; label: string }) {
  return (
    <div className={p.stack}>
      <div className={p.pagehead}>
        <h1>{view.title}</h1>
        <p>{view.lede}</p>
        <p className={p.note}>{view.count}</p>
      </div>
      <nav aria-label={label}>
        <ul className={`${p.cluster} ${s.topics}`}>
          {view.topics.map((x) => <li key={x.href}><SiteLink href={x.href} aria-current={x.current ? 'page' : undefined}>{x.label}</SiteLink></li>)}
        </ul>
      </nav>
      <ul className={`${p.grid} ${s.grid}`}>
        {view.featured ? <li className={s.lead}><PostCard post={view.featured} wide label={view.startHere} level={2} /></li> : null}
        {view.cards.map((c) => <li key={c.slug}><PostCard post={c} list level={2} /></li>)}
      </ul>
    </div>
  )
}
