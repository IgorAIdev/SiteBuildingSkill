/*
 * Витрина `.storefront/` и файлы набора, из которых она поставлена (И751).
 *
 * Слежка `npm run storefront` кладёт правку набора в витрину, пока сервер
 * работает. Правку, сделанную, пока он стоял, слежка не видела: 05.10.2026
 * сервер остановился ночью, а файлы шаблона, поправленные до запуска
 * (lib/catalog-view.ts, components/Filters.tsx, тесты), в витрину не легли —
 * витрина ставится, только если её нет, и заказчик смотрел бы прежний
 * магазин. Поэтому витрина помнит, с какими файлами набора она сведена
 * (`STAMP`: путь → хеш), и запуск сверяет их с нынешними. Решает одно место —
 * `route`: и для слежки, и для запуска.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Что витрина берёт из набора: папки — со всем вложенным, и ставщик. */
export const SOURCES = ['templates/storefront', 'styles', 'tools', 'skills/site-building/assets', 'install.mjs', 'scripts.mjs']
export const TEMPLATE_DIR = 'templates/storefront/'
/** Где витрина помнит, с чем сведена. Рядом с записью ставщика. */
export const STAMP = '.storefront-sources.json'

/* Что кладётся прямо: файл шаблона тем же путём. Что требует переустановки:
   каталог и правило панели, список свойств и выпуск вида (их пересчитывает
   сборка каталога; `styles/look.css` у витрины выпущен, у шаблона лежит
   рукой — прямая копия затёрла бы выпуск), и всё вне шаблона, что установщик
   раскладывает сам. */
const REBUILD = /^(look-panel\/|lib\/look-|scripts\/look-slots\.mjs|lib\/source\/sample\/look\.json|package\.json|styles\/look\.css)/
/* Временные файлы редакторов (`x.ts.tmp.123`, `x~`, `.x.swp`) живут миг:
   их не кладут и из-за них не переставляют. */
const temp = (rel) => /\.tmp\.[^/]*$|~$|\.sw[a-p]$/.test(rel)
/** Не источник витрины: зависимости, сборка, временное, сам запускатель. */
export const skip = (rel) => /(^|\/)(node_modules|\.next)(\/|$)/.test(rel) || rel === 'tools/storefront.mjs' || temp(rel)

/** Как правка файла набора (путь от корня набора) доходит до витрины:
 *  `direct` — файл шаблона кладётся тем же путём, `overlay` — витрина
 *  ставится поверх. Удалённый файл снимает только переустановка (И340). */
export const route = (rel, gone = false) =>
  rel.startsWith(TEMPLATE_DIR) && !gone && !REBUILD.test(rel.slice(TEMPLATE_DIR.length)) ? 'direct' : 'overlay'

export const hash = (body) => createHash('sha256').update(body).digest('hex')

/** Хеш каждого файла набора, который берёт витрина: путь от корня набора → хеш. */
export function sources(kit) {
  const out = {}
  const walk = (rel) => {
    if (skip(rel)) return
    const full = join(kit, rel)
    if (!existsSync(full)) return
    if (statSync(full).isDirectory()) {
      for (const name of readdirSync(full).sort()) walk(`${rel}/${name}`)
      return
    }
    /* Не прочёлся (занят) — выпадет из списка и при следующей сверке
       покажется изменённым: лишняя переустановка, а не пропущенная правка. */
    try { out[rel] = hash(readFileSync(full)) } catch { /* см. выше */ }
  }
  for (const root of SOURCES) walk(root)
  return out
}

/** Что сделать витрине, сведённой с набором `before`, чтобы сойтись с `now`:
 *  `overlay` — изменившиеся файлы, ради которых витрина ставится поверх
 *  (пусто — не нужно), `direct` — файлы шаблона (путь внутри шаблона),
 *  которые кладутся тем же путём. Не помнит, с чем сведена, — поверх. */
export function plan(before, now) {
  if (!before) return { overlay: [STAMP], direct: [] }
  const overlay = []
  const direct = []
  for (const rel of new Set([...Object.keys(before), ...Object.keys(now)])) {
    if (skip(rel) || before[rel] === now[rel]) continue
    if (route(rel, !(rel in now)) === 'direct') direct.push(rel.slice(TEMPLATE_DIR.length))
    else overlay.push(rel)
  }
  return { overlay: overlay.sort(), direct: direct.sort() }
}

/** С чем витрина сведена; `null` — не помнит (поставлена до И751 или запись
 *  испорчена). */
export function readStamp(site) {
  try { return JSON.parse(readFileSync(join(site, STAMP), 'utf8')).files ?? null } catch { return null }
}

export function writeStamp(site, files) {
  writeFileSync(join(site, STAMP), JSON.stringify({ files }) + '\n')
}

/** Файл шаблона лёг в витрину — запомнить. Витрина, которая не помнит, с чем
 *  сведена, так и не помнит: частная запись сказала бы, что остальное сошлось. */
export function stampOne(site, rel, body) {
  const files = readStamp(site)
  if (!files) return
  files[`${TEMPLATE_DIR}${rel}`] = hash(body)
  writeStamp(site, files)
}
