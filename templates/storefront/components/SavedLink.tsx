'use client'
import s from './Header.module.css'
import { usePathname } from 'next/navigation'
import { useSaved } from '@/lib/saved.ts'
import { hrefFor } from '@/lib/href.ts'
import type { Lang } from '@/lib/locale.ts'
import { Icon } from './Icon.tsx'

/* Избранное — знаком сердца с числом на углу, тем же, что у корзины
   (`badge`). Ведёт на страницу избранного со списком в адресе. На самой странице
   избранного знак — текущий (`aria-current`), с той же отметкой, что слово меню
   (И715); список в адресе путь не меняет. Один знак и в шапке, и в низу шторки
   меню (И772): строкой «Favourites · 11» он там стоял до 05.10.2026 и был
   единственным словом среди знаков. */
export function SavedLink({ lang, label }: { lang: Lang; label: string }) {
  const saved = useSaved()
  const here = usePathname() === new URL(hrefFor(lang, { saved: [] }), 'http://x').pathname
  const href = hrefFor(lang, { saved })
  return (
    <a className={s.glyph} href={href} aria-current={here ? 'page' : undefined} aria-label={saved.length ? `${label} (${saved.length})` : label}>
      <span className={s.cartSign}>
        <Icon id="heart" />
        {saved.length ? <span className={s.badge} aria-hidden="true">{saved.length}</span> : null}
      </span>
    </a>
  )
}
