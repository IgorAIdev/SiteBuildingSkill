/* look-home:sport:file */
import p from '@/styles/primitives.module.css'
import s from './blocks.module.css'
import type { Block } from '@/lib/source/contract.ts'
import type { BlockCtx } from './types.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { heroShelves } from '@/lib/hero-shelves.ts'
import { CategoryPaths } from '../CategoryPaths.tsx'

/* Первый экран «Sport» (docs/design/четвёртая-витрина.md): плакат без снимка —
   узкий заголовок прописными, строка текста, путь в каталог; товар стоит сразу под ним
   (рецепт `sport`, lib/homes.ts), поэтому снимок героя не нужен: кадром первого
   окна служит сама полка. Раскладка — `stack`: заголовок, под ним ряд
   `sidebar` (слова слева, путь справа, ряду тесно — столбиком); путь — тот же ряд, что у обычного героя (кнопки полок,
   примитив `rail` вида `wrap`). */
export function SportHero({ block, ctx }: { block: Extract<Block, { type: 'hero' }>; ctx: BlockCtx }) {
  const shelves = heroShelves(block.shelves, ctx.collections)
  return (
    <section className={`${p.wrap} ${p.stack} ${s.heroSport}`} data-scene="hero">
      <h1>{block.title}</h1>
      <div className={`${p.sidebar} ${s.heroSportRow}`}>
        <p>{block.lede}</p>
        <nav className={p.aside} aria-label={t(ctx.lang, 'nav.categories')}>
          <CategoryPaths
            look={ctx.cat ?? 'dot'}
            all={{ label: t(ctx.lang, 'nav.shopAll'), sign: 'shop-awning', href: hrefFor(ctx.lang, { catalog: true }) }}
            shelves={shelves.map((c) => ({ label: c.name, sign: c.sign, href: hrefFor(ctx.lang, { category: c.slug }) }))}
            list={{ className: `${p.rail} ${s.heroShelves}`, rail: 'wrap' }}
            gridClass={`${p.stack} ${s.heroGrid}`}
          />
        </nav>
      </div>
    </section>
  )
}
