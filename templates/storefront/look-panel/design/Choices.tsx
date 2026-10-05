'use client'
import { useState, type ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s_ from './design.module.css'
import { useStudio, type Option, type Studio } from './studio.ts'

/* Выбор на странице дизайн-системы — только палитра (И572: выбор вида
   живёт в панели Look, страница показывает дизайн-систему; палитру
   выбирают и здесь). Вариант — карточкой: имя и «Выбрать» всегда сверху
   (слово заказчика 29.09.2026: «названия пиши сверху всегда»), под ними
   образец. Образец не нажимается (`inert`): щелчок по нему выбирает
   вариант. Щелчок — общее состояние (studio.ts): предпросмотр на всём
   сайте и черновик. «Сохранить вид» — полоса под выбором. */

/** Карточка варианта: имя, строка и «Выбрать» сверху, образец под ними. */
function ChoiceCard({ s, field, o, children }: { s: Studio; field: string; o: Option; children: ReactNode }) {
  const hit = s.blockedBy(field, o.id)
  const on = s.names[field] === o.id
  const pick = () => { if (!hit) s.pick(field, o.id) }
  return (
    <li className={s_.set} data-on={on} aria-disabled={hit ? true : undefined}>
      <div className={s_.setHead}>
        <span className={s_.setName}>{o.name}</span>
        <button type="button" className={b.btn} data-size="sm" data-voice={on ? 'loud' : undefined} aria-pressed={on} disabled={Boolean(hit)} onClick={pick}>{on ? 'Выбрано' : 'Выбрать'}</button>
      </div>
      {hit ? <p className={p.note}>Не с «{s.title(hit.field, hit.id)}» — {hit.why}</p> : o.line ? <span className={s_.setLine}>{o.line}</span> : null}
      <div className={s_.setSample} onClick={pick}><div inert>{children}</div></div>
    </li>
  )
}

/** Варианты поля карточками; образец варианта рисует тот, кто выбирает. */
export function Choices({ s, field, sample }: { s: Studio; field: string; sample: (o: Option) => ReactNode }) {
  return <ul className={`${p.grid} ${s_.sets}`}>{(s.catalog.groups[field] ?? []).map((o) => <ChoiceCard key={o.id} s={s} field={field} o={o}>{sample(o)}</ChoiceCard>)}</ul>
}

const SAID: Record<string, string> = {
  saving: 'Сохраняю черновик…', saved: 'Черновик сохранён.', notSaved: 'Черновик не сохранён.', draftSilent: 'Черновик не сохранён: сервер не ответил.',
  checking: 'Проверяю это сочетание — около минуты…', failed: 'Не сохранено: проверка сайта не прошла.', passed: 'Проверка пройдена. Сохраняю…',
  published: 'Сохранено: витрина теперь с этим видом.', publishedSoon: 'Сохранено: страницы подхватят вид в течение минуты.', publishSilent: 'Не сохранено: сервер не ответил.',
}

/** «Сохранить вид» — та же проверка сочетания и публикация, что в панели; строка итога. */
export function SaveBar() {
  const { s, said } = useStudio()
  const [busy, setBusy] = useState(false)
  if (!s) return null
  const bad = s.clashes()
  return (
    <div className={s_.actions}>
      <div className={p.cluster}>
        <button type="button" className={b.btn} data-voice="loud" disabled={busy || bad.length > 0} title={bad[0]?.why}
          onClick={() => { setBusy(true); s.publish().finally(() => setBusy(false)) }}>Сохранить вид</button>
        {s.drafting ? <button type="button" className={b.btn} onClick={() => s.stop()}>Вернуть сохранённый</button> : null}
      </div>
      <output className={p.note} aria-live="polite">
        {said ? SAID[said.code] ?? said.code : s.drafting ? 'Сайт показывает черновик — вид ещё не сохранён.' : 'Щелчок по варианту сразу меняет весь сайт черновиком; «Сохранить вид» проверяет сочетание и закрепляет его за витриной.'}
        {said?.detail ? <details><summary>Подробнее</summary><pre>{said.detail}</pre></details> : null}
      </output>
    </div>
  )
}
