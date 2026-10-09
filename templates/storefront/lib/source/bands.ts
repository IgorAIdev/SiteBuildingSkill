/* Отрезки меры и цены по товарам полки (И742, И744): один расчёт на оба
   источника — переходник движка cbdin (vendure/traits.ts: мг и цена) и образец
   (sample/catalog.ts: цена). Код отрезка — «от-до» в адресе (`20-45`), выбор
   из адреса разбирается тем же кодом. Чистый модуль. */
/** Отрезки меры по товарам полки: пока разных значений не больше `most` —
 *  каждое своим значением; больше — `most` отрезков примерно поровну
 *  товаров (cbdin.bg: мг «10–150 · 200–250 · 300–350 · 400–600 · 750–3000»,
 *  цена тремя отрезками 27 / 27 / 31). Равные числа не разрываются между
 *  отрезками. */
export function bands(values: number[], most: number): [number, number][] {
  const sorted = [...values].sort((a, b) => a - b)
  const distinct = [...new Set(sorted)]
  if (distinct.length <= most) return distinct.map((v) => [v, v])
  const out: [number, number][] = []
  let start = 0
  for (let k = 1; k <= most && start < sorted.length; k++) {
    let end = Math.max(start, Math.round((sorted.length * k) / most) - 1)
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end]) end++
    out.push([sorted[start], sorted[end]])
    start = end + 1
  }
  return out
}

/** Код отрезка — «от-до» или одно число; разбор того же кода из адреса. */
export const bandCode = ([lo, hi]: [number, number]): string => (lo === hi ? String(lo) : `${lo}-${hi}`)
const SPAN = /^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?$/
export const spanOf = (code: string): [number, number] | null => {
  const m = SPAN.exec(code)
  return m ? [Number(m[1]), Number(m[2] ?? m[1])] : null
}
export const within = (x: number | null, codes: string[]): boolean =>
  x != null && codes.some((c) => { const s = spanOf(c); return !!s && x >= s[0] && x <= s[1] })
