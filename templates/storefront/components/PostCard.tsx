import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './PostCard.module.css'
import rh from './RailHead.module.css'
import type { PostCardView } from '@/lib/post-view.ts'
import { shot } from '@/lib/shot.ts'
import { SiteLink } from './SiteLink.tsx'
import { Icon } from './Icon.tsx'

/* Карточка статьи — одна на сайт (И729): лента блога главной, список блога и
   рубрики, «Citește mai departe», образцы дизайн-системы. Устройство — по
   образцу HyperUI «Blog Cards: bordered with image, date, title and excerpt»
   (MIT, Mark Mead): снимок, дата, заголовок, строка о статье; взято устройство,
   не код. Кромки у карточки нет: у Gymshark и Allbirds лента статей — снимок и
   слова на полу страницы (замер 04.10.2026). Строка данных — «N мин · рубрика»
   (И749, блог cbdshop.bg; дата — в самой статье, 22.10.2026).

   Ссылка одна — заголовок; её область растянута на всю карточку, как у
   карточки товара: снимок не вторая ссылка. Статья без снимка стоит с пустым
   кадром той же меры — ряд не скачет.

   `list` — карточка списка блога и рубрики, а не ряда главной: там она стоит
   не рядом с товаром, и снимок — обложка статьи в миниатюре (пропорция
   обложки, как у cbdshop.bg 343 : 200 и cbdin.bg 365 × 205), заголовок —
   ступенью подзаголовка, а не имени товара (заказчик 21.10.2026: «дизайн в
   блоге плох» — квадрат 369 и заголовок 16 читались полкой товара).

   `level` — ступень заголовка по месту: под заголовком раздела (лента главной,
   «Citește mai departe») — третья; в списке блога над карточками только имя
   страницы — вторая, иначе лестница для чтения вслух прыгает с h1 на h3
   (check:craft, heads). Вид от ступени не зависит — его даёт класс. */
export function PostCard({ post, list = false, level = 3 }: { post: PostCardView; list?: boolean; level?: 2 | 3 }) {
  const Title = level === 2 ? 'h2' : 'h3'
  return (
    <article className={s.card} data-place={list ? 'list' : undefined}>
      <div className={`${p.frame} ${s.shot}`}>{post.image ? <img {...shot(post.image, 'shelf', true)} alt="" decoding="async" /> : null}</div>
      <div className={s.text}>
        {list ? null : <p className={`${p.note} ${s.meta}`}>{post.meta ?? <time dateTime={post.date.iso}>{post.date.text}</time>}</p>}
        <Title className={s.title}><SiteLink className={s.link} href={post.href}>{post.title}</SiteLink></Title>
        <p className={s.summary}>{post.summary}</p>
        {/* Низ карточки списка: строка данных слева, «Read the article ↗» справа — тем же
            контролом, что «View all» шапки ряда (RailHead): вид «слово» с ответом пункта
            меню (btn.module.css, `data-hand="menu"`: тихое → полное под рукой и при нажатии,
            без движения), строй и знак — `.all` шапки ряда. Заказчик 22.10.2026: «может
            кнопку читать сделать со стрелкой перехода как у View all?», затем «откуда её
            дизайн наведение / нажатие?» — прежде слово было собрано здесь своим: марочная
            краска под рукой карточки и сдвиг стрелки, которых у «View all» нет. Ссылка —
            на ту же статью и поверх растянутой ссылки заголовка (`tap` — точка отсчёта),
            но без остановки табом и чтения вслух: ссылка карточки — заголовок. */}
        {list ? (
          <div className={s.foot} data-foot="">
            <p className={`${p.note} ${s.meta}`}>{post.meta ?? <time dateTime={post.date.iso}>{post.date.text}</time>}</p>
            <SiteLink className={`${b.word} ${p.tap} ${rh.all} ${s.read}`} data-hand="menu" href={post.href} tabIndex={-1} aria-hidden="true">{post.read}<Icon id="arrow-up-right" /></SiteLink>
          </div>
        ) : null}
      </div>
    </article>
  )
}
