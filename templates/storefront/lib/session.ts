import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { PERSONAL, SESSION_COOKIE } from './session-cookie.ts'
import { SITE_URL } from './seo.ts'
import { flowCookie, FLOW_SECONDS } from './social.ts'

const MONTH = 60 * 60 * 24 * 30

/** Ключ сессии покупки из cookie. Cookie — только для сервера: скрипт
 *  страницы его не читает (`httpOnly`), чужой сайт его не шлёт
 *  (`sameSite=lax`). */
export async function readSession(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value || null
}

/** `secure` — когда сайт на https: образец на http://localhost иначе не
 *  сохранил бы корзину, открытый с телефона по адресу в сети. */
export async function writeSession(token: string): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: SITE_URL().startsWith('https:'), path: '/', maxAge: MONTH })
}

/** Выход из кабинета (И771): сессию у источника уже закрыл `signOut`, cookie
 *  уходит здесь — следующая страница открывается гостем. */
export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE)
}

/** Запись в корзину или в оформление меняет все личные страницы сразу. Со
 *  скриптом браузер держит уже открытые страницы в памяти роутера, и
 *  «Назад» показывал их такими, какими они были до записи: контакты пустыми,
 *  хотя они сохранены (сценарий гостя приёмки плана 2). Вызывается записью
 *  после удачи, перед переходом. */
export function sessionChanged(): void {
  for (const shape of PERSONAL) revalidatePath(shape, 'page')
}

/** Вход сделан — паролем, письмом или через поставщика: новая сессия — в
 *  cookie, личные страницы — заново. Переход — у зовущего. */
export async function enterSession(before: string | null, session: string | null): Promise<void> {
  if (session && session !== before) await writeSession(session)
  sessionChanged()
}

/** Ход входа через поставщика (И787): `state`, PKCE, язык и путь назад — на
 *  10 минут. `sameSite=lax`: возврат от поставщика — переход верхнего уровня,
 *  такую cookie браузер несёт. На https имя с `__Host-` (lib/social.ts,
 *  `flowCookie`): путь `/`, `secure`, без `Domain` — соседний поддомен её не
 *  подложит. */
const secure = () => SITE_URL().startsWith('https:')
export async function writeFlow(value: string): Promise<void> {
  (await cookies()).set(flowCookie(secure()), value, { httpOnly: true, sameSite: 'lax', secure: secure(), path: '/', maxAge: FLOW_SECONDS })
}

/** Ход читается один раз: взят — снят (повтор того же возврата — уже чужой). */
export async function takeFlow(): Promise<string | null> {
  const jar = await cookies()
  const name = flowCookie(secure())
  const value = jar.get(name)?.value ?? null
  if (value) jar.delete({ name, path: '/', secure: secure() })
  return value
}
