import { source } from '@/lib/source/index.ts'
import { DEFAULT_LANG, isLang } from '@/lib/locale.ts'
import { parseFacetParams } from '@/lib/source/vendure/core/search.mjs'
import { EFFECT_FACET } from '@/lib/source/effect.ts'
import { showLabel } from '@/lib/catalog-view.ts'

/* Счёт фильтра (LiveFilter.tsx): кнопка «применить» и числа у значений —
   выбор, ещё не применённый. Рамка — та же, что у полки страницы: полка
   (`category`) или эффект (`effect`, грань, которую страница эффекта держит
   сама); грани — из формы, тем же разбором, что адрес полки (`facet.*`).
   Источник отдаёт только счёт (`count`): выдачи и значений граней, без карточек.
   Источник молчит — 503, и кнопка остаётся «применить». */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const asked = query.get('lang') ?? ''
  const lang = isLang(asked) ? asked : DEFAULT_LANG
  const category = query.get('category') || undefined
  const effect = query.get('effect')
  const facets = parseFacetParams(query) as Record<string, string[]>
  const r = await source().listing(lang, { category, facets: effect ? { ...facets, [EFFECT_FACET]: [effect] } : facets, sort: 'popular', page: null, count: true })
  if (!r.ok) return Response.json({ total: null }, { status: 503 })
  /* Числа у значений — на тот же ещё не применённый выбор: «против всех граней,
     кроме своей» (cbd-facet, §3), как у полки. */
  const counts = Object.fromEntries(r.value.facets.map((f) => [f.code, Object.fromEntries(f.values.map((v) => [v.code, v.count]))]))
  return Response.json({ total: r.value.total, label: showLabel(lang, r.value.total), facets: counts }, { headers: { 'Cache-Control': 'private, max-age=60' } })
}
