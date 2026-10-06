/* Вид как значения — проверка и выпуск (И270).

   Вид приходит сайту из источника данных (образец — lib/source/sample/
   look.json, живой магазин — админка) и ложится в страницу блоком
   `<style href="look">`. Поэтому каждое значение проверяется до страницы:
   имя свойства — из закрытого списка сайта (lib/look-slots.json, его
   выпускает scripts/look-slots.mjs из стилей самого сайта), значение — по
   роду свойства: краска, длина, число, слово, тень, сдвиг, шрифт. Разбор
   строгий: знаков, которыми закрывают объявление, блок или тег (`;` `{` `}`
   `<` `>` `\` `@` `"`, кавычка — кроме имени шрифта), в значении не бывает
   вовсе, функции и слова — из списка рода. Внедрить CSS нечем. Не прошедшее
   отбрасывается по одному свойству; на его месте остаётся умолчание стилей
   сайта, и отброшенное называется. Чистый модуль: ни next, ни диска. */
import { HEADERS, type HeaderVariant } from './headers.ts'
import { CARDS, type CardVariant } from './cards.ts'
import { HOMES, type HomeVariant } from './homes.ts'
import type { FontMetrics, Look, LookFont } from './source/contract.ts'

export type SlotType = 'colour' | 'length' | 'number' | 'keyword' | 'shadow' | 'transform' | 'font'
/** Что выбирается вместе: набор цвета, набор ритма, ширина холста, углы,
 *  тени, шрифт, стиль кнопок, вид поля ввода и галочки; ручки карты
 *  товара — доля ряда под галерею, место миниатюр, край снимка (И278); ручки
 *  товара на полке и карте — пропорция снимка, плотность полки и место
 *  кнопки «в корзину» на карточке (И400). */
export type Group = 'palette' | 'scale' | 'text-size' | 'head-size' | 'width' | 'corners' | 'shadow' | 'face' | 'button' | 'field' | 'field-label' | 'tick' | 'pdp-gallery' | 'pdp-thumbs' | 'pdp-edge' | 'seg-look' | 'quick-look' | 'go-hover' | 'star' | 'say-look' | 'pair-look' | 'cart-sign' | 'cart-meta' | 'door-case' | 'logo' | 'stock-look' | 'pager-look' | 'filter-look' | 'filter-phone' | 'save-look' | 'nav-current'
  /** Подложка секции главной: по группе на блок (`band-<блок>`, И591) — блоки берутся из реестра, список сюда не пишется. */
  | `band-${string}`
/** Свойство вида: род значения, группа и умолчание стилей сайта. */
export type Slot = { type: SlotType; group: Group; value: string }
export type Slots = Readonly<Record<string, Slot>>
export type Dropped = { what: string; why: string }

const UNITS = new Set(['', 'px', 'rem', 'em', 'vw', 'vh', 'svh', 'dvh', '%', 'cqi', 'ch'])
const FUNCS: Readonly<Record<SlotType, readonly string[]>> = {
  colour: ['light-dark', 'color-mix'],
  length: ['clamp', 'calc', 'min', 'max'],
  number: ['calc'],
  keyword: [],
  shadow: ['color-mix'],
  transform: ['scale', 'translatex', 'translatey'],
  font: [],
}
const WORDS: Readonly<Record<SlotType, readonly string[]>> = {
  colour: ['transparent', 'currentcolor', 'in', 'srgb', 'oklab', 'oklch'],
  length: ['normal'],
  number: [],
  keyword: ['none', 'uppercase', 'lowercase', 'capitalize', 'normal', 'underline', 'block', 'below', 'side', 'dots', 'over', 'inset', 'bleed', 'full', 'beside', 'above', 'edge', 'inside', 'chips', 'joined', 'tray', 'tint', 'disc', 'words', 'tone', 'compact', 'rings', 'bare', 'toned', 'line', 'note', 'apart', 'joined', 'show', 'rows', 'pills', 'tiles', 'cart', 'bag', 'count', 'sum', 'pill', 'word', 'split', 'leaf', 'quiet', 'brand', 'dark', 'sign', 'dot', 'bar', 'panel', 'drawer'],
  shadow: ['none', 'inset', 'transparent', 'in', 'srgb', 'oklab'],
  transform: ['none'],
  font: [],
}
/* Заместители ссылки `var(--…)` и имени шрифта в кавычках — знаки, которых
   значение пройти не может (ворота знаков выше), подделать их нечем. */
const REF = '§'
const NAME = '¤'
const TOKEN = /\s+|#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])|[+-]?(?:\d+\.?\d*|\.\d+)([a-zA-Z%]*)|([a-zA-Z][a-zA-Z-]*)\(|[a-zA-Z][a-zA-Z0-9-]*|[,+*/-]|\)|§|¤/y

/** Значение годится свойству этого рода. */
export function valid(type: SlotType, value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim() || value.length > 400) return false
  if (!/^[A-Za-z0-9#.,%()+\-*/ ']+$/.test(value)) return false
  let rest = type === 'font' ? value.replace(/'[A-Za-z0-9 ]{1,60}'/g, NAME) : value
  if (rest.includes("'")) return false
  rest = rest.replace(/var\(--[a-z0-9-]+\)/g, REF)
  if (rest.includes('--') || /var\(/i.test(rest)) return false
  const kinds: string[] = []
  let depth = 0
  TOKEN.lastIndex = 0
  while (TOKEN.lastIndex < rest.length) {
    const at = TOKEN.lastIndex
    const m = TOKEN.exec(rest)
    if (!m || m.index !== at) return false
    const t = m[0]
    if (/^\s+$/.test(t)) continue
    if (t === REF || t === NAME) kinds.push(t === REF ? 'ref' : 'name')
    else if (t.startsWith('#')) { if (type !== 'colour') return false; kinds.push('hex') }
    else if (/^[+-]?[\d.]/.test(t)) {
      const unit = (m[1] ?? '').toLowerCase()
      if (!UNITS.has(unit) || type === 'keyword' || type === 'font') return false
      if (type === 'shadow' && !['', 'px', 'rem', 'em', '%'].includes(unit)) return false
      if (type === 'number' && unit) return false
      if (type === 'colour' && unit && unit !== '%') return false
      kinds.push('num')
    } else if (m[2]) {
      if (!FUNCS[type].includes(m[2].toLowerCase())) return false
      depth++
      kinds.push('fn')
    } else if (t === ')') {
      if (--depth < 0) return false
    } else if (/^[a-zA-Z]/.test(t)) {
      if (type !== 'font' && !WORDS[type].includes(t.toLowerCase())) return false
      kinds.push('word')
    } else {
      if (type === 'keyword' || ((type === 'shadow' || type === 'font') && t !== ',')) return false
      kinds.push(t === ',' ? 'comma' : 'op')
    }
  }
  if (depth !== 0 || !kinds.length) return false
  if (type === 'keyword') return kinds.length === 1 && kinds[0] === 'word'
  /* Тень — ссылка на роль, `none` или слои: длины, краска ссылкой или
     вуалью, `inset`. `none` — только одно. */
  if (type === 'shadow') return kinds.length === 1 || !/\bnone\b/i.test(rest)
  return true
}

const FAMILY = /^[A-Za-z0-9 ]{1,60}$/
const FONT_URL = /^\/fonts\/[a-z0-9-]{1,80}\.woff2$/
const WEIGHT = /^[1-9]00( [1-9]00)?$/
const RANGE = /^U\+[0-9A-Fa-f?]{1,6}(-[0-9A-Fa-f]{1,6})?(, ?U\+[0-9A-Fa-f?]{1,6}(-[0-9A-Fa-f]{1,6})?)*$/
const LABEL = /^[\p{L}\p{N} .+-]{1,60}$/u
const FIELDS = new Set(['palette', 'face', 'text-size', 'head-size', 'scale', 'width', 'corners', 'shadow', 'field', 'field-label', 'tick', 'header', 'card', 'home', 'pdp-gallery', 'pdp-thumbs', 'pdp-edge', 'seg-look', 'quick-look', 'go-hover', 'star', 'say-look', 'pair-look', 'cart-sign', 'cart-meta', 'door-case', 'logo', 'stock-look', 'pager-look', 'filter-look', 'filter-phone', 'save-look', 'nav-current'])
/** Оси кнопки — поля `btn-<ось>`: каталог кнопки растёт осями данными (И273). */
const AXIS = /^(btn|band)-[a-z0-9-]{1,30}$/

/** Разметка, которую сайт умеет рисовать: варианты шапки, карточки товара
 *  и главной. */
export type Structure = { headers: readonly HeaderVariant[]; cards: readonly CardVariant[]; homes: readonly HomeVariant[] }
export const STRUCTURE: Structure = { headers: HEADERS, cards: CARDS, homes: HOMES }

const record = (x: unknown): Record<string, unknown> | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : null)

/** Шрифт вида годен: имя семейства простыми знаками, файлы — woff2 со
 *  своего адреса `/fonts/`, толщины и диапазоны знаков по записи CSS. */
export function validFont(x: unknown): x is LookFont {
  const f = record(x)
  if (!f || typeof f.family !== 'string' || !FAMILY.test(f.family) || !Array.isArray(f.files) || !f.files.length || f.files.length > 24) return false
  if (f.metrics !== undefined && !validMetrics(f.metrics)) return false
  return f.files.every((file) => {
    const r = record(file)
    return !!r && typeof r.url === 'string' && FONT_URL.test(r.url) && typeof r.weight === 'string' && WEIGHT.test(r.weight) && typeof r.range === 'string' && RANGE.test(r.range)
  })
}
/** Размеры шрифта — доли кегля в разумных пределах: в CSS они идут
 *  процентами, и мусор в записи не должен стать мусором в стиле. Ширины —
 *  по толщинам из сотен 100…900 (ключ — толщина). */
const within = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi
const validMetrics = (x: unknown): x is FontMetrics => {
  const m = record(x)
  const widths = record(m?.widths)
  return !!m && !!widths && Object.keys(widths).length > 0 && Object.entries(widths).every(([w, v]) => /^[1-9]00$/.test(w) && within(v, 0.2, 1)) &&
    within(m.ascent, 0.5, 2) && within(m.descent, 0, 1) && within(m.gap, 0, 1)
}

/** Сохранённый вид → вид, которым можно рисовать, и что отброшено. */
export function acceptValues(raw: unknown, slots: Slots, known: Structure = STRUCTURE): { look: Look; dropped: Dropped[] } {
  const dropped: Dropped[] = []
  const r = record(raw)
  const header = known.headers.find((h) => h === r?.header)
  if (r && !header) dropped.push({ what: 'header', why: `«${String(r.header)}» is not a header this site draws` })
  /* Карточки в сохранённом виде может не быть (вид старше поля) — тогда
     первая, без слова. */
  const card = known.cards.find((c) => c === r?.card)
  if (r && r.card !== undefined && !card) dropped.push({ what: 'card', why: `«${String(r.card)}» is not a product card this site draws` })
  /* Главной в сохранённом виде может не быть (вид старше поля) — тогда
     первая, нынешняя, без слова. */
  const home = known.homes.find((h) => h === r?.home)
  if (r && r.home !== undefined && !home) dropped.push({ what: 'home', why: `«${String(r.home)}» is not a home page this site draws` })
  const vars: Record<string, string> = {}
  for (const [name, value] of Object.entries(record(r?.vars) ?? {})) {
    const slot = Object.hasOwn(slots, name) ? slots[name] : null
    if (!slot) dropped.push({ what: name, why: 'is not a property of this site' })
    else if (!valid(slot.type, value)) dropped.push({ what: name, why: `is not a ${slot.type} value` })
    else vars[name] = value as string
  }
  const fonts: LookFont[] = []
  const given = r?.fonts
  for (const f of Array.isArray(given) ? given : []) {
    if (validFont(f) && fonts.length < 4) fonts.push(f)
    else dropped.push({ what: 'font', why: 'is not a self-hosted woff2 font of this site' })
  }
  const names: Record<string, string> = {}
  for (const [k, v] of Object.entries(record(r?.names) ?? {})) if ((FIELDS.has(k) || AXIS.test(k)) && typeof v === 'string' && LABEL.test(v)) names[k] = v
  return { look: { header: header ?? known.headers[0], card: card ?? known.cards[0], home: home ?? known.homes[0], vars, fonts, names }, dropped }
}

/** Роли тени — по работе (И228). Их геометрия замешана на ингредиентах пола
 *  (`--sh-ring`, `--sh-near`, `--sh-far-*`, `--sh-inset`), а `var()` внутри
 *  свойства раскрывается там, где свойство объявлено: роль объявляется на
 *  каждом полу, который меняет ингредиенты, — одной записью на список полов
 *  `FLOORS`, а не копией геометрии на каждом (И385). Тот же список держит
 *  основа набора в `styles/look.css`. */
/* Шесть ролей по работе, как у профессиональных систем (И726; Atlassian: raised,
   overflow, overlay; Primer: resting, floating; Material 3: уровни 1–3): raised —
   поверхность в покое; lift — шаг под рукой, только под рукой; sticky — полоса у
   края, под которой едет содержимое; overlay — всплывающее немодальное (меню,
   подсказка, кнопка и окно помощи); modal — окно и шторка с затемнением; in —
   вдавленное. */
export const SHADOWS = ['--sh-raised', '--sh-lift', '--sh-sticky', '--sh-overlay', '--sh-modal', '--sh-in'] as const
export const FLOORS = ":root,[data-ground='deck'],[data-plate]"
const isShadow = (name: string): boolean => (SHADOWS as readonly string[]).includes(name)
/** Роли вида, чьи значения ссылаются на краски пола (`var(--ink)`,
 *  `var(--quiet)`, `var(--pop-ink)` …): вид поля,
 *  галочка, ссылка под рукой (И426). `var()` раскрывается там, где роль
 *  объявлена: объявленные на корне, они несли краски бумаги и на палубу —
 *  слово текущей полки в тёмной строке шапки стояло тёмным на тёмном. Поэтому
 *  они объявляются на каждом полу, как роли тени. Заливка, чернила и кромка
 *  тихой кнопки (`--ctrl-btn-fill|ink|edge`) — той же породы (И549): знак
 *  без плиты в тёмном подвале нёс чернила бумаги, тёмным по тёмному. Роли
 *  главной (`-pop`: заливка, надпись, кромка, тон, обод) — тоже на каждом полу
 *  (И694): на корне они несли заливку бумаги, и когда палуба стала заливкой
 *  марки (тёмное одно), главная в подвале совпала с ним цветом — «Subscribe»
 *  осталась одной надписью (слово заказчика 03.10.2026: «кнопка subscribe
 *  поломана»). На палубе главная берёт заливку палубы (`--pop` пола). */
export const FLOOR_ROLES = /^--(?:(?:ctrl-field|ctrl-tick|go-hover)(?:-|$)|ctrl-btn-(?:fill|ink|edge|tint|rim)(?:-pop)?$)/
const onFloors = (name: string): boolean => isShadow(name) || FLOOR_ROLES.test(name)

/** Проверенный вид → текст блока `<style href="look">`: свойства на корне
 *  (краски — `light-dark()`, как в styles/palette.css, тема решается
 *  `color-scheme`), роли тени — на списке полов, шрифты со своих адресов. */
export function lookCss(look: Look): string {
  const decl = (keep: (name: string) => boolean) => Object.entries(look.vars).filter(([k]) => keep(k)).map(([k, v]) => `${k}:${withFallback(v, look.fonts)}`).join(';')
  const vars = decl((k) => !onFloors(k))
  const shadows = decl(onFloors)
  return [vars ? `:root{${vars}}` : '', shadows ? `${FLOORS}{${shadows}}` : '', ...fontFaces(look.fonts, look.vars)].filter(Boolean).join('\n')
}

/** Опорные системные шрифты запасного начертания: средняя ширина знака
 *  тем же счётом, что у шрифта вида (scripts/font-fallback.mjs, `metricsOf`;
 *  сняты с arial.ttf, arialbd.ttf, times.ttf и timesbd.ttf Windows
 *  06.10.2026, таблицей частот capsize). Жирное — своим файлом: синтетический
 *  жирный обычного Arial не шире его, и надписи органов (600) выходили на
 *  4 % уже. */
export const FALLBACK_REFERENCE = {
  sans: { regular: { local: "local('Arial')", avg: 0.4458 }, bold: { local: "local('Arial Bold'),local('Arial-BoldMT')", avg: 0.4798 } },
  serif: { regular: { local: "local('Times New Roman')", avg: 0.4062 }, bold: { local: "local('Times New Roman Bold'),local('TimesNewRomanPS-BoldMT')", avg: 0.4324 } },
} as const
const fallbackName = (family: string) => `${family} Fallback`

/** Значение свойства шрифта с запасным начертанием сразу за семейством
 *  вида: `'Manrope', var(--face-stack)` → `'Manrope', 'Manrope Fallback',
 *  var(--face-stack)`. Только у семейств с размерами — без них запасного
 *  начертания нет. */
export function withFallback(value: string, fonts: readonly LookFont[]): string {
  let out = value
  for (const f of fonts) {
    if (!f.metrics || out.includes(`'${fallbackName(f.family)}'`)) continue
    out = out.replace(`'${f.family}'`, `'${f.family}', '${fallbackName(f.family)}'`)
  }
  return out
}

/** Доля кегля → процент CSS. */
const pct = (x: number) => `${(x * 100).toFixed(2)}%`

/** `@font-face` вида: файлы семейства и запасное начертание, растянутое под
 *  размеры семейства (слово заказчика 01.10.2026: слова на свежей странице
 *  не смещаются). Файлы — `font-display: optional`, и заранее их просит
 *  Shell (`fontPreloads`): предзагруженный `optional` браузер ждёт до первой
 *  отрисовки, не дольше 100 мс, а не успевший — не подменяет до конца
 *  визита (web.dev, «preload optional fonts», Chrome 83+). Подмена
 *  (`swap`) сдвигала строку всегда, когда запасной шире или уже в ней
 *  хоть на долю процента: подгонка средняя, слово — нет («Contact» у
 *  Manrope на 6,7 % шире Arial, «Blog» на 1,7 % уже; подзаголовок статьи
 *  на 0,7 % короче колонки — запасным в две строки, И608). Запасное
 *  подогнано всё равно: опоздавший шрифт — визит запасным, и он стоит теми
 *  же строками, что настоящий. Формулы next/font: override
 *  делится на `size-adjust`, потому что браузер умножает на него и их.
 *  Опора — Times New Roman, если семейство стоит в стеке с засечками, иначе
 *  Arial; до 500 — обычный, с 600 — жирный. Запасное у каждой толщины
 *  записи своё (`metrics.widths`): ширина настоящего растёт с толщиной, а у
 *  обычного Arial при 400 и 500 одна, и одно начертание на 100…500 ставило
 *  меню и заголовки 500 на 1,5–2 % уже (И608). Толщина отвечает за полосу
 *  до середины между соседями; соседние полосы с одним файлом и одним
 *  растяжением (толщины за диапазоном файла) идут одним начертанием. */
export function fontFaces(fonts: readonly LookFont[], vars: Record<string, string> = {}): string[] {
  return fonts.flatMap((f) => {
    const files = f.files.map((x) =>
      `@font-face{font-family:'${f.family}';src:url(${x.url}) format('woff2');font-weight:${x.weight};font-style:normal;font-display:optional;unicode-range:${x.range}}`)
    if (!f.metrics) return files
    const m = f.metrics
    const serif = Object.values(vars).some((v) => v.includes(`'${f.family}'`) && /(^|[\s,])serif\s*$/.test(v))
    const ref = serif ? FALLBACK_REFERENCE.serif : FALLBACK_REFERENCE.sans
    const weights = Object.keys(m.widths).map(Number).sort((a, b) => a - b)
    const bands: { lo: number; hi: number; src: string; size: number }[] = []
    weights.forEach((w, i) => {
      const base = w >= 600 ? ref.bold : ref.regular
      const size = m.widths[w] / base.avg
      const lo = i ? (weights[i - 1] + w) / 2 : 1
      const hi = i < weights.length - 1 ? (w + weights[i + 1]) / 2 - 1 : 1000
      const last = bands.at(-1)
      if (last && last.src === base.local && last.size === size) last.hi = hi
      else bands.push({ lo, hi, src: base.local, size })
    })
    return [...files, ...bands.map(({ lo, hi, src, size }) =>
      `@font-face{font-family:'${fallbackName(f.family)}';src:${src};font-weight:${lo} ${hi};size-adjust:${pct(size)};ascent-override:${pct(m.ascent / size)};descent-override:${pct(m.descent / size)};line-gap-override:${pct(m.gap / size)}}`)]
  })
}

/** Файлы шрифтов вида — все, их документ просит заранее (`preload`), до
 *  первой отрисовки. Без этого файл шёл в очередь только когда браузер
 *  встречал текст, и слова сперва вставали запасным стеком, а через миг
 *  подменялись шрифтом и сдвигались (слово заказчика 01.10.2026: «при
 *  наведении на пункты меню слова чуть смещаются, один раз на свежей
 *  странице»). Все подмножества, а не по буквам языка: расширенная латиница
 *  нужна и английской странице — «Română» в переключателе языка стоит на
 *  каждой (замер check:craft `fontLate`); два файла латиницы — ~35 КБ. */
export function fontPreloads(fonts: readonly LookFont[]): string[] {
  return [...new Set(fonts.flatMap((f) => f.files.map((x) => x.url)))]
}

/** Толщины, загруженные у семейства вида; null — семейство не загружается
 *  видом (системное), толщины любые. */
export function loadedWeights(fonts: readonly LookFont[], family: string | null): number[] | null {
  const f = family ? fonts.find((x) => x.family === family) : null
  if (!f) return null
  const out = new Set<number>()
  for (const file of f.files) {
    const [lo, hi = lo] = file.weight.split(' ').map(Number)
    for (let w = lo; w <= hi; w += 100) out.add(w)
  }
  return [...out].sort((a, b) => a - b)
}
