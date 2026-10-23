import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './BlogIndex.module.css'
import type { BlogIndexView } from '@/lib/post-view.ts'
import { PostCard } from './PostCard.tsx'
import { SiteLink } from './SiteLink.tsx'

/* Список блога и страница рубрики — одна разметка (И749; бриф
   docs/design/блог.md, образец — блог cbdshop.bg): шапка страницы (имя,
   вводная, «N articole · actualizat la …»), рубрики ссылками — у каждой свой
   адрес; вид — строка слов, как ряд полок шапки: тихое слово, текущее —
   полное и подчёркнутое (BlogIndex.module.css, `topics`), кеглем тела
   (check:design navSmall); рубрики — часть шапки, шагом строки под счётом, а не
   отдельная полоса посередине между шапкой и сеткой (замер 22.10.2026: 55 от
   шапки и 44 до сетки — ничьи). Затем сетка карточек, закреплённая первой той же
   карточкой; колонок — сколько влезет (`grid`, auto-fit: правило 5). */
export function BlogIndex({ view, label }: { view: BlogIndexView; label: string }) {
  return (
    <div className={p.stack}>
      <div className={p.pagehead}>
        <h1>{view.title}</h1>
        <p>{view.lede}</p>
        <p className={p.note}>{view.count}</p>
        <nav aria-label={label} className={s.nav}>
          {/* Рубрики — полосой пути (`rail`, `data-rail="wrap"`): шире шва 560 переносятся, на
              телефоне — одна строка, листается вбок (слово заказчика 23.10.2026: «ссылки категории
              статей должны скролиться по горизонтали, а не строки занимать»). */}
          <ul className={`${p.rail} ${s.topics}`} data-rail="wrap">
            {view.topics.map((x) => <li key={x.href}><SiteLink className={`${b.word} ${p.tap}`} href={x.href} aria-current={x.current ? 'page' : undefined}>{x.label}</SiteLink></li>)}
          </ul>
        </nav>
      </div>
      <ul className={`${p.grid} ${s.grid}`}>
        {view.cards.map((c) => <li key={c.slug}><PostCard post={c} list level={2} /></li>)}
      </ul>
    </div>
  )
}
