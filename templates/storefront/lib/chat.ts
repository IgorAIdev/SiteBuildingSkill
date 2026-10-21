/* Ссылка на разговор в мессенджере — чистая функция: её читает и окно быстрого
   заказа в браузере (components/QuickOrder.tsx), поэтому она не знает сайта
   запроса — список мессенджеров сайта лежит в lib/contacts.ts. */
export type Messenger = 'viber' | 'telegram' | 'whatsapp' | 'instagram'

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
