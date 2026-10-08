/**
 * Дизайн-система не отстала от сайта.
 *
 * Заведено по слову заказчика 01.10.2026: «формируй файл проверки, по
 * которому будем проверки сайта запускать, чтоб всё проверялось — и эти
 * проблемы с дизайн-системой» (И605). В тот день он нашёл глазами три вещи,
 * которых не видела ни одна проверка:
 *
 *   · сердце «в избранное» на карточке сидело на белой плашке, которую
 *     подкладывала карточка, а не само сердце, — место рисовало контрол;
 *   · хвост «y» в Apple Pay резался на странице знаков и не резался в
 *     подвале: рисовать за окном знак разрешала пилюля подвала, а не знак;
 *   · цветные знаки мессенджеров стоят на сайте, а в дизайн-системе их нет.
 *
 * Отсюда три семьи:
 *
 *   notShown     — компонент стоит на сайте, а страница дизайн-системы его не
 *                  берёт. Дизайн-система показывает НАСТОЯЩИЙ компонент
 *                  (а не рисунок), поэтому мерится ввозом: файл страницы
 *                  дизайн-системы (look-panel/design) ввозит компонент сам;
 *   placePaints  — узел передаёт компоненту свой класс (`className={s.x}`) и
 *                  этим классом красит его: фон, обводка, угол, тень. Место
 *                  решает только, ГДЕ стоит контрол; как он выглядит — в его
 *                  модуле (правило 10);
 *   placeClips   — место решает, режется ли знак (`svg{overflow…}`). Можно
 *                  ли рисунку за окно — свойство знака (Icon.tsx), иначе
 *                  в одном месте он цел, в другом обрезан;
 *   ownedPart    — часть общего контрола, у которой есть своя разметка
 *                  (компонент), написана на месте руками: классы шапки окна
 *                  (`pn.bar`, `pn.title`, `pn.close`) вне PaneHead.tsx. Слово
 *                  заказчика 04.10.2026: «у окна корзины вверху закрашена
 *                  шапка, а в твоём меню не закрашена… внеси это в проверку,
 *                  чтоб всё из дизайн-системы бралось, чтоб был единый
 *                  источник правды» (И671). Мерит и сайт, и страницу
 *                  дизайн-системы: образец, нарисованный копией, — та же беда.
 *
 * ХРАПОВИК, как `check:design`: база — `tools/system-baseline.json`, расти ни
 * одной семье нельзя. В магазине без панели (её сняли словом заказчика)
 * страницы дизайн-системы нет — и проверке мерить нечего.
 *
 *   node tools/check-system.mjs                проверить
 *   node tools/check-system.mjs --list [семья] показать находки
 *   node tools/check-system.mjs --update       записать текущие числа как базу
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BASELINE = join(ROOT, 'tools/system-baseline.json')
const rel = (p) => relative(ROOT, p).split('\\').join('/')

/* Сайт — в корне магазина, а в наборе — образцовая витрина. */
const SITE = [ROOT, join(ROOT, 'templates/storefront')].find((d) => existsSync(join(d, 'look-panel/design')) && existsSync(join(d, 'components')))
if (!SITE) {
  console.log('Дизайн-системы нет (панель снята) — мерить нечего.')
  process.exit(0)
}
const DESIGN = join(SITE, 'look-panel/design')

const FAMILIES = {
  notShown: 'компонент стоит на сайте, а в дизайн-системе его нет',
  placePaints: 'место красит взятый контрол своим классом',
  placeClips: 'место решает, режется ли знак',
  ownedPart: 'часть общего контрола написана на месте, а не взята его компонентом',
}

const walk = (dir, test, out = []) => {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, test, out)
    else if (test(n)) out.push(p)
  }
  return out
}
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const lineOf = (text, index) => text.slice(0, index).split('\n').length

/** Ввозы файла: имя → полный путь (только свои файлы, с `@/` и `./`). */
function imports(file) {
  const out = []
  for (const m of read(file).matchAll(/import\s+(?:type\s+)?([\s\S]*?)\s+from\s+'([^']+)'/g)) {
    const spec = m[2]
    const path = spec.startsWith('@/') ? join(SITE, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(file), spec) : null
    if (!path) continue
    out.push({ names: m[1], path: resolve(path) })
  }
  return out
}

const siteCode = [...walk(join(SITE, 'components'), (n) => n.endsWith('.tsx')), ...walk(join(SITE, 'app'), (n) => n.endsWith('.tsx'))]
const found = Object.fromEntries(Object.keys(FAMILIES).map((k) => [k, []]))

/* ── notShown ─────────────────────────────────────────────────────────────
   Компонент — файл `components/**.tsx`, который отдаёт функцию с большой
   буквы и который ввозит хоть одна страница или узел сайта. Показан — если
   его ввозит файл дизайн-системы сам: показанное через родителя может стоять
   в закрытом окне и глазами не видно (так было со списком мессенджеров —
   он живёт в шапке, а шапка на странице дизайн-системы закрыта). */
const components = walk(join(SITE, 'components'), (n) => n.endsWith('.tsx'))
  /* Без `className` компонент ничего не одевает — данные для поиска,
     слежка за избранным, обёртка: показывать глазами нечего. */
  .filter((p) => /export\s+function\s+[A-Z]/.test(read(p)) && /className=/.test(read(p)))
  .map((p) => resolve(p))
/* Не вещи, а устройство: показывать глазами в них нечего, их содержимое
   показано по частям. Имя и причина — тут, одним списком. */
const STRUCTURE = {
  'components/Shell.tsx': 'рамка страницы — шапка, подвал и место под страницу; они показаны сами',
  'components/blocks/registry.tsx': 'реестр блоков главной — раскладывает блоки, каждый показан сам',
}
/* Части, которые без родителя — не тот предмет: фильтр полки — окно и строка над
   полкой, его виды показаны настоящей полкой в каждом виде (Магазин → Каталог →
   «Фильтр полки», И739); голый фильтр — закрытое окно и кнопка, глазами не видно
   ничего. Засчитываются, только если родитель показан сам; родитель не показан —
   находка у обоих. Имя, родитель и причина — тут, одним списком. */
const INSIDE = {
  'components/Filters.tsx': ['components/Catalog.tsx', 'фильтр полки — окно и строка над полкой; виды показаны настоящей полкой (И739)'],
  'components/LiveFilter.tsx': ['components/Filters.tsx', 'живой счёт формы фильтра — его устройство, а не вещь'],
  'components/ReviewPlay.tsx': ['components/ReviewCard.tsx', 'постер видеоотзыва — часть карточки отзыва с роликом (И728)'],
  'components/FoldGrid.tsx': ['components/Catalog.tsx', 'полка телефона шагами по 24 — сетка карточек каталога на узкой коробке, её устройство (И754)'],
  'components/FoldShelf.tsx': ['components/Catalog.tsx', 'свёртка полки телефона — сколько из 24 показано, «Показать ещё» и «24 of 85» под полкой; своей разметки нет, кнопки и счёт рисует строка листания каталога (И754)'],
  'components/PaneHandle.tsx': ['components/SearchPane.tsx', 'ручка свайпа — полоска у края окна поиска на телефоне (pane-swipe), без окна она не вещь; окно показано в рамке сайта'],
  'components/ShelfRows.tsx': ['components/EmptyPaths.tsx', 'тихие строки полок — под пустой корзиной и под пустым полем окна поиска; показаны настоящей пустой корзиной (И691)'],
  'components/SocialSignIn.tsx': ['components/AuthPage.tsx', 'кнопки Google и Facebook под формой входа и создания — часть страницы входа; показаны настоящей страницей в обоих видах (И787)'],
  'components/AddLabel.tsx': ['components/AddToCart.tsx', 'надпись кнопки «в корзину» — слово, «Added · n» и уступка места внутри кнопки страницы товара и карточки, не вещь сама по себе (И469, И763)'],
}
const used = new Set(siteCode.flatMap((f) => imports(f).map((i) => i.path)))
const shown = new Set(walk(DESIGN, (n) => n.endsWith('.tsx')).flatMap((f) => imports(f).map((i) => i.path)))
const shownSelf = (name, depth = 3) => {
  if (shown.has(resolve(join(SITE, name)))) return true
  const parent = INSIDE[name]?.[0]
  return Boolean(parent && depth && shownSelf(parent, depth - 1))
}
for (const c of components) {
  const name = relative(SITE, c).split('\\').join('/')
  if (STRUCTURE[name]) continue
  if (used.has(c) && !shownSelf(name)) found.notShown.push(`${rel(c)}  — на сайте стоит, в дизайн-системе не показан`)
}

/* ── placePaints ──────────────────────────────────────────────────────────
   `<Компонент … className={s.x}>` в узле, у которого `s` — его модуль
   стилей, и правило `.x{…}` в этом модуле с фоном, обводкой, углом или
   тенью. Позиция, отступ и размер места — можно: это «где стоит». */
const PAINT = /(?:^|;)\s*(background(?:-color)?|border(?:-[a-z-]+)?|outline(?:-[a-z]+)?|box-shadow)\s*:/
const rules = (css) => [...css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
for (const file of siteCode) {
  const text = read(file)
  /* Свой модуль узла — из components/ или app/; общие модули (примитивы,
     кнопка) — это сами контролы и раскладка, а не место. */
  const mine = (p) => [join(SITE, 'components'), join(SITE, 'app')].some((d) => p.startsWith(resolve(d)))
  const own = imports(file).filter((i) => i.path.endsWith('.module.css') && mine(i.path) && existsSync(i.path) && /^\w+$/.test(i.names.trim()))
  if (!own.length) continue
  const comps = new Set(imports(file).filter((i) => i.path.endsWith('.tsx')).flatMap((i) => i.names.replace(/[{}]/g, '').split(',').map((x) => x.trim().split(/\s+as\s+/).pop())).filter((n) => /^[A-Z]/.test(n)))
  for (const tag of text.matchAll(/<([A-Z]\w*)((?:[^<>{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)>/g)) {
    if (!comps.has(tag[1])) continue
    const cls = tag[2].match(/className=\{([\s\S]*?)\}\s*(?=\w+=|\/?$)/)?.[1] ?? tag[2].match(/className=\{([^}]*)\}/)?.[1] ?? ''
    for (const { names, path } of own) {
      const name = names.trim()
      for (const m of cls.matchAll(new RegExp(`\\b${name}\\.(\\w+)`, 'g'))) {
        const css = read(path)
        for (const r of rules(css)) {
          /* Класс — последним звеном селектора: `.card .x` красит контрол,
             `.x svg` — уже его рисунок, это другая беда (placeClips). */
          const sels = r[1].split(',').map((x) => x.trim())
          if (!sels.some((s) => new RegExp(`\\.${m[1]}(?![\\w-])(?:\\[[^\\]]*\\]|:[\\w-]+(?:\\([^)]*\\))?)*$`).test(s))) continue
          const prop = r[2].match(PAINT)?.[1]
          if (prop) found.placePaints.push(`${rel(path)}:${lineOf(css, r.index + r[1].length)}  .${m[1]} {${prop}} — красит <${tag[1]}> из ${rel(file)}:${lineOf(text, tag.index)}`)
        }
      }
    }
  }
}

/* ── placeClips ───────────────────────────────────────────────────────────
   Правило, которое решает обрезку знака на месте: селектор кончается на
   `svg`, в теле `overflow`. Окно знака и право рисунка выйти за него — в
   Icon.tsx (И604), одно на все места. */
const styleFiles = [...walk(join(SITE, 'components'), (n) => n.endsWith('.css')), ...walk(join(SITE, 'app'), (n) => n.endsWith('.css')), ...walk(join(SITE, 'styles'), (n) => n.endsWith('.css')), ...walk(DESIGN, (n) => n.endsWith('.css'))]
if (SITE !== ROOT) styleFiles.push(...walk(join(ROOT, 'styles'), (n) => n.endsWith('.css')))
for (const file of styleFiles) {
  const css = read(file)
  for (const r of rules(css)) {
    if (r[1].split(',').some((s) => /\bsvg(?:\.[\w-]+|\[[^\]]*\])*\s*$/.test(s.trim())) && /(?:^|;)\s*overflow(?:-[xy])?\s*:/.test(r[2])) {
      found.placeClips.push(`${rel(file)}:${lineOf(css, r.index + r[1].length)}  ${r[1].trim().slice(0, 80)} — обрезку знака решает место`)
    }
  }
}

/* ── ownedPart ────────────────────────────────────────────────────────────
   Реестр: модуль стилей, его части, у которых одна разметка, и компонент,
   который их пишет. Любой другой файл сайта или дизайн-системы, который
   ввозит модуль и пишет такую часть (`pn.bar`), — находка: место собрало
   контрол заново, и всё, что решено в компоненте (тёмный пол шапки,
   крестик), у него уже своё. Новая общая вещь с разметкой — строка сюда. */
const OWNED = [
  { module: 'styles/pane.module.css', parts: ['bar', 'title', 'close', 'lead', 'aside', 'wide', 'row'], owner: 'components/PaneHead.tsx', what: 'шапка окна' },
]
const designCode = walk(DESIGN, (n) => n.endsWith('.tsx'))
for (const file of [...siteCode, ...designCode]) {
  const text = read(file)
  for (const own of OWNED) {
    if (resolve(file) === resolve(join(SITE, own.owner))) continue
    for (const i of imports(file)) {
      if (!i.path.split('\\').join('/').endsWith(own.module) || !/^\w+$/.test(i.names.trim())) continue
      const name = i.names.trim()
      for (const m of text.matchAll(new RegExp(`\\b${name}\\.(${own.parts.join('|')})\\b`, 'g'))) {
        found.ownedPart.push(`${rel(file)}:${lineOf(text, m.index)}  ${name}.${m[1]} — ${own.what} собрана на месте; брать ${own.owner}`)
      }
    }
  }
}

/* ── вердикт ───────────────────────────────────────────────────────────── */
const counts = Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v.length]))
const listAt = process.argv.indexOf('--list')
if (listAt !== -1) {
  const only = process.argv[listAt + 1]
  for (const [k, v] of Object.entries(found)) {
    if (only && only !== k) continue
    console.log(`\n${k} · ${FAMILIES[k]} — ${v.length}`)
    for (const x of v) console.log(`  ${x}`)
  }
  process.exit(0)
}
if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + '\n')
  console.log(`База записана: ${rel(BASELINE)}`)
  process.exit(0)
}
if (!existsSync(BASELINE)) {
  console.error(`Нет ${rel(BASELINE)}. Создать: npm run check:system -- --update`)
  process.exit(1)
}
const base = JSON.parse(read(BASELINE))
let grew = false
for (const [k, n] of Object.entries(counts)) {
  const was = base[k] ?? 0
  const mark = n > was ? '✗' : '✓'
  if (n > was) grew = true
  console.log(`${mark} ${FAMILIES[k]}: ${n}${n !== was ? ` (было ${was})` : ''}`)
  if (n > was) for (const x of found[k]) console.log(`    ${x}`)
}
if (grew) {
  console.error('\nДизайн-система отстала от сайта. Починить по строкам выше; признанный долг —')
  console.error('npm run check:system -- --update, с причиной в коммите.')
  process.exit(1)
}
const total = Object.values(counts).reduce((a, b) => a + b, 0)
const wasTotal = Object.values(base).reduce((a, b) => a + b, 0)
if (total < wasTotal) console.log(`\nДолг сократился: ${wasTotal} → ${total}. Обновите базу: npm run check:system -- --update`)
