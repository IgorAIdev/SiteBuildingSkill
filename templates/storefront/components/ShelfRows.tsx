import b from '@/styles/btn.module.css'
import s from './ShelfRows.module.css'
import { Icon } from './Icon.tsx'
import { SiteLink } from './SiteLink.tsx'

export type ShelfRow = { label: string; href: string; sign: string | null }

/* Полки магазина — тихими строками со знаком товара: окно поиска под пустым
   полем и в пустой шторке корзины (EmptyPaths `pane`, 23.10.2026). Одна разметка (правило 10):
   строка — вид `row` (styles/btn.module.css), слово — ролью меню, знак — тихий.
   Не кнопки и не фишки: путь — текст (слова заказчика 03.10.2026: «не слишком ли
   это ярко… может текст»; 08.10.2026: «в пустой корзине предложи категории
   примерно как в поиске… минималистично»; И691). `label` — имя списка для
   чтения вслух: страница, где строки стоят сами, называет их `nav`. */
export function ShelfRows({ rows, label }: { rows: ShelfRow[]; label?: string }) {
  const list = (
    <ul className={s.shelves}>
      {rows.map((x) => <li key={x.href}><SiteLink className={`${b.row} ${s.shelf}`} href={x.href}><Icon id={x.sign ?? 'arrow-right'} /><span className={s.shelfName}>{x.label}</span></SiteLink></li>)}
    </ul>
  )
  return label ? <nav aria-label={label}>{list}</nav> : list
}
