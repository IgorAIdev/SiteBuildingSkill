import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './RailHead.module.css'
import type { Lang } from '@/lib/locale.ts'
import { t } from '@/lib/i18n/index.ts'
import { Icon } from './Icon.tsx'
import { RailPager } from './RailPager.tsx'
import { SiteLink } from './SiteLink.tsx'

/* Шапка ряда, который листают вбок, — одна на сайт (правило 10, И665):
   плитки категорий и эффектов главной, полки товаров. Слева заголовок и
   описание ряда одной подписью (`hgroup`; описания нет в данных — заголовок
   стоит один), справа — кнопки листания и выход «View all» одной группой,
   выход у самого края (заказчик 28.09.2026: «справа приклеивается к правой
   стороне кнопка View all, а левее её кнопки скролла»). Слово выхода — одно у
   всех рядов (И536); данные дают только адрес, нет адреса — выхода нет.
   Выход — слово со стрелкой под 45° без кромки, на любой ширине (заказчик
   20.10.2026: «View all без окантовки, а стрелочка под углом 45 град»; до того —
   пилюля у кругов листания, И747, и слово только на телефоне, И759). Под рукой —
   как пункт меню, только оттенок: тихое слово становится полным, без движения
   (`word`, `data-hand="menu"`; заказчик 20.10.2026: «эффекты нужны простые, как в
   меню, изменение оттенка»). Цель пальца — запасом `tap`.
   Рельса ряда — `${id}-rail`: её листают кнопки. */
export function RailHead({ id, title, lede, all, lang }: { id: string; title: string; lede?: string; all: string | null; lang: Lang }) {
  return (
    <div className={p.sectionHead} data-row>
      <hgroup>
        <h2 id={id}>{title}</h2>
        {lede ? <p>{lede}</p> : null}
      </hgroup>
      <div className={p.cluster}>
        <RailPager rail={`${id}-rail`} back={t(lang, 'rail.prev')} next={t(lang, 'rail.next')} />
        {all ? <SiteLink className={`${b.word} ${p.tap} ${s.all}`} data-hand="menu" href={all}>{t(lang, 'shelf.all')}<Icon id="arrow-up-right" /></SiteLink> : null}
      </div>
    </div>
  )
}
