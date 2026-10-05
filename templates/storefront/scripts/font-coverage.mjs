/* Шрифт вида умеет буквы рынка (слово заказчика 05.10.2026: «какой-то шрифт,
   типографика для Румынии… витрина универсальная, через месяц другая
   страна»).

   У румынского пять букв вне базовой латиницы — ă â î ș ț, причём ș и ț с
   запятой снизу (U+0219, U+021B), не седильные ş ţ; у венгерского — ő ű; у
   болгарского и греческого свой алфавит. Шрифт без этих знаков не ломает
   сайт — он молча отдаёт их системному шрифту, и слово посреди строки
   меняет лицо. Какие буквы нужны, — факт языка: `lib/alphabets.json`, по
   языку. Какие языки у рынка — `LOCALES` из `lib/locale.ts`, их переписывает
   установщик; новая страна ничего здесь не правит. Язык без записи в
   таблице — остановка, не молчание.

   Меряется то, что получит покупатель: знак засчитан, только если он есть в
   таблице знаков файла (cmap) И входит в `unicode-range` его `@font-face` —
   иначе браузер этот файл для знака не возьмёт. Подмножество по имени не
   смотрится: у шрифта бывает `latin-ext` без ș ț.

   Читают эту сверку двое — скачивание шрифта в панели вида и тест
   опубликованного вида (tests/fonts.test.ts), — по одной функции; панель
   снимается, а сверка и тест остаются сайту. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fontTables } from './font-fallback.mjs'

/** Цифры, латиница и знак евро: цены, имя марки и адреса стоят на любом рынке. */
export const BASE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz€'

const codes = (s) => [...s].map((c) => c.codePointAt(0))

/** Языки рынка — строка `LOCALES` из `lib/locale.ts` (её же читает tools/routes.mjs). */
export function marketLangs(root) {
  const text = readFileSync(join(root, 'lib/locale.ts'), 'utf8')
  const row = text.match(/LOCALES = \[([^\]]*)\]/)?.[1]
  if (!row) throw new Error('lib/locale.ts: нет строки LOCALES — не знаю языков рынка')
  return [...row.matchAll(/'([a-z]{2,3}(?:-[A-Za-z]+)*)'/g)].map((m) => m[1])
}

/** Буквы рынка: `langs`, `byLang` (язык → код знака → знак), `all` — все коды. */
export function marketLetters(root) {
  const langs = marketLangs(root)
  const table = JSON.parse(readFileSync(join(root, 'lib/alphabets.json'), 'utf8'))
  const byLang = new Map([['*', BASE]])
  for (const lang of langs) {
    const letters = table[lang.split('-')[0].toLowerCase()]
    if (letters === undefined) throw new Error(`lib/alphabets.json: у языка «${lang}» рынка нет записи букв — шрифту нечего сверять; допиши строку языка`)
    byLang.set(lang, letters)
  }
  const all = new Set()
  for (const letters of byLang.values()) for (const c of codes(letters)) all.add(c)
  return { langs, byLang, all }
}

/** `unicode-range` → отрезки кодов: `U+0100-02BA, U+0218-021B, U+4??`. */
export function parseRange(range) {
  const out = []
  for (const part of range.split(',')) {
    const m = part.trim().match(/^U\+([0-9A-Fa-f?]+)(?:-([0-9A-Fa-f]+))?$/)
    if (!m) continue
    out.push(m[1].includes('?')
      ? [parseInt(m[1].replace(/\?/g, '0'), 16), parseInt(m[1].replace(/\?/g, 'F'), 16)]
      : [parseInt(m[1], 16), parseInt(m[2] ?? m[1], 16)])
  }
  return out
}
const inRange = (spans, cp) => spans.some(([lo, hi]) => cp >= lo && cp <= hi)
/** Касается ли `unicode-range` хоть одного знака из `codesSet`. */
export const rangeTouches = (range, codesSet) => {
  const spans = parseRange(range)
  for (const cp of codesSet) if (inRange(spans, cp)) return true
  return false
}

/** Знаки, у которых в таблице шрифта есть глиф (форматы 4 и 12, Юникод). */
export function cmapChars(buf) {
  const cmap = fontTables(buf).get('cmap')
  const out = new Set()
  if (!cmap) return out
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const platform = cmap.readUInt16BE(4 + i * 8)
    if (platform !== 0 && platform !== 3) continue
    const o = cmap.readUInt32BE(8 + i * 8)
    const format = cmap.readUInt16BE(o)
    if (format === 4) {
      const segs = cmap.readUInt16BE(o + 6) / 2
      const ends = o + 14; const starts = ends + segs * 2 + 2; const deltas = starts + segs * 2; const offs = deltas + segs * 2
      for (let s = 0; s < segs; s++) {
        const end = cmap.readUInt16BE(ends + s * 2); const start = cmap.readUInt16BE(starts + s * 2)
        const delta = cmap.readUInt16BE(deltas + s * 2); const off = cmap.readUInt16BE(offs + s * 2)
        for (let c = start; c <= end && c < 0xffff; c++) {
          const glyph = off === 0 ? (c + delta) & 0xffff : cmap.readUInt16BE(offs + s * 2 + off + (c - start) * 2)
          if (glyph !== 0) out.add(c)
        }
      }
    } else if (format === 12) {
      const groups = cmap.readUInt32BE(o + 12)
      for (let g = 0; g < groups; g++) {
        const start = cmap.readUInt32BE(o + 16 + g * 12); const end = cmap.readUInt32BE(o + 20 + g * 12)
        for (let c = start; c <= end; c++) out.add(c)
      }
    }
  }
  return out
}

/** Чего шрифту не хватает: язык → знаки, которых покупатель не получит из
 *  файлов `files` (`{ bytes, range }` — файл и `unicode-range` его начертания).
 *  Пусто — шрифт умеет все буквы рынка. */
export function lacking(files, letters) {
  const served = new Set()
  for (const f of files) {
    const spans = parseRange(f.range)
    for (const cp of cmapChars(f.bytes)) if (letters.all.has(cp) && inRange(spans, cp)) served.add(cp)
  }
  const out = new Map()
  for (const [lang, text] of letters.byLang) {
    const missing = [...new Set(codes(text))].filter((cp) => !served.has(cp))
    if (missing.length) out.set(lang, String.fromCodePoint(...missing))
  }
  return out
}

/** Простыми словами: «румынский: ș ț; венгерский: ő». */
export function lackText(lack) {
  const names = new Intl.DisplayNames(['ru'], { type: 'language' })
  return [...lack].map(([lang, text]) => {
    const who = lang === '*' ? 'цифры и латиница' : (() => { try { return names.of(lang) } catch { return lang } })()
    return `${who}: ${[...text].join(' ')}`
  }).join('; ')
}
