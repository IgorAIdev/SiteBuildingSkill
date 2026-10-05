/* Реквизиты — образец (COMPANY_IS_REAL = false в lib/flags.ts): настоящие
   даёт заказчик. Ссылки ANPC (SAL) и платформы споров ЕС (SOL) обязательны
   на витрине румынского рынка. */
/* Имя магазина для знака (components/Logo.tsx): голова, хвост и страна —
   данные магазина, знак только ставит их по варианту вида. */
export const BRAND = { head: 'CBD', tail: 'in', country: 'RO' }

export const COMPANY = {
  name: 'SC Exemplu Cânepă SRL',
  cui: 'RO00000000',
  regCom: 'J00/0000/2026',
  address: 'Str. Exemplu 1, București',
}
/* SAL ANPC — платформа жалоб приказа ANPC 270/2026 (в силе с 19.05.2026);
   платформы ЕС (ODR/SOL) больше нет — закрыта 20.07.2025 (Регламент (ЕС)
   2024/3228), ссылка и пиктограмма SOL сняты. */
export const ANPC_SAL_URL = 'https://reclamatiisal.anpc.ro/'

/* Условия магазина — документ с этим адресом: на него ссылаются подвал и
   последний шаг оформления (заказ принимается по этим условиям). */
export const TERMS_DOC = 'termeni'
/* Как магазин обращается с данными — документ с этим адресом: на него
   ссылается форма создания кабинета (И771). */
export const PRIVACY_DOC = 'confidentialitate'

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
