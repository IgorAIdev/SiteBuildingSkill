/* Заявление об отказе от договора — правила без Vendure (И748): что
   принимается и что пишется в письме-подтверждении. Отдельным файлом без
   декораторов и без `@vendure/*`, чтобы его проверял тест набора
   (selftest/vendure-withdrawal.test.mjs) без сервера.

   Основание: ст. 11a Директивы 2011/83 (в редакции 2023/2673, с 19.06.2026;
   в Румынии — OUG 18/2026): форма спрашивает только имя, данные договора и
   адрес для подтверждения; подтверждение с содержанием заявления, датой и
   временем уходит «без неоправданной задержки» на долговечном носителе. */

export type StatementInput = { name: string; orderCode: string; emailAddress: string }
export type Checked = { ok: true; value: StatementInput } | { ok: false; reason: string }

export const LIMITS = { name: 120, orderCode: 40, emailAddress: 120 } as const
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Заявление принимается, даже если заказа с таким кодом нет: право на отказ
 *  не зависит от того, верно ли покупатель переписал номер, — магазин
 *  разбирается сам. Отказ — только пустым полям, мусорной длине и адресу, на
 *  который нельзя послать подтверждение. */
export function checkStatement(input: Partial<StatementInput>): Checked {
  const value = {
    name: (input.name ?? '').trim(),
    orderCode: (input.orderCode ?? '').trim(),
    emailAddress: (input.emailAddress ?? '').trim(),
  }
  if (!value.name || value.name.length > LIMITS.name) return { ok: false, reason: 'name' }
  if (!value.orderCode || value.orderCode.length > LIMITS.orderCode) return { ok: false, reason: 'orderCode' }
  if (!EMAIL.test(value.emailAddress) || value.emailAddress.length > LIMITS.emailAddress) return { ok: false, reason: 'emailAddress' }
  return { ok: true, value }
}

type Words = { subject: string; hello: string; received: string; content: string; name: string; order: string; email: string; at: string; next: string; shopSubject: string; orderMissing: string }
const WORDS: Record<'ro' | 'en' | 'hu', Words> = {
  ro: {
    subject: 'Confirmarea retragerii din contract — comanda {order}',
    hello: 'Bună ziua, {name},',
    received: 'Am primit declarația dumneavoastră de retragere din contract.',
    content: 'Conținutul declarației:',
    name: 'Nume', order: 'Numărul comenzii', email: 'E-mail', at: 'Primită la',
    next: 'Trimiteți produsele înapoi în cel mult 14 zile de la această declarație. Vă rambursăm suma în cel mult 14 zile de la primirea ei; putem aștepta până primim produsele sau dovada expedierii.',
    shopSubject: 'Declarație de retragere — comanda {order}',
    orderMissing: 'Comanda cu acest număr nu a fost găsită în canal; verificați manual.',
  },
  en: {
    subject: 'Confirmation of your withdrawal from the contract — order {order}',
    hello: 'Hello {name},',
    received: 'We have received your statement of withdrawal from the contract.',
    content: 'Content of the statement:',
    name: 'Name', order: 'Order number', email: 'E-mail', at: 'Received on',
    next: 'Please send the products back within 14 days of this statement. We refund you within 14 days of receiving it; we may wait until we get the products or proof of dispatch.',
    shopSubject: 'Withdrawal statement — order {order}',
    orderMissing: 'No order with this number in the channel; check manually.',
  },
  hu: {
    subject: 'Az elállás visszaigazolása — {order} rendelés',
    hello: 'Kedves {name}!',
    received: 'Megkaptuk a szerződéstől való elállásról szóló nyilatkozatát.',
    content: 'A nyilatkozat tartalma:',
    name: 'Név', order: 'Rendelésszám', email: 'E-mail', at: 'Beérkezett',
    next: 'A termékeket a nyilatkozattól számított legfeljebb 14 napon belül küldje vissza. Az összeget a nyilatkozat beérkezésétől számított legfeljebb 14 napon belül visszatérítjük; megvárhatjuk a termékek vagy a feladás igazolásának megérkezését.',
    shopSubject: 'Elállási nyilatkozat — {order} rendelés',
    orderMissing: 'Ilyen számú rendelés nincs a csatornában; ellenőrizze kézzel.',
  },
}
const LOCALE: Record<keyof typeof WORDS, string> = { ro: 'ro-RO', en: 'en-GB', hu: 'hu-HU' }
const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (all, k: string) => vars[k] ?? all)

/** Дата и время приёма по часам рынка (Бухарест) — подтверждение называет и то и другое. */
export const momentOf = (lang: string, at: Date, timeZone = 'Europe/Bucharest'): string =>
  new Intl.DateTimeFormat(LOCALE[lang as keyof typeof WORDS] ?? LOCALE.ro, { dateStyle: 'long', timeStyle: 'short', timeZone }).format(at)

/** Слова письма на языке заявления; незнакомый язык — румынский (рынок). */
export function letterOf(lang: string, s: StatementInput & { receivedAt: Date; orderFound: boolean }, timeZone?: string) {
  const w = WORDS[lang as keyof typeof WORDS] ?? WORDS.ro
  const at = momentOf(lang, s.receivedAt, timeZone)
  return {
    subject: fill(w.subject, { order: s.orderCode }),
    shopSubject: fill(w.shopSubject, { order: s.orderCode }),
    hello: fill(w.hello, { name: s.name }),
    received: w.received, content: w.content, next: w.next,
    rows: [[w.name, s.name], [w.order, s.orderCode], [w.email, s.emailAddress], [w.at, at]],
    warning: s.orderFound ? null : w.orderMissing,
    at,
  }
}

/** Запись в истории заказа (видна в админке Vendure у заказа). */
export const noteOf = (s: StatementInput & { receivedAt: Date }) =>
  `Withdrawal statement received ${s.receivedAt.toISOString()}: ${s.name}, ${s.emailAddress}`
