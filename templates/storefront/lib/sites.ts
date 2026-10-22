import REGISTRY from './sites.json' with { type: 'json' }
import { isLang, type Lang } from './locale.ts'

/* Одна витрина — много сайтов (docs/plans/multi-site.md; слово владельца
   21.10.2026: «одна витрина конечно» — на вопрос «сто доменов — сто
   сторфронтов?»). Сайт — данные, а не копия кода: имя хоста ведёт к записи
   реестра (`sites.json`), запись говорит, на каких языках сайт и какой язык
   основной; дальше по ней же — рынок, вид и каталог (план, Ш2–Ш4).

   Как у профессионалов — образец Vercel «Platforms» (multi-tenant Next.js):
   прокладка (`proxy.ts`) узнаёт сайт по хосту и переписывает адрес на
   внутренний сегмент `/[site]/…`; страницы собираются заранее на каждую пару
   «сайт × язык». Публичный адрес сайта не меняется: `/en/catalog` — тот же. */

/** `url` — адрес сайта для canonical, карты и JSON-LD (`https://cbdbuy.be`);
 *  нет — окружение `SITE_URL` (lib/seo.ts). */
/** `market` — код пакета рынка (lib/market.ts: `RO`, `BE`, `HR`). */
/** `source` — откуда каталог сайта (`sample` образец, `vendure` движок);
 *  нет — окружение `SOURCE`. `channel` — канал Vendure сайта (рынок у движка —
 *  канал: свои товары, валюта, цены, языки, налоги, доставка); нет —
 *  окружение `VENDURE_CHANNEL_TOKEN`. */
export type Site = { id: string; hosts: string[]; langs: Lang[]; defaultLang: Lang; url: string | null; market: string; source: string | null; channel: string | null }

/** Запись реестра как она лежит в файле: языки — словами, адреса — по желанию. */
type Row = { id: string; hosts: string[]; langs: string[]; defaultLang: string; url?: string; market: string; source?: string; channel?: string }

const sites: Site[] = (REGISTRY.sites as Row[]).map((s) => {
  const langs = s.langs.filter(isLang)
  if (langs.length !== s.langs.length) throw new Error(`sites.json: у сайта «${s.id}» язык без перевода — ${s.langs.filter((l) => !isLang(l)).join(', ')}`)
  if (!isLang(s.defaultLang) || !langs.includes(s.defaultLang)) throw new Error(`sites.json: основной язык сайта «${s.id}» не из его языков`)
  return { id: s.id, hosts: s.hosts.map((h) => h.toLowerCase()), langs, defaultLang: s.defaultLang, url: s.url ?? null, market: s.market, source: s.source ?? null, channel: s.channel ?? null }
})

export const SITES: readonly Site[] = sites
/** Сайт по умолчанию — хост без записи в реестре: машина разработчика, адрес
 *  sslip.io. На сервере его можно назвать окружением (`DEFAULT_SITE`). */
export const DEFAULT_SITE: Site = sites.find((s) => s.id === (process.env.DEFAULT_SITE || REGISTRY.default)) ?? sites[0]

/** Заголовок, которым прокладка передаёт сайт запроса тем, кто адреса
 *  `/[site]/…` не получает: карте сайта, robots, обработчикам `/api`. */
export const SITE_HEADER = 'x-shop-site'

const byId = new Map(sites.map((s) => [s.id, s]))
export const siteById = (id: string): Site | null => byId.get(id) ?? null

/** Адрес страницы, как его видит покупатель: без внутреннего сегмента сайта. Прокладка
 *  (proxy.ts) переписывает публичный `/en/blog` на `/[site]/en/blog`, и заранее собранная
 *  страница сайта отдаёт хукам путь с сегментом сайта: переключатель языка строил от него
 *  `/demo/en/blog` — такой страницы нет (check:urls, большая проверка 23.10.2026). Сегмент
 *  снимается, только когда за ним идёт ещё сегмент: язык — первый сегмент публичного адреса. */
export function publicPath(path: string): string {
  const m = /^\/([^/]+)(?=\/)/.exec(path)
  return m && byId.has(m[1]) ? path.slice(m[0].length) : path
}

/** Пары «сайт × его язык» — страницы заранее: их берут оба корневых макета (магазина
 *  и кассы); одна запись на два места (check:code, `twice`). */
export const siteLangParams = () => SITES.flatMap((site) => site.langs.map((lang) => ({ site: site.id, lang })))

/** Сайт по имени хоста: `www.` и порт не в счёт. */
export function siteByHost(host: string | null | undefined): Site {
  const name = (host ?? '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '')
  return sites.find((s) => s.hosts.includes(name)) ?? DEFAULT_SITE
}
