/**
 * Цвет обеих тем — отрисованная проверка (И766).
 *
 * Заведена по счёту: скиллы `craft` и `palette` и реестр «по словам»
 * описывали её подробно, шесть правил тёмной темы «мерились» ею, а файла и
 * команды не было — правило без реализации (CLAUDE.md). Контраст и ступень —
 * разные вопросы: отрисованная проверка (`check:craft`) мерит, читается ли
 * БУКВА на её фоне, и была зелёной всё время, пока карточку ночью не было
 * видно на листе. Здесь меряется второе — видно ли, что поверхность лежит на
 * поверхности, — и пары краски там, куда страница с умолчаниями не заходит.
 *
 * Открывает собранный сайт в светлой и тёмной теме (эмуляция
 * `prefers-color-scheme` и `data-theme` на корне), по каждому набору
 * `[data-palette]` из стилей страницы ставит измеритель на корень, на палубу
 * и в лист на палубе, снимает роли с живой страницы и судит:
 *
 *   семь ступеней    карточка и меню над страницей, плашка и орган в
 *                    карточке, полоса секции — нейтральные: ночью не мельче
 *                    нормы и дня; палуба и заливка марки — от 20 обе темы
 *   два края         пол ночью не ниже 10, текст ночью не выше 96
 *   насыщенность     ночью не выше дневной сверх порога различения
 *   семь пар краски  на корне, на палубе, в листе на палубе и в живых
 *                    палубах и листах страниц — 4.5 : 1
 *
 * Не храповик, и это по существу: карточка, которую не видно на фоне, не
 * становится приемлемой оттого, что так было вчера. Разбор и числа —
 * `.claude/skills/craft/references/color.md`; семьи и суд —
 * `tools/theme-families.mjs`; пороги — `NIGHT` в `tools/thresholds.mjs`.
 *
 *   npm run build:site && npm run serve
 *   node tools/check-theme.mjs                      главная, итог и находки
 *   node tools/check-theme.mjs --pages /,/en/catalog  живые палубы и листы этих страниц
 *   node tools/check-theme.mjs --show               таблица целиком
 *   node tools/check-theme.mjs --json out.json      находки и таблица файлом
 *
 * Сайт — `SITE=` (по умолчанию http://localhost:8099, `npm run serve`).
 * Код выхода: 0 — чисто, 1 — находки, 2 — не проверено (нет браузера,
 * страница не открылась, ролей набора на сайте нет).
 */

import { writeFileSync } from 'node:fs'
import { loadPlaywright } from './browser.mjs'
import { THEME_FAMILIES, THEME_LABELS, STEPS, PAIRS, FLOORS, spec, probe, paletteSets, judge } from './theme-families.mjs'

const flag = (name) => {
  const i = process.argv.indexOf(name)
  return i === -1 ? null : process.argv[i + 1] ?? null
}
const SITE = (process.env.SITE ?? 'http://localhost:8099').replace(/\/$/, '')
const PAGES = (flag('--pages') ?? process.env.THEME_PAGES ?? '/').split(',').map((p) => p.trim()).filter(Boolean)
const SHOW = process.argv.includes('--show')
const JSON_OUT = flag('--json')
const DEFAULT = 'как стоит'

const { chromium } = await loadPlaywright()
const browser = await chromium.launch(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {})

const unopened = []
const taken = {}
let names = []
try {
  for (const mode of ['light', 'dark']) {
    taken[mode] = { sets: {}, real: [] }
    const context = await browser.newContext({ colorScheme: mode, viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    for (const path of PAGES) {
      let status = 0
      try {
        status = (await page.goto(SITE + path, { waitUntil: 'load', timeout: 60000 }))?.status() ?? 0
      } catch (error) {
        unopened.push(`${path} (${mode}): ${String(error.message).split('\n')[0]}`)
        continue
      }
      if (status >= 400) { unopened.push(`${path} (${mode}): ответ ${status}`); continue }
      /* Тема — на корне, как её ставит кнопка темы; переходы стоят: краска
         снимается конечная, а не середина перехода. */
      await page.evaluate((m) => { document.documentElement.dataset.theme = m }, mode)
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' })
      /* Наборы и измеритель — с первой открывшейся страницы: роли общие. */
      if (!Object.keys(taken[mode].sets).length) {
        if (!names.length) names = await page.evaluate(paletteSets)
        taken[mode].sets[DEFAULT] = (await page.evaluate(probe, spec())).floors
        const was = await page.evaluate(() => document.documentElement.getAttribute('data-palette'))
        for (const name of names) {
          await page.evaluate((x) => { document.documentElement.dataset.palette = x }, name)
          taken[mode].sets[`«${name}»`] = (await page.evaluate(probe, spec())).floors
        }
        await page.evaluate((x) => {
          if (x === null) delete document.documentElement.dataset.palette
          else document.documentElement.dataset.palette = x
        }, was)
      }
      const { real } = await page.evaluate(probe, spec(true))
      taken[mode].real.push(...real.map((r) => ({ ...r, page: path })))
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(`Цвет обеих тем · ${SITE} · страницы: ${PAGES.join(', ')}`)
if (unopened.length) {
  console.error('\n✗ Не открылось — проверка НЕ ПРОВЕДЕНА целиком:')
  for (const u of unopened) console.error(`    ${u}`)
  console.error('    Собрать и поднять: npm run build:site && npm run serve; свой адрес — SITE=…')
}
if (!taken.light?.sets[DEFAULT] || !taken.dark?.sets[DEFAULT]) process.exit(2)

const { found, rows, skipped } = judge(taken)
const measured = rows.length
if (!measured) {
  console.error('\n✗ Ни одной роли набора на странице нет (--page, --plate, --ink …) — мерить нечего, проверка НЕ ПРОВЕДЕНА.')
  process.exit(2)
}

const sets = Object.keys(taken.light.sets)
const realCount = (kind) => new Set(taken.light.real.filter((r) => r.kind === kind).map((r) => r.label)).size
console.log(`  наборы: ${sets.join(', ')}; живые палубы: ${realCount('deck')}, листы на палубе: ${realCount('plate')}`)
console.log(`  на набор: ступеней ${STEPS.length}, пар ${PAIRS.length} × ${FLOORS.length} пола × 2 темы, краёв 2, насыщенность`)

if (SHOW) {
  for (const set of sets) {
    console.log(`\n  ${set}`)
    console.log(`    ${'что'.padEnd(54)} ${'день'.padStart(7)} ${'ночь'.padStart(7)}   норма`)
    for (const r of rows.filter((x) => x.set === set)) {
      console.log(`    ${`${r.part}: ${r.name}`.slice(0, 54).padEnd(54)} ${String(r.day ?? '—').padStart(7)} ${String(r.night ?? '—').padStart(7)}   ${r.need}`)
    }
  }
}
if (skipped.length) {
  console.log(`\n  не измерено (роли нет на этом сайте): ${skipped.length}`)
  for (const s of skipped.slice(0, SHOW ? Infinity : 5)) console.log(`    ${s}`)
}
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ found, rows, skipped, unopened }, null, 2) + '\n')

if (found.length) {
  console.log(`\n✗ Цвет тем разошёлся с правилами: ${found.length}`)
  for (const fam of THEME_FAMILIES) {
    const mine = found.filter((f) => f.family === fam)
    if (!mine.length) continue
    console.log(`  ${fam} — ${THEME_LABELS[fam]}`)
    for (const f of mine) console.log(`    ${f.where}: ${f.text}`)
  }
  console.log('\nЧинится слоем: краска — строитель палитры (styles/palette.json → npm run palette), роль — styles/tokens.css, пол и лист — styles/base.css; не порогом.')
  process.exit(1)
}
console.log(`\n✓ Обе темы держат ступени, края, насыщенность и пары${unopened.length ? ' — на открывшихся страницах' : ''}.${SHOW ? '' : ' Таблица: --show'}`)
process.exit(unopened.length ? 2 : 0)
