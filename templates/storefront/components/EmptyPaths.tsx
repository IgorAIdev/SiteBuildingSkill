import type { ShelvesView } from '@/lib/shelves-view.ts'
import { ShelfRows } from './ShelfRows.tsx'
import { StateScreen } from './StateScreen.tsx'

/* Пустой экран с путями — слово и пути, ничего больше: пустая корзина (шторка, страница,
   образец) и пустое избранное. Слово заказчика 08.10.2026: «в пустой корзине предложи
   категории примерно как в поиске… не наляписто, минималистично», затем «и пустое избранное
   так же сделаем»; И689. Заголовок, под ним одна строка-приглашение (спокойно, без «!», как
   велит голос витрины) и тихие строки `ShelfRows`, те же, что в окне поиска под пустым полем:
   «все товары» первой, дальше главные полки. Ни знака в круге, ни громкой кнопки, ни кнопок
   категорий — путь есть текст. Одна разметка на все пустые экраны этого рода (правило 10). */
export function EmptyPaths({ level, title, lead, shelves }: { level: 1 | 2; title: string; lead: string; shelves: ShelvesView }) {
  return <StateScreen level={level} kind="empty" title={title} lead={lead} flush after={<ShelfRows label={shelves.label} rows={shelves.links} bleed={level === 1} />} />
}
