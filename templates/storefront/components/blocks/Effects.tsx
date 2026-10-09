import p from '@/styles/primitives.module.css'
import type { Block } from '@/lib/source/contract.ts'
import { RailHead } from '../RailHead.tsx'
import { Doors, effectDoors } from './Doors.tsx'
import type { BlockCtx, Place } from './types.ts'

type Props = { block: Extract<Block, { type: 'effects' }>; ctx: BlockCtx; place: Place }

/* Эффекты — тем же рядом дверей, что полки (слово заказчика 03.10.2026:
   «ниже делай такой же блок только эффекты»): одежда та же (`home`), шапка
   та же. Дверь ведёт на страницу эффекта, а не к галочке фильтра (shop,
   catalog.md: «Признак, вынесенный в навигацию, обязан быть страницей»).
   Выхода «View all» у ряда нет: страницы «все эффекты» не будет (слово
   заказчика 03.10.2026, catalog.md: «Выход ряда — тоже обещание страницы»);
   кнопки листания стоят у правого края ряда.
   Эффектов нет в данных — блока нет.
   Тонкая строка пилюль вместо плиток сравнивалась 03.10.2026 и снята словом
   заказчика («прежние плитки», docs/design/home.md §8): ряд остаётся плитками. */
export function Effects({ block, ctx, place }: Props) {
  if (!ctx.effects.length) return null
  return (
    <section className={`${p.wrap} ${p.section}`} data-air={place.air ?? undefined} aria-labelledby="effects">
      <RailHead id="effects" title={block.title} lede={block.lede} all={null} lang={ctx.lang} />
      <Doors id="effects-rail" home={ctx.home} doors={effectDoors(ctx.lang, ctx.effects)} />
    </section>
  )
}
