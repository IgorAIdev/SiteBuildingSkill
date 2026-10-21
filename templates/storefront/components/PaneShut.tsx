'use client'
import { useEffect } from 'react'

/* Переход из окна закрывает окно — одно правило на весь сайт (шторка меню, окно поиска,
   выпадающие меню). Ссылки сайта идут мягким переходом (SiteLink): страница не грузится
   заново, и открытое поверх окно оставалось открытым над новой страницей (слово заказчика
   21.10.2026 с телефона: «меню после выбора не закрывается»). Щелчок по ссылке внутри
   открытого окна закрывает его и окна, в которых оно лежит; ссылка в новую вкладку
   (Ctrl, Cmd, Shift, средняя кнопка, `target`) окно не трогает — страница остаётся та же.
   Закрывается и при выборе той страницы, где уже стоишь: адрес не меняется, а выбор
   сделан. */
export function PaneShut() {
  useEffect(() => {
    const on = (e: MouseEvent) => {
      /* `defaultPrevented` не спрашивается: ссылка сайта (next/link) сама отменяет переход
         браузера, чтобы перейти без перезагрузки, — это всё равно переход. */
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!link || link.getAttribute('target') || link.hasAttribute('download')) return
      for (let pane = link.closest<HTMLElement>('[popover]:popover-open'); pane; pane = pane.parentElement?.closest<HTMLElement>('[popover]:popover-open') ?? null) pane.hidePopover()
    }
    document.addEventListener('click', on)
    return () => document.removeEventListener('click', on)
  }, [])
  return null
}
