'use client'
import { useId } from 'react'
import { usePathname } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import fs from './Filters.module.css'
import s from './LangSwitch.module.css'
import { Turn } from './Turn.tsx'
import { LANG_NAMES, LOCALES, type Lang } from '@/lib/locale.ts'

const FIRST = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`)

/* Выбор языка — один на сайт (И479): коды языков одним блоком-
   переключателем на примитиве сегментов (`seg`, тот же, что выбор варианта
   товара) — в шапке, в шторке меню и в подвале. Слово заказчика
   27.09.2026: «выбор языка, как и все второстепенные функции, нужно делать
   минималистично… если это выбор из близких параметров, стоит объединить в
   единый блок, типа переключатель»; образцы — cbdin.bg «BG | EN», cbdshop.bg
   «Език BG EN». До того язык выбирался тремя устройствами: выпадающим
   списком «EN ▾» в шапке, строкой имён в шторке и столбцом имён в подвале,
   со своим разбором адреса в двух файлах.

   Ссылка ведёт на ту же страницу на другом языке (язык — первый сегмент
   адреса). Видимо — код, вслух — код и имя языка на нём самом («EN
   English»): видимое слово входит в имя (WCAG 2.5.3). Блок назван для
   чтения вслух (`aria-label`).

   Правило шапки (слово заказчика 27.09.2026): языков больше двух — в
   строке шапки выбор выпадающим меню, а не сегментами. Три кода рядом
   занимали в строке место полок и поиска; два — пара, и переключатель
   читается одним жестом. Раскрытие — то же, что у порядка полки
   (SortMenu.tsx): кнопка с текущим кодом и стрелкой, список ссылок в
   верхнем слое (`popover`), Escape и щелчок мимо — от браузера. В шторке
   меню и в подвале места хватает — там сегменты при любом числе языков;
   какое место — говорит `drop`. */
export const DROP_FROM = 3

/* Кнопка раскрытия в шапке — тихая, как значки поиска и корзины рядом
   (`trigger` — их класс из шапки): слово заказчика 28.09.2026 «не должна
   быть кнопка языка более кричащей, чем корзина». В рамке кнопки она
   перекрикивала значки без рамки. */
export function LangSwitch({ lang, label, drop = false, trigger = b.btn }: { lang: Lang; label: string; drop?: boolean; trigger?: string }) {
  const path = usePathname()
  const id = useId()
  if (drop && LOCALES.length >= DROP_FROM) {
    const list = `lang-${id.replace(/:/g, '')}`
    return (
      <div className={`${fs.facet} ${s.drop}`}>
        <button className={`${trigger} ${fs.trigger}`} type="button" popoverTarget={list} aria-label={`${label}: ${lang.toUpperCase()} ${LANG_NAMES[lang]}`}>
          {lang.toUpperCase()}<Turn />
        </button>
        <ul id={list} popover="auto" className={`${p.menu} ${fs.drop} ${fs.options}`} data-align="end" aria-label={label}>
          {LOCALES.map((l) => (
            <li key={l}>
              <a href={path.replace(FIRST, `/${l}`)} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>
                {l.toUpperCase()}<span className={s.name}>{LANG_NAMES[l]}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return (
    /* Группа, а не меню: переключатель — орган (как выбор варианта), не
       навигация по разделам. */
    <div className={s.lang} role="group" aria-label={label}>
      <ul className={p.seg}>
        {LOCALES.map((l) => (
          <li key={l}>
            <a href={path.replace(FIRST, `/${l}`)} hrefLang={l} lang={l} aria-current={l === lang ? 'true' : undefined}>
              {l.toUpperCase()}<span className={p.said}> {LANG_NAMES[l]}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
