import p from '@/styles/primitives.module.css'
import s from './blocks.module.css'
import type { Block } from '@/lib/source/contract.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import type { BlockCtx, Place } from './types.ts'
import { shot } from '@/lib/shot.ts'
import { CategoryButton } from '../CategoryButton.tsx'
import { heroShelves } from '@/lib/hero-shelves.ts'
import { MinimalHero } from './MinimalHero.tsx' // look-home:minimal

type Props = { block: Extract<Block, { type: 'hero' }>; ctx: BlockCtx; place: Place }

/* Первый экран — светлая половина и снимок рядом (вариант C, слово заказчика
   04.10.2026: «беру вариант C»; И710; образец Allbirds): заголовок, абзац и ряд
   пути — на полу страницы чернилами страницы, снимок — кадром справа. Раскладка —
   примитив `lede` (текст и кадр рядом; ряду тесно — столбиком), кадр — `frame`.
   В разметке снимок первый: в столбике он стоит сверху — товар в первом окне
   телефона (И553), а на широком ряд развёрнут (blocks.module.css, `.hero`). До
   04.10.2026 — тёмная сцена во всю коробку и текст на вуали поверх снимка (И280,
   И697): «по цветам, по расположению мне не нравится». */
/* Один снимок, без слайдов. Слайдер (И493, самолистание И584) снят словом
   заказчика 01.10.2026: «слайдер отменяем, вырезал его, удаляй, делаем херо
   изображение»: второй и третий слайд почти никто не видит, а сам
   сменяющийся слайд уводит строку из-под глаз (замер Notre Dame, Baymard,
   NN/g). */
/* Под абзацем — ряд пути: «В магазин» и кнопки главных полок (слово заказчика
   03.10.2026: «херо блок синюю кнопку удаляй, вместо неё Shop большая кнопка, и
   ниже в левой части… кнопки основных категорий… другие категории не
   размещаем»; И673) одним рядом (И708); с 04.10.2026 — все полки, ряд переносится, а
   на телефоне едет вбок (примитив `rail`, вид `wrap`; И735). Первая — «Shop all», та же
   кнопка, что у полок: все кнопки ряда равные, весь каталог отличает слово (слово
   заказчика 04.10.2026; прежде «Shop» — заливкой марки, И697). Кнопки — «Кнопки категорий»
   вкладки «Кнопки» (CategoryButton): кружок со знаком товара. Какие полки —
   данные блока (`shelves`): `'all'` — все полки магазина в порядке каталога (И735;
   слово заказчика 04.10.2026: «размещай все категории кнопками»), лишнее
   переносится вторым рядом; полки нет у магазина — нет кнопки. */
export function Hero({ block, ctx }: Props) {
  const shelves = heroShelves(block.shelves, ctx.collections)
  /* look-home:minimal:start */
  if (ctx.home === 'minimal') return <MinimalHero block={block} ctx={ctx} />
  /* look-home:minimal:end */
  return (
    <section className={`${p.wrap} ${p.lede} ${s.hero}`}>
      <div className={`${p.frame} ${s.heroShot}`}>
        <img {...shot(block.image, 'wide')} alt={block.image.alt} fetchPriority="high" />
      </div>
      <div className={p.ledeText}>
        <div className={`${p.stack} ${s.heroWords}`}>
          <h1>{block.title}</h1>
          <p>{block.lede}</p>
        </div>
        <nav aria-label={t(ctx.lang, 'nav.categories')}>
          <ul className={`${p.rail} ${s.heroShelves}`} data-rail="wrap">
            <li><CategoryButton name={t(ctx.lang, 'nav.shopAll')} sign="shop-awning" href={hrefFor(ctx.lang, { catalog: true })} /></li>
            {shelves.map((c) => <li key={c.slug}><CategoryButton name={c.name} sign={c.sign} href={hrefFor(ctx.lang, { category: c.slug })} /></li>)}
          </ul>
        </nav>
      </div>
    </section>
  )
}
