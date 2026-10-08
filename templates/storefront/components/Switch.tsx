import type { InputHTMLAttributes, ReactNode } from 'react'
import f from '@/styles/form.module.css'
import p from '@/styles/primitives.module.css'

/* Переключатель — да или нет одним нажатием, когда решение действует по
   отдельности (категория согласия на cookie, И791). Порт HyperUI Toggles (MIT):
   `label` → браузерная галочка, скрытая для глаза примитивом `said` (одно место
   на сайт), но в фокусе и в форме (чтец говорит «флажок, отмечен» — как у
   образца; `role="switch"` стандарт на галочке разрешает, но линтер набора тогда
   просит `aria-checked` — второй источник того же состояния рядом с браузерным)
   → дорожка → бегунок. Вид — один на сайт (styles/form.module.css, `.switch`); место решает
   только, где он стоит.
   Состояние — у галочки: `checked` с `onChange` или `defaultChecked`, `disabled`
   — погашен (необходимые cookie включены всегда). */
export function Switch({ label, ...input }: { label: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>) {
  return (
    <label className={f.switch}>
      <span>{label}</span>
      <input type="checkbox" className={p.said} {...input} />
      <span className={f.track} aria-hidden="true"><span className={f.thumb} /></span>
    </label>
  )
}
