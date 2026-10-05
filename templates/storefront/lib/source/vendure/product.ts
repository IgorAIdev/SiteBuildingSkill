import type { Lang } from '../../locale.ts'
import type { OptionGroup, Product, Result, Variant } from '../contract.ts'
import { displayOptionGroups } from './core/product.mjs'
import { overallStock } from '../stock.ts'
import { formOf, standardDetails } from '../details.ts'
import { lineOf } from '../line.ts'
import { image, money, nativeSlug, packOf, stockOf, strengthOf, type Engine, type VProduct } from './shape.ts'
import type { Reads, VMate } from './reads.ts'
import { t } from '../../i18n/index.ts'

/* Карта товара из движка: описание, снимки, варианты и линейка (И503) —
   соседи по полке, у которых своя сила и мера. Партий и протоколов у движка
   нет (`batch: null`, `labReports: []`), отзывов в ядре нет (`rating: null`). */

export function productOf({ channelOf, speak }: Engine, reads: Reads) {
  return async (lang: Lang, id: string): Promise<Result<Product>> => {
    const [c, languageCode] = [await channelOf(), await speak(lang)]
    if (!c || !languageCode) return { ok: false, reason: 'unavailable' }
    const r = await reads.bySlug(languageCode, id)
    if (!r.ok) return r
    const p = r.value
    const text = p.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const was = p.customFields?.wasPrice
    const shown = displayOptionGroups(p) as VProduct['optionGroups']
    /* Упаковка — поле товара движка, одна на все его варианты, как у
       карточки полки (`cardOf`, shape.ts). */
    const pack = packOf(p.customFields?.volume, p.customFields?.strength)
    const mateOf = (m: VMate | VProduct) => ({ id: nativeSlug(c, m), name: m.name, brand: m.customFields?.brand?.trim() || null, strength: m.customFields?.strength ?? null, volume: m.customFields?.volume ?? null, stock: overallStock(m.variants.map((v) => stockOf(v.stockLevel))) })
    const shelf = p.variants.length === 1 && p.collections[0] ? await reads.shelfMates(languageCode, p.collections[0].id) : []
    const line = shelf.length ? lineOf(mateOf(p), shelf.map(mateOf), { strength: t(lang, 'line.strength'), volume: t(lang, 'line.volume') }) : null
    const own = line ? line.members.find((m) => m.id === nativeSlug(c, p)) : undefined
    return {
      ok: true,
      value: {
        id: nativeSlug(c, p), category: p.collections[0] ? nativeSlug(c, p.collections[0]) : '', brand: p.customFields?.brand?.trim() || null, name: p.name,
        summary: p.customFields?.seoDescription?.trim() || text.split(/(?<=[.!?])\s/)[0] || '',
        description: text,
        /* Состав и применение — стандартные тексты вида товара (И482): текст
           один на полку, а не поле на каждом товаре; вид — по грани полки
           движка (`category`: oil, capsules…) или по самой полке. */
        ...standardDetails(formOf([...p.facetValues.filter((v) => v.facet.code === 'category').map((v) => v.code), ...p.collections.map((one) => one.slug)]), lang),
        standard: null,
        images: [p.featuredAsset, ...p.assets.filter((a) => a.preview !== p.featuredAsset?.preview)].flatMap((a) => (a ? [image(a, p.name)!] : [])),
        optionGroups: line && own ? line.axes : shown.map((g): OptionGroup => ({ code: g.code, name: g.name, options: g.options.map((o) => ({ code: o.code, name: o.name })) })),
        variants: p.variants.map((v): Variant => ({
          id: v.id, sku: v.sku, name: p.name, price: money(c, v.priceWithTax),
          was: typeof was === 'number' && was > v.priceWithTax ? money(c, was) : null,
          stock: stockOf(v.stockLevel), options: line && own ? own.options : Object.fromEntries(v.options.map((o) => [o.group.code, o.code])), batch: null, pack,
        })),
        labReports: [], rating: null, strength: strengthOf(p), line: line && own ? line.members : [],
      },
    }
  }
}
