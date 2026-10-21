'use server'
import { redirect } from 'next/navigation'
import { commerce } from '../source/index.ts'
import { readSession, writeSession } from '../session.ts'
import { readCartOp, runCartOp, outcomeOf, type Outcome } from '../cart-ops.ts'
import { DEFAULT_LANG, isLang, type Lang } from '../locale.ts'
import { hrefFor } from '../href.ts'
import { field } from '../checkout-form.ts'
import { inRequestSite } from '../request-site.ts'

async function apply(form: FormData): Promise<{ lang: Lang; code: string; count: number | null; inCart: number | null }> {
  const raw = field(form, 'lang')
  const lang = isLang(raw) ? raw : DEFAULT_LANG
  const before = await readSession()
  const done = await runCartOp(commerce(), before, lang, readCartOp(form))
  if (done.session && done.session !== before) await writeSession(done.session)
  /* Личные страницы запись не пересобирает (`sessionChanged`): ответ действия
     нёс бы заново собранную ТЕКУЩУЮ страницу — главную со всеми полками за «+»
     в шторке (962 мс), а на самой странице корзины такая запись шла 6 с против
     1.4 с у «запись, потом перерисовка» (замер 03.10.2026; И696). Страница
     корзины перерисовывается сама (CartFresh); без скрипта переход на корзину и
     так свежий. */
  return { lang, code: done.code, count: done.count, inCart: done.inCart }
}

/** Без скрипта: запись, затем переход на корзину с кодом исхода в адресе
 *  (POST → переход → GET): обновление страницы не повторяет запись. */
async function cartSubmit_(form: FormData): Promise<void> {
  const { lang, code } = await apply(form)
  redirect(hrefFor(lang, { cart: true, result: code }))
}

/** Со скриптом: запись и исход словами; страница покажет его и перечитает
 *  корзину сама. */
async function cartCall_(form: FormData): Promise<Outcome> {
  const { lang, code, count, inCart } = await apply(form)
  return outcomeOf(lang, code, count, inCart) ?? { kind: 'error', code, message: '', count, inCart: null }
}

/* Каждое действие — с сайтом запроса (lib/request-site.ts): рынок, адрес и
   каталог внутри — сайта, с которого пришла форма. */
export async function cartSubmit(...a: Parameters<typeof cartSubmit_>): ReturnType<typeof cartSubmit_> { return inRequestSite(() => cartSubmit_(...a)) }
export async function cartCall(...a: Parameters<typeof cartCall_>): ReturnType<typeof cartCall_> { return inRequestSite(() => cartCall_(...a)) }
