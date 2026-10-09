import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import s from './RailHead.module.css'
import type { Lang } from '@/lib/locale.ts'
import { t } from '@/lib/i18n/index.ts'
import { Icon } from './Icon.tsx'
import { RailPager } from './RailPager.tsx'

/* Шапка ряда, который листают вбок, — одна на сайт (правило 10, И665):
   плитки категорий и эффектов главной, полки товаров. Слева заголовок и
   описание ряда одной подписью (`hgroup`; описания нет в данных — заголовок
   стоит один), справа — кнопки листания и выход «View all» одной группой,
   выход у самого края (заказчик 28.09.2026: «справа приклеивается к правой
   стороне кнопка View all, а левее её кнопки скролла»). Выход — пилюля того
   же стиля и роста, что кнопки листания (набор «Уголок» каталога кнопок,
   рост 40; заказчик 02.10.2026: «в комплект к этим стрелкам»), и так же под рукой
   заливается маркой (`data-hand="pop"`, И704). Форма — пилюля при любом угле
   панели, как и круги листания (`data-rail-nav`, И747: «тут нужны пилюли, чтоб не
   такие массивные были»). Слово выхода — одно у
   всех рядов (И536); данные дают только адрес, нет адреса — выхода нет.
   На телефоне кругов листания нет (полку листают свайпом), и пилюля одна
   стояла рядом с заголовком крупнее его смысла — там выход словом со стрелкой
   (`go`), как «View All» у Gymshark (заказчик 05.10.2026: «кнопка View all
   какая-то большая по сравнению с заголовком»; И759). Какой из двух видно,
   решает ширина шапки ряда (RailHead.module.css); адрес один.
   Рельса ряда — `${id}-rail`: её листают кнопки. */
export function RailHead({ id, title, lede, all, lang }: { id: string; title: string; lede?: string; all: string | null; lang: Lang }) {
  return (
    <div className={p.sectionHead} data-row>
      <hgroup>
        <h2 id={id}>{title}</h2>
        {lede ? <p>{lede}</p> : null}
      </hgroup>
      <div className={`${p.cluster} ${s.acts}`}>
        <RailPager rail={`${id}-rail`} back={t(lang, 'rail.prev')} next={t(lang, 'rail.next')} />
        {all ? <a className={`${b.btn} ${s.wide}`} data-rail-nav data-hand="pop" href={all}>{t(lang, 'shelf.all')}<Icon id="arrow-right" /></a> : null}
        {all ? <a className={`${go.go} ${s.narrow}`} href={all}>{t(lang, 'shelf.all')}<Icon id="arrow-right" /></a> : null}
      </div>
    </div>
  )
}
