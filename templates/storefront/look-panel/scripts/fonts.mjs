/* Шрифт выбранного вида — в сайт, на свой адрес (PANEL.md, шаг 4).

   Страница покупателя к Google не ходит (LG München, 20.01.2022): шрифт
   вида лежит у сайта в public/fonts/ и отдаётся с его адреса `/fonts/…`
   (app/fonts/[file]/route.ts — и для файла, положенного после запуска).
   Скачивает его панель, на сервере, в миг черновика или публикации: браузер
   покупателя в этом не участвует. Подмножества — латиница и расширенная
   (румынские ș ț ă î â, венгерские ő ű) и кириллица — для страниц
   дизайн-системы и панели по-русски (без неё русские слова шли запасным
   шрифтом, латиница рядом — шрифтом вида, И621); файл кириллицы браузер
   берёт, только когда на странице есть русские буквы, — покупателю
   ro/en/hu он не грузится. К этим трём добавляется любое подмножество,
   в которое попадает буква языка рынка (греческий, например, — `greek`):
   рынок задаёт `LOCALES`, буквы языка — `lib/alphabets.json`. По одному
   файлу на начертание; у переменного шрифта Google отдаёт один файл на все
   толщины — он и записывается диапазоном толщин.

   Шрифт, не умеющий букв рынка, не записывается: остановка с названием
   языка и недостающих знаков (scripts/font-coverage.mjs, И769). */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { lookMetrics } from '../../scripts/font-fallback.mjs'
import { lackText, lacking, marketLetters, rangeTouches } from '../../scripts/font-coverage.mjs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
/** Подмножества, что берутся всегда: латиница, расширенная и кириллица панели. */
const SUBSETS = ['latin', 'latin-ext', 'cyrillic']

/** Адрес CSS Google Fonts для семейства и толщин. */
export const cssUrl = (family, weights) => `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights.join(';')}&display=swap`

/** CSS Google Fonts → начертания нужных подмножеств: подмножество, адрес
 *  файла, толщины, диапазон знаков. Один адрес на несколько толщин —
 *  переменный шрифт. `need` — коды знаков рынка: подмножество вне трёх
 *  обычных берётся, только если оно нужно букве, которую эти три по
 *  диапазону не покрывают (греческая — `greek`; румынская ă уже в
 *  `latin-ext`, и вьетнамский файл ради неё не качается). */
export function parseFaces(css, need = new Set()) {
  const all = []
  for (const m of css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    const [, subset, body] = m
    const url = body.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    const weight = Number(body.match(/font-weight:\s*(\d+)/)?.[1])
    const range = body.match(/unicode-range:\s*([^;]+);/)?.[1].trim()
    if (url && weight && range) all.push({ subset, url, weight, range })
  }
  const uncovered = new Set(need)
  for (const f of all) if (SUBSETS.includes(f.subset)) for (const cp of [...uncovered]) if (rangeTouches(f.range, new Set([cp]))) uncovered.delete(cp)
  const byUrl = new Map()
  for (const { subset, url, weight, range } of all) {
    if (!SUBSETS.includes(subset) && !rangeTouches(range, uncovered)) continue
    const face = byUrl.get(url) ?? { subset, url, weights: [], range }
    face.weights.push(weight)
    byUrl.set(url, face)
  }
  return [...byUrl.values()]
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Скачать семейство в папку шрифтов сайта → шрифт вида (LookFont).
 *  `letters` — буквы рынка (`marketLetters`): шрифт без них не записывается. */
export async function fetchFont({ family, weights }, dir, letters) {
  /* Мимо кэша данных Next (`no-store`) и со второй попытки: сервер страниц
     однажды отдал первому запросу ответ без начертаний woff2. */
  let faces = []
  for (let attempt = 0; attempt < 2 && !faces.length; attempt++) {
    const res = await fetch(cssUrl(family, weights), { headers: { 'user-agent': UA }, cache: 'no-store' })
    if (!res.ok) throw new Error(`Google Fonts не отдал «${family}»: ${res.status}`)
    faces = parseFaces(await res.text(), letters.all)
  }
  if (!faces.length) throw new Error(`«${family}»: в ответе нет начертаний ${SUBSETS.join(', ')}`)
  const loaded = await Promise.all(faces.map(async (face) => ({ face, bytes: Buffer.from(await (await fetch(face.url)).arrayBuffer()) })))
  /* До записи: шрифт, не умеющий букв рынка, в public/fonts не попадает. */
  let lack
  try { lack = lacking(loaded.map(({ face, bytes }) => ({ bytes, range: face.range })), letters) } catch (e) {
    throw new Error(`Файл шрифта «${family}» не читается (${e.message}) — буквы рынка не сверены. Выберите другой шрифт.`)
  }
  if (lack.size) throw new Error(`Шрифт «${family}» не умеет букв рынка (${lackText(lack)}): эти знаки покупателю нарисует системный шрифт, и слово поедет другим лицом. Выберите другой шрифт.`)
  mkdirSync(dir, { recursive: true })
  const files = []
  let metrics
  for (const { face, bytes } of loaded) {
    /* Размеры для запасного начертания — с латиницы, при каждой толщине
       100…900 (`lookMetrics`): по ним сайт растягивает системный шрифт под
       этот, и подмена на свежей странице не сдвигает слова
       (scripts/font-fallback.mjs, lib/look-values.ts `fontFaces`). */
    if (face.subset === 'latin' && !metrics) metrics = lookMetrics(bytes, Math.min(...face.weights), Math.max(...face.weights))
    const name = `${slug(family)}-${face.subset}-${createHash('sha256').update(bytes).digest('hex').slice(0, 10)}.woff2`
    if (!existsSync(join(dir, name))) writeFileSync(join(dir, name), bytes)
    const lo = Math.min(...face.weights)
    const hi = Math.max(...face.weights)
    files.push({ url: `/fonts/${name}`, weight: lo === hi ? String(lo) : `${lo} ${hi}`, range: face.range })
  }
  return metrics ? { family, files, metrics } : { family, files }
}

/** Все семейства выбранного шрифта; `root` — корень сайта: от него читаются
 *  языки рынка и их буквы. */
export const fetchFonts = async (need, dir, root) => {
  const letters = marketLetters(root)
  return Promise.all(need.map((f) => fetchFont(f, dir, letters)))
}
