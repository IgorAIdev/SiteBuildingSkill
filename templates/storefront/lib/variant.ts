import type { Lang } from './locale.ts'
import type { Product, Variant } from './source/contract.ts'
import type { Params } from './listing.ts'
import { inspectSelection } from './commerce/variant-selection.mjs'
import { hrefFor } from './href.ts'

export type SelectionStatus = 'ready' | 'unavailable' | 'incomplete' | 'missing' | 'invalid' | 'ambiguous'
export type OptionGroupLinks = { code: string; name: string; options: { code: string; name: string; href: string | null; current: boolean }[] }

/* Помощник набора — JavaScript; тип его ответа записан здесь один раз. */
type Inspected = { status: SelectionStatus; variant: { id: string } | null }

/** Выбор из адреса: `option.<группа>=<код>`. Группа, которой у товара нет, не угадывается. */
export function readSelection(params: Params, product: Product): Record<string, string> {
  /* Товар линейки (И503) — один вариант, и выбор его — он сам: сила и мера
     у товара в адресе, а не в параметрах. */
  if (product.line.length) return { ...product.variants[0]?.options }
  const out: Record<string, string> = {}
  for (const g of product.optionGroups) {
    const raw = params[`option.${g.code}`]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value) out[g.code] = value
  }
  return out
}

/** Покупатель нажал «в корзину», не выбрав варианта (адрес от `hrefFor`
 *  с `choose`): без скрипта это переход формы, со скриптом — тот же адрес
 *  мягким переходом. */
export function askedToChoose(params: Params): boolean {
  const raw = params.choose
  return (Array.isArray(raw) ? raw[0] : raw) === '1'
}

export function pickState(product: Product, selected: Record<string, string>): { status: SelectionStatus; variant: Variant | null } {
  const options = product.optionGroups.map((g) => ({ id: g.code, values: g.options.map((o) => o.code) }))
  const variants = product.variants.map((v) => ({ id: v.id, options: v.options, available: v.stock !== 'out' }))
  const r = inspectSelection(options, variants, selected) as Inspected
  const found = r.variant
  return { status: r.status, variant: found ? (product.variants.find((v) => v.id === found.id) ?? null) : null }
}

/** Ссылки выбора. У опции — адрес с ней вместо текущей в той же группе.
 *  Сочетания нет вовсе — адреса нет; вариант есть, но нет в наличии —
 *  адрес есть: страница скажет «stoc epuizat», а не спрячет вариант. */
export function optionLinks(lang: Lang, product: Product, selected: Record<string, string>): OptionGroupLinks[] {
  if (product.line.length) return lineLinks(lang, product)
  const known = Object.fromEntries(Object.entries(selected).filter(([k, v]) =>
    product.optionGroups.some((g) => g.code === k && g.options.some((o) => o.code === v))))
  const exists = (candidate: Record<string, string>) =>
    product.variants.some((v) => Object.entries(candidate).every(([k, val]) => v.options[k] === val))
  return product.optionGroups.map((g) => ({
    code: g.code,
    name: g.name,
    options: g.options.map((o) => {
      const candidate = { ...known, [g.code]: o.code }
      return { code: o.code, name: o.name, current: known[g.code] === o.code, href: exists(candidate) ? hrefFor(lang, { product: product.id, options: candidate }) : null }
    }),
  }))
}

/** Ссылки выбора товара линейки (И503): опция ведёт к соседу — товару той
 *  же марки и имени с этой силой или мерой, — с тем же выбором в остальных
 *  группах; такого нет — к любому соседу с этой опцией. Соседа нет вовсе —
 *  адреса нет. Каждый сосед — своя страница со своим адресом, её видит
 *  поиск. */
function lineLinks(lang: Lang, product: Product): OptionGroupLinks[] {
  const own = product.variants[0]?.options ?? {}
  const has = (m: Product['line'][number], want: Record<string, string>) => Object.entries(want).every(([k, v]) => m.options[k] === v)
  return product.optionGroups.map((g) => ({
    code: g.code,
    name: g.name,
    options: g.options.map((o) => {
      const to = product.line.find((m) => has(m, { ...own, [g.code]: o.code })) ?? product.line.find((m) => m.options[g.code] === o.code)
      return { code: o.code, name: o.name, current: own[g.code] === o.code, href: to ? hrefFor(lang, { product: to.id }) : null }
    }),
  }))
}

/** Имя страницы товара линейки (И503): имя и его сила и мера — «Full-spectrum
 *  CBD oil 10 % · 10 ml». У соседей имя одно, и без меры их страницы
 *  звались бы одинаково: заголовок окна, h1 и крошка для поиска — дубли.
 *  Товар один — имя как есть. */
export function titleOf(product: Product): string {
  if (!product.line.length) return product.name
  const own = product.variants[0]?.options ?? {}
  /* Мера, которую имя уже несёт («10% CBD Oil…» у движка cbdin), второй
     раз не пишется. */
  const bare = (x: string) => x.replace(/[\s\u00a0]+/g, '').toLowerCase()
  const said = product.optionGroups.map((g) => g.options.find((o) => o.code === own[g.code])?.name)
    .filter((x): x is string => Boolean(x) && !bare(product.name).includes(bare(x!)))
  return said.length ? `${product.name} ${said.join(' · ')}` : product.name
}
