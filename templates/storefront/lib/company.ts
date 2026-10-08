import type { Lang } from './locale.ts'

/* Реквизиты — образец (COMPANY_IS_REAL = false в lib/flags.ts): настоящие
   даёт заказчик. На витрине румынского рынка обязательны ссылка на ANPC и SAL
   (приказ 270/2026); SOL — нет: платформа ЕС закрыта 20.07.2025. */
/* Имя магазина для знака (components/Logo.tsx): голова, хвост и страна —
   данные магазина, знак только ставит их по варианту вида. */
export const BRAND = { head: 'CBD', tail: 'in', country: 'RO' }

export const COMPANY = {
  name: 'SC Exemplu Cânepă SRL',
  cui: 'RO00000000',
  regCom: 'J00/0000/2026',
  address: 'Str. Exemplu 1, București',
}
/* SAL ANPC — платформа жалоб приказа ANPC 270/2026 (в силе с 19.05.2026), в
   подвале — пиктограммой 250 × 50; ссылка на ANPC (anpc.ro) — приказ 72/2010 в
   ред. 505/2026, с 04.09.2026;
   платформы ЕС (ODR/SOL) больше нет — закрыта 20.07.2025 (Регламент (ЕС)
   2024/3228), ссылка и пиктограмма SOL сняты. */
export const ANPC_SAL_URL = 'https://reclamatiisal.anpc.ro/'
/** Пиктограмма SAL — официальная картинка ANPC без изменений, 250 × 50 (приказ
 *  270/2026, И791). Файл кладёт человек руками (сайт ANPC за проверкой на бота):
 *  `public/legal/anpc-sal.png`; пока файла нет — `src: null`, и подвал ставит
 *  текстовую ссылку на SAL. Размер — данные знака, а не вид. */
export const ANPC_SAL_BADGE: { src: string | null; width: number; height: number } = { src: null, width: 250, height: 50 }
/** ANPC — орган защиты потребителей: ссылкой «ANPC» в ряду закона подвала на
 *  всех страницах, значит и на главной (приказ 72/2010 в ред. 505/2026). */
export const ANPC_URL = 'https://anpc.ro/'
/** Уведомление ЕС о законной гарантии (Имплементационный регламент (ЕС)
 *  2025/1960, Приложение I; с 27.09.2026) — картинкой ЕС без изменений на языке
 *  страницы, с EUR-Lex (повторное использование — Решение 2011/833/ЕС). Файлы
 *  кладёт человек: `public/legal/eu-guarantee-<язык>.png`; пока файла нет —
 *  `null`, и не рисуется ничего (своё «подобие» знака ЕС — не уведомление). */
export const EU_GUARANTEE_NOTICE: Record<Lang, { src: string; width: number; height: number } | null> = { ro: null, en: null, hu: null }

/* Условия магазина — документ с этим адресом: на него ссылаются подвал и
   последний шаг оформления (заказ принимается по этим условиям). */
export const TERMS_DOC = 'termeni'
/* Как магазин обращается с данными — документ с этим адресом: на него
   ссылается форма создания кабинета (И771). */
export const PRIVACY_DOC = 'confidentialitate'
/* Политика cookie — документ с этим адресом: на него ссылается полоса согласия
   (И791). */
export const COOKIE_DOC = 'cookie-uri'

/* Чем магазин принимает оплату — знаки в подвале (слово заказчика
   29.09.2026, И549). Данные магазина, а не вид: список ставит заказчик по
   договору с банком; образец — четыре частых в Румынии. Имя — для чтеца. */
export type Pay = 'visa' | 'mastercard' | 'applepay' | 'googlepay'
export const PAYMENTS: readonly { key: Pay; label: string }[] = [
  { key: 'visa', label: 'Visa' },
  { key: 'mastercard', label: 'Mastercard' },
  { key: 'applepay', label: 'Apple Pay' },
  { key: 'googlepay', label: 'Google Pay' },
]
