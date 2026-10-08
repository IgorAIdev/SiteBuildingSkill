import type { Lang } from './locale.ts'
import type { Collection } from './source/contract.ts'
import { hrefFor } from './href.ts'
import { t } from './i18n/index.ts'

/** Пути с пустого экрана (корзина, избранное) — тихими строками со знаком, как в окне поиска
 *  (`ShelfRows`, И689): «все товары» первой, дальше главные полки магазина. */
export type ShelvesView = { label: string; links: { label: string; sign: string | null; href: string }[] }

/** Какие полки — данные главной (`mainShelves`); «все товары» есть всегда, и у экрана без полок путь
 *  дальше остаётся. Знак «всех товаров» — тот же, что у них в меню и в окне поиска (`shop-awning`). */
export const shelvesView = (lang: Lang, shelves: Collection[]): ShelvesView => ({
  label: t(lang, 'nav.categories'),
  links: [
    { label: t(lang, 'nav.catalog'), sign: 'shop-awning', href: hrefFor(lang, { catalog: true }) },
    ...shelves.map((col) => ({ label: col.name, sign: col.sign, href: hrefFor(lang, { category: col.slug }) })),
  ],
})
