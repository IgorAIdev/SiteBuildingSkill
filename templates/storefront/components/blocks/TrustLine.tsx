import p from '@/styles/primitives.module.css'
import s from './blocks.module.css'
import type { Block } from '@/lib/source/contract.ts'
import type { BlockCtx } from './types.ts'
import type { SloganLine } from '@/lib/pledges.ts'
import { Icon } from '../Icon.tsx'

/** Слоганы блока `trust` строками: лаборатория — словом блока, доставка и возврат — фактами
 *  магазина (`ctx.slogans`, lib/pledges.ts `sloganLines`), а не числом в слове: изменился порог
 *  или срок — изменилась главная. Три, не два (слово владельца 15.10.2026: «два факта мало,
 *  обычно дают три»). Нет факта — нет слогана. */
export function trustRows(block: Extract<Block, { type: 'trust' }>, ctx: BlockCtx): SloganLine[] {
  return [...(block.lab ? [{ sign: 'flask' as const, text: block.lab.title }] : []), ...ctx.slogans]
}

/* Слоганы доверия — одна линия слов со знаками фирменной краски (слово владельца 21.10.2026: «всё
   таки тут иконки нужны… фирменного цвета»; 16.10.2026 знаки снимались) и без ссылок (17.10.2026: «это мотивационная вещь, а не ссылка»): текст, не
   орган — ни подложки под рукой, ни цели нажатия. Рядом, тесно — переносятся целиком (примитив
   `cluster`). Стоит в первом окне над рядом кнопок героя (слово владельца 15.10.2026: «выше
   кнопки магазина») и там, где рецепт ставит блок отдельным местом (Trust.tsx). Нет ни одного
   слогана — нет и ряда. */
export function TrustLine({ block, ctx }: { block: Extract<Block, { type: 'trust' }>; ctx: BlockCtx }) {
  const rows = trustRows(block, ctx)
  if (!rows.length) return null
  return (
    <ul className={`${p.cluster} ${s.trustLine}`} aria-label={block.title || undefined}>
      {rows.map((row) => <li key={row.text} className={s.trustTitle}><Icon id={row.sign} />{row.text}</li>)}
    </ul>
  )
}
