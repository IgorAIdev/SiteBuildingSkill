import type { Lang } from '@/lib/locale.ts'
import type { Block } from '@/lib/source/contract.ts'
import { content, source } from '@/lib/source/index.ts'
import { Hero } from '@/components/blocks/Hero.tsx'
import type { BlockCtx } from '@/components/blocks/types.ts'
import { Part } from './parts.tsx'
import { lookNow } from '@/lib/look.ts'
import { shelfCard } from '@/lib/view.ts'

/* Home → Hero Block: варианты героя главной — настоящий блок сайта на
   словах и снимке главной (слово заказчика 01.10.2026: «в дизайн-системе
   делаем страницу Hero Block, где будем размещать варианты этого
   хероблока»). Сейчас вариант один: снимок, «В магазин» и под ней
   кнопки главных категорий со знаком товара, все одного роста (И673,
   И683); новый вариант
   встаёт сюда строкой. Герою из контекста
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
      <Hero block={hero} ctx={ctx} place={{ air: null }} />
    </Part>
  )
}
