import type { Lang } from '../../locale.ts'
import type { Card, Image, Money, Pack, Stock, Strength } from '../contract.ts'
import { assetImage, type Asset } from './image.ts'
import { overallStock, standardOf } from '../stock.ts'
import { soldByConcentration } from './traits.ts'

/* Форма данных движка cbdin и её перевод в форму витрины (lib/source/contract.ts):
   типы ответов, куски запросов, упаковка, адрес и карточка — одним местом на
   все работы переходника: сборку (catalog.ts), чтения (reads.ts), полку
   (listing.ts) и карту товара (product.ts). До 04.10.2026 всё это жило в
   catalog.ts, и файл дорос до порога чтения (420 строк, check:code). */

/* Помощники набора — JavaScript; тип их ответа записан здесь один раз. */
export type Fetched<T> = { ok: true; data: T } | { ok: false; kind: string; message: string }
/** Запрос к Shop API с кэшем страницы — один на источник (catalog.ts). */
export type Ask = <T>(query: string, variables: Record<string, unknown>, languageCode?: string) => Promise<Fetched<T>>

export type Translation = { languageCode: string; slug: string }
export type VCollection = { id: string; slug: string; name: string; description: string; featuredAsset: Asset | null; translations: Translation[] }
export type VProduct = {
  id: string; name: string; slug: string; description: string
  translations: Translation[]
  featuredAsset: Asset | null; assets: Asset[]
  collections: { id: string; slug: string; translations: Translation[] }[]
  facetValues: { code: string; facet: { code: string } }[]
  customFields: { brand?: string | null; volume?: string | null; strength?: string | null; wasPrice?: number | null; seoDescription?: string | null } | null
  optionGroups: { id: string; code: string; name: string; options: { id: string; code: string; name: string }[] }[]
  variants: { id: string; sku: string; name: string; priceWithTax: number; stockLevel: string; options: { id: string; code: string; group: { code: string } }[] }[]
}
type Hit = { productId: string }
type FacetCount = { count: number; facetValue: { id: string; code: string; name: string; facet: { id: string; code: string; name: string } } }
export type SearchData = { search: { totalItems: number; items: Hit[]; facetValues: FacetCount[] } }
export type Channel = { defaultLanguageCode: string; availableLanguageCodes: string[]; defaultCurrencyCode: string }
/** Что нужно любой работе переходника: запрос, канал и язык запроса. */
export type Engine = { ask: Ask; channelOf: () => Promise<Channel | null>; speak: (lang: Lang) => Promise<string | null> }

export const ASSET = `preview width height focalPoint { x y }`
export const PRODUCT = `
  id name slug description
  translations { languageCode slug }
  featuredAsset { ${ASSET} } assets { ${ASSET} }
  collections { id slug translations { languageCode slug } }
  facetValues { code facet { code } }
  customFields { brand volume strength wasPrice seoDescription }
  optionGroups { id code name options { id code name } }
  variants { id sku name priceWithTax stockLevel options { id code group { code } } }
`
export const SEARCH = `query ($input: SearchInput!) { search(input: $input) {
  totalItems
  items { productId }
  facetValues { count facetValue { id code name facet { id code name } } }
} }`
export const COUNTS = `query ($input: SearchInput!) { search(input: $input) { facetValues { count facetValue { id code name facet { id code name } } } } }`

const STOCK: Record<string, Stock> = { IN_STOCK: 'in', LOW_STOCK: 'low', OUT_OF_STOCK: 'out' }
export const stockOf = (level: string): Stock => STOCK[level] ?? 'in'

/** Штуки движок пишет словом своего языка («30 capsules», «30 капсули»). */
/* Конец слова — не `\b`: граница `\b` знает только латиницу, после
   «капсули» её нет. */
const PIECES = /^(\d+)\s*(capsules?|caps|softgels?|pcs|pieces|ct|gummies|капсули|бр|броя|таблетки|бонбони?)(?!\p{L})/iu
const MEASURE = /^(\d+(?:[.,]\d+)?)\s*(ml|g)$/i
/** Упаковка из полей товара движка: мера из `volume`, CBD — из `strength`.
 *  Не разобралось — мера неизвестна, и строки фактов нет: лучше промолчать,
 *  чем напечатать выдуманное число. */
export function packOf(volume: string | null | undefined, strength: string | null | undefined): Pack | null {
  const raw = (volume ?? '').trim()
  const mgMatch = /(\d+(?:[.,]\d+)?)\s*mg/i.exec(strength ?? '')
  const mg = mgMatch ? Number(mgMatch[1].replace(',', '.')) : null
  const pieces = PIECES.exec(raw)
  if (pieces) return { mg, size: Number(pieces[1]), unit: 'pcs' }
  const measure = MEASURE.exec(raw)
  if (measure) return { mg, size: Number(measure[1].replace(',', '.')), unit: measure[2].toLowerCase() as 'ml' | 'g' }
  return null
}

/** Чем товар продаётся (cbd-facet, §1): что дозируют каплей или дозатором —
 *  концентрацией, остальное — содержанием. Одно решение с гранью
 *  концентрации (`soldByConcentration`, traits.ts, И742). */
export const strengthOf = (p: VProduct): Strength => (soldByConcentration(p) ? 'percent' : 'mg')

/** Постоянный адрес — slug языка канала по умолчанию. */
export const nativeSlug = (c: Channel, item: { slug: string; translations: Translation[] }) =>
  item.translations.find((tr) => tr.languageCode === c.defaultLanguageCode)?.slug ?? item.slug
export const money = (c: Channel, minor: number): Money => ({ minor, currency: c.defaultCurrencyCode })
/** Снимок товара и полки — сервером снимков движка (image.ts). */
export const image = (asset: Asset | null, alt: string): Image | null => (asset ? assetImage(asset, alt, 800) : null)
const NO_IMAGE: Image = { src: '', alt: '', width: 800, height: 800 }

/** Карточка — из товара целиком: цена его вариантов та же, что у поиска
 *  (`priceWithTax`), и «от» у диапазона считается одинаково на полке, в
 *  ходовых и в похожих. */
export function cardOf(c: Channel, p: VProduct): Card {
  const prices = p.variants.map((v) => v.priceWithTax)
  const [min, max] = [Math.min(...prices), Math.max(...prices)]
  const pack = packOf(p.customFields?.volume, p.customFields?.strength)
  const was = p.customFields?.wasPrice
  /* Стандартного варианта у движка пока нет — первый в наличии (И473). */
  const pick = standardOf(p.variants.map((v) => ({ ...v, stock: stockOf(v.stockLevel) })), null)
  return {
    id: nativeSlug(c, p), category: p.collections[0] ? nativeSlug(c, p.collections[0]) : '', brand: p.customFields?.brand?.trim() || null, name: p.name,
    image: image(p.featuredAsset, p.name) ?? NO_IMAGE,
    price: min === max ? { kind: 'single', value: money(c, min) } : { kind: 'range', min: money(c, min), max: money(c, max) },
    was: min === max && typeof was === 'number' && was > min ? money(c, was) : null,
    variant: pick?.id ?? null,
    pick: pick ? { id: pick.id, price: money(c, pick.priceWithTax), was: typeof was === 'number' && was > pick.priceWithTax ? money(c, was) : null, stock: pick.stock, pack } : null,
    stock: overallStock(p.variants.map((v) => stockOf(v.stockLevel))),
    strength: strengthOf(p), packs: pack ? p.variants.map(() => pack) : [],
  }
}
