import p from '@/styles/primitives.module.css'
import type { ShelvesView } from '@/lib/shelves-view.ts'
import type { CatLook } from '@/lib/look-values.ts'
import { CategoryPaths } from './CategoryPaths.tsx'
import { StateScreen } from './StateScreen.tsx'

/* Пустой экран с путями — слово и пути, ничего больше: пустая корзина (шторка, страница,
   образец). Слово заказчика 08.10.2026: «в пустой корзине предложи категории примерно как
   в поиске… не наляписто, минималистично»; И689. Пустое избранное ушло на полку ходовых
   товаров (20.10.2026: «в избранном не нужно повторять категории, они же в меню есть»). Заголовок, под ним одна строка-приглашение (спокойно, без «!», как
   велит голос витрины) и полки — кнопками категорий сайта (`CategoryPaths`): тот же вид,
   что на первом экране (`--cat-look`: пилюли или плитки), «все товары» первой. Ни знака в
   круге, ни громкой кнопки сверх «всех товаров».

   Прежде (22.10.2026) пустая корзина ставила плитки сетки при опубликованных пилюлях — вид,
   которого на сайте не было нигде; заказчик: «на такой же дизайн где-то ещё есть на сайте?».
   Новое место берёт контрол в том виде, что сайт уже выбрал, а не придумывает свой.
   Пилюли в окне — рядом с переносом (`cluster`): полоса вбок первого экрана в окне 400
   показала бы полторы кнопки. Одна разметка на все пустые экраны этого рода (правило 10). */
export function EmptyPaths({ level, title, lead, shelves, cat }: { level: 1 | 2; title: string; lead: string; shelves: ShelvesView; cat: CatLook }) {
  const [all, ...rest] = shelves.links
  return (
    <StateScreen level={level} kind="empty" title={title} lead={lead} flush after={all ? (
      <nav aria-label={shelves.label}>
        <CategoryPaths look={cat} all={all} shelves={rest} list={{ className: p.cluster }} gridClass={p.stack} />
      </nav>
    ) : null} />
  )
}
