import { commerce } from './source/index.ts'
import { enterSession, readSession } from './session.ts'
import { landed, type Flow } from './social.ts'
import type { Provider, SocialGrant } from './source/contract.ts'

/* Вход по коду своего хода (И787) — один на адрес возврата
   (app/api/auth/[provider]/callback) и на образец без окна (действие кнопки,
   lib/actions/account.ts): источник меняет код на вход, новая сессия — в
   cookie, ответ — куда уйти (`landed`). Не в файле действий: всё, что
   выходит из файла `'use server'`, становится действием, которое браузер
   может позвать сам. */
export async function enterWith(l: { provider: Provider; flow: Flow; grant: SocialGrant }): Promise<string> {
  const before = await readSession()
  const entry = await commerce().signInWith(before, l.flow.lang, l.provider, l.grant)
  if (entry.change.ok) await enterSession(before, entry.session)
  return landed(l.flow, l.provider, entry.change)
}
