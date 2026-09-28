import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import p from '@/styles/primitives.module.css'
import s from './SearchForm.module.css'
import { Icon } from './Icon.tsx'

/* Поле поиска — одно на сайт: страница поиска и «не найдено» берут его
   отсюда. Отправка — знаком внутри поля, тихой кнопкой (разбор 24.09.2026,
   Q3): громкая «Search» рядом с полем отнимала у него на телефоне треть
   строки и тратила на поле единственный громкий голос экрана. Поле — мерой
   строки, а не во всю коробку: поле на 1300px читается полосой, а не
   местом, куда вписать слово. На странице поле одно — `id` постоянный. */
/* Поиск в шапке — это же поле (И481): до 27.09.2026 шапка рисовала своё —
   знак отправки рядом с полем, а не в нём. В шапке подпись не видна
   (`quiet`: ряд шапки подписью не растёт, вслух она остаётся), подсказка
   внутри поля — та же подпись; `id` у поля свой — на странице поиска стоят
   оба. */
export function SearchForm({ action, q, label, submit, id = 'search-q', quiet = false, className = '' }: {
  action: string; q: string; label: string; submit: string; id?: string; quiet?: boolean; className?: string
}) {
  return (
    <form className={`${f.field} ${s.form} ${className}`} action={action} method="get" role="search">
      <label className={quiet ? p.said : f.label} htmlFor={id}>{label}</label>
      <div className={s.box}>
        <input id={id} className={`${f.box} ${s.input}`} name="q" type="search" defaultValue={q} enterKeyHint="search" placeholder={quiet ? label : undefined} />
        <button className={`${b.btn} ${s.go}`} data-voice="bare" data-size="sm" type="submit" aria-label={submit}><Icon id="search" /></button>
      </div>
    </form>
  )
}
