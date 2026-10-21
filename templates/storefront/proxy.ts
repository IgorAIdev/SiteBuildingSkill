import { NextResponse, type NextRequest } from 'next/server'
import { LANG_HEADER, langOfPath, isLang } from '@/lib/locale.ts'
import { SITE_HEADER, siteByHost, siteById } from '@/lib/sites.ts'

/* Сайт и язык адреса — заголовками запроса, и больше ничего. Страница «не
   найдено» (app/global-not-found.tsx) адреса не получает, а язык ей нужен:
   /hu/a/b отвечает по-венгерски. Данных здесь не спрашивают: есть ли товар,
   решает страница, а не прокладка перед ней (И257).

   Сайт — по имени хоста (lib/sites.ts, docs/plans/multi-site.md): адрес языка
   `/<lang>/…` переписывается на внутренний `/<site>/<lang>/…` — дерево страниц
   стоит под `app/[site]`, а публичный адрес не меняется. Язык не своего
   сайта не переписывается и уходит на «не найдено». Адреса без языка (`/api`,
   карта сайта, robots, знаки) не переписываются — им сайт приходит
   заголовком. */
export function proxy(request: NextRequest) {
  const site = siteByHost(request.headers.get('host'))
  const path = request.nextUrl.pathname
  const lang = langOfPath(path)
  const headers = new Headers(request.headers)
  headers.set(LANG_HEADER, site.langs.includes(lang) ? lang : site.defaultLang)
  headers.set(SITE_HEADER, site.id)
  /* Корень — на основной язык сайта: у каждого сайта свой (lib/sites.ts). */
  if (path === '/') {
    const url = request.nextUrl.clone()
    url.pathname = `/${site.defaultLang}`
    return NextResponse.redirect(url, 307)
  }
  const first = path.split('/')[1] ?? ''
  /* Внутренний адрес снаружи (`/demo/en/…`) — второй адрес той же страницы:
     он уходит под сайт ещё раз и не находится. */
  if ((isLang(first) && site.langs.includes(first)) || siteById(first)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${site.id}${path}`
    return NextResponse.rewrite(url, { request: { headers } })
  }
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: ['/((?!_next/).*)'] }
