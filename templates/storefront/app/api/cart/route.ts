import { commerce, content } from '@/lib/source/index.ts'
import { readSession } from '@/lib/session.ts'
import { DEFAULT_LANG, isLang } from '@/lib/locale.ts'
import { money } from '@/lib/money.ts'
import { cartStamp, cartView } from '@/lib/cart-view.ts'
import { cartHeld } from '@/lib/cart-ops.ts'
import { mainShelves } from '@/lib/main-shelves.ts'

/* Счётчик шапки. Личное не кэшируется нигде, а страницы каталога остаются
   общими и статическими: счётчик приходит отдельным запросом, а не делает
   динамическим каждый адрес магазина. Источник молчит — `count: null`, и
   шапка показывает корзину без числа, а не «0».

   Сумма — готовой строкой в записи языка страницы (`?lang=`): деньги
   считает и пишет страница, не компонент (И430; сумма у корзины — вид
   `--cart-meta: sum`, шапка cbdin.bg). Сумма — товары без доставки: выбор
   доставки на оформлении её в шапке не двигает. Пустая корзина — без суммы.

   `?view=1` — ещё и вид корзины для её шторки (CartPane): тот же `cartView`,
   что у страницы корзины, — строки, итоги, слова кнопок. Пустой корзине —
   ещё и главные полки кнопками категорий (И689): не тупик, а пути дальше.

   `held` — штук каждого варианта в корзине: по нему кнопки «в корзину»
   страницы показывают «Added · 4» уже при загрузке (lib/in-cart.ts, И469).
   Источник молчит — `null`: кнопки остаются, какими были. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const asked = query.get('lang') ?? ''
  const lang = isLang(asked) ? asked : DEFAULT_LANG
  const r = await commerce().checkout(await readSession(), lang)
  const cart = r.ok ? r.value?.cart ?? null : null
  const count = r.ok ? (cart?.quantity ?? 0) : null
  const sum = cart && cart.quantity > 0 ? money(cart.subtotal, lang) : null
  /* Порог бесплатной доставки — из данных магазина; источник молчит — полосы нет. */
  const facts = query.has('view') && r.ok ? await content().facts() : null
  const freeFrom = facts?.ok ? facts.value.freeDeliveryFrom : null
  const shelves = query.has('view') && r.ok && !cart?.lines.length ? await mainShelves(lang) : []
  const view = query.has('view') && r.ok ? cartView(lang, cart, null, { freeFrom, popular: [], shelves }) : null
  return Response.json({ count, sum, held: r.ok ? cartHeld(cart) : null, stamp: r.ok ? cartStamp(cart) : null, view }, { headers: { 'Cache-Control': 'private, no-store' } })
}
