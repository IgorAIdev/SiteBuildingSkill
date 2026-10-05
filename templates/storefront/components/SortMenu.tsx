import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './Catalog.module.css'
import fs from './Filters.module.css'
import m from '@/styles/menu.module.css'
import type { SortView } from '@/lib/catalog-view.ts'
import { Icon } from './Icon.tsx'

/* Порядок полки — в полосе органов, справа (разбор 24.09.2026, C1): стоял
   внизу колонки фильтров под четырьмя гранями, и его не находили.

   Раскрытие со ссылками, а не список с отправкой на изменении: каждый
   порядок — адрес (shop, «Фильтры живут в адресе всегда»), выбор — переход
   по ссылке. Список, отправлявший форму на `change`, уводил бы со страницы
   с первой же стрелки клавиатуры (И265, WCAG 3.2.2). Раскрытие — то же, что
   у граней (Filters.module.css, `drop`): одна одежда на оба. Без скрипта
   работает всё: `popover` и ссылки.

   Кнопка — знак порядка и выбранный порядок словом (И709; слово заказчика
   04.10.2026: «не Sort by писать, а иконку»): знак `list-filter` — знак
   сортировки элемента 63 с образца заказчика. Подписи «Sort by» на виду нет
   ни на какой ширине, стрелки раскрытия тоже: знак сам говорит «меню
   порядка», и кнопка не растёт. Имя для чтения вслух — «Sort by: Best
   sellers» (`aria-label`), то же имя — у списка. На телефоне (шов 560) —
   один знак: строка «Filters · счёт · порядок» в одну строку не встаёт с
   «Cele mai vândute» (И758); выбранный порядок — галочкой в списке.

   Кнопка — общей формы кнопок сайта (ось Buttons → Shape; признак `data-pill`
   снят 04.10.2026 — форму решает панель): угол органа делал полосу полки
   единственным прямоугольником среди круглых органов (слово заказчика 04.10.2026: «явно это не прямоугольная
   кнопка»; у Allbirds порядок — пилюля 41 px с тонкой кромкой, замер того
   же дня; И707).

   Строки — меню набора (styles/menu.module.css, И730): одна строка на все
   раскрытия сайта, выбранное — галочкой.

   `id` — адрес раскрытия; свой — у второго порядка на той же странице
   (дизайн-система). */
export function SortMenu({ sort, id = 'sort-list' }: { sort: SortView; id?: string }) {
  return (
    <div className={s.sort}>
      <button className={`${b.btn} ${fs.trigger}`} data-voice="bare" data-hang="end" type="button" popoverTarget={id} aria-label={sort.said}><Icon id="list-filter" /><span className={s.sortWord}>{sort.current}</span></button>
      <ul id={id} popover="auto" className={`${p.menu} ${fs.drop} ${m.list}`} data-align="end" aria-label={sort.label}>
        {sort.options.map((o) => <li key={o.value}><a className={b.row} href={o.href} aria-current={o.on ? 'true' : undefined}>{o.label}</a></li>)}
      </ul>
    </div>
  )
}
