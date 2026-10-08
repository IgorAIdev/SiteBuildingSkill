'use client'
import { useEffect, useRef, useState } from 'react'
import b from '@/styles/btn.module.css'
import p from '@/styles/primitives.module.css'
import s from './ConsentBanner.module.css'
import type { ConsentView } from '@/lib/consent-view.ts'
import { CONSENT_EVENT, CONSENT_PREFS, kindOf, type Choice, type Optional } from '@/lib/consent.ts'
import { saveChoice } from '@/lib/consent-save.ts'
import { ConsentOpen } from './ConsentOpen.tsx'

type Done = ReturnType<typeof kindOf>

/* Полоса согласия на cookie — первый слой (И791; бриф docs/design/документы-и-куки.md).
   Образец места — GOV.UK Design System «Cookie banner» (MIT): полоса в потоке
   страницы, над шапкой и до ссылки «к содержимому», не приклеена к низу (WCAG
   2.4.11 — не закрывает фокус; низ занят стопкой помощи и строкой покупки) и не
   окно поверх (решение свободное, страница доступна — EDPB 05/2020 § 39–41).
   «Acceptă toate» и «Refuză toate» — один голос (тихая кнопка сайта) и одна ширина
   (`switcher`): отказаться так же просто, как согласиться (EDPB Cookie Banner
   Taskforce, 17.01.2023); громкой в полосе нет. «Setări cookie» — словом, третьим.
   Своей заливки, тени и хода нет: пол страницы и волосок снизу. Текст полосы —
   не ответ поиска (`data-nosnippet`): он стоит над шапкой на каждой странице.

   Видна, пока корень `[data-consent='ask']` (ставит CONSENT_BOOT до отрисовки):
   выбора нет или он старше версии реестра. После выбора — строка «что выбрано и
   что его можно изменить», с фокусом на ней, и под ней «Setări cookie» с «Ascunde
   mesajul» (GOV.UK: подтверждение несёт путь назад — в кассе подвала нет, И325).
   Выбор из окна настроек, открытого с полосы, кончается той же строкой; выбор из
   подвала потом полосу не показывает. `sample` — образец дизайн-системы: виден
   всегда, кнопки нажимаются, но выбор сайта не трогают — ни cookie, ни события, ни
   журнала (И667); `done` — его состояние «подтверждение». */
export function ConsentBanner({ view, optional, target = CONSENT_PREFS, idPrefix = '', sample = false, done: shown = null }: {
  view: ConsentView; optional: Optional[]; target?: string; idPrefix?: string; sample?: boolean; done?: Done | null
}) {
  const [done, setDone] = useState<Done | null>(shown)
  const [gone, setGone] = useState(false)
  const asking = useRef(false)
  const status = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (sample) return
    asking.current = document.documentElement.dataset.consent === 'ask'
    const on = (e: Event) => {
      if (!asking.current) return
      asking.current = false
      setDone(kindOf((e as CustomEvent<Choice>).detail.categories, optional))
    }
    window.addEventListener(CONSENT_EVENT, on)
    return () => window.removeEventListener(CONSENT_EVENT, on)
  }, [optional, sample])
  useEffect(() => { if (done && !shown) status.current?.focus() }, [done, shown])

  const choose = (cats: Optional[]) => (sample ? setDone(kindOf(cats, optional)) : saveChoice(cats))
  if (gone) return null
  const title = `${idPrefix}consent-title`
  return (
    <section className={s.banner} aria-labelledby={title} data-print="skip" data-nosnippet="" data-done={done ? '' : undefined} data-sample={sample ? '' : undefined}>
      <div className={`${p.wrap} ${p.stack} ${s.inner}`}>
        <h2 id={title} className={s.title}>{view.title}</h2>
        {done ? (
          <>
            <p ref={status} role="status" tabIndex={-1}>{view.done[done]} {view.done.change}</p>
            <div className={`${p.cluster} ${s.acts}`}>
              <ConsentOpen label={view.open} voice="bare" target={target} />
              <button className={b.btn} data-voice="bare" type="button" onClick={() => setGone(true)}>{view.hide}</button>
            </div>
          </>
        ) : (
          <>
            <div className={`${p.stack} ${p.prose} ${s.text}`}>
              <p>{view.lead}</p>
              <p>{view.choose}{view.policy ? <> <a href={view.policy.href}>{view.policy.label}</a></> : null}</p>
            </div>
            <div className={`${p.cluster} ${s.acts}`}>
              <div className={`${p.switcher} ${s.pair}`}>
                <button className={b.btn} type="button" onClick={() => choose(optional)}>{view.accept}</button>
                <button className={b.btn} type="button" onClick={() => choose([])}>{view.reject}</button>
              </div>
              <ConsentOpen label={view.open} voice="bare" target={target} />
            </div>
          </>
        )}
      </div>
    </section>
  )
}
