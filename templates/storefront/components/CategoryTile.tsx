import c from './CategoryTile.module.css'
import { Icon } from './Icon.tsx'
import { SiteLink } from './SiteLink.tsx'

/* Плитка категории — вид «сетка девяти» оси «Кнопки категорий» (панель Look →
   Home; слово заказчика 14.10.2026: «давай сетка девяти попробуем»). Знак
   товара над именем полки, плитка — ссылка на полку. Второй вид той же
   кнопки (CategoryButton — «кружок со знаком»): выбирает ось `--cat-look`,
   страница читает её у вида (app/[site]/[lang]/page.tsx) и кладёт в `ctx.cat`;
   Hero ставит либо ряд кнопок, либо сетку плиток. Полки без знака плитка не
   рисует пустой — знак листа `shop-awning` стоит вместо него. */
export function CategoryTile({ name, sign, href }: { name: string; sign: string | null; href: string }) {
  return (
    <SiteLink className={c.tile} href={href} data-tile="" data-lines="">
      <Icon id={sign ?? 'shop-awning'} className={c.sign} />
      <span className={c.name}>{name}</span>
    </SiteLink>
  )
}
