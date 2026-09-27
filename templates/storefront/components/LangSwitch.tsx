'use client'
import { usePathname } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import s from './LangSwitch.module.css'
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
   чтения вслух (`aria-label`). */
export function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const path = usePathname()
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
