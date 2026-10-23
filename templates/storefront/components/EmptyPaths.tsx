import p from '@/styles/primitives.module.css'
import type { ShelvesView } from '@/lib/shelves-view.ts'
import type { CatLook } from '@/lib/look-values.ts'
import { CategoryPaths } from './CategoryPaths.tsx'
import { ShelfRows } from './ShelfRows.tsx'
import { StateScreen } from './StateScreen.tsx'

/* Пустой экран с путями — слово и пути, ничего больше: пустая корзина (шторка, страница,
   образец). Слово заказчика 08.10.2026: «в пустой корзине предложи категории примерно как
   в поиске… не наляписто, минималистично»; И689. Пустое избранное ушло на полку ходовых
   товаров (20.10.2026: «в избранном не нужно повторять категории, они же в меню есть»). Заголовок, под ним одна строка-приглашение (спокойно, без «!», как
   велит голос витрины) и полки, «все товары» первой. Ни знака в круге, ни громкой кнопки
   сверх «всех товаров».

   Пути берут то, что сайт уже показывает в том же месте (22.10.2026: «на такой же дизайн
   где-то ещё есть на сайте?»). В окне (`pane`) — строки полок со знаком, как в окне поиска
   (`ShelfRows`, слово заказчика 23.10.2026 со снимком шторки: «пилюли в шторке не скролятся,
   сделай их просто в столбик вертикально… так же, как в поиске, иконками, а не пилюлями»):
   ряд пилюль в узком окне уходил за край. На странице — кнопки категорий сайта
   (`CategoryPaths`, `--cat-look`: пилюли или плитки), тот же ряд, что на первом экране:
   полоса пути (`rail`, `data-rail="wrap"`), шире шва 560 переносится, на телефоне — одна
   строка вбок (слово заказчика 23.10.2026 о рядах ссылок; check:craft `linkRow`). Одна
   разметка на все пустые экраны этого рода (правило 10). */
export function EmptyPaths({ level, title, lead, shelves, cat, pane = false }: { level: 1 | 2; title: string; lead: string; shelves: ShelvesView; cat: CatLook; pane?: boolean }) {
  const [all, ...rest] = shelves.links
  return (
    <StateScreen level={level} kind="empty" title={title} lead={lead} flush after={!all ? null : pane ? (
      <ShelfRows rows={shelves.links} label={shelves.label} />
    ) : (
      <nav aria-label={shelves.label}>
        <CategoryPaths look={cat} all={all} shelves={rest} list={{ className: p.rail, rail: 'wrap' }} gridClass={p.stack} />
      </nav>
    )} />
  )
}
