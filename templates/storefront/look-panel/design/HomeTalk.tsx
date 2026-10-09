import p from '@/styles/primitives.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { Block, Review } from '@/lib/source/contract.ts'
import { content, source } from '@/lib/source/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { reviewView, type ReviewView } from '@/lib/review-view.ts'
import { postCard } from '@/lib/post-view.ts'
import { Reviews } from '@/components/blocks/Reviews.tsx'
import { Posts } from '@/components/blocks/Posts.tsx'
import { ReviewCard } from '@/components/ReviewCard.tsx'
import { PostCard } from '@/components/PostCard.tsx'
import { RailPager } from '@/components/RailPager.tsx'
import type { BlockCtx } from '@/components/blocks/types.ts'
import { Part } from './parts.tsx'
import c from './cards.module.css'
import s from './home.module.css'

/* Главная → Отзывы и блог (И728, И729; слово заказчика 04.10.2026: «давай
   еще на главную блок отзывов — видеоотзывов и текст отзывов делай — и блок
   блога»). Показ, не выбор: настоящие блоки главной и их карточки — по одной
   на вариант, на одной ленте (карточки — лентой, разделы — столбиком; слово
   заказчика 30.09.2026). Варианты отметки рисует тот же вид, что сайт
   (`reviewView` с флагом настоящести), а не копия карточки. */
type Sample = { key: string; name: string; note: string; view: ReviewView }

export async function HomeTalk({ lang }: { lang: Lang }) {
  const [page, got, posts, top] = await Promise.all([
    content().page(lang, 'home'), content().reviews(lang), content().posts(lang), source().listing(lang, { facets: {}, sort: 'popular', page: null }),
  ])
  const blocks = page.ok ? page.value.blocks : []
  const reviewsBlock = blocks.find((b): b is Extract<Block, { type: 'reviews' }> => b.type === 'reviews')
  const postsBlock = blocks.find((b): b is Extract<Block, { type: 'posts' }> => b.type === 'posts')
  const reviews = got.ok ? got.value : []
  const list = posts.ok ? posts.value : []
  const ctx = { lang, reviews, posts: list } as unknown as BlockCtx
  /* Товар образца для ссылки карточки — товар полки магазина: на движке у
     отзывов образца ссылки на товар нет (lib/source/index.ts), а вариант
     «с товаром» показать нужно. */
  const item = top.ok ? top.value.items[0] : undefined
  const product = item ? { name: item.name, href: hrefFor(lang, { product: item.id }) } : null
  const withProduct = (r: Review): Review => ({ ...r, product: r.product ?? product })
  const video = reviews.find((r) => r.video?.src)
  const text = reviews.find((r) => !r.video && r.title)
  const plain = reviews.find((r) => !r.video && !r.title) ?? (text ? { ...text, title: undefined } : undefined)
  const samples: Sample[] = [
    video && { key: 'video', name: 'Видеоотзыв', note: 'Постер 2 : 3 и круг «пуск»: нажатие на постер открывает окно с роликом. Под постером — звёзды, цитата в две строки, имя, дата, товар.', view: reviewView(lang, withProduct(video)) },
    text && { key: 'sample', name: 'Текст — образец', note: 'Так стоит отзыв шаблона: на месте отметки — «Sample review», пока отзывы не настоящие (флаг REVIEWS_ARE_REAL).', view: reviewView(lang, withProduct(text)) },
    text && { key: 'verified', name: 'Текст — проверенный покупатель', note: 'Настоящий отзыв, привязанный к заказу: знак проверки и «Verified buyer».', view: reviewView(lang, withProduct({ ...text, verified: true }), true) },
    text && { key: 'open', name: 'Текст — без проверки', note: 'Настоящий отзыв без заказа: отметки нет.', view: reviewView(lang, withProduct({ ...text, verified: false }), true) },
    plain && { key: 'shop', name: 'Отзыв о магазине', note: 'Без заголовка и без товара: звёзды и цитата, ссылки на товар нет.', view: reviewView(lang, { ...plain, product: null }) },
  ].filter((x): x is Sample => Boolean(x))
  const first = list[0]
  return (
    <>
      {reviewsBlock ? (
        <Part title="Отзывы покупателей" lede="Настоящий блок главной: стоит после «Best sellers». Видео первыми, за ними текст, одной лентой; у каждой карточки кадр одной меры — ряд ровный. Отзывы приходят из источника магазина; нет отзывов — блока нет. Разметки отзывов на главной нет.">
          <div className={s.sample}><Reviews block={reviewsBlock} ctx={ctx} place={{ air: null }} /></div>
        </Part>
      ) : null}
      {samples.length ? (
        <Part title="Карточка отзыва" lede="Карточка одна на сайт — по одной на каждый вариант. Отметку у имени решает флаг настоящести, а не данные: образец никогда не пишет «Verified buyer»." tools={<RailPager rail="sys-reviews-rail" back={t(lang, 'rail.prev')} next={t(lang, 'rail.next')} />}>
          <ul id="sys-reviews-rail" className={`${p.rail} ${c.row}`} data-rail="goods">
            {samples.map((x) => (
              <li key={x.key} className={c.cell}>
                <p className={c.cellName}>{x.name}</p>
                <ReviewCard review={x.view} />
                <p className={p.note}>{x.note}</p>
              </li>
            ))}
          </ul>
        </Part>
      ) : null}
      {postsBlock ? (
        <Part title="Статьи блога" lede="Настоящий блок главной: стоит перед вопросами. Последние статьи из того же списка, что страница блога; «View all» ведёт на блог. Карточка — одна ссылка: снимок, дата, заголовок, строка о статье.">
          <div className={s.sample}><Posts block={postsBlock} ctx={ctx} place={{ air: null }} /></div>
        </Part>
      ) : null}
      {first ? (
        <Part title="Карточка статьи" lede="Со снимком и без него: статья без снимка стоит с пустым кадром той же меры, ряд не скачет.">
          <ul className={`${p.rail} ${c.row}`} data-rail="goods">
            <li className={c.cell}><p className={c.cellName}>Со снимком</p><PostCard post={postCard(lang, first)} /></li>
            <li className={c.cell}><p className={c.cellName}>Без снимка</p><PostCard post={postCard(lang, { ...first, image: null })} /></li>
          </ul>
        </Part>
      ) : null}
    </>
  )
}
