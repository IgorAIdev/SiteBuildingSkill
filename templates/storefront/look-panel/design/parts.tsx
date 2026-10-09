import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import s from './design.module.css'
import { Probe } from './Probe.tsx'

/* Общие куски вкладок страницы дизайн-системы: раздел, строка «образец ·
   имя · роль словами · замер» и значение роли для образца. Вкладки живут
   в своих файлах (DesignPage.tsx, Buttons.tsx), кусок — один. */

/* `tools` — органы у правого края шапки раздела: стрелки ленты образцов. */
export const Part = ({ title, lede, tools, children }: { title: string; lede: string; tools?: ReactNode; children: ReactNode }) => (
  <section className={s.part} aria-label={title}>
    <div className={p.sectionHead} data-row={tools ? '' : undefined}><hgroup><h2>{title}</h2><p>{lede}</p></hgroup>{tools ? <div className={p.cluster}>{tools}</div> : null}</div>
    {children}
  </section>
)

/** Строка «образец · имя · роль словами · замер». */
export const Row = ({ name, note, what, children }: { name: string; note: string; what: Parameters<typeof Probe>[0]['what']; children: ReactNode }) => (
  <li className={s.row} data-row>
    <div className={s.sample}>{children}</div>
    <div className={s.label}><span>{note}</span><code>{name}</code><Probe what={what} /></div>
  </li>
)

/** Описание варианта того, что отвечает руке: что это — и три строки
 *  «Покой · Наведение · Нажатие» (слово заказчика 01.10.2026: «описание
 *  делай так же, как у карточек… это правило заведи для всех аналогичных
 *  элементов», И602). Все три обязательны — у варианта, который нажимают,
 *  описание без ответа руке не собирается. */
export type Hand = { what: string; rest: string; hover: string; press: string }
export const States = ({ what, rest, hover, press }: Hand) => (
  <div className={s.desc}>
    <p className={p.note}>{what}</p>
    <dl className={`${p.note} ${s.states}`}>
      {([['Покой', rest], ['Наведение', hover], ['Нажатие', press]] as const).map(([when, how]) => <div key={when}><dt>{when}:</dt> <dd>{how}</dd></div>)}
    </dl>
  </div>
)

/** Метка «на сайте» у варианта, который носит витрина (слово заказчика
 *  01.10.2026): страница показывает все варианты, метка говорит, какой из
 *  них выбран — по опубликованному виду (`lookNow`), а не по панели. Вид
 *  метки — тот же, что у пометки вкладки «выбор». */
export const Worn = ({ on, where = 'на сайте' }: { on: boolean; where?: string }) => (on ? <span className={s.tabMark}>{where}</span> : null)

export const cssVar =(name: string, value: string) => ({ [name as string]: value })
