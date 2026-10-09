/* Флаги настоящести (соглашение набора, tools/stages.mjs): пока false, цена
   не идёт в разметку для поиска, а страницы закрыты от обхода. */
export const CATALOG_IS_REAL = false
export const PRICES_ARE_REAL = false
export const COMPANY_IS_REAL = false
/* Оценка покупателей идёт в разметку (`aggregateRating`) только настоящая:
   выдуманные звёзды в выдаче Google считает обманом разметки и снимает
   расширенный результат со всего сайта (Google, «Review snippet»: «ratings
   must be sourced directly from users»). Образец держит свои — для вида. */
export const REVIEWS_ARE_REAL = false
