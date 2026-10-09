import type { Facet } from '../contract.ts'
import { bandCode, bands, spanOf, within } from '../bands.ts'
/* Отрезки меры — один расчёт (lib/source/bands.ts). */
export { bands } from '../bands.ts'

/* Грани полки из полей товара движка: концентрация, CBD в упаковке и вид
   экстракта (И742; цену заказчик снял 04.10.2026: «удаляй выбор по цене»).
   Слово заказчика 02.10.2026: меню «Oil» — «выбор
   по концентрации, по типу» (образец cbdin.bg); 04.10.2026: «там ещё эффект,
   содержание, вид продукта». В движке cbdin таких разделов граней нет: у
   товара поля `strength` («1000mg»), `volume` («10ml», «5g», «30 капсули») и
   `spectrumKey` («full», «broad», «isolate», «raw»), а сила в процентах стоит
   только в имени. Имя не разбираем — считаем из полей: % = мг ÷ (мл или г ×
   10), как у cbdin.bg («10 % · 1000 mg» в 10 мл; 3000 mg в 30 мл — те же 10 %).

   Поиск движка по полям товара не ищет, поэтому выбор по этим граням идёт
   в переходнике: он берёт номера товаров полки у поиска и сверяет их с
   полями (`traitsOf` в catalog.ts). Нет у движка поля — граней нет, а каталог
   стоит как стоял.

   Концентрация (%) — у того, что дозируют каплей или дозатором; CBD в
   упаковке (мг) — у каждого товара, у масла тоже (И742, слово заказчика
   04.10.2026: «мг у них есть… 30 % — это 3000 мг»): масло 3000 мг попадает
   в отрезок «800–3000 mg» наравне с капсулами. */

export const CONCENTRATION = 'concentration'
export const CONTENT = 'content'
export const TYPE = 'type'
/** Порядок граней в фильтре — порядок этого списка (И742). */
export const VIRTUAL = [CONCENTRATION, CONTENT, TYPE] as const
type Key = (typeof VIRTUAL)[number]

/** `percent` — у того, что продаётся концентрацией; `mg` — CBD в упаковке
 *  у любого товара, где движок его знает. */
export type Trait = { percent: string | null; mg: number | null; type: string | null }
/** Имена граней и запись отрезков языком страницы (`mg` — от и до; одно
 *  число, когда отрезок — точка). */
export type Named = {
  concentration: string; content: string; type: string; types: Record<string, string>
  mg: (lo: number, hi: number) => string
}
type Picked = Partial<Record<Key, string[]>>

type Shelf = { facetValues: { code: string; facet: { code: string } }[] }
type Fields = { volume?: string | null; strength?: string | null; spectrumKey?: string | null; dropsPerMl?: number | null; applicatorMl?: number | null }
type Raw = Shelf & { customFields: Fields | null }

const MG = /(\d+(?:[.,]\d+)?)\s*mg/i
const MEASURE = /^(\d+(?:[.,]\d+)?)\s*(ml|g)$/i
const ORDER = ['full', 'broad', 'isolate', 'raw']
/** Полки капель: у движка cbdin мера капли (`dropsPerMl`) у масел не
 *  заполнена — пока её нет, каплю узнаём по полке. Поле заполнено — решает
 *  оно, и полка не нужна. */
const DROP_SHELVES = new Set(['oil', 'oils', 'pets'])
/** Масла слабее процента не бывает (слово заказчика 04.10.2026: «масел 0.4 %
 *  не бывает»; у cbdin.bg масла — от 3 до 50 %). Жидкость на полке капель
 *  слабее — бальзам или лосьон (бальзам для лап: 200 мг в 50 мл), и она
 *  продаётся содержанием, мг, как у cbdin.bg. */
const MIN_DROP_PERCENT = 1
const number = (s: string) => Number(s.replace(',', '.'))

/** Концентрация из полей: мг ÷ (мл или г × 10); нет меры или мг — `null`. */
const concentrationOf = (f: Fields | null): { value: number; unit: string } | null => {
  const mg = MG.exec(f?.strength ?? '')
  const measure = MEASURE.exec((f?.volume ?? '').trim())
  if (!mg || !measure || !number(measure[1])) return null
  return { value: number(mg[1]) / (number(measure[1]) * 10), unit: measure[2].toLowerCase() }
}

/** Продаётся концентрацией (cbd-facet, §1): меру дозирует капля или дозатор
 *  — поле движка (`dropsPerMl`, `applicatorMl`, паста в шприце), а пока его
 *  нет — жидкость в мл на полке капель не слабее масла (`MIN_DROP_PERCENT`).
 *  Одно решение на грань и на карту товара (`strengthOf`, catalog.ts). */
export function soldByConcentration(p: Shelf & { customFields: Fields | null }): boolean {
  const f = p.customFields
  const c = concentrationOf(f)
  if (!c || c.value <= 0) return false
  if (f?.dropsPerMl != null || f?.applicatorMl != null) return true
  return c.unit === 'ml' && c.value >= MIN_DROP_PERCENT && p.facetValues.some((v) => v.facet.code === 'category' && DROP_SHELVES.has(v.code))
}

export function traitOf(p: Raw): Trait {
  const f = p.customFields
  const mg = MG.exec(f?.strength ?? '')
  const total = mg ? number(mg[1]) : null
  const byPercent = soldByConcentration(p)
  const raw = byPercent ? concentrationOf(f)!.value : null
  return {
    percent: raw && raw > 0 ? String(Math.round(raw * 10) / 10) : null,
    mg: total && total > 0 ? total : null,
    type: f?.spectrumKey?.trim().toLowerCase() || null,
  }
}

const matches = (t: Trait | undefined, picked: Picked): boolean => {
  const got = (k: Key) => picked[k] ?? []
  return (!got(CONCENTRATION).length || (t?.percent != null && got(CONCENTRATION).includes(t.percent))) &&
    (!got(CONTENT).length || within(t?.mg ?? null, got(CONTENT))) &&
    (!got(TYPE).length || (t?.type != null && got(TYPE).includes(t.type)))
}

/** Товары полки, прошедшие выбор по этим граням, в порядке выдачи. */
export const chosen = (ids: string[], traits: Map<string, Trait>, picked: Picked): string[] => ids.filter((id) => matches(traits.get(id), picked))

const NONE: Trait = { percent: null, mg: null, type: null }

/** Грани полки. Значения — по рамке (`frame`: полка страницы без выбора
 *  покупателя), счёт — по `ids` (рамка, суженная гранями движка) против выбора
 *  других граней (cbd-facet, §3), своя грань не сужает себя. Значение с нулём
 *  остаётся в списке — фильтр гасит его, а не прячет (заказчик 04.10.2026:
 *  «должны становиться неактивными и количество ноль»): список не прыгает, и
 *  живой счёт ещё не применённого выбора находит каждое значение (раньше
 *  у косметики грань процентов пропадала из ответа, и «20 % (4)» стояло
 *  старым числом). Нет значений в рамке — грани нет. Отрезки мг — тоже по
 *  рамке: выбор меняет счёт, а не сами отрезки. */
export function virtualFacets(ids: string[], traits: Map<string, Trait>, picked: Picked, names: Named, frame: string[] = ids): Facet[] {
  const of = (id: string) => traits.get(id) ?? NONE
  const against = (own: Key) => ids.filter((id) => matches(traits.get(id), { ...picked, [own]: [] }))
  /* Счёт значений рамки: каждое — с нулём, пока выбор его не находит. */
  const count = (list: string[], pick: (t: Trait) => string | null) => {
    const n = new Map<string, number>()
    for (const id of frame) { const k = pick(of(id)); if (k) n.set(k, 0) }
    for (const id of list) { const k = pick(of(id)); if (k && n.has(k)) n.set(k, n.get(k)! + 1) }
    return n
  }
  const banded = (code: Key, name: string, most: number, pick: (t: Trait) => number | null, label: (lo: number, hi: number) => string): Facet | null => {
    const all = frame.map((id) => pick(of(id))).filter((x): x is number => x != null)
    if (!all.length) return null
    const spans = bands(all, most)
    const live = against(code).map((id) => pick(of(id)))
    const sel = picked[code] ?? []
    const values = spans.map((s) => {
      const c = bandCode(s)
      return { code: c, name: label(s[0], s[1]), count: live.filter((x) => x != null && x >= s[0] && x <= s[1]).length, selected: sel.includes(c) }
    })
    /* Выбор из адреса, которого среди отрезков уже нет (ассортимент сдвинул
       их), — своим значением: пилюля и галочка не пропадают молча. */
    for (const c of sel) {
      const s = spanOf(c)
      if (s && !values.some((v) => v.code === c)) values.push({ code: c, name: label(s[0], s[1]), count: live.filter((x) => x != null && x >= s[0] && x <= s[1]).length, selected: true })
    }
    /* Мг есть на любой полке и едет во все товары (И742, 04.10.2026). */
    return { code, name, bands: true, values }
  }
  const out: Facet[] = []
  const pct = count(against(CONCENTRATION), (t) => t.percent)
  if (pct.size) {
    out.push({ code: CONCENTRATION, name: names.concentration, values: [...pct].sort((a, b) => Number(a[0]) - Number(b[0])).map(([code, n]) => ({ code, name: `${code}%`, count: n, selected: (picked.concentration ?? []).includes(code) })) })
  }
  const content = banded(CONTENT, names.content, 5, (t) => t.mg, names.mg)
  if (content) out.push(content)
  const kinds = count(against(TYPE), (t) => t.type)
  if (kinds.size) {
    const rank = (k: string) => (ORDER.includes(k) ? ORDER.indexOf(k) : ORDER.length)
    out.push({ code: TYPE, name: names.type, values: [...kinds].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0])).map(([code, n]) => ({ code, name: names.types[code] ?? code.charAt(0).toUpperCase() + code.slice(1), count: n, selected: (picked.type ?? []).includes(code) })) })
  }
  return out
}
