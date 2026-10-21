import { headers } from 'next/headers'
import { SITE_HEADER } from './sites.ts'
import { runWithSite } from './site-now.ts'

/** Работа серверного действия или обработчика `/api` — с сайтом запроса:
 *  прокладка (proxy.ts) ставит его заголовком на каждый запрос, и рынок,
 *  адрес и каталог внутри работы — этого сайта (lib/site-now.ts). */
export async function inRequestSite<T>(work: () => Promise<T>): Promise<T> {
  return runWithSite((await headers()).get(SITE_HEADER), work)
}
