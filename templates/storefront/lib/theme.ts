/** Тема по выбору покупателя (ось `theme`, tools/axes.mjs): без выбора — как
 *  у системы (`color-scheme: light dark` на корне); выбор — cookie, и тогда
 *  `[data-theme]` на корне ставит ТОЛЬКО `color-scheme` (styles/tokens.css),
 *  цвета остаются функцией `light-dark()`. Имя cookie и разбор — здесь одним
 *  местом: их читают скрипт до первой отрисовки (Shell) и переключатель. */
export const THEME_COOKIE = 'theme'
export type Theme = 'light' | 'dark'

/** Скрипт до первой отрисовки: ставит `data-theme` из cookie, пока страница
 *  не показана, — иначе тёмный выбор мигал бы светлым кадром. Строкой, потому
 *  что исполняется в `<script>` до React; делает одно и не ходит в сеть. */
export const THEME_BOOT = `(function(){var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);if(m)document.documentElement.dataset.theme=m[1]})()`

/** Год — срок выбора; путь — весь сайт, иначе у каждого языка своя тема. */
export const themeCookie = (theme: Theme): string => `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`
