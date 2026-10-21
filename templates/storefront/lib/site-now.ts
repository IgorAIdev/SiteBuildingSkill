import { AsyncLocalStorage } from 'node:async_hooks'
import { DEFAULT_SITE, siteById, type Site } from './sites.ts'

/* Сайт запроса на сервере — одна ячейка на запрос (`cache` React: каждый
   запрос и каждая заранее собранная страница — своя ячейка). Ставит её тот,
   кто знает адрес: макет и страница — из `/[site]/…` (lib/route.ts,
   `langOf`), карта сайта и robots — из заголовка прокладки. Читают — те, кому
   сайт нужен глубже адреса: адрес сайта для canonical, языки переключателя.

   Тесты витрины ходят без установленных пакетов (`npm test` нового сайта):
   там React нет, и ячейка — одна на процесс, сайт по умолчанию. */
type Slot = () => { site: Site }
const fallback: Slot = (() => { const one = { site: DEFAULT_SITE }; return () => one })()
const slot: Slot = await import('react')
  .then((react) => react.cache((): { site: Site } => ({ site: DEFAULT_SITE })))
  .catch(() => fallback)

/* Серверное действие и обработчик `/api` идут вне отрисовки — там ячейка
   React не живёт. Им сайт ставится областью (`runWithSite`, lib/request-site.ts):
   сайт из заголовка прокладки держится до конца их работы. */
const scope = new AsyncLocalStorage<Site>()
export const runWithSite = <T,>(id: string | null | undefined, work: () => Promise<T>): Promise<T> =>
  scope.run(siteById(id ?? '') ?? DEFAULT_SITE, work)

export const setSite = (id: string | undefined): void => {
  const site = id ? siteById(id) : null
  if (site) slot().site = site
}
export const siteNow = (): Site => scope.getStore() ?? slot().site
