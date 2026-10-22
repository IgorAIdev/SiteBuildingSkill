import cat from './CategoryTile.module.css'
import type { CatLook } from '@/lib/look-values.ts'
import { CategoryButton } from './CategoryButton.tsx'
import { CategoryTile } from './CategoryTile.tsx'

export type CategoryPath = { label: string; sign: string | null; href: string }

/* Кнопки полок — в том виде, что выбран для сайта (`--cat-look`, панель Look → Home):
   `dot` — «все товары» залитой пилюлей и полки тихими пилюлями (CategoryButton),
   `grid` — «все товары» пилюлей сверху и полки плитками (CategoryTile). Решает вид
   здесь, один раз: первый экран и пустая корзина берут этот компонент, а не выбирают
   контрол каждое у себя (правило 10). 22.10.2026 пустая корзина поставила плитки при
   опубликованных пилюлях — вид, которого на сайте нет; заказчик: «на такой же дизайн
   где-то ещё есть на сайте?», «когда придумываешь дизайн, он должен быть согласно
   дизайн-системе». Раскладку ряда (`list` — классы и атрибут списка пилюль) даёт место:
   на первом экране — полоса пути (`rail`), в окне — ряд с переносом (`cluster`). */
export function CategoryPaths({ look, all, shelves, list, gridClass }: {
  look: CatLook
  all: CategoryPath
  shelves: CategoryPath[]
  list: { className: string; rail?: 'wrap' }
  gridClass?: string
}) {
  if (look === 'grid') {
    return (
      <div className={gridClass}>
        <CategoryButton name={all.label} sign={all.sign} href={all.href} />
        <ul className={cat.grid}>
          {shelves.map((x) => <li key={x.href}><CategoryTile name={x.label} sign={x.sign} href={x.href} /></li>)}
        </ul>
      </div>
    )
  }
  return (
    <ul className={list.className} data-rail={list.rail}>
      <li><CategoryButton name={all.label} sign={all.sign} href={all.href} /></li>
      {shelves.map((x) => <li key={x.href}><CategoryButton quiet name={x.label} sign={x.sign} href={x.href} /></li>)}
    </ul>
  )
}
