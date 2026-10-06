import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOCALES } from '../lib/locale.ts'
import { fontFaces, fontPreloads, withFallback } from '../lib/look-values.ts'
import { fillMetrics, fontTables, metricsOf } from '../scripts/font-fallback.mjs'
import { lackText, lacking, marketLangs, marketLetters, parseRange } from '../scripts/font-coverage.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/* Размеры Manrope 400–700 (scripts/font-fallback.mjs, `lookMetrics`): за
   диапазоном файла ширина та же, что у его края. */
const widths = { 100: 0.4601, 200: 0.4601, 300: 0.4601, 400: 0.4601, 500: 0.4684, 600: 0.4768, 700: 0.4852, 800: 0.4852, 900: 0.4852 }
const fonts = [{ family: 'Manrope', metrics: { widths, ascent: 1.066, descent: 0.3, gap: 0 }, files: [
  { url: '/fonts/manrope-latin-ext.woff2', weight: '400 700', range: 'U+0100-02BA, U+0218-021B, U+1E00-1E9F' },
  { url: '/fonts/manrope-latin.woff2', weight: '400 700', range: 'U+0000-00FF, U+0131, U+20AC' },
] }]

/* Документ просит заранее все файлы шрифтов вида (И608). */
test('fonts: the document preloads every file of the look fonts', () => {
  assert.deepEqual(fontPreloads(fonts).sort(), ['/fonts/manrope-latin-ext.woff2', '/fonts/manrope-latin.woff2'])
  assert.deepEqual(fontPreloads([]), [])
})

/* За семейством в стеке — подогнанное запасное начертание; у каждой
   толщины своё растяжение: меню и заголовки 500 шире текста 400, а обычный
   Arial при обеих один (И608, поправка 06.10.2026). Без размеров его нет. */
test('fonts: a family with metrics gets a fitted fallback per weight right after it in the stack', () => {
  assert.equal(withFallback("'Manrope', var(--face-stack)", fonts), "'Manrope', 'Manrope Fallback', var(--face-stack)")
  assert.equal(withFallback(withFallback("'Manrope', var(--face-stack)", fonts), fonts), "'Manrope', 'Manrope Fallback', var(--face-stack)")
  const faces = fontFaces(fonts, { '--face': "'Manrope', var(--face-stack)" })
  assert.equal(faces.length, 6, 'два файла и четыре полосы: до 400, 500, 600, от 700')
  for (const file of faces.slice(0, 2)) assert.match(file, /font-display:optional;/, 'опоздавший файл не подменяет запасной')
  assert.match(faces[2], /font-family:'Manrope Fallback';src:local\('Arial'\);font-weight:1 449;size-adjust:103\.21%;ascent-override:103\.29%/)
  assert.match(faces[3], /src:local\('Arial'\);font-weight:450 549;size-adjust:105\.07%/)
  assert.match(faces[4], /src:local\('Arial Bold'\),local\('Arial-BoldMT'\);font-weight:550 649;size-adjust:99\.37%/)
  assert.match(faces[5], /src:local\('Arial Bold'\),local\('Arial-BoldMT'\);font-weight:650 1000;size-adjust:101\.13%/)
  const bare = [{ ...fonts[0], metrics: undefined }]
  assert.equal(withFallback("'Manrope', var(--face-stack)", bare), "'Manrope', var(--face-stack)")
  assert.equal(fontFaces(bare).length, 2)
  assert.match(fontFaces(fonts, { '--face-head': "'Manrope', Georgia, 'Times New Roman', serif" })[2], /local\('Times New Roman'\)/)
})

/* Ширина знака у переменного шрифта — при толщине текста, а не при
   начертании по умолчанию из файла (у Manrope это 200). */
test('fonts: variable-font widths follow the asked weight', (t) => {
  const file = new URL('../public/fonts/manrope-latin-a30ddcd349.woff2', import.meta.url)
  if (!existsSync(file)) { t.skip('шрифта вида в public/fonts нет — витрина без шрифта со своего адреса'); return }
  const tables = fontTables(readFileSync(file))
  const [w200, w400, w600] = [200, 400, 600].map((w) => metricsOf(tables, w).avg)
  assert.ok(w200 < w400 && w400 < w600, `${w200} < ${w400} < ${w600}`)
})

/* Запись вида до 06.10.2026 — две ширины (`avg` при 400, `bold` при 600) по
   строчным буквам — дополняется заново: по ней меню 500 стояло на запасном
   уже настоящего (И608). */
test('fonts: an old metrics record (avg/bold) is refilled with a width per weight', (t) => {
  const url = '/fonts/manrope-latin-a30ddcd349.woff2'
  if (!existsSync(join(ROOT, 'public', url))) { t.skip('шрифта вида в public/fonts нет — витрина без шрифта со своего адреса'); return }
  const look = { fonts: [{ family: 'Manrope', metrics: { avg: 0.4578, bold: 0.4739, ascent: 1.066, descent: 0.3, gap: 0 }, files: [{ url, weight: '400 700', range: 'U+0000-00FF' }] }] }
  assert.equal(fillMetrics(look, ROOT), 1)
  const m = look.fonts[0].metrics as unknown as { widths: Record<string, number> }
  assert.deepEqual(Object.keys(m.widths), ['100', '200', '300', '400', '500', '600', '700', '800', '900'])
  assert.ok(m.widths['500'] > m.widths['400'] && m.widths['300'] === m.widths['400'] && m.widths['900'] === m.widths['700'], JSON.stringify(m.widths))
  assert.equal(fillMetrics(look, ROOT), 0, 'новая запись не трогается')
})

/* Шрифт вида умеет буквы рынка (И769): какие буквы нужны — по языкам рынка
   из таблицы `lib/alphabets.json`, а не под одну страну. */
test('font letters: the market languages come from LOCALES, each with its alphabet on record', () => {
  assert.deepEqual(marketLangs(ROOT), [...LOCALES])
  const { byLang, all } = marketLetters(ROOT)
  for (const lang of LOCALES) assert.ok(byLang.has(lang), `${lang}: нет букв`)
  assert.ok(byLang.get('*')!.includes('€'), 'цены: знак евро стоит на любом рынке')
  for (const cp of [0x103, 0xe2, 0xee, 0x219, 0x21b, 0x151, 0x171]) assert.ok(all.has(cp), `U+${cp.toString(16)} — буква рынка`)
})

test('font letters: Romanian is comma-below ș ț, never cedilla ş ţ; a language row holds no plain ASCII', () => {
  const table: Record<string, string> = JSON.parse(readFileSync(join(ROOT, 'lib/alphabets.json'), 'utf8'))
  for (const c of ['ș', 'ț', 'Ș', 'Ț']) assert.ok(table.ro.includes(c), `ro: нет ${c}`)
  assert.ok(!/[ŞşŢţ]/.test(table.ro), 'ro: седиль вместо запятой снизу')
  for (const [lang, letters] of Object.entries(table)) assert.ok(!/[\u0000-\u007f]/.test(letters), `${lang}: ASCII в буквах — база задана в scripts/font-coverage.mjs`)
})

test('font letters: a market language without a record is a stop, not silence', () => {
  const root = mkdtempSync(join(tmpdir(), 'market-'))
  mkdirSync(join(root, 'lib'))
  writeFileSync(join(root, 'lib/locale.ts'), "export const LOCALES = ['ro', 'xx'] as const\n")
  writeFileSync(join(root, 'lib/alphabets.json'), '{"ro":"ăș"}')
  assert.throws(() => marketLetters(root), /«xx».*нет записи букв/)
})

/* Читатель woff2 берёт размер сжатой части из своего поля заголовка, а не из
   поля версии: раньше стояло смещение 24 (версия 1.0 = 65536), и файл с
   потоком крупнее 64 КБ резался — шрифт не принимался с ошибкой о конце файла. */
test('font letters: the woff2 reader takes the compressed size from its own header field, not from the version', (t) => {
  const file = join(ROOT, 'public/fonts/manrope-latin-ext-3911b66d9f.woff2')
  if (!existsSync(file)) { t.skip('Manrope в public/fonts нет — витрина без шрифта со своего адреса'); return }
  const bytes = Buffer.from(readFileSync(file))
  bytes.writeUInt32BE(1, 24)
  assert.ok(fontTables(bytes).get('cmap'), 'таблицы читаются при любой версии файла')
})

test('font letters: unicode-range parses spans, single codes and wildcards', () => {
  assert.deepEqual(parseRange('U+0100-02BA, U+0218-021B, U+2113, U+4??'), [[0x100, 0x2ba], [0x218, 0x21b], [0x2113, 0x2113], [0x400, 0x4ff]])
})

/* Настоящие файлы: расширенная латиница держит ă ș ț, базовая — нет; знак
   есть в файле, но вне `unicode-range` — браузер файл не возьмёт. */
test('font letters: real Manrope files — latin-ext carries Romanian and Hungarian, latin alone does not, a range that hides it counts as missing', (t) => {
  const dir = join(ROOT, 'public/fonts/')
  const latin = 'manrope-latin-a30ddcd349.woff2'
  const ext = 'manrope-latin-ext-3911b66d9f.woff2'
  if (!existsSync(dir + latin) || !existsSync(dir + ext)) { t.skip('Manrope в public/fonts нет — витрина без шрифта со своего адреса'); return }
  const letters = marketLetters(ROOT)
  const both = [
    { bytes: readFileSync(dir + latin), range: 'U+0000-00FF, U+0131, U+0152-0153, U+20AC' },
    { bytes: readFileSync(dir + ext), range: 'U+0100-02BA, U+0218-021B, U+1E00-1E9F' },
  ]
  assert.equal(lacking(both, letters).size, 0, lackText(lacking(both, letters)))
  const lack = lacking([both[0]], letters)
  for (const c of ['ă', 'ș', 'ț']) assert.ok(lack.get('ro')!.includes(c), `ro без расширенной латиницы: нет ${c}`)
  for (const c of ['ő', 'ű']) assert.ok(lack.get('hu')!.includes(c), `hu без расширенной латиницы: нет ${c}`)
  assert.ok(!lack.has('*') && !lack.has('en'), 'базовая латиница и английский на месте')
  assert.match(lackText(lack), /румынский: .*ș/)
  const hidden = lacking([both[0], { bytes: both[1].bytes, range: 'U+0000-00FF' }], letters)
  assert.ok(hidden.get('ro')!.includes('ș'), 'файл есть, а range скрывает знак')
})

/* Что отдаётся покупателю сейчас: все шрифты опубликованного вида, из файлов
   на диске, против букв рынка. */
test('font letters: the published look fonts cover every letter of the market languages', (t) => {
  const look = JSON.parse(readFileSync(join(ROOT, 'lib/source/sample/look.json'), 'utf8')) as { fonts?: { family: string; files: { url: string; range: string }[] }[] }
  if (!look.fonts?.length) { t.skip('в опубликованном виде шрифта со своего адреса нет — системный стек'); return }
  const letters = marketLetters(ROOT)
  for (const font of look.fonts) {
    const files = font.files.map((f) => ({ range: f.range, path: join(ROOT, 'public', f.url) }))
    if (files.some((f) => !existsSync(f.path))) { t.diagnostic(`${font.family}: файлов шрифта нет на диске — не проверено`); continue }
    const lack = lacking(files.map((f) => ({ bytes: readFileSync(f.path), range: f.range })), letters)
    assert.equal(lack.size, 0, `${font.family} не умеет букв рынка: ${lackText(lack)}`)
  }
})
