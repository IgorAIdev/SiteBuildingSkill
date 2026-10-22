'use client'
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { usePagePath } from '@/lib/page-path.ts'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './Header.module.css'
import fs from './Filters.module.css'
import m from '@/styles/menu.module.css'
import type { NavGroup, NavLink } from '@/lib/shell.ts'
import { Icon } from './Icon.tsx'
import { Turn } from './Turn.tsx'
import { SiteLink } from './SiteLink.tsx'

/* Полки шапки. Каждая строка несёт всё, чем её может нарисовать шапка:
   знак полки, имя, строку о полке. Стрелка обозначает только раскрытие. Снимков полок в меню нет —
   знак полки из данных, тот же, что у кнопок категорий (слово заказчика
   05.10.2026: «само меню убирай изображения, иконки категорий можно
   использовать»; И753). Строкой текста в ряду, рядом в
   шторке телефона или плиткой в панели «Shop» — решает вид шапки
   (Header.module.css), разметка одна. Текущая полка — `aria-current` по
   адресу страницы: его знает клиентская часть, и при сборке тоже, так что
   отметка стоит уже в отданной разметке.

   Общие параметры полки (И478; меню cbdshop.bg: «Масла ⌄ — Концентрация
   5 % 10 % … · Вид экстракта …»): у полки с подменю (`menu` — то же, что
   стрелка в строке шапки) в шторке рядом со строкой — раскрытие; под
   строкой — грани фишками, каждая ведёт в полку сразу с фильтром. У полки
   без подменю в строке и в шторке — одна ссылка (слово заказчика
   05.10.2026: «в десктопе доп. меню только для масла — значит, и в мобайле
   для других не требуется»). Фишки и подписи — те же, что у групп «по поводу»
   (`sheetGroup`, `groupName`, `pills`, `p.chip`): одно устройство. В строке
   шапки на широком раскрытия нет — там полки ссылками. `more` — имя
   раскрытия для чтения вслух, с `{name}` полки.

   Полки, не вставшие в строку шапки, — под «Ещё» (приоритетное меню,
   priority+; слово заказчика 29.09.2026: «для крайних правых пунктов не
   будет хватать места — группировать в пункт More»; И546). Ширины полок
   меряются, пока видны все, и помнятся: от ширины окна они не зависят.
   Строка меряет место своей навигации (`nav`, берёт весь остаток строки)
   и прячет хвост (`data-over`), который встаёт списком под «Ещё». В шторке
   телефона видны все полки, «Ещё» нет; без скрипта строка едет вбок, как
   прежде. `overflow` — слово «Ещё».

   Подменю в строке (слово заказчика 02.10.2026: «у меню Oil — раскрывающееся
   подменю»; образец — Flowbite «Mega menu» и его дропдаун с запуском по
   наведению, MIT, themesberg/flowbite@232ebdb,
   src/components/dropdown/index.ts): у полки с гранями в строке рядом со
   ссылкой стоит стрелка, под ней — панель тех же граней фишками (`Facets`,
   одно устройство со шторкой). Панель — `popover` (правило 8): Escape,
   щелчок мимо и возврат фокуса — от браузера; стрелка раскрывает нажатием и
   с клавиатуры, мышь — наведением (вход через `ENTER`, уход через `LEAVE`,
   как `delay` образца; таймеры отменяются — в образце вход, запланированный
   до ухода, всё равно срабатывал). Палец и перо наведением не открывают: у
   них нажатие. Окно панели стоит под своей полкой (`--shelf-anchor`). */
const ENTER = 120
const LEAVE = 220

/** Те же грани строками, без фишек — в панели подменю строки (образец
 *  меню cbdin.bg: «По концентрация» и значения столбиком). Одна грань —
 *  столбик со своим именем. Строка и подпись группы — меню набора
 *  (styles/menu.module.css, И730): одни на все выпадающие списки сайта —
 *  язык, порядок, «Ещё», грани каталога (правило 10). */
function FacetList({ groups, id }: { groups: NavGroup[]; id: string }) {
  return (
    <>
      {groups.map((g, k) => (
        <div key={g.name} className={s.sheetGroup}>
          <p className={m.group} id={`${id}-${k}`}>{g.name}</p>
          <ul className={m.list} aria-labelledby={`${id}-${k}`}>
            {g.links.map((x) => <li key={x.href}><SiteLink className={b.row} href={x.href}><span className={s.name}>{x.label}</span></SiteLink></li>)}
          </ul>
        </div>
      ))}
    </>
  )
}

/** Тело панели подменю — грани строками или полки со знаком: одно на панель в
 *  строке шапки и на раскрытый образец в дизайн-системе (SiteFrame.tsx),
 *  рисуется один раз (правило 10). Обёртку (окно или образец) ставит место. */
export function DropBody({ link, id }: { link: NavLink; id: string }) {
  const path = usePagePath()
  return link.facets.length ? (
    <div className={`${p.cluster} ${s.dropGroups}`}>
      <FacetList groups={link.facets} id={id} />
    </div>
  ) : (
    <ul className={m.list}>
      {link.kids.map((k) => (
        <li key={k.href}>
          <SiteLink className={b.row} href={k.href} aria-current={k.href === path ? 'true' : undefined}>
            {k.sign ? <Icon id={k.sign} /> : null}
            <span className={s.name}>{k.label}</span>
          </SiteLink>
        </li>
      ))}
    </ul>
  )
}

/** Раскрытие строки в шторке телефона (как у cbdin.bg): под строкой — список
 *  строк меню (styles/menu.module.css). У «By effect» — эффекты со знаком, у
 *  масел — грани группами и в конце «смотреть всё» на саму полку. Только
 *  названия: пояснений в шторке нет (правило cbdin.bg). */
function Fold({ link, id, all }: { link: NavLink; id: string; all: string }) {
  const path = usePagePath()
  return link.facets.length ? (
    <>
      <FacetList groups={link.facets} id={id} />
      <div className={s.sheetGroup}><ul className={m.list}><li><SiteLink className={b.row} href={link.href}><span className={s.name}>{all}</span></SiteLink></li></ul></div>
    </>
  ) : (
    <ul className={m.list}>
      {link.kids.map((k) => (
        <li key={k.href}>
          <SiteLink className={b.row} href={k.href} aria-current={k.href === path ? 'true' : undefined}>
            {k.sign ? <Icon id={k.sign} /> : null}
            <span className={s.name}>{k.label}</span>
          </SiteLink>
        </li>
      ))}
    </ul>
  )
}

export function NavLinks({ links, className, more, overflow, all = '' }: { links: NavLink[]; className: string; more: string; overflow?: string; all?: string }) {
  const path = usePagePath()
  const [open, setOpen] = useState<string | null>(null)
  const [cut, setCut] = useState<number | null>(null)
  const list = useRef<HTMLUListElement>(null)
  const waits = useRef(new Map<HTMLElement, number>())
  useEffect(() => {
    const held = waits.current
    return () => { for (const t of held.values()) window.clearTimeout(t) }
  }, [])
  /* Наведение мыши открывает и закрывает панель своей полки. Панель — потомок
     пункта списка, так что путь от слова к панели через зазор не «уходит»:
     вход в панель отменяет ожидающий уход. Стрелки в строке нет (шторка,
     узкая коробка) — наведения нет. */
  const glide = (e: PointerEvent<HTMLLIElement>, want: boolean) => {
    if (e.pointerType !== 'mouse') return
    const li = e.currentTarget
    const panel = li.querySelector<HTMLElement>(':scope > [data-drop]')
    const arrow = li.querySelector<HTMLElement>(':scope > [data-drop-arrow]')
    if (!panel || !arrow?.getClientRects().length) return
    window.clearTimeout(waits.current.get(li))
    waits.current.set(li, window.setTimeout(() => {
      if (panel.matches(':popover-open') === want) return
      if (want) panel.showPopover(); else panel.hidePopover()
    }, want ? ENTER : LEAVE))
  }
  useLayoutEffect(() => {
    const ul = list.current
    const nav = ul?.closest('nav')
    if (!ul || !nav || !overflow) return
    const items = [...ul.querySelectorAll<HTMLElement>(':scope > li:not([data-more])')]
    let widths: number[] = []
    const tail = ul.querySelector<HTMLElement>(':scope > li[data-more]')
    const fit = () => {
      if (nav.matches(':popover-open, [data-leaving]') || !nav.clientWidth) { setCut(null); return }
      if (!widths.length || widths.some((w) => !w)) widths = items.map((li) => li.getBoundingClientRect().width)
      const gap = parseFloat(getComputedStyle(ul).columnGap) || 0
      const room = nav.clientWidth
      const total = widths.reduce((a, w) => a + w, 0) + gap * (widths.length - 1)
      if (total <= room) { setCut(null); return }
      /* Ширина «Ещё» меряется показанной: скрытая она нулевая. */
      const was = tail?.style.display ?? ''
      if (tail) tail.style.display = 'flex'
      const reserve = (tail?.getBoundingClientRect().width ?? 0) + gap
      if (tail) tail.style.display = was
      let used = 0, n = 0
      while (n < widths.length && used + widths[n] + (n ? gap : 0) + reserve <= room) { used += widths[n] + (n ? gap : 0); n++ }
      setCut(n)
    }
    const watch = new ResizeObserver(fit)
    watch.observe(nav)
    fit()
    return () => watch.disconnect()
  }, [overflow, links])
  /* id — свои у каждого экземпляра: «shelf-more» совпадал с id полки «ещё»
     на странице каталога (Catalog.tsx), а меню полок стоит и образцом в
     дизайн-системе. */
  const at = `shelf-${useId().replace(/:/g, '')}`
  const moreId = `${at}-more`
  return (
    <ul ref={list} className={className}>
      {links.map((l, i) => {
        const id = `${at}-params-${i}`
        const shown = open === l.href
        const drops = l.menu || l.kids.length > 0
        return (
          <li key={l.href} data-params={l.menu ? '' : undefined} data-drops={drops ? '' : undefined} data-over={cut !== null && i >= cut ? '' : undefined} style={drops ? { '--shelf-anchor': `--${at}-${i}` } as CSSProperties : undefined} onPointerEnter={drops ? (e) => glide(e, true) : undefined} onPointerLeave={drops ? (e) => glide(e, false) : undefined}>
            <SiteLink className={b.word} data-hand="menu" href={l.href} aria-current={l.href === path ? 'page' : undefined}>
              {l.sign ? <span className={s.sign} aria-hidden="true"><Icon id={l.sign} /></span> : null}
              <span className={s.name}>{l.label}</span>
              {l.line ? <span className={s.line}>{l.line}</span> : null}
            </SiteLink>
            {l.menu ? (
              <>
                <button className={`${b.btn} ${s.params}`} data-voice="bare" data-pager="" type="button" aria-expanded={shown} aria-controls={id} aria-label={l.facets.length ? more.replace('{name}', l.label) : l.label} onClick={() => setOpen(shown ? null : l.href)}>
                  <Turn />
                </button>
                <div className={s.paramsPanel} id={id} hidden={!shown}>
                  <Fold link={l} id={id} all={all} />
                </div>
              </>
            ) : null}
            {drops ? (
              <>
                <button className={`${s.dropArrow} ${fs.trigger} ${b.word}`} type="button" data-hand="menu" data-drop-arrow="" popoverTarget={`${id}-drop`} aria-label={more.replace('{name}', l.label)}>
                  <Turn />
                </button>
                <div id={`${id}-drop`} popover="auto" data-drop="" data-scroll-shut data-align="start" className={`${p.menu} ${fs.drop} ${s.dropPanel}`} aria-label={l.label}>
                  <DropBody link={l} id={`${id}-drop`} />
                </div>
              </>
            ) : null}
          </li>
        )
      })}
      {overflow ? (
        <li className={s.more} data-more="" data-on={cut !== null ? '' : undefined}>
          <button className={`${s.moreBtn} ${fs.trigger} ${b.word}`} type="button" data-hand="menu" popoverTarget={moreId}>{overflow}<Turn /></button>
          <ul id={moreId} popover="auto" className={`${p.menu} ${fs.drop} ${m.list}`} data-align="end" aria-label={overflow}>
            {links.slice(cut ?? links.length).map((l) => <li key={l.href}><SiteLink className={b.row} href={l.href} aria-current={l.href === path ? 'page' : undefined}>{l.label}</SiteLink></li>)}
          </ul>
        </li>
      ) : null}
    </ul>
  )
}
