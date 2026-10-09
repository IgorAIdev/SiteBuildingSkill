'use client'
import { Children, cloneElement, type ReactElement, type ReactNode } from 'react'
import { useFoldCount } from './FoldShelf.tsx'

/* Полка телефона шагами (И754): карточки за показанным шагом помечены
   (`data-past`) и спрятаны стилем только на узкой коробке (Catalog.module.css);
   сколько показано — у свёртки (FoldShelf), кнопка и счёт — в строке листания.
   Страница магазина по-прежнему 60 (И732): все карточки лежат в разметке. */
export function FoldGrid({ id, className, children }: { id: string; className: string; children: ReactNode }) {
  const count = useFoldCount()
  const items = Children.toArray(children) as ReactElement<{ 'data-past'?: string }>[]
  return (
    <ul id={id} className={className} data-catalog-grid="" data-fold="">
      {items.map((li, i) => cloneElement(li, { 'data-past': i >= count ? '' : undefined }))}
    </ul>
  )
}
