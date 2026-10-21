import type { Lang } from './locale.ts'
import type { Messenger } from './chat.ts'

/* Данные магазина у каждого сайта свои (docs/plans/multi-site.md, Ш2): имя для
   знака, реквизиты, каналы связи, мессенджеры, соцсети, оплата, документы и
   органы защиты потребителей рынка. Витрина одна — сайтов много; что стоит на
   сайте, решает его запись здесь (`SHOPS[<id сайта>]`), а позже — запись сайта
   в Payload (план, Ш5а). Образец — заглушки: настоящие данные даёт заказчик
   (COMPANY_IS_REAL = false в lib/flags.ts). */

export type Pay = 'visa' | 'mastercard' | 'applepay' | 'googlepay'
export type Social = 'instagram' | 'facebook' | 'youtube' | 'telegram'
export type Picture = { src: string; width: number; height: number }

export type ShopData = {
  /** Имя для знака (components/Logo.tsx): голова, хвост и страна. */
  brand: { head: string; tail: string; country: string }
  company: { name: string; cui: string; regCom: string; address: string }
  contacts: { phone: string; email: string }
  /** Куда уходит быстрый заказ; порядок — порядок строк окна (И442). */
  messengers: readonly { key: Messenger; label: string; value: string }[]
  /** Ряд знаков в подвале (И549); строка без адреса в подвал не выходит. */
  socials: readonly { key: Social; label: string; href: string }[]
  /** Первая строка окна помощи (И547): кто отвечает и в каком мессенджере. */
  support: { name: string; via: Messenger }
  /** Знаки оплаты в подвале (И549) — по договору магазина с банком. */
  payments: readonly { key: Pay; label: string }[]
  /** Адреса документов: условия, данные, cookie. */
  docs: { terms: string; privacy: string; cookies: string }
  /** Орган защиты потребителей рынка: ссылка в ряду закона подвала и платформа
   *  жалоб с пиктограммой; у рынка без такого требования — null. */
  consumer: { authorityUrl: string; complaintsUrl: string | null; complaintsBadge: { src: string | null; width: number; height: number } } | null
  /** Уведомление ЕС о законной гарантии на языке страницы (Имплементационный
   *  регламент (ЕС) 2025/1960); файла нет — null, не рисуется ничего. */
  euGuarantee: Partial<Record<Lang, Picture | null>>
}

/* Сайт образца — румынский рынок. На витрине Румынии обязательны ссылка на
   ANPC и платформа жалоб SAL (приказ 270/2026; ANPC — приказ 72/2010 в ред.
   505/2026, с 04.09.2026); платформы ЕС (ODR/SOL) больше нет — закрыта
   20.07.2025 (Регламент (ЕС) 2024/3228). Пиктограмма SAL — официальная
   картинка ANPC 250 × 50 (И791), файл кладёт человек: `public/legal/anpc-sal.png`;
   пока файла нет — `src: null`, и подвал ставит текстовую ссылку. */
const DEMO: ShopData = {
  brand: { head: 'CBD', tail: 'in', country: 'RO' },
  company: { name: 'SC Exemplu Cânepă SRL', cui: 'RO00000000', regCom: 'J00/0000/2026', address: 'Str. Exemplu 1, București' },
  contacts: { phone: '+40 700 000 000', email: 'contact@exemplu.ro' },
  messengers: [
    { key: 'viber', label: 'Viber', value: '+40 700 000 000' },
    { key: 'telegram', label: 'Telegram', value: '@exemplu' },
    { key: 'whatsapp', label: 'WhatsApp', value: '+40 700 000 000' },
    { key: 'instagram', label: 'Instagram', value: 'exemplu' },
  ],
  socials: [
    { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/exemplu' },
    { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/exemplu' },
    { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@exemplu' },
    { key: 'telegram', label: 'Telegram', href: 'https://t.me/exemplu' },
  ],
  support: { name: 'Igor', via: 'telegram' },
  payments: [
    { key: 'visa', label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'applepay', label: 'Apple Pay' },
    { key: 'googlepay', label: 'Google Pay' },
  ],
  docs: { terms: 'termeni', privacy: 'confidentialitate', cookies: 'cookie-uri' },
  consumer: { authorityUrl: 'https://anpc.ro/', complaintsUrl: 'https://reclamatiisal.anpc.ro/', complaintsBadge: { src: null, width: 250, height: 50 } },
  euGuarantee: { ro: null, en: null, hu: null },
}

/** Данные магазина по id сайта (lib/sites.json); сайта нет — образец. */
export const SHOPS: Readonly<Record<string, ShopData>> = { demo: DEMO }
export const DEFAULT_SHOP: ShopData = DEMO
