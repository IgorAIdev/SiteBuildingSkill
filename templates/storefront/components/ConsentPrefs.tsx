'use client'
import { useEffect, useRef, useState } from 'react'
import b from '@/styles/btn.module.css'
import m from '@/styles/menu.module.css'
import p from '@/styles/primitives.module.css'
import pn from '@/styles/pane.module.css'
import type { ConsentView } from '@/lib/consent-view.ts'
import { CONSENT_OPEN, CONSENT_PREFS, parseConsent, type Optional } from '@/lib/consent.ts'
import { saveChoice } from '@/lib/consent-save.ts'
import { DocTable } from './DocTable.tsx'
import { PaneHead } from './PaneHead.tsx'
import { Switch } from './Switch.tsx'
import { Turn } from './Turn.tsx'

/* Окно настроек cookie — второй слой согласия (И791). Окно — `<dialog>` +
   `showModal()` (правило 8): Escape, фокус и затемнение — от браузера; тройка
   окна (styles/pane.module.css, И460): шапка стоит (`PaneHead`), прокручивается
   тело; посреди на широком, нижней шторкой на телефоне. Устройство — orestbida
   `preferencesModal` (MIT): строка на категорию — имя и переключатель одной
   строкой, описание под ней, «Ce cookie-uri (n)» свёрткой с таблицей из реестра.
   «Strict necesare» включены и погашены, словом «Mereu active» (orestbida
   `readOnly`); необязательные выключены, пока человек сам не включит (CJEU
   Planet49, C-673/17). Низ — пара окна (И772): тихая «Refuză toate», громкая
   «Salvează alegerea». Открывается событием «Setări cookie» (ConsentOpen) и
   каждый раз — с текущим выбором из cookie. `sample` — образец дизайн-системы:
   переключается и закрывается по-настоящему, но выбор сайта не читает и не
   пишет (И667). */
export function ConsentPrefs({ view, id = CONSENT_PREFS, sample = false }: { view: ConsentView; id?: string; sample?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [picked, setPicked] = useState<Optional[]>([])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const open = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) return
      if (!sample) setPicked(parseConsent(document.cookie)?.categories ?? [])
      d.showModal()
    }
    /* Нажатие мимо окна закрывает его — как у остальных окон сайта (QuickOrder). */
    const miss = (e: MouseEvent) => { if (e.target === d) d.close() }
    window.addEventListener(CONSENT_OPEN, open)
    d.addEventListener('click', miss)
    return () => { window.removeEventListener(CONSENT_OPEN, open); d.removeEventListener('click', miss) }
  }, [id, sample])

  const flip = (c: Optional) => setPicked((now) => (now.includes(c) ? now.filter((x) => x !== c) : [...now, c]))
  const save = (cats: Optional[]) => { if (sample) setPicked(cats); else saveChoice(cats); ref.current?.close() }

  return (
    <dialog ref={ref} id={id} className={pn.pane} data-pane="dialog" aria-labelledby={`${id}-title`} data-print="skip">
      <PaneHead title={view.prefs.title} titleId={`${id}-title`} close={view.prefs.close} onClose={() => ref.current?.close()} />
      <div className={`${pn.body} ${p.stack}`}>
        <p>{view.prefs.lede}</p>
        {view.prefs.categories.map((c) => {
          const key = `${id}-${c.key}`
          const on = c.key === 'necessary' || picked.includes(c.key)
          return (
            <div key={c.key} className={p.stack}>
              <Switch
                label={c.readOnly ? `${c.name} · ${view.prefs.always}` : c.name}
                name={c.key} checked={on} disabled={c.readOnly} aria-describedby={`${key}-desc`}
                onChange={() => { if (c.key !== 'necessary') flip(c.key) }}
              />
              <p id={`${key}-desc`} className={p.note}>{c.desc}</p>
              {c.table.rows.length ? (
                <details className={m.fold}>
                  <summary id={`${key}-list`}>{c.list}<Turn /></summary>
                  <DocTable head={c.table.head} rows={c.table.rows} labelledBy={`${key}-list`} />
                </details>
              ) : null}
            </div>
          )
        })}
      </div>
      <div className={pn.foot}>
        <div className={pn.acts}>
          <button className={b.btn} type="button" onClick={() => save([])}>{view.reject}</button>
          <button className={b.btn} data-voice="loud" type="button" onClick={() => save(picked)}>{view.prefs.save}</button>
        </div>
      </div>
    </dialog>
  )
}
