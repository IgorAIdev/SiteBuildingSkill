import type { Lang } from '@/lib/locale.ts'
import type { Block } from '@/lib/source/contract.ts'
import { content, source } from '@/lib/source/index.ts'
import { Hero } from '@/components/blocks/Hero.tsx'
import { MinimalHero } from '@/components/blocks/MinimalHero.tsx'
import { HOMES } from '@/lib/homes.ts'
import type { BlockCtx } from '@/components/blocks/types.ts'
import { Part, Worn } from './parts.tsx'
import s from './design.module.css'
import { lookNow } from '@/lib/look.ts'
import { shelfCard } from '@/lib/view.ts'

/* Home → Hero Block: варианты героя главной — настоящий блок сайта на
   словах и снимке главной (слово заказчика 01.10.2026: «в дизайн-системе
   делаем страницу Hero Block, где будем размещать варианты этого
   хероблока»). Вариантов два: снимок и кнопки всех категорий со знаком
   товара, все одного роста (И673, И683), и минимальный второй витрины —
   один товар, громкая кнопка и категории словами (`MinimalHero`, главная
   «minimal»); новый вариант встаёт сюда строкой. Герою из контекста
   нужны только язык и полки — остальное у главной, не у него. */
export async function HeroBlock({ lang }: { lang: Lang }) {
  const [page, cols, look] = await Promise.all([content().page(lang, 'home'), source().collections(lang), lookNow()])
  const hero = page.ok ? page.value.blocks.find((b): b is Extract<Block, { type: 'hero' }> => b.type === 'hero') : undefined
  if (!hero) return null
  const ids = page.ok ? page.value.blocks.flatMap((b) => b.type === 'featured' ? b.ids : []) : []
  const cards = await source().cards(lang, ids)
  const first = cards.ok ? ids.map((id) => cards.value.find((c) => c.id === id)).find(Boolean) : null
  const spotlight = first ? shelfCard(lang, first) : null
  const ctx = { lang, home: look.home, spotlight, collections: cols.ok ? cols.value : [] } as unknown as BlockCtx
  return (
    <Part title="Hero Block" lede="Первый экран главной: один снимок, заголовок, абзац, под ними кнопка «В магазин» и кнопки главных категорий того же роста — «Кнопки категорий» из «Кнопок», кружок со знаком товара. Кнопки стоят в колонке текста и переносятся в ней, вправо за текст не выходят. Слова и снимок — данные главной; какие категории стоят кнопками — тоже данные главной.">
      {/* Оба вида героя, один под другим (страница целиком рядом не встанет): обычный —
          при любой одежде плиток, минимальный — у главной «minimal» (вторая витрина). */}
      <div className={s.group}>
        <h3>Снимок и кнопки категорий <Worn on={look.home !== 'minimal'} /></h3>
        <Hero block={hero} ctx={{ ...ctx, home: look.home === 'minimal' ? HOMES[0] : look.home }} place={{ air: null }} />
      </div>
      <div className={s.group}>
        <h3>Минимальный: один товар и категории словами <Worn on={look.home === 'minimal'} /></h3>
        <MinimalHero block={hero} ctx={{ ...ctx, home: 'minimal' }} />
      </div>
    </Part>
  )
}
