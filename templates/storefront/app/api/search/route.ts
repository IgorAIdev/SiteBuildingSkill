import { source } from '@/lib/source/index.ts'
import { DEFAULT_LANG, isLang } from '@/lib/locale.ts'
import { shelfCard } from '@/lib/view.ts'
import { hrefFor } from '@/lib/href.ts'

/* Подсказки поиска в шапке (SearchPane): первые товары того же поиска, что
   у страницы поиска (`source().listing` с `q`), карточками полки — имя,
   снимок, цена считаны страницей, не компонентом. `total` — сколько всего,
   `href` — все результаты страницей поиска. Источник молчит — пустой ответ,
   поле работает как прежде: Enter ведёт на страницу поиска. */
const SHOWN = 6

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const asked = query.get('lang') ?? ''
  const lang = isLang(asked) ? asked : DEFAULT_LANG
  const q = (query.get('q') ?? '').trim()
  const href = hrefFor(lang, { search: q })
  if (q.length < 2) return Response.json({ q, total: 0, href, cards: [] })
  const r = await source().listing(lang, { q, facets: {}, sort: 'popular', page: null })
  const items = r.ok ? r.value.items : []
  return Response.json(
    { q, total: r.ok ? r.value.total : 0, href, cards: items.slice(0, SHOWN).map((c) => shelfCard(lang, c)) },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  )
}
