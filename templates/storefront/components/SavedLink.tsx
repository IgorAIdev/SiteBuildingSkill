'use client'
import s from './Header.module.css'
import { usePagePath } from '@/lib/page-path.ts'
import { useSaved } from '@/lib/saved.ts'
import { hrefFor } from '@/lib/href.ts'
import type { Lang } from '@/lib/locale.ts'
import { Icon } from './Icon.tsx'
import { SiteLink } from './SiteLink.tsx'

/* Избранное — знаком сердца с числом на углу, тем же, что у корзины
   (`badge`). Ведёт на страницу избранного со списком в адресе. На самой странице
   избранного знак — текущий (`aria-current`), с той же отметкой, что слово меню
   (И715); список в адресе путь не меняет. Один знак и в шапке, и в низу шторки
   меню (И772): строкой «Favourites · 11» он там стоял до 05.10.2026 и был
   единственным словом среди знаков. */
export function SavedLink({ lang, label }: { lang: Lang; label: string }) {
  const saved = useSaved()
  const here = usePagePath() === new URL(hrefFor(lang, { saved: [] }), 'http://x').pathname
  const href = hrefFor(lang, { saved })
  return (
    <SiteLink className={s.glyph} href={href} aria-current={here ? 'page' : undefined} aria-label={saved.length ? `${label} (${saved.length})` : label}>
      <span className={s.cartSign}>
        <Icon id="heart" />
        {saved.length ? <span className={s.badge} aria-hidden="true">{saved.length}</span> : null}
      </span>
    </SiteLink>
  )
}
