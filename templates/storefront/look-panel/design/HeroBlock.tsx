import type { Lang } from '@/lib/locale.ts'
import type { Block } from '@/lib/source/contract.ts'
import { content, source } from '@/lib/source/index.ts'
import { Hero } from '@/components/blocks/Hero.tsx'
import type { BlockCtx } from '@/components/blocks/types.ts'
import { Part } from './parts.tsx'

/* Home → Hero Block: варианты героя главной — настоящий блок сайта на
   словах и снимке главной (слово заказчика 01.10.2026: «в дизайн-системе
   делаем страницу Hero Block, где будем размещать варианты этого
   хероблока»). Сейчас вариант один: снимок, «В магазин» и под ней
   кнопки главных категорий со знаком товара, все одного роста (И673,
   И683); новый вариант
   встаёт сюда строкой. Герою из контекста
   нужны только язык и полки — остальное у главной, не у него. */
export async function HeroBlock({ lang }: { lang: Lang }) {
  const [page, cols] = await Promise.all([content().page(lang, 'home'), source().collections(lang)])
  const hero = page.ok ? page.value.blocks.find((b): b is Extract<Block, { type: 'hero' }> => b.type === 'hero') : undefined
  if (!hero) return null
  const ctx = { lang, collections: cols.ok ? cols.value : [] } as unknown as BlockCtx
  return (
    <Part title="Hero Block" lede="Первый экран главной: один снимок, заголовок, абзац, под ними кнопка «В магазин» и кнопки главных категорий того же роста — «Кнопки категорий» из «Кнопок», кружок со знаком товара. Кнопки стоят в колонке текста и переносятся в ней, вправо за текст не выходят. Слова и снимок — данные главной; какие категории стоят кнопками — тоже данные главной.">
      <Hero block={hero} ctx={ctx} place={{ air: null }} />
    </Part>
  )
}
