'use client'
import type { CSSProperties } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import pn from '@/styles/pane.module.css'
import m from '@/styles/menu.module.css'
import { PaneHead } from '@/components/PaneHead.tsx'
import { SHADOWS } from '@/lib/look-values.ts'
import { useStudio } from './studio.ts'
import { Part, Worn } from './parts.tsx'
import s from './design.module.css'
import sf from './siteframe.module.css'

/* Система → «Тени» (И726; слово заказчика 04.10.2026: «тени, как и цвета, как и
   типографику, нужно применять системно; в дизайн-системе прописать варианты
   возможные, где тень применяется, где нет»). Шесть ролей по работе — у каждой своя
   строка о том, что её носит; наборы панели (Look → System → Shape → Shadows)
   показаны рядом, каждый своими значениями на тех же предметах: роли образцами,
   настоящая бумага меню и настоящее окно. Помечен набор, что на сайте. Выбора на
   странице нет — он в панели. Ниже — то, у чего тени нет ни в одном наборе. */
const ROLE: Record<(typeof SHADOWS)[number], string> = {
  '--sh-raised': 'Поверхность в покое: доски шапки, выбранный пункт лотка',
  '--sh-lift': 'Шаг под рукой — только под мышью и пальцем: карточка товара',
  '--sh-sticky': 'Полоса у края, под которой едет содержимое: полоса покупки',
  '--sh-overlay': 'Висит над страницей без затемнения: меню, сообщение, помощь',
  '--sh-modal': 'Окно и шторка с затемнением: корзина, меню, фильтры, поиск',
  '--sh-in': 'Вдавленное: раскрытый пункт лотка',
}
const NAME: Record<string, string> = { flat: 'Без тени', supersoft: 'Супермягкая', soft: 'Мягкая' }
type Set = { id: string; name: string; line?: string; rung?: number; vars: Record<string, string> }

export function Shadows() {
  const { s: studio } = useStudio()
  const sets = [...((studio?.catalog.groups.shadow ?? []) as Set[])].sort((a, z) => (a.rung ?? 0) - (z.rung ?? 0))
  const worn = studio?.names.shadow
  return (
    <>
      <Part title="Тени по работе" lede="Тень — только у того, что висит над страницей; то, что лежит на ней, отделяют кромка и тон. Шесть ролей, у каждой свои вещи. Набор выбирается целиком в панели Look → System → Shape → Shadows; помечен тот, что на сайте. Нажмите «Открыть окно» — откроется настоящее окно с тенью этого набора.">
        {sets.length ? null : <p className={p.note}>Наборы загружаются из панели Look…</p>}
        <div className={`${p.stack} ${sf.column}`}>
          {sets.map((set) => (
            <section key={set.id} className={sf.sample} style={set.vars as CSSProperties} aria-label={NAME[set.id] ?? set.name}>
              <h3>{NAME[set.id] ?? set.name} <Worn on={set.id === worn} /></h3>
              {set.line ? <p className={p.note}>{set.line}</p> : null}
              <ul className={`${p.grid} ${s.tiles}`}>
                {SHADOWS.map((role) => (
                  <li key={role} className={s.tile}><span className={s.shadow} style={{ '--x': `var(${role})` } as CSSProperties} /><span>{ROLE[role]}</span><code>{role}</code></li>
                ))}
              </ul>
              <ul className={`${p.cluster} ${sf.row}`} role="list">
                <li className={sf.sample}>
                  <h3>Меню</h3>
                  <div className={`${p.menu} ${sf.paper}`}>
                    <ul className={m.list}>
                      <li><a className={b.row} href="#top" aria-current="true">Best sellers</a></li>
                      <li><a className={b.row} href="#top">Newest</a></li>
                      <li><a className={b.row} href="#top">Price: low to high</a></li>
                    </ul>
                  </div>
                </li>
                <li className={sf.sample}>
                  <h3>Окно с затемнением</h3>
                  <button className={b.btn} type="button" popoverTarget={`design-shadow-${set.id}`}>Открыть окно</button>
                  <div id={`design-shadow-${set.id}`} popover="auto" className={pn.pane} data-pane="dialog" style={set.vars as CSSProperties} aria-label="Образец окна">
                    <PaneHead title={NAME[set.id] ?? set.name} close="Закрыть" target={`design-shadow-${set.id}`} />
                    <div className={pn.body}><p>{ROLE['--sh-modal']}.</p></div>
                  </div>
                </li>
              </ul>
            </section>
          ))}
        </div>
      </Part>
      <Part title="Без тени всегда" lede="У этих вещей тени нет ни в одном наборе: кнопка отвечает краской, поле — кромкой, фишка и снимок лежат на странице. Шапка, приклеенная тоже, отделена волоском, подвал — тоном.">
        <ul className={`${p.cluster} ${sf.row}`} role="list">
          <li className={sf.sample}><h3>Кнопка</h3><button className={b.btn} type="button">Add to cart</button></li>
          <li className={sf.sample}><h3>Фишка</h3><a className={p.chip} href="#top">Full spectrum</a></li>
        </ul>
      </Part>
    </>
  )
}
