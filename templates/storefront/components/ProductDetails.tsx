import p from '@/styles/primitives.module.css'
import s from './ProductDetails.module.css'
import type { DetailsView } from '@/lib/product-view.ts'
import { LabReport } from './LabReport.tsx'

/* Разделы о товаре — под колонкой покупки (И466; слово заказчика
   27.09.2026: «ниже горизонтальное меню с пунктами Описание, Состав, Как
   пользоваться, COA — посмотри, что принято в индустрии»).

   Принято — меню и разделы подряд, а не вкладки, прячущие текст: Baymard
   («Product Page UX»: горизонтальные вкладки на карте товара — треть людей
   не находит содержимого скрытых вкладок; рекомендация — одна длинная
   страница с переходом по разделам). Меню — строка ссылок-якорей, на
   телефоне — полоса `rail`, которая едет вбок; нажатие ведёт к разделу, и
   каждый раздел виден и без меню, и поиском, и чтецом. Протокол партии —
   тот же плоский LabReport, что у главной. Разделов без данных нет, меню
   из одного пункта — тоже. */
export function ProductDetails({ details }: { details: DetailsView }) {
  if (!details.parts.length) return null
  return (
    <div className={s.details}>
      {details.parts.length > 1 ? (
        <nav className={s.menu} aria-label={details.label}>
          <ul className={`${p.rail} ${s.items}`}>
            {details.parts.map((x) => <li key={x.id}><a href={`#${x.id}`}>{x.title}</a></li>)}
          </ul>
        </nav>
      ) : null}
      {details.parts.map((x) => x.lab
        ? (
          /* Раздел протокола озаглавлен как остальные (h2 раздела), сам
             протокол — ступенью ниже: имя документа и номер партии. */
          <section key={x.id} id={x.id} className={s.part} aria-labelledby={`${x.id}-title`}>
            <h2 className={s.title} id={`${x.id}-title`}>{x.title}</h2>
            <LabReport lab={x.lab} level={3} />
          </section>
        )
        : (
          <section key={x.id} id={x.id} className={s.part} aria-labelledby={`${x.id}-title`}>
            <h2 className={s.title} id={`${x.id}-title`}>{x.title}</h2>
            <div className={p.prose}><p>{x.text}</p></div>
          </section>
        ))}
    </div>
  )
}
