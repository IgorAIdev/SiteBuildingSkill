'use client'
import { themeCookie, type Theme } from '@/lib/theme.ts'
import { Icon } from './Icon.tsx'

/* День / ночь — один тихий знак (бриф docs/design/шапка.md): в светлой теме
   виден месяц, в тёмной — солнце, то есть знак показывает, КУДА переключит.
   Какой из двух виден, решает стиль по `data-theme` и по системе, а не
   состояние React: сервер не знает выбора, и знак не мигает при оживлении.
   Нажатие меняет `data-theme` на корне и пишет cookie (lib/theme.ts). */
/* Переключение — вне компонента: состояния у него нет, память — корень и cookie. */
const flip = () => {
  const root = document.documentElement
  const now: Theme = (root.dataset.theme as Theme | undefined) ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const next: Theme = now === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  document.cookie = themeCookie(next)
}

export function ThemeToggle({ label, className, sun, moon }: { label: string; className: string; sun: string; moon: string }) {
  return (
    <button className={className} type="button" data-hand="menu" onClick={flip} aria-label={label}>
      <span className={moon}><Icon id="moon" /></span>
      <span className={sun}><Icon id="sun" /></span>
    </button>
  )
}
