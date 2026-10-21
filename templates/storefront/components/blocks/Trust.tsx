import p from '@/styles/primitives.module.css'
import s from './blocks.module.css'
import b from '@/styles/btn.module.css'
import { Icon } from '../Icon.tsx'
import type { Block } from '@/lib/source/contract.ts'
import { hrefFor } from '@/lib/href.ts'
import type { BlockCtx, Place } from './types.ts'
import { SiteLink } from '../SiteLink.tsx'

type Row = { key: string; icon: string; title: string; text?: string; href: string | null }

/* Ряд доказательств перед подвалом (docs/design/home.md, «Доверие — после
   товара»): лаборатория — словом блока, доставка и возврат — теми же фактами
   магазина, что у кнопки заказа (`ctx.pledges`, lib/pledges.ts), а не числом
   в слове: изменился порог — изменилась главная. Нет факта — нет строки; нет
   ни одной — блока нет. Заголовка на странице нет: это подпись под страницей, а
   не раздел, — имя ряда для чтеца с экрана несёт `aria-label`. Строка со
   страницей-доказательством — ссылка целиком. */
export function Trust({ block, ctx, place }: { block: Extract<Block, { type: 'trust' }>; ctx: BlockCtx; place: Place }) {
  const doc = (slug?: string) => (slug ? hrefFor(ctx.lang, { doc: slug }) : null)
  const rows: Row[] = [
    ...(block.lab ? [{ key: 'lab', icon: 'certificate', title: block.lab.title, text: block.lab.text, href: doc(block.lab.doc) }] : []),
    ...ctx.pledges.items.map((x, at) => ({ key: `pledge-${at}`, icon: x.icon, title: x.text, href: doc(x.icon === 'rotate-ccw' ? block.returnsDoc : block.deliveryDoc) })),
  ]
  if (!rows.length) return null
  return (
    <section className={`${p.wrap} ${p.section}`} data-air={place.air ?? undefined} aria-label={block.title || undefined}>
      <ul className={`${p.grid} ${s.trust}`}>
        {rows.map((row) => {
          const body = (
            <>
              <Icon id={row.icon} className={s.trustIcon} />
              <span className={s.trustCopy}>
                <span className={s.trustTitle}>{row.title}</span>
                {row.text ? <span className={s.trustText}>{row.text}</span> : null}
              </span>
            </>
          )
          return <li key={row.key}>{row.href ? <SiteLink className={`${b.row} ${s.trustRow}`} href={row.href}>{body}</SiteLink> : <span className={s.trustRow}>{body}</span>}</li>
        })}
      </ul>
    </section>
  )
}
