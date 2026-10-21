/*
 * Рост знаков категорий и эффектов: `signGroups.ts` («Категории», «Эффекты») → `skills/site-building/assets/icons/fit.json`.
 *
 * Знаки полок рисовались по одному, и каждый занимал свою долю окна 24×24:
 * вейп — 7×19, пипетка под углом — 14×19, капсула — 16×16, коробка — 22×22.
 * Штрих у всех один (`--icon-stroke`, не масштабируется), но знак в 16 пикселях
 * меньше соседа выглядит мельче и слипается деталями (заказчик 20.10.2026,
 * лист «Категории»). Здесь каждому знаку считается сжатие/растяжение к
 * центру окна так, чтобы БОЛЬШАЯ сторона нарисованного была 20 из 24 —
 * живая зона пера (см. `brand` в icons.mjs); `node tools/icons.mjs` кладёт
 * его на знак матрицей. Штрих при этом остаётся в пикселях экрана.
 *
 *   node tools/icons-fit.mjs
 *
 * Мерится по закрашенным пикселям (волосяной штрих), не по `getBBox`: тот
 * неточен под поворотом (docs/owner-decisions/signs-45-degrees.md).
 * Растеризует `sharp` — в наборе его нет, берётся из `.storefront/`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = path.resolve('.')
const need = [path.join(root, '.storefront/package.json'), path.join(root, 'package.json')].find((p) => existsSync(path.join(path.dirname(p), 'node_modules/sharp')))
if (!need) { console.error('✗ Нет sharp: нужен .storefront/node_modules (npm run storefront ставит).'); process.exit(1) }
const sharp = createRequire(need)('sharp')

const LIVE = 20
const AREA = 18
const SS = 16
const groups = readFileSync(path.join(root, 'templates/storefront/look-panel/design/signGroups.ts'), 'utf8')
/* Рост одинаков у знаков, которые стоят столбиком рядом: полки («Категории») и
   «для чего» («Эффекты») — меню «All products» и «By effect». Эффекты не
   выравнивались: «Recovery» стоял ростом 16 из 24 рядом с молнией 20 (заказчик
   21.10.2026: «видно же, что иконки разного размера… и в эффектах проверь»). */
const LISTS = ['Категории', 'Эффекты']
const parts = LISTS.map((g) => groups.split(`title: '${g}'`)[1]?.split('] },')[0])
if (parts.some((x) => !x)) { console.error(`✗ В signGroups.ts нет раздела: ${LISTS.filter((_, i) => !parts[i]).join(', ')}.`); process.exit(1) }
/* Ряд знаков шапки — тоже столбик рядом: поиск, разделы, избранное, кабинет,
   корзина. Человек стоял площадью 16, корзина — 20 (замер 21.10.2026). Крестик,
   стрелки и полоски меню — не предметы, их рост задан рисунком Lucide. */
const ROW = ['search', 'layout-grid', 'heart', 'user', 'shopping-cart', 'shopping-bag', 'shopping-handbag', 'shopping-basket']
const ids = [...new Set([...parts.flatMap((x) => [...x.matchAll(/\['([a-z0-9-]+)',/g)].map((m) => m[1])), ...ROW])]
const dir = path.join(root, 'skills/site-building/assets/icons/lucide')
const out = {}
for (const id of ids) {
  const f = path.join(dir, `${id}.svg`)
  if (!existsSync(f)) continue // знак из другой папки (залитый) — не мерим
  const body = readFileSync(f, 'utf8').replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${24 * SS}" height="${24 * SS}" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width=".1" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true })
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1
  for (let i = 0; i < data.length; i++) if (data[i] > 20) { const x = i % info.width, y = (i / info.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const w = (x1 - x0) / SS, h = (y1 - y0) / SS
  /* Рост по площади, а не по одной стороне — сетка значков Material Design
     (keyline shapes): квадрат 18×18, круг Ø20, вытянутый 16×20 — у всех одна
     площадь, около 18². Одна большая сторона 20 делала квадратную капсулу и
     лапу крупнее узкой пипетки 14×20 (заказчик 21.10.2026 на меню полок:
     «видно же, что иконки разного размера»). Большая сторона — не выше 20. */
  const s = +Math.min(LIVE / Math.max(w, h), AREA / Math.sqrt(w * h)).toFixed(3)
  const cx = (x0 + x1) / 2 / SS, cy = (y0 + y1) / 2 / SS
  if (Math.abs(s - 1) < 0.03) continue // и так в росте: знак не трогается
  out[id] = [s, +(12 - s * cx).toFixed(2), +(12 - s * cy).toFixed(2)]
}
writeFileSync(path.join(root, 'skills/site-building/assets/icons/fit.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`Рост выставлен: ${Object.keys(out).length} из ${ids.length} знаков, площадь ${AREA}², большая сторона не выше ${LIVE} из 24`)
