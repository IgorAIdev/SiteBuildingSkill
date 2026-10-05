'use client'
import s from './Header.module.css'
import { usePathname } from 'next/navigation'
import { hrefFor } from '@/lib/href.ts'
import type { Lang } from '@/lib/locale.ts'
import { Icon } from './Icon.tsx'

/* Кабинет (И771): знаком человека сразу за сердцем, перед корзиной, как у своей
   витрины заказчика (cbdshop.bg: «Любими · Вход в профила»). Ведёт на кабинет: гостю
   там вход, вошедшему — заказы. Знак один для обоих — шапка общая у всех страниц и
   сессию не читает, иначе каждая страница стала бы личной. На страницах кабинета
   знак — текущий, с той же отметкой, что слово меню (И715). `sheet` — знак в низу
   шторки меню (И772): на узкой коробке из шапки он уходит (`.account`, на 360 между
   знаком и знаками остаётся 48), и в шторке стоит тем же знаком, без шапочного
   класса. */
export function AccountLink({ lang, label, sheet = false }: { lang: Lang; label: string; sheet?: boolean }) {
  const home = hrefFor(lang, { account: 'home' })
  const path = usePathname()
  const current = path === home || path.startsWith(`${home}/`) ? 'page' : undefined
  return <a className={sheet ? s.glyph : `${s.glyph} ${s.account}`} href={home} aria-current={current} aria-label={label}><Icon id="user" /></a>
}
