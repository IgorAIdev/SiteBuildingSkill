import p from '@/styles/primitives.module.css'
import type { Block } from '@/lib/source/contract.ts'
import { hrefFor } from '@/lib/href.ts'
import { latestPosts, postCard } from '@/lib/post-view.ts'
import { RailHead } from '../RailHead.tsx'
import { PostCard } from '../PostCard.tsx'
import type { BlockCtx, Place } from './types.ts'

/* Статьи блога — перед справкой (И729): последние из того же списка, что
   страница блога (`ctx.posts`, новые первыми), шапка ряда общая — с выходом
   «View all» на страницу блога, лента — рельса товаров. Статей нет — блока нет. */
export function Posts({ block, ctx, place }: { block: Extract<Block, { type: 'posts' }>; ctx: BlockCtx; place: Place }) {
  const posts = latestPosts(ctx.posts, block.limit)
  if (!posts.length) return null
  return (
    <section className={`${p.wrap} ${p.section}`} data-air={place.air ?? undefined} aria-labelledby="posts">
      <RailHead id="posts" title={block.title} lede={block.lede} all={hrefFor(ctx.lang, { blog: true })} lang={ctx.lang} />
      <ul id="posts-rail" className={p.rail} data-rail="goods">{posts.map((x) => <li key={x.slug}><PostCard post={postCard(ctx.lang, x)} /></li>)}</ul>
    </section>
  )
}
