/* Каналы связи — одно место (check:code, семья contactScheme). Образец. */
export const CONTACTS = { phone: '+40 700 000 000', email: 'contact@exemplu.ro' }
export const telHref = () => `tel:${CONTACTS.phone.replace(/\s+/g, '')}`
export const mailHref = () => `mailto:${CONTACTS.email}`

/* Мессенджеры магазина — куда уходит быстрый заказ (слово заказчика
   25.09.2026: «быстрый заказ вызывает всплывающее меню с мессенджерами»,
   И442). Порядок — порядок строк окна; какие стоят и с каким адресом —
   данные магазина: образец держит заглушки, настоящие номера и имена
   вписывает заказчик. Канал без адреса не выпадает из списка: строка
   печатается, нажатие прячется (И111 прежнего проекта — «прячется не факт,
   а нажатие»). Адрес ссылки считается здесь из значения, а не хранится
   рядом: поправят номер — поправится и ссылка. */
export type Messenger = 'viber' | 'telegram' | 'whatsapp' | 'instagram'
export const MESSENGERS: readonly { key: Messenger; label: string; value: string }[] = [
  { key: 'viber', label: 'Viber', value: '+40 700 000 000' },
  { key: 'telegram', label: 'Telegram', value: '@exemplu' },
  { key: 'whatsapp', label: 'WhatsApp', value: '+40 700 000 000' },
  { key: 'instagram', label: 'Instagram', value: 'exemplu' },
]

const digits = (v: string) => v.replace(/[^\d+]/g, '')

/** Ссылка на разговор с магазином; где мессенджер принимает текст в
 *  адресе (Telegram, WhatsApp) — с уже набранным сообщением, если оно
 *  есть. У Viber и Instagram такого параметра нет: добавленный, он сломал
 *  бы ссылку, — текст заказа окно показывает само. Значения нет — ссылки
 *  нет. */
export function chatHref(m: { key: Messenger; value: string }, text = ''): string | null {
  const v = m.value.trim()
  if (!v) return null
  const said = text ? `?text=${encodeURIComponent(text)}` : ''
  switch (m.key) {
    case 'telegram': return `https://t.me/${v.replace(/^@/, '')}${said}`
    case 'whatsapp': return `https://wa.me/${digits(v).replace(/^\+/, '')}${said}`
    case 'viber': return `viber://chat?number=${encodeURIComponent(digits(v))}`
    case 'instagram': return `https://ig.me/m/${v.replace(/^@/, '')}`
  }
}

/* Соцсети магазина — ряд знаков в подвале (слово заказчика 29.09.2026:
   «соцсети ж нужны»; И549). Какие стоят и куда ведут — данные магазина:
   образец держит заглушки, настоящие адреса вписывает заказчик; строки без
   адреса в подвал не выходят. Порядок — порядок ряда. */
export type Social = 'instagram' | 'facebook' | 'youtube' | 'telegram'
export const SOCIALS: readonly { key: Social; label: string; href: string }[] = [
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/exemplu' },
  { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/exemplu' },
  { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@exemplu' },
  { key: 'telegram', label: 'Telegram', href: 'https://t.me/exemplu' },
]

/* Кто отвечает — первая строка окна помощи, пункт меню «Онлайн-поддержка ·
   имя» (слово заказчика 29.09.2026: «онлайн сапорт — это пункт меню, а не
   название формы»; образец — окно cbdin). Нажатие ведёт в разговор с ним в
   мессенджере `via`. Имя и мессенджер — данные магазина: образец держит имя
   со снимка, настоящее вписывает заказчик. */
export const SUPPORT: { name: string; via: Messenger } = { name: 'Igor', via: 'telegram' }
export function supportHref(): string | null {
  const m = MESSENGERS.find((x) => x.key === SUPPORT.via)
  return m ? chatHref(m) : null
}

/** Пути к магазину одним списком — меню трубки в шапке и окно помощи
 *  (И547): телефон, почта, затем мессенджеры в их порядке. Instagram — не
 *  путь связи, а соцсеть: он в ряду соцсетей подвала (`SOCIALS`), в списке
 *  его нет (слово заказчика 29.09.2026: «Instagram убрать»). Строка — ключ,
 *  имя, показанное значение и ссылка из него; значения нет — нет и ссылки.
 *  Имена телефона и почты — слова языка, мессенджеров — их марки. */
export type Reach = 'phone' | 'email' | Exclude<Messenger, 'instagram'>
export type ReachRow = { key: Reach; name: string; value: string; href: string | null }
export function reachRows(words: { phone: string; email: string }): ReachRow[] {
  const chats = MESSENGERS.flatMap((m) => (m.key === 'instagram' ? [] : [{ key: m.key, name: m.label, value: m.value, href: chatHref(m) }]))
  return [
    { key: 'phone', name: words.phone, value: CONTACTS.phone, href: CONTACTS.phone.trim() ? telHref() : null },
    { key: 'email', name: words.email, value: CONTACTS.email, href: CONTACTS.email.trim() ? mailHref() : null },
    ...chats,
  ]
}
