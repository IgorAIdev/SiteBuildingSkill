import type { Block } from './source/contract.ts'

/* Главная (app/[lang]/page.tsx, components/blocks/*). Раскладка — одна:
   герой со снимком, полки, ходовые, слово магазина, справка (сцена,
   docs/design/home.md). Семь раскладок на выбор (И360) сняты словом
   заказчика 01.10.2026: «этот layout в панели и херо-блок меняет, вообще
   плохо, удаляй этот лейаут из панели» (И596).

   Вид называет полем `home` одежду дверей — плиток эффектов (Doors.tsx,
   Effects.tsx): разметка одна, меняется то, на чём стоит имя (и, у
   `caption`, строка описания под ним). Плиток
   категорий на главной нет: категории — кнопками на снимке героя (слово
   заказчика 03.10.2026, И673). Первая — умолчание: та, что стоит на сайте. */
// look-home:* Пока вид выбирается, в коде стоят все одежды. Когда выбран,
// look-home:* `npm run look:remove` удаляет строки и блоки с меткой одежд,
// look-home:* которых вид не носит, — здесь, в Doors.tsx и blocks.module.css.
export const HOMES = [
  'caption', // look-home:caption
  'button', // look-home:button
  'glass', // look-home:glass
  'frost', // look-home:frost
  'bar', // look-home:bar
  'mount', // look-home:mount
  'under', // look-home:under
  'outline', // look-home:outline
  'minimal', // look-home:minimal
] as const

export type HomeVariant = (typeof HOMES)[number]

/** Место на главной — блок данных по типу. */
export type Slot = Block['type']
/** Воздух над местом — роль примитива `section` (`data-air`): `head` —
 *  группа (место продолжает соседа сверху), `band` — полоса; нет — раздел. */
export type Air = 'head' | 'band'
export type Step = readonly [Slot, Air?]

/** Состав главной: порядок мест и воздух над каждым. Тип блока, которого
 *  рецепт не называет, не пропадает — встаёт в конец по порядку данных:
 *  блок владельца на витрине, пока владелец его не снял. */
/* Отзывы — сразу за полками товара (за «Best sellers», docs/open.md «Отзывы
   покупателей», И728), статьи блога — перед справкой (И729). */
export const RECIPE: readonly Step[] = [['hero'], ['effects'], ['featured'], ['reviews'], ['story'], ['posts'], ['faq']]

export type Placed = { slot: Slot; block: Block; air: Air | null; key: string }

/** Блоки страницы в порядке рецепта: блоков одного типа несколько — стоят
 *  подряд на месте типа, в порядке данных; тип вне рецепта — в конце.
 *  Чистая функция: вид не решает, ЧТО на странице, — только где. */
export function arrange(blocks: readonly Block[]): Placed[] {
  const out: Placed[] = []
  const named = new Set<Slot>(RECIPE.map(([slot]) => slot))
  RECIPE.forEach(([slot, air], at) => {
    blocks.filter((b) => b.type === slot).forEach((block, i) => out.push({ slot, block, air: air ?? null, key: `${at}-${slot}-${i}` }))
  })
  blocks.forEach((block, i) => { if (!named.has(block.type)) out.push({ slot: block.type, block, air: null, key: `x${i}-${block.type}` }) })
  return out
}
