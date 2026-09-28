'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './Header.module.css'
import type { NavLink } from '@/lib/shell.ts'
import { Icon } from './Icon.tsx'
import { Turn } from './Turn.tsx'
import { shot } from '@/lib/shot.ts'

/* Полки шапки. Каждая строка несёт всё, чем её может нарисовать шапка:
   кадр полки, имя, строку о полке, стрелку. Строкой текста в ряду, рядом в
   шторке телефона или плиткой в панели «Shop» — решает вид шапки
   (Header.module.css), разметка одна. Текущая полка — `aria-current` по
   адресу страницы: его знает клиентская часть, и при сборке тоже, так что
   отметка стоит уже в отданной разметке.

   Общие параметры полки (И478; меню cbdshop.bg: «Масла ⌄ — Концентрация
   5 % 10 % … · Вид экстракта …»): у полки со своими гранями в шторке рядом
   со строкой — раскрытие; под строкой — грани фишками, каждая ведёт в полку
   сразу с фильтром. Фишки и подписи — те же, что у групп «по поводу»
   (`sheetGroup`, `groupName`, `pills`, `p.chip`): одно устройство. В строке
   шапки на широком раскрытия нет — там полки ссылками. `more` — имя
   раскрытия для чтения вслух, с `{name}` полки. */
export function NavLinks({ links, className, more }: { links: NavLink[]; className: string; more: string }) {
  const path = usePathname()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <ul className={className}>
      {links.map((l, i) => {
        const id = `shelf-params-${i}`
        const shown = open === l.href
        return (
          <li key={l.href} data-all={l.image ? undefined : ''} data-params={l.facets.length ? '' : undefined}>
            <a href={l.href} aria-current={l.href === path ? 'page' : undefined}>
              {l.image
                ? <img className={s.thumb} {...shot(l.image, 'thumb', true)} alt="" decoding="async" />
                : <span className={s.thumb} aria-hidden="true"><Icon id="package" /></span>}
              <span className={s.name}>{l.label}</span>
              {l.line ? <span className={s.line}>{l.line}</span> : null}
              <span className={s.chev} aria-hidden="true"><Icon id="chevron-right" /></span>
            </a>
            {l.facets.length ? (
              <>
                <button className={`${b.btn} ${s.params}`} data-voice="bare" type="button" aria-expanded={shown} aria-controls={id} aria-label={more.replace('{name}', l.label)} onClick={() => setOpen(shown ? null : l.href)}>
                  <Turn />
                </button>
                <div className={s.paramsPanel} id={id} hidden={!shown}>
                  {l.facets.map((g, k) => (
                    <div key={g.name} className={s.sheetGroup}>
                      <p className={s.groupName} id={`${id}-${k}`}>{g.name}</p>
                      <ul className={`${p.cluster} ${s.pills}`} aria-labelledby={`${id}-${k}`}>
                        {g.links.map((x) => <li key={x.href}><a className={p.chip} href={x.href}><span className={s.pillName}>{x.label}</span></a></li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
