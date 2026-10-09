/* Подогнанный запасной шрифт (слово заказчика 01.10.2026: «на свежей
   странице слова чуть смещаются… сделай, чтоб такой проблемы не было более»).

   Шрифт вида лежит у сайта (`/fonts/…`, туда его кладёт панель вида) и
   приходит не сразу: до него слова стоят запасным стеком, а когда он
   приходит — подменяются и сдвигаются, потому что у системного шрифта другая
   ширина букв и другая высота строки. Лечится двумя вещами: файл просится
   заранее (`<link rel=preload>`, components/Shell.tsx), а запасной шрифт
   растягивается под размеры настоящего — `size-adjust` по средней ширине
   буквы и `ascent-/descent-/line-gap-override` по высоте строки. Так делает
   next/font (`adjustFontFallback`); здесь — без зависимостей, из самого
   файла, который браузер и скачает. Размеры кладутся в запись вида
   (`LookFont.metrics`, панель вида, когда скачивает шрифт), запасное начертание
   из них пишет сайт (lib/look-values.ts, `fontFaces`).

   Средняя ширина — по частоте знаков в тексте, а не по одной букве: ширина
   слова складывается из частых знаков, и заглавные, цифры и препинание в
   счёт входят (без них Manrope выходил на 1,5 % шире своих строк: у него
   они уже, чем у Arial). Своя ширина — у каждой толщины 100…900: текст
   набран 400, меню и заголовки 500, и запасной, подогнанный под 400,
   стоял в строках 500 на 1,5–2 % уже (герой /hu — две строки вместо трёх,
   замер 06.10.2026, И608). Опорные шрифты — системные Arial и Times New
   Roman; их ширины сняты этим же счётом с файлов Windows 06.10.2026 и
   записаны числом в `FALLBACK_REFERENCE` (lib/look-values.ts), потому что
   на сервере сборки этих файлов нет. */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliDecompressSync } from 'node:zlib'

/* Номера таблиц woff2 — по спецификации W3C (WOFF 2.0, 5.1). */
const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm',
  'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT',
  'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC',
  'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat',
  'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf',
  'Silf', 'Glat', 'Gloc', 'Feat', 'Sill']

/** Целое переменной длины woff2: по семь бит на байт. */
const base128 = (buf, at) => {
  let v = 0
  for (let i = 0; i < 5; i++) {
    const b = buf[at + i]
    v = ((v << 7) | (b & 0x7f)) >>> 0
    if (!(b & 0x80)) return [v, at + i + 1]
  }
  throw new Error('UIntBase128 длиннее пяти байт')
}

/** Таблицы шрифта: woff2 или голый sfnt (ttf, otf). `hmtx1` — таблица
 *  ширин в преобразованном виде woff2 (флаги, затем ширины подряд). */
export function fontTables(buf) {
  const out = new Map()
  if (buf.readUInt32BE(0) === 0x774f4632) {
    const count = buf.readUInt16BE(12)
    let at = 48
    const dir = []
    for (let i = 0; i < count; i++) {
      const flags = buf[at++]
      let tag = TAGS[flags & 0x3f]
      if ((flags & 0x3f) === 0x3f) { tag = buf.toString('latin1', at, at + 4); at += 4 }
      let len; [len, at] = base128(buf, at)
      const tv = (flags >> 6) & 3
      const moved = tag === 'glyf' || tag === 'loca' ? tv !== 3 : tag === 'hmtx' ? tv !== 0 : false
      if (moved) { let t; [t, at] = base128(buf, at); len = t }
      dir.push({ tag: tag === 'hmtx' && moved ? 'hmtx1' : tag, len })
    }
    /* Размер сжатой части — по смещению 20 (totalCompressedSize, WOFF 2.0, 3);
       24 — версия файла, «1.0» = 65536, и файл с большим потоком резался
       (Metal Mania, латиница 76 КБ: «unexpected end of file»). */
    const flat = brotliDecompressSync(buf.subarray(at, at + buf.readUInt32BE(20)))
    let off = 0
    for (const t of dir) { out.set(t.tag, flat.subarray(off, off + t.len)); off += t.len }
    return out
  }
  const count = buf.readUInt16BE(4)
  for (let i = 0; i < count; i++) {
    const rec = 12 + i * 16
    const off = buf.readUInt32BE(rec + 8)
    out.set(buf.toString('latin1', rec, rec + 4), buf.subarray(off, off + buf.readUInt32BE(rec + 12)))
  }
  return out
}

/** Частота знаков в тексте, доли: таблица `latin` из capsize (@capsizecss/unpack
 *  4.0.1, MIT; счёт по 5000 заметкам английских WikiNews) — по ней next/font
 *  (`adjustFontFallback`) растягивает свой запасной шрифт. Сверено 06.10.2026
 *  с текстами витрины трёх языков (блог, документы, отзывы, надписи
 *  интерфейса): ширина Manrope к Arial по этой таблице расходится с замером
 *  текста не больше чем на 0,7 %, таблица из самих текстов витрины лучше не
 *  вышла — расхождение от длины слов (у Manrope пробел 0,2 кегля, у Arial
 *  0,28), а не от языка. */
const FREQ = {
  ' ': .154, e: .0922, t: .0672, a: .0668, i: .0588, n: .0578, o: .0571, r: .0526,
  s: .0469, h: .0351, l: .0304, d: .0298, c: .0232, u: .0207, m: .0181, f: .017,
  p: .0163, g: .0155, y: .0123, b: .0114, w: .011, ',': .0083, '.': .0079, v: .0076,
  0: .0053, k: .0046, T: .0041, S: .0041, A: .004, '|': .0038, C: .0031, 2: .0026,
  M: .0025, x: .0025, 1: .0023, P: .0023, I: .0022, '[': .0021, B: .002, '-': .0018,
  U: .0016, 5: .0015, R: .0015, F: .0015, "'": .0014, N: .0014, H: .0013, D: .0013,
  L: .0012, '"': .0012, W: .0012, z: .0011, G: .0011, E: .0011, 3: .001, '(': .001,
  ')': .001, j: .0009, J: .0009, O: .0009, 4: .0008, q: .0008, ':': .0008, 6: .0007,
  8: .0007, ']': .0007, K: .0007, '=': .0007, 9: .0006, 7: .0005, V: .0005, Y: .0003,
  $: .0002, Z: .0002, Q: .0001, á: .0001, é: .0001, '/': .0001, '%': .0001, ';': .0001,
  X: .0001,
}

/** Поправка ширины переменного шрифта на толщину `weight` (таблицы fvar,
 *  avar, HVAR): в файле записаны ширины начертания по умолчанию, а у
 *  Manrope это 200, тогда как текст сайта набран 400. Без поправки запасной
 *  шрифт подгонялся бы под самое тонкое начертание. Возвращает функцию
 *  «глиф → прибавка к ширине» или ноль, если шрифт не переменный. */
function widthDelta(tables, weight) {
  const fvar = tables.get('fvar'); const hvar = tables.get('HVAR')
  if (!fvar || !hvar) return () => 0
  const axesAt = fvar.readUInt16BE(4); const axisCount = fvar.readUInt16BE(8); const axisSize = fvar.readUInt16BE(10)
  const coords = []
  for (let i = 0; i < axisCount; i++) {
    const a = axesAt + i * axisSize
    const tag = fvar.toString('latin1', a, a + 4)
    const [min, def, max] = [4, 8, 12].map((o) => fvar.readInt32BE(a + o) / 65536)
    const v = tag === 'wght' ? Math.min(max, Math.max(min, weight)) : def
    coords.push(v === def ? 0 : v < def ? (v - def) / (def - min) : (v - def) / (max - def))
  }
  /* avar: кусочная карта нормализованной оси. */
  const avar = tables.get('avar')
  if (avar) {
    let at = 8
    for (let i = 0; i < axisCount; i++) {
      const n = avar.readUInt16BE(at); at += 2
      const map = Array.from({ length: n }, (_, k) => [avar.readInt16BE(at + k * 4) / 16384, avar.readInt16BE(at + k * 4 + 2) / 16384])
      at += n * 4
      const c = coords[i]
      for (let k = 1; k < map.length; k++) {
        if (c <= map[k][0]) { const [x0, y0] = map[k - 1]; const [x1, y1] = map[k]; coords[i] = x1 === x0 ? y0 : y0 + (c - x0) * (y1 - y0) / (x1 - x0); break }
      }
    }
  }
  const storeAt = hvar.readUInt32BE(4); const mapAt = hvar.readUInt32BE(8)
  const store = hvar.subarray(storeAt)
  const regions = store.subarray(store.readUInt32BE(2))
  const rAxes = regions.readUInt16BE(0)
  const scalarOf = (r) => {
    let s = 1
    for (let i = 0; i < rAxes; i++) {
      const o = 4 + (r * rAxes + i) * 6
      const [start, peak, end] = [0, 2, 4].map((k) => regions.readInt16BE(o + k) / 16384)
      const c = coords[i] ?? 0
      if (peak === 0) continue
      if (c < Math.min(start, peak) || c > Math.max(peak, end)) return 0
      if (c === peak) continue
      s *= c < peak ? (c - start) / (peak - start) : (end - c) / (end - peak)
    }
    return s
  }
  const dataCount = store.readUInt16BE(6)
  const data = Array.from({ length: dataCount }, (_, k) => store.subarray(store.readUInt32BE(8 + k * 4)))
  const deltaOf = (outer, inner) => {
    const d = data[outer]
    if (!d) return 0
    const items = d.readUInt16BE(0); const wordField = d.readUInt16BE(2); const nRegions = d.readUInt16BE(4)
    if (inner >= items) return 0
    const long = (wordField & 0x8000) !== 0; const words = wordField & 0x7fff
    const big = long ? 4 : 2; const small = long ? 2 : 1
    const rowSize = words * big + (nRegions - words) * small
    let at = 6 + nRegions * 2 + inner * rowSize
    let sum = 0
    for (let k = 0; k < nRegions; k++) {
      const size = k < words ? big : small
      const delta = size === 4 ? d.readInt32BE(at) : size === 2 ? d.readInt16BE(at) : d.readInt8(at)
      at += size
      sum += delta * scalarOf(d.readUInt16BE(6 + k * 2))
    }
    return sum
  }
  if (!mapAt) return (g) => deltaOf(0, g)
  const map = hvar.subarray(mapAt)
  const format = map[0]; const entry = map[1]
  const count = format === 1 ? map.readUInt32BE(2) : map.readUInt16BE(2)
  const first = format === 1 ? 6 : 4
  const size = ((entry >> 4) & 3) + 1; const innerBits = (entry & 0xf) + 1
  return (g) => {
    const i = Math.min(g, count - 1)
    let v = 0
    for (let b = 0; b < size; b++) v = (v << 8) | map[first + i * size + b]
    return deltaOf(v >>> innerBits, v & ((1 << innerBits) - 1))
  }
}

/** Размеры шрифта в долях кегля при толщине `weight`: средняя ширина знака
 *  текста, верх и низ строки, межстрочный зазор. */
export function metricsOf(tables, weight = 400) {
  const head = tables.get('head'); const hhea = tables.get('hhea'); const os2 = tables.get('OS/2'); const cmap = tables.get('cmap')
  const hmtx = tables.get('hmtx'); const hmtx1 = tables.get('hmtx1')
  if (!head || !hhea || !cmap || !(hmtx || hmtx1)) throw new Error('в шрифте нет head, hhea, hmtx или cmap')
  const upm = head.readUInt16BE(18)
  const nh = hhea.readUInt16BE(34)
  let sub = null
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const o = cmap.readUInt32BE(8 + i * 8)
    if (cmap.readUInt16BE(o) === 4) { sub = cmap.subarray(o); break }
  }
  if (!sub) throw new Error('в шрифте нет cmap формата 4')
  const seg = sub.readUInt16BE(6) / 2
  const gid = (cp) => {
    for (let s = 0; s < seg; s++) {
      if (cp > sub.readUInt16BE(14 + s * 2)) continue
      const start = sub.readUInt16BE(16 + seg * 2 + s * 2)
      if (cp < start) return 0
      const delta = sub.readInt16BE(16 + seg * 4 + s * 2)
      const roAt = 16 + seg * 6 + s * 2
      const ro = sub.readUInt16BE(roAt)
      if (!ro) return (cp + delta) & 0xffff
      const g = sub.readUInt16BE(roAt + ro + (cp - start) * 2)
      return g ? (g + delta) & 0xffff : 0
    }
    return 0
  }
  const more = widthDelta(tables, weight)
  const adv = (g) => {
    const i = Math.min(g, nh - 1)
    return (hmtx1 ? hmtx1.readUInt16BE(1 + i * 2) : hmtx.readUInt16BE(i * 4)) + more(g)
  }
  let sum = 0; let weightSum = 0
  for (const [ch, f] of Object.entries(FREQ)) {
    const g = gid(ch.codePointAt(0))
    if (!g) continue
    sum += adv(g) * f; weightSum += f
  }
  /* Высота строки — как у браузера: при флаге USE_TYPO_METRICS (бит 7
     fsSelection) — типографские числа OS/2, иначе — hhea. */
  const typo = os2 && os2.length > 72 && (os2.readUInt16BE(62) & 0x80)
  const ascent = typo ? os2.readInt16BE(68) : hhea.readInt16BE(4)
  const descent = typo ? os2.readInt16BE(70) : hhea.readInt16BE(6)
  const gap = typo ? os2.readInt16BE(72) : hhea.readInt16BE(8)
  const r = (x) => Math.round(x * 10000) / 10000
  return { avg: r(sum / weightSum / upm), ascent: r(ascent / upm), descent: r(Math.abs(descent) / upm), gap: r(gap / upm) }
}

/** Толщины, у каждой из которых своё запасное начертание (lib/look-values.ts,
 *  `fontFaces`). */
export const FACE_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

/** Размеры для записи вида (`LookFont.metrics`): высота строки и средняя
 *  ширина знака при каждой толщине `FACE_WEIGHTS` (`widths`) — запасное
 *  начертание у каждой толщины своё, потому что ширина настоящего шрифта
 *  растёт с толщиной, а у системного обычного и жирного — нет. Толщины
 *  зажимаются в диапазон файла `lo…hi`: браузер возьмёт ближайшую из
 *  файла. */
export function lookMetrics(buf, lo, hi = lo) {
  const tables = fontTables(buf)
  const at = (w) => Math.min(Math.max(w, lo), hi)
  const { ascent, descent, gap } = metricsOf(tables, at(400))
  return { widths: Object.fromEntries(FACE_WEIGHTS.map((w) => [w, metricsOf(tables, at(w)).avg])), ascent, descent, gap }
}

/** Шрифтам сохранённого вида без размеров — размеры из их файлов в
 *  `public/fonts` (вид, записанный до 01.10.2026, и размеры прежнего вида
 *  `avg`/`bold` — до 06.10.2026, по двум толщинам и строчным буквам).
 *  Латиница, как у панели вида. Возвращает, сколько семейств дополнено. */
export function fillMetrics(look, root = '.') {
  let filled = 0
  for (const f of Array.isArray(look?.fonts) ? look.fonts : []) {
    if (f.metrics?.widths) continue
    const latin = f.files.find((x) => /-latin-[0-9a-f]+\.woff2$/.test(x.url)) ?? f.files[0]
    if (!latin) continue
    const [lo, hi = lo] = latin.weight.split(' ').map(Number)
    f.metrics = lookMetrics(readFileSync(resolve(root, 'public', latin.url.replace(/^\//, ''))), lo, hi)
    filled++
  }
  return filled
}

/* node scripts/font-fallback.mjs <вид.json> … — дополнить записи на месте. */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const path of process.argv.slice(2)) {
    const text = readFileSync(path, 'utf8')
    const look = JSON.parse(text)
    const n = fillMetrics(look)
    if (n) writeFileSync(path, JSON.stringify(look, null, /^\{\n {2}"/.test(text.replace(/\r\n/g, '\n')) ? 2 : 1) + '\n')
    console.log(`${path}: размеры шрифта дописаны семействам — ${n}`)
  }
}
