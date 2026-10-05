import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './BlogIndex.module.css'
import type { BlogIndexView } from '@/lib/post-view.ts'
import { PostCard } from './PostCard.tsx'

/* Список блога и страница рубрики — одна разметка (И749; бриф
   docs/design/блог.md, образец — блог cbdshop.bg): шапка страницы (имя,
   вводная, «N articole · actualizat la …»), рубрики ссылками — у каждой свой
   адрес; вид — кнопка сайта кеглем тела (навигация не мельче тела, check:design
   navSmall), текущая — заливкой выбранного (`aria-current`, `--chosen`), —
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
        <ul className={p.cluster}>
          {view.topics.map((x) => <li key={x.href}><a className={b.btn} href={x.href} aria-current={x.current ? 'page' : undefined}>{x.label}</a></li>)}
        </ul>
      </nav>
      {view.featured ? <PostCard post={view.featured} wide label={view.startHere} level={2} /> : null}
      <ul className={`${p.grid} ${s.grid}`}>
        {view.cards.map((c) => <li key={c.slug}><PostCard post={c} level={2} /></li>)}
      </ul>
    </div>
  )
}
