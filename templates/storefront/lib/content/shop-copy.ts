import data from './shop-copy.json' with { type: 'json' }
import type { Lang } from '../locale.ts'
import type { Form } from '../source/details.ts'
import { formOf } from '../source/details.ts'
import { CATEGORIES } from '../products.ts'

/** Editorial content shared by the sample, Vendure and the rendered pages.
 * Unknown collections/effects keep their source copy and get no invented FAQ. */
export type ShopCopy = {
  heading: string
  title: string
  description: string
  lede: string
  sections: { heading: string; paragraphs: string[] }[]
  faq: { title: string; items: { q: string; a: string }[] }
  sources?: { label: string; url: string }[]
}
const COPY: {
  categories: Partial<Record<Form, Record<Lang, ShopCopy>>>
  effects: Record<string, Record<Lang, ShopCopy>>
} = data

export function categoryCopy(lang: Lang, slug: string): ShopCopy | null {
  const form = formOf([slug]) ?? CATEGORIES.find((c) => c.slug === slug)?.form
  return form ? COPY.categories[form]?.[lang] ?? null : null
}

export function effectCopy(lang: Lang, code: string): ShopCopy | null {
  return Object.hasOwn(COPY.effects, code) ? COPY.effects[code][lang] : null
}
