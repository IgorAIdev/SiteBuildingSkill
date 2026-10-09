/*
 * Значок вкладки магазина: имя из двух строк на краске марки →
 * `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png` (И677).
 *
 *   node tools/make-favicon.mjs [--head CBD] [--tail in] [--color '#0c3a46'] [--out templates/storefront/app]
 *
 * Буквы — контуры Manrope 800 (OFL; @fontsource/manrope через jsDelivr), а не
 * текст: значок вкладки шрифтов страницы не видит, и подпись `<text>` рисовалась
 * бы системным. Голова (`CBD`) и хвост (`in`) — данные магазина, как у знака
 * (`BRAND`, templates/storefront/lib/company.ts); краска — `--pop` опубликованного
 * вида (в шаблоне #0c3a46). Сменилось имя или марка — значок выпускают заново.
 *
 * Нужны два пакета, в набор они не входят:
 *   npm i --no-save opentype.js @resvg/resvg-js
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback }
const HEAD = arg('head', 'CBD'), TAIL = arg('tail', 'in'), BRAND = arg('color', '#0c3a46'), OUT = arg('out', 'templates/storefront/app')
const INK = '#ffffff', SIZE = 64, RADIUS = 14

let opentype, Resvg
try { opentype = (await import('opentype.js')).default; ({ Resvg } = await import('@resvg/resvg-js')) } catch {
  console.error('✗ Нужны opentype.js и @resvg/resvg-js: npm i --no-save opentype.js @resvg/resvg-js')
  process.exit(1)
}
const res = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/manrope/files/manrope-latin-800-normal.woff')
if (!res.ok) { console.error(`✗ Шрифт не скачался: ${res.status}`); process.exit(1) }
const font = opentype.parse(await res.arrayBuffer())

const line = (text, size) => { const path = font.getPath(text, 0, 0, size); const bb = path.getBoundingBox(); return { path, bb, w: bb.x2 - bb.x1, h: bb.y2 - bb.y1 } }
let size = 30
size *= (SIZE * 0.78) / line(HEAD, size).w
const top = line(HEAD, size), bottom = line(TAIL, size)
const gap = size * 0.16
const y0 = (SIZE - (top.h + gap + bottom.h)) / 2
const place = (l, y) => {
  const dx = (SIZE - l.w) / 2 - l.bb.x1, dy = y - l.bb.y1
  l.path.commands.forEach((c) => { for (const k of ['x', 'x1', 'x2']) if (k in c) c[k] += dx; for (const k of ['y', 'y1', 'y2']) if (k in c) c[k] += dy })
  return l.path.toPathData(2)
}
const paths = `<path d="${place(top, y0)}" fill="${INK}"/><path d="${place(bottom, y0 + top.h + gap)}" fill="${INK}"/>`
const svg = (r) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="${BRAND}"/>${paths}</svg>\n`
const png = (source, px) => new Resvg(source, { fitTo: { mode: 'width', value: px } }).render().asPng()

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'icon.svg'), svg(RADIUS))
/* apple-touch-icon — квадрат без скругления: углы iOS скругляет сама. */
writeFileSync(join(OUT, 'apple-icon.png'), png(svg(0), 180))
/* favicon.ico — два PNG (32 и 48) в контейнере ICO: для браузеров без SVG-значка. */
const imgs = [32, 48].map((s) => [s, png(svg(RADIUS), s)])
const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4)
let off = 6 + 16 * imgs.length
const dir = Buffer.concat(imgs.map(([s, b]) => { const e = Buffer.alloc(16); e[0] = s; e[1] = s; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(b.length, 8); e.writeUInt32LE(off, 12); off += b.length; return e }))
writeFileSync(join(OUT, 'favicon.ico'), Buffer.concat([head, dir, ...imgs.map(([, b]) => b)]))
console.log(`✓ ${HEAD}${TAIL} · ${BRAND} → ${OUT}/{icon.svg, favicon.ico, apple-icon.png}`)
