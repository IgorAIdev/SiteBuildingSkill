import type { Lang } from './locale.ts'
import { siteNow } from './site-now.ts'
import { DEFAULT_SHOP, SHOPS, type Pay, type Picture, type ShopData } from './shop-data.ts'

/* Данные магазина сайта запроса (lib/shop-data.ts): у каждого сайта свои —
   имя для знака, реквизиты, оплата, документы, органы защиты потребителей
   рынка. Читает только сервер: сайт запроса знает он (lib/site-now.ts). */
export type { Pay }
export const shop = (): ShopData => SHOPS[siteNow().id] ?? DEFAULT_SHOP

/* Имя магазина для знака (components/Logo.tsx): голова, хвост и страна —
   данные магазина, знак только ставит их по варианту вида. */
export const shopBrand = () => shop().brand
export const shopCompany = () => shop().company
/** Ссылка на орган защиты потребителей — в ряду закона подвала; у рынка без
 *  такого требования — null. */
export const authorityUrl = (): string | null => shop().consumer?.authorityUrl ?? null
/** Платформа жалоб рынка (SAL ANPC в Румынии) и её пиктограмма. */
export const complaintsUrl = (): string | null => shop().consumer?.complaintsUrl ?? null
export const complaintsBadge = (): { src: string | null; width: number; height: number } => shop().consumer?.complaintsBadge ?? { src: null, width: 250, height: 50 }
/** Уведомление ЕС о законной гарантии на языке страницы; файла нет — null. */
export const euGuaranteeNotice = (lang: Lang): Picture | null => shop().euGuarantee[lang] ?? null
/* Условия магазина — на них ссылаются подвал и последний шаг оформления. */
export const termsDoc = () => shop().docs.terms
/* Как магазин обращается с данными — на них ссылается форма кабинета (И771). */
export const privacyDoc = () => shop().docs.privacy
/* Политика cookie — на неё ссылается полоса согласия (И791). */
export const cookieDoc = () => shop().docs.cookies
/* Чем магазин принимает оплату — знаки в подвале (И549). */
export const shopPayments = () => shop().payments
