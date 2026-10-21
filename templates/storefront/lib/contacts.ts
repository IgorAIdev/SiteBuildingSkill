import { chatHref, type Messenger } from './chat.ts'
import { shop } from './company.ts'
import type { Social } from './shop-data.ts'

/* Каналы связи сайта запроса — одно место (check:code, семья contactScheme).
   Данные — у сайта (lib/shop-data.ts); ссылка в мессенджер — чистая функция
   (lib/chat.ts), её читает и окно в браузере. */
export type { Messenger, Social }
export { chatHref }
export const shopContacts = () => shop().contacts
export const telHref = () => `tel:${shopContacts().phone.replace(/\s+/g, '')}`
export const mailHref = () => `mailto:${shopContacts().email}`
export const shopMessengers = () => shop().messengers
/** Мессенджеры заказа — без Instagram: окно помощи и быстрый заказ его не показывают (слово заказчика 29.09.2026:
 *  «Instagram убрать»; 17.10.2026: «Instagram кнопку удали» в быстром заказе). Один список на оба места. */
export const orderMessengers = () => shopMessengers().filter((m): m is ReturnType<typeof shopMessengers>[number] & { key: Exclude<Messenger, 'instagram'> } => m.key !== 'instagram')
export const shopSocials = () => shop().socials
export const shopSupport = () => shop().support

export function supportHref(): string | null {
  const m = shopMessengers().find((x) => x.key === shopSupport().via)
  return m ? chatHref(m) : null
}

/** Пути к магазину одним списком — меню трубки в шапке и окно помощи
 *  (И547): телефон, почта, затем мессенджеры в их порядке. Instagram — не
 *  путь связи, а соцсеть: он в ряду соцсетей подвала, в списке его нет
 *  (слово заказчика 29.09.2026: «Instagram убрать»). Строка — ключ, имя,
 *  показанное значение и ссылка из него; значения нет — нет и ссылки. Имена
 *  телефона и почты — слова языка, мессенджеров — их марки. */
export type Reach = 'phone' | 'email' | Exclude<Messenger, 'instagram'>
export type ReachRow = { key: Reach; name: string; value: string; href: string | null }
export function reachRows(words: { phone: string; email: string }): ReachRow[] {
  const contacts = shopContacts()
  const chats = orderMessengers().map((m) => ({ key: m.key, name: m.label, value: m.value, href: chatHref(m) }))
  return [
    { key: 'phone', name: words.phone, value: contacts.phone, href: contacts.phone.trim() ? telHref() : null },
    { key: 'email', name: words.email, value: contacts.email, href: contacts.email.trim() ? mailHref() : null },
    ...chats,
  ]
}
