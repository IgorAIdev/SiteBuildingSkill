import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { takeFlow } from '@/lib/session.ts'
import { callbackPath, land, unpackFlow } from '@/lib/social.ts'
import { enterWith } from '@/lib/social-entry.ts'
import { absolute } from '@/lib/seo.ts'

/* Адрес возврата входа через поставщика (И787): один на поставщика, без языка —
   его вписывают в консоли Google и Meta и в `SOCIAL_AUTH_REDIRECT_URIS` сервера.
   Ход берётся из cookie и снимается; код с `state` своего хода уходит источнику
   (`signInWith`: у Vendure — `authenticate` с токеном гостя, корзина переезжает),
   новая сессия — в cookie, как у входа паролем. «Отмена» у поставщика — тихо
   назад к форме; отказ — на форму словами (`?auth=…&via=…`). Не страница: в
   дерево маршрутов не входит, ссылок на него на сайте нет — только форма кнопок.
   Решают `land` и `landed` (lib/social.ts, tests/social.test.ts), вход — `enterWith`. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const l = land((await params).provider, unpackFlow(await takeFlow()), request.nextUrl.searchParams, (p) => absolute(callbackPath(p)))
  redirect('to' in l ? l.to : await enterWith(l))
}
