/* look-home:minimal:file */
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import s from './blocks.module.css'
import type { Block } from '@/lib/source/contract.ts'
import type { BlockCtx } from './types.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { shot } from '@/lib/shot.ts'
import { heroShelves } from '@/lib/hero-shelves.ts'
import { Icon } from '../Icon.tsx'

/** Optional editorial home. Product, price and image come from one shelf item. */
export function MinimalHero({ block, ctx }: { block: Extract<Block, { type: 'hero' }>; ctx: BlockCtx }) {
  const product = ctx.spotlight
  const image = product?.image ?? block.image
  const shelves = heroShelves(block.shelves, ctx.collections)
  return (
    <section className={`${p.wrap} ${p.lede} ${s.minimalHero}`} data-scene="hero">
      <div className={`${p.ledeText} ${s.minimalText}`}>
        <div className={`${p.stack} ${s.heroWords}`}><h1>{block.title}</h1><p>{block.lede}</p></div>
        <a className={b.btn} data-voice="loud" href={hrefFor(ctx.lang, { catalog: true })}>{t(ctx.lang, 'nav.shopAll')}<Icon id="arrow-right" /></a>
        <nav aria-label={t(ctx.lang, 'nav.categories')}>
          <ul className={`${p.cluster} ${s.minimalShelves}`}>
            {shelves.map((c) => <li key={c.slug}><a className={go.go} href={hrefFor(ctx.lang, { category: c.slug })}>{c.name}</a></li>)}
          </ul>
        </nav>
      </div>
      <div className={`${p.stack} ${s.minimalProduct}`}>
        <div className={`${p.frame} ${s.minimalShot}`}><img {...shot(image, 'stage')} alt={product?.name ?? image.alt} fetchPriority="high" /></div>
        {product ? <a className={`${go.go} ${s.minimalCaption}`} href={product.href}><span>{product.name}</span><span>{product.price}</span><Icon id="arrow-right" className={go.to} /></a> : null}
      </div>
    </section>
  )
}
