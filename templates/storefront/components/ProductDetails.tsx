import { useId } from 'react'
import p from '@/styles/primitives.module.css'
import s from './ProductDetails.module.css'
import type { DetailsView } from '@/lib/product-view.ts'

/* Разделы о товаре — своим блоком под верхом карты, от левого края (И512;
   слово заказчика 28.09.2026: «описание, ингредиенты и как использовать —
   без раскрытия, просто заголовки и текст»). Раскрытия (И509) сняты: текст
   виден сразу, как у длинной страницы товара (Baymard, «Product Page UX»:
   скрытое содержимое треть людей не находит). Строки меню-якорей нет
   (28.09.2026). Протокол партии здесь больше не стоит — он знаком у
   наличия и окном (ProductView). Разделов без данных нет. */
export function ProductDetails({ details }: { details: DetailsView }) {
  /* Имя общего заголовка — своё у каждого блока: на странице дизайн-системы
     он стоит и под картой товара, и сам по себе. */
  const id = `details-${useId().replace(/:/g, '')}`
  if (!details.parts.length) return null
  return (
    <section className={`${p.stack} ${s.details}`} aria-labelledby={id} data-parts>
      {/* Одно описание частями (И581): общий заголовок — для чтеца и
          оглавления, глазу его заменяет место под картой; части — h3. */}
      <h2 id={id} className={p.said}>{details.label}</h2>
      {details.parts.map((x) => (
        <section key={x.id} id={x.id} className={p.prose} aria-labelledby={`${x.id}-title`}>
          <h3 id={`${x.id}-title`} className={s.title}>{x.title}</h3>
          <p>{x.text}</p>
        </section>
      ))}
    </section>
  )
}
