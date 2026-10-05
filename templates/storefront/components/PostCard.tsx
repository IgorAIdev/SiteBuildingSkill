import p from '@/styles/primitives.module.css'
import s from './PostCard.module.css'
import type { PostCardView } from '@/lib/post-view.ts'
import { shot } from '@/lib/shot.ts'

/* Карточка статьи — одна на сайт (И729): лента блога главной, список блога и
   рубрики, «Citește mai departe», образцы дизайн-системы. Устройство — по
   образцу HyperUI «Blog Cards: bordered with image, date, title and excerpt»
   (MIT, Mark Mead): снимок, дата, заголовок, строка о статье; взято устройство,
   не код. Кромки у карточки нет: у Gymshark и Allbirds лента статей — снимок и
   слова на полу страницы (замер 04.10.2026). Строка данных — «дата · N мин ·
   рубрика» (И749, блог cbdshop.bg).

   Ссылка одна — заголовок; её область растянута на всю карточку, как у
   карточки товара: снимок не вторая ссылка. Статья без снимка стоит с пустым
   кадром той же меры — ряд не скачет.

   `wide` — закреплённая статья списка («Începe de aici», cbdshop.bg): снимок и
   слова рядом (примитив `switcher`), над заголовком — ярлык.

   `level` — ступень заголовка по месту: под заголовком раздела (лента главной,
   «Citește mai departe») — третья; в списке блога над карточками только имя
   страницы — вторая, иначе лестница для чтения вслух прыгает с h1 на h3
   (check:craft, heads). Вид от ступени не зависит — его даёт класс. */
export function PostCard({ post, wide = false, label, level = 3 }: { post: PostCardView; wide?: boolean; label?: string; level?: 2 | 3 }) {
  const Title = level === 2 ? 'h2' : 'h3'
  return (
    <article className={wide ? `${p.switcher} ${s.wide}` : s.card}>
      <div className={`${p.frame} ${s.shot}`}>{post.image ? <img {...shot(post.image, 'shelf', true)} alt="" decoding="async" /> : null}</div>
      <div className={s.text}>
        {label ? <p className={p.chip} data-pill>{label}</p> : null}
        <p className={`${p.note} ${s.meta}`}>{post.meta ?? <time dateTime={post.date.iso}>{post.date.text}</time>}</p>
        <Title className={s.title}><a className={s.link} href={post.href}>{post.title}</a></Title>
        <p className={s.summary}>{post.summary}</p>
      </div>
    </article>
  )
}
