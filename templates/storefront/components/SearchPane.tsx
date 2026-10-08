'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import pn from '@/styles/pane.module.css'
import s from './SearchPane.module.css'
import type { ShelfCard } from '@/lib/view.ts'
import { shot } from '@/lib/shot.ts'
import { Icon } from './Icon.tsx'
import { PaneHandle } from './PaneHandle.tsx'
import { PaneHead } from './PaneHead.tsx'

type Found = { q: string; total: number; href: string; cards: ShelfCard[] }
type Words = { clear: string; open: string; close: string; label: string; submit: string; all: string; found: string; none: string; shelves: string }
type Shelf = { label: string; href: string; sign: string | null }

/* Поиск из шапки — окно сверху, а не переход на страницу (слово заказчика
   28.09.2026: «что должно открываться при нажатии? поле ввода как-то, но не
   отдельная страница, как сделано у профессионалов»; бриф
   docs/design/поиск.md). Знак открывает окно общего модуля
   (styles/pane.module.css, `data-pane="top"`): поле в фокусе сразу, под ним
   пока пусто — полки магазина, с двух букв — первые товары (`/api/search`)
   и ссылка на все результаты. Enter — страница поиска, как без скрипта:
   поле — обычная форма GET. */
const WAIT = 200

export function SearchPane({ lang, action, words, shelves, trigger }: { lang: string; action: string; words: Words; shelves: Shelf[]; trigger: string }) {
  const id = `search-${useId().replace(/:/g, '')}`
  const pane = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  /* На странице поиска лупа — текущая, с отметкой слова меню (И715). */
  const here = usePathname() === new URL(action, 'http://x').pathname
  const [q, setQ] = useState('')
  const [found, setFound] = useState<Found | null>(null)
  useEffect(() => {
    const el = pane.current
    if (!el) return
    const on = (e: Event) => { if ((e as ToggleEvent).newState === 'open') field.current?.focus() }
    el.addEventListener('toggle', on)
    return () => el.removeEventListener('toggle', on)
  }, [])
  useEffect(() => {
    const asked = q.trim()
    if (asked.length < 2) return
    const stop = new AbortController()
    const wait = window.setTimeout(() => {
      fetch(`/api/search?lang=${lang}&q=${encodeURIComponent(asked)}`, { signal: stop.signal })
        .then((r) => (r.ok ? (r.json() as Promise<Found>) : null))
        .then((d) => { if (d) setFound(d) })
        .catch(() => {})
    }, WAIT)
    return () => { window.clearTimeout(wait); stop.abort() }
  }, [q, lang])
  const shown = q.trim().length >= 2 && found?.q === q.trim() ? found : null
  return (
    <>
      <button className={trigger} type="button" popoverTarget={id} aria-label={words.open} aria-current={here ? 'page' : undefined}><Icon id="search" /></button>
      <div ref={pane} id={id} popover="auto" className={pn.pane} data-pane="top" aria-label={words.label}>
        <PaneHead wide title={words.label} close={words.close} target={id} />
        <div className={pn.body}>
          <div className={`${p.wrap} ${s.body}`}>
            <form className={s.form} action={action} method="get" role="search">
              <label className={p.said} htmlFor={`${id}-q`}>{words.label}</label>
              <Icon id="search" />
              <input ref={field} id={`${id}-q`} className={`${f.box} ${s.input}`} name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" placeholder={words.label} autoComplete="off" />
            </form>
            <p className={s.head} role="status">{shown ? `${words.found} · ${new Intl.NumberFormat(lang).format(shown.total)}` : words.shelves}</p>
            {q ? (
              <div className={`${pn.acts} ${s.actions}`}>
                {shown ? <a className={b.btn} href={shown.href}>{words.all.replace('{q}', shown.q)}<Icon id="arrow-right" /></a> : null}
                <button className={b.btn} type="button" onClick={() => { setQ(''); field.current?.focus() }}>{words.clear}</button>
              </div>
            ) : null}
            {shown ? (
              shown.cards.length ? (
                <>
                  <ul className={s.found}>
                    {shown.cards.map((c) => (
                      <li key={c.id}>
                        <a className={s.hit} href={c.href}>
                          <span className={`${p.frame} ${s.thumb}`}><img {...shot(c.image, 'thumb', true)} alt="" decoding="async" /></span>
                          <span className={s.what}>{c.brand ? <span className={s.brand} translate="no">{c.brand}</span> : null}<span className={s.name}>{c.name}</span></span>
                          <span className={s.price}>{c.price}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : <p className={s.none}>{words.none.replace('{q}', shown.q)}</p>
            ) : (
              <>
                {/* Полки — тихими строками со знаком товара, как найденные товары
                    ниже в том же окне, а не кнопками и не фишками (слова заказчика
                    03.10.2026: «кнопки не из дизайн-системы — приведи к единому
                    виду», затем «не слишком ли это ярко… может текст»; И691).
                    У профессионалов в окне поиска пути — текстом: Apple «Quick
                    Links» строками, предиктивный поиск Shopify — строками. */}
                <ul className={s.shelves}>{shelves.map((x) => <li key={x.href}><a className={`${b.row} ${s.shelf}`} href={x.href}><Icon id={x.sign ?? 'arrow-right'} /><span className={s.shelfName}>{x.label}</span></a></li>)}</ul>
              </>
            )}
          </div>
        </div>
        <PaneHandle />
      </div>
    </>
  )
}
