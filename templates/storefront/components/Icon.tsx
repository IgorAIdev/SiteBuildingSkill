/* Знак из листа основы (styles/icons.svg → public/icons.svg). Рисунок — в
   листе, имя — у кнопки или ссылки рядом (у безмолвной — aria-label). */
export function Icon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <use href={`/icons.svg#${id}`} />
    </svg>
  )
}
