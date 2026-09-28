import p from '@/styles/primitives.module.css'
import s from './ProductDetails.module.css'
import b from './blocks/blocks.module.css'
import type { DetailsView } from '@/lib/product-view.ts'
import { LabReport } from './LabReport.tsx'
import { Turn } from './Turn.tsx'

/* Разделы о товаре — под колонкой покупки (И466; слово заказчика
   27.09.2026: «ниже горизонтальное меню с пунктами Описание, Состав, Как
   пользоваться, COA — посмотри, что принято в индустрии»).

   Принято — меню и разделы подряд, а не вкладки, прячущие текст: Baymard
   («Product Page UX»: горизонтальные вкладки на карте товара — треть людей
   не находит содержимого скрытых вкладок; рекомендация — одна длинная
   страница). Строки меню-якорей над разделами нет (слово заказчика
   28.09.2026: «горизонтальное меню убирай»): каждый раздел виден и так,
   поиском и чтецом. Протокол партии — тот же плоский LabReport, что у
   главной. Разделов без данных нет.

   Разделы — раскрытия (отложенное заказчиком 27.09.2026, взято по «делай
   всё» 28.09.2026): четыре раскрытых раздела подряд тянули страницу на
   телефоне на несколько экранов. Раскрытие — та же строка, что у вопросов
   главной (`blocks.module.css`, `q` / `ask`, знак `Turn`): контрол берётся,
   а не рисуется. Описание и протокол открыты сразу — первое читают все,
   второе — вещь, которую запомнят; остальное — строкой, текст в разметке
   (поиск и чтец видят его и закрытым). Так у Allbirds, Byredo, Everlane на
   телефоне (замер 28.09.2026, бриф карты товара). */
export function ProductDetails({ details }: { details: DetailsView }) {
  if (!details.parts.length) return null
  return (
    <div className={`${s.details} ${b.rows}`}>
      {details.parts.map((x, i) => (
        <details key={x.id} id={x.id} className={b.q} open={i === 0 || Boolean(x.lab)}>
          <summary className={b.ask}><h2 className={s.title}>{x.title}</h2><Turn /></summary>
          {x.lab
            /* Протокол — ступенью ниже заголовка раздела: имя документа и номер партии. */
            ? <div className={s.body}><LabReport lab={x.lab} level={3} /></div>
            : <div className={`${p.prose} ${s.body}`}><p>{x.text}</p></div>}
        </details>
      ))}
    </div>
  )
}
