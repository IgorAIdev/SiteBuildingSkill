'use client'
import { createContext, useContext, type ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import { useStudio } from './studio.ts'
import s from './cards.module.css'

/* Стенд вкладки «Карточки» — то, что на ней нажимают (слово заказчика
   30.09.2026: «возле дизайнов поставь чекбоксы рядом с названием; отмеченный
   вариант переходит как основа дизайна ниже в раздел информации о карточке»;
   «перед рядом карточек поставь переключатель тени как в панели — единый
   источник тени»; «выбранные мною карточки на странице не выставляются,
   они выставляются только из меню»). Своего стенд не помнит: отмеченный
   дизайн и тень — поля вида `card` и `shadow` в общем состоянии выбора
   (studio.ts), те же, что в панели Look; щелчок меняет весь сайт
   черновиком. Пока состояние не пришло — отмечен дизайн сайта с сервера
   (`first`). Карточки рисует сервер (Cards.tsx); стенд только показывает
   нужные. */

const Dress = createContext<{ dress: string; set: (id: string) => void }>({ dress: '', set: () => {} })

export function Bench({ first, children }: { first: string; children: ReactNode }) {
  const { s: studio } = useStudio()
  const dress = studio?.names.card ?? first
  const set = (id: string) => studio?.pick('card', id)
  return <Dress.Provider value={{ dress, set }}>{children}</Dress.Provider>
}

/** Отметка у имени дизайна: отмеченный — дизайн карточки сайта (черновиком,
 *  как выбор в панели) и основа раздела «Информация в карточке». Выбор один из многих — переключатель, а не флажок. Группу
 *  держит состояние стенда, а не имя (`name`): панель Look держит копию
 *  страницы деревом, и с именем группы отметка в копии снимала отметку
 *  здесь. */
export function DressPick({ id, name }: { id: string; name: string }) {
  const { dress, set } = useContext(Dress)
  return <label className={f.tick}><input type="radio" checked={dress === id} onChange={() => set(id)} /><span className={s.cellName}>{name}</span></label>
}

/** Показывает содержимое только у отмеченного дизайна. */
export function ForDress({ id, children }: { id: string; children: ReactNode }) {
  return useContext(Dress).dress === id ? <>{children}</> : null
}

/** Тень — варианты поля `shadow` каталога вида, как в панели Look; имена —
 *  по-русски, как вся страница (у каталога они английские, для панели). */
const SHADOW_NAMES: Record<string, string> = { flat: 'Без тени', supersoft: 'Супермягкая', soft: 'Мягкая' }
/** Что даёт каждая тень карточке — словами, строкой под переключателем. */
const SHADOW_SAYS: Record<string, string> = {
  flat: 'Без тени: у дизайнов 3 и 4 под рукой тени нет — остаётся линия по краю.',
  supersoft: 'Супермягкая: у дизайнов 3 и 4 под рукой — тень в пиксель у края и совсем короткая дымка под карточкой. Половина мягкой.',
  soft: 'Мягкая: у дизайнов 3 и 4 под рукой — еле заметная тень у края и короткая лёгкая дымка под карточкой.',
}
export function ShadowSwitch() {
  const { s: studio } = useStudio()
  /* По нарастанию тени, как лестница в панели (`rung` каталога): каталог
     ставит первым вариант сайта, и порядок шёл вразнобой. */
  const options = [...(studio?.catalog.groups.shadow ?? [])].sort((a, b) => ((a as { rung?: number }).rung ?? 0) - ((b as { rung?: number }).rung ?? 0))
  if (!studio || !options.length) return null
  return (
    <div className={s.shadow}>
      <div className={p.cluster} role="group" aria-label="Тень">
        <span className={s.shadowName}>Тень</span>
        {options.map((o) => {
          const on = studio.names.shadow === o.id
          return <button key={o.id} type="button" className={b.btn} data-size="sm" data-voice={on ? 'loud' : undefined} aria-pressed={on} title={o.line} onClick={() => studio.pick('shadow', o.id)}>{SHADOW_NAMES[o.id] ?? o.name}</button>
        })}
      </div>
      <p className={p.note} aria-live="polite">{SHADOW_SAYS[studio.names.shadow] ?? ''}</p>
    </div>
  )
}
