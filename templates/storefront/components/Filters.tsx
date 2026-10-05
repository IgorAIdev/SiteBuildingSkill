import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import pn from '@/styles/pane.module.css'
import s from './Filters.module.css'
import m from '@/styles/menu.module.css'
import type { FacetView, FiltersView } from '@/lib/catalog-view.ts'
import { Icon } from './Icon.tsx'
import { Turn } from './Turn.tsx'
import { PaneHead } from './PaneHead.tsx'
import { ApplyCount, LiveFilter, ValueTick } from './LiveFilter.tsx'

/* Одна разметка граней на все виды (И739) — вид решают стили по роли вида и
   коробке органов полки (Filters.module.css), разметка одна:

   Широкая коробка, `--filter-look`:
     `drawer` (сайт; Gymshark «Filter & Sort») — кнопка «Filtre» и шторка от
       края со всеми группами, как на узком и как корзина: шапка и низ стоят,
       группы прокручиваются, «применить» со счётом всегда на виду. Панель
       колонками под строкой (`panel`) заказчик снял 04.10.2026: «такое полотно
       выбора не нужно» — она уходила под край окна вместе с кнопкой;
     `bar` (Shopify Dawn, ASOS) — строка раскрытий над полкой: у каждой группы
       своя кнопка и своё раскрытие со своей «применить».
   Узкая коробка, `--filter-phone`:
     `drawer` (сайт) — кнопка «Filtre» и шторка от края со всеми гранями;
     `pills` (Zalando, notino) — та же кнопка и, строкой ниже, грани пилюлями
       вбок, каждая со своим раскрытием.
   Колонка граней сбоку — другое устройство страницы, не вид этой разметки:
   shop, references/catalog.md, «Фильтр полки: виды на выбор».

   Порядок — не в форме: он ссылками (SortMenu.tsx) и берёт то же раскрытие
   (`drop`).

   `id` — адрес шторки; свой — у второй формы на той же странице
   (дизайн-система). */
/* Строки галочек грани — меню набора (styles/menu.module.css, И730): та же
   строка, что у порядка, языка и подменю шапки. */
function Ticks({ code, values }: { code: string; values: FacetView['values'] }) {
  return (
    <ul className={m.list}>
      {values.map((v) => (
        <li key={v.code}>
          <label className={`${f.tick} ${b.row}`}>
            <ValueTick code={code} value={v.code} name={v.name} count={v.count} selected={v.selected} />
          </label>
        </li>
      ))}
    </ul>
  )
}

export function Filters({ f: view, id = 'filters' }: { f: FiltersView; id?: string }) {
  return (
    <>
      {view.facets.length ? (
        /* Слово и знак без плиты, слово на линии колонки (И740; Allbirds, Gymshark). */
        <button className={`${b.btn} ${s.open}`} data-voice="bare" data-hang="start" type="button" popoverTarget={id}>
          <Icon id="sliders-horizontal" />{view.open}
        </button>
      ) : null}
      {/* Шторка — окно общего модуля (styles/pane.module.css, И460): шапка и
          низ стоят, грани прокручиваются. В строке над полкой тело свёрнуто
          (`display:contents`), и раскрытия стоят в строке примитива. */}
      <form id={id} popover="auto" className={`${p.cluster} ${pn.pane} ${s.filters}`} data-pane="start" data-row action={view.action} method="get" aria-label={view.title}>
        <LiveFilter form={id} live={view.live}>
        {/* Имя окна несёт полку страницы, выход из неё — словом у крестика (И740). */}
        <PaneHead className={s.head} title={view.scope ? `${view.title} · ${view.scope.label}` : view.title} close={view.close} target={id}
          end={view.scope ? <a className={`${b.word} ${s.wider}`} href={view.scope.href} aria-label={view.scope.said}>{view.scope.all}</a> : null} />
        <div className={`${pn.body} ${s.list}`}>
          {view.facets.map((facet) => (
            <div key={facet.code}>
              <button className={`${b.btn} ${s.trigger}`} data-voice="bare" type="button" popoverTarget={`${id}-${facet.code}`}>{facet.label}<Turn /></button>
              <fieldset id={`${id}-${facet.code}`} popover="auto" className={`${p.menu} ${s.drop} ${s.values}`}>
                {/* Подпись, строки галочек и кнопка — меню набора (styles/menu.module.css,
                    И730): та же строка, что у порядка, языка и подменю шапки; кнопка —
                    пилюлей, как все кнопки сайта. */}
                <legend className={`${m.group} ${s.legend}`}>{facet.name}</legend>
                <Ticks code={facet.code} values={facet.values} />
                {/* Длинный список — десять на виду, остальное под «Arată toate (14)»
                    (catalog-view.ts, `foldValues`); выбранное в свёртке раскрывает её. */}
                {facet.fold ? (
                  <details className={m.fold} open={facet.fold.open}>
                    <summary className={b.row}>{facet.fold.label}<Turn /></summary>
                    <Ticks code={facet.code} values={facet.fold.values} />
                  </details>
                ) : null}
                <ApplyCount className={`${b.btn} ${s.apply}`} data-wide idle={view.apply} />
              </fieldset>
            </div>
          ))}
        </div>
        <div className={`${pn.foot} ${pn.acts} ${s.actions}`}>
          {/* Низ — пара окна (`pn.acts`, И772), как у корзины: тихая «сбросить»
              слева, громкая «применить» справа. «Применить» — главное действие шторки:
              заливка марки (palette, roles.md, «Заливки»: «применить фильтры» — кнопка
              покупки), со счётом того, что даст выбор («Arată 12 produse», ApplyCount).
              До 05.10.2026 они стояли столбиком во всю ширину — громкая и контур, —
              а низ корзины был словом и кнопкой рядом: «кнопки внизу в разных формах». */}
          {view.clear ? <a className={b.btn} href={view.clear.href}>{view.clear.label}</a> : null}
          <ApplyCount className={b.btn} data-voice="loud" idle={view.apply} />
        </div>
        </LiveFilter>
      </form>
    </>
  )
}
