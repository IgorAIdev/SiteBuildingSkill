import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './blocks.module.css'
import type { Block } from '@/lib/source/contract.ts'
import { faqLd } from '@/lib/ld.ts'
import { JsonLd } from '../JsonLd.tsx'
import { Turn } from '../Turn.tsx'
import type { BlockCtx, Place } from './types.ts'

/* Вопросы — тот же порядок, что у доставки над ними: заголовок слева,
   строки справа через волосок; в узкой коробке — столбиком (`sidebar`).
   Знак раскрытия поворачивается, ответ — в удобной мере строки. Одна
   FAQPage на страницу и ровно столько вопросов, сколько нарисовано
   (check:seo, faqPage) — разметка строится из тех же пунктов.
   Знак — в тихом круге; цвет разделу даёт полоса (на главной — тёмная
   палуба), а не сплошные точки марки на сером (слова заказчика 03.10.2026:
   «он просто серый весь», затем «кружочки синего на большой серой площади
   херово смотрится»; И690, И697, бриф docs/design/вопросы.md); первый вопрос
   открыт; строка под рукой — вид «строка» (`row`, И685). Раскрыт один: общее
   имя группы (`name`) — браузер закрывает прежний вопрос, когда открывают новый
   (слово заказчика 05.10.2026; И761); блок вопросов на странице один. */
export function Faq({ block, place }: { block: Extract<Block, { type: 'faq' }>; ctx?: BlockCtx; place: Place }) {
  return (
    <section className={`${p.wrap} ${p.section}`} data-air={place.air ?? undefined}>
      <div className={`${p.sidebar} ${s.split}`}>
        <div className={p.aside}><div className={p.sectionHead}><h2>{block.title}</h2></div></div>
        <div className={`${s.rows} ${s.splitBody}`}>
          {block.items.map((item, i) => (
            <details key={item.q} className={s.q} data-faq name="faq" open={i === 0}>
              <summary className={`${b.row} ${s.ask}`}>{item.q}<span className={s.askSign}><Turn /></span></summary>
              <p className={s.answer}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd data={faqLd(block.items)} />
    </section>
  )
}
