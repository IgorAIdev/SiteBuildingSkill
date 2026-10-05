/**
 * Проверка тронутой части магазина — отрисованной и нажатием, пока её делают
 * (И765).
 *
 * Слово заказчика 05.10.2026: «нужно, чтоб и при производстве, делании любой
 * части магазина типа меню, страницы и других проверки проверяли,
 * корректировали и делали результат правильный». Хук правки меряет файлы за
 * секунду, но перенос надписи после нажатия, лента под краем окна, кнопка в
 * две строки на телефоне видны только на отрисованной странице — и до этой
 * проверки их видели на сдаче, ночью или глазами заказчика.
 *
 * Что тронуто — из памяти правок сессии (хук правки), из `--files` или из
 * незакоммиченного. Часть → её страницы (`tools/parts.mjs`) → адреса из карты
 * ПОДНЯТОГО сайта (у витрины на движке cbdin адреса образца дали бы 404) →
 *   · `check:craft` узким прогоном по этим страницам, основной язык, в ОДНУ
 *     полосу: сервер разработки на Windows ломает свой манифест от
 *     одновременных запросов (check:open ходит так же — по одному);
 *   · `check:counters` в Chromium, если у части есть «в корзину» или счётчик.
 * Находки чинятся в той же работе; сайт не поднят — «не проверено» вслух.
 * Полный прогон — всех языков, ширин и браузеров — остаётся большой проверке.
 *
 *   node tools/check-part.mjs --session <id>      что правила сессия
 *   node tools/check-part.mjs --files a.tsx,b.css ровно эти файлы
 *   SITE=http://localhost:3020 — какой сайт мерить (иначе ищется на 3020, 3000)
 *
 * Код 1 — есть находки; 2 — мерить нечем (сайт не поднят).
 */

import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { KINDS, partsOf, pendingOf, noteChecked, shopPath } from './parts.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
/* В наборе мерится его витрина `.storefront/` (копия шаблона, которую
   держит `npm run storefront`); в магазине — сам магазин. */
const KIT = existsSync(join(ROOT, 'templates/storefront')) && existsSync(join(ROOT, '.storefront/package.json'))
const SHOP = KIT ? join(ROOT, '.storefront') : ROOT

const flag = (name) => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1] ?? null }
const session = flag('--session')
const asked = (flag('--files') ?? '').split(',').map((x) => x.trim()).filter(Boolean)
const dirty = () => {
  try { return execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean).map((l) => l.slice(3).trim()) } catch { return [] }
}
const files = asked.length ? asked : session ? pendingOf(session) : dirty().filter((f) => shopPath(f))
const parts = partsOf(files)

if (!parts.length) {
  console.log('· тронутых частей сайта нет — мерить нечего')
  noteChecked(session, 'nothing')
  process.exit(0)
}
console.log('Тронуто:')
for (const p of parts) console.log(`  · ${p.name}${p.press ? ' (и нажатием)' : ''}: ${p.touched.join(', ')}`)

/* ── какой сайт ─────────────────────────────────────────────────────── */
const alive = async (base) => {
  try { return (await fetch(`${base}/`, { signal: AbortSignal.timeout(5000) })).status < 500 } catch { return false }
}
/* Не ответил — может, перезапускается: ждём минуту, а не сдаёмся с первого
   отказа. */
let SITE = process.env.SITE?.replace(/\/$/, '') ?? null
for (let i = 0; i < 30; i++) {
  const found = SITE ? ((await alive(SITE)) ? SITE : null) : await (async () => { for (const port of [3020, 3000]) if (await alive(`http://localhost:${port}`)) return `http://localhost:${port}`; return null })()
  if (found) { SITE = found; break }
  if (i === 29) SITE = null
  else await new Promise((r) => setTimeout(r, 2000))
}
if (!SITE) {
  console.log('\n✗ НЕ ПРОВЕРЕНО: сайт не поднят (ни SITE=, ни 3020, ни 3000). Поднять витрину и запустить снова.')
  noteChecked(session, 'no-site')
  process.exit(2)
}

/* Витрина набора — общая у всех сессий одного дерева: правка шаблона,
   `tools/`, `styles/` или `scripts.mjs` (своя или соседней) переставляет её и
   перезапускает сервер. 05.10.2026 три прогона подряд застали это посреди
   замера — «connection refused», 500, «не страница сайта», — и находки были
   про перестановку, а не про сайт. Поэтому мерить — когда витрина сошлась с
   набором (`.storefront-sources.json`, И751), набор не менялся 20 секунд и
   сервер трижды подряд ответил. Упал посреди замера — дождаться и повторить,
   до двух раз; не вышло — «не проверено», а не находки. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function steady() {
  for (let ok = 0, i = 0; i < 90; i++) {
    ok = (await alive(SITE)) ? ok + 1 : 0
    if (ok >= 3) return true
    await sleep(2000)
  }
  return false
}
async function ready() {
  if (KIT) {
    const { plan, readStamp, sources } = await import('./storefront-sync.mjs')
    const behind = (now) => { const p = plan(readStamp(SHOP), now); return [...p.overlay, ...p.direct] }
    for (let i = 0, said = false; i < 150; i++) {
      const now = sources(ROOT)
      if (!behind(now).length) {
        await sleep(i ? 20000 : 5000)
        const again = sources(ROOT)
        if (JSON.stringify(again) === JSON.stringify(now) && !behind(again).length) break
      }
      if (!said) { console.log(`· витрина переставляется (правки набора: ${behind(now).slice(0, 3).join(', ') || 'идут'}) — жду, пока затихнет`); said = true }
      await sleep(2000)
    }
  }
  return steady()
}
const fell = (r) => /ERR_CONNECTION_REFUSED|ECONNREFUSED|ERR_ABORTED|сервер упал|ERR_EMPTY_RESPONSE|не страница сайта|ответила 5\d\d/.test(`${r.stdout}${r.stderr}`)
function run(args, extra) {
  const r = spawnSync(process.execPath, args, { cwd: SHOP, env: { ...env, ...extra }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  process.stdout.write(r.stdout ?? ''); process.stderr.write(r.stderr ?? '')
  return r
}
async function runSteady(args, extra = {}) {
  let r = run(args, extra)
  for (let i = 0; i < 2 && fell(r); i++) {
    if (!(await ready())) break
    console.log('· витрину переставляли посреди замера — повтор')
    r = run(args, extra)
  }
  return { ...r, shaken: fell(r) }
}

if (!(await ready())) {
  console.log('\n✗ НЕ ПРОВЕРЕНО: сайт не отвечает ровно — перезапускается дольше трёх минут.')
  noteChecked(session, 'no-site')
  process.exit(2)
}

/* ── адреса: из карты поднятого сайта ───────────────────────────────── */
const sitemap = await fetch(`${SITE}/sitemap.xml`).then((r) => r.ok).catch(() => false)
const env = { ...process.env, SITE, CRAFT_LANES: '1', CRAFT_OPEN_MS: '150000', ...(sitemap ? { SOURCE: process.env.SOURCE && process.env.SOURCE !== 'sample' ? process.env.SOURCE : 'live' } : {}) }
const listed = spawnSync(process.execPath, ['--input-type=module', '-e',
  "const r = await import('./tools/routes.mjs'); console.log(JSON.stringify({ lang: r.DEFAULT_LANG ?? '', list: r.sample() }))"], { cwd: SHOP, env, encoding: 'utf8' })
let lang = '', list = []
try { ({ lang, list } = JSON.parse(listed.stdout.trim().split('\n').pop())) } catch {
  console.log(`\n✗ НЕ ПРОВЕРЕНО: адреса сайта не прочитать — ${(listed.stderr || listed.stdout).trim().split('\n').slice(-3).join(' ')}`)
  noteChecked(session, 'no-pages')
  process.exit(2)
}
const rest = (path) => !lang ? path : path === `/${lang}` ? '' : path.startsWith(`/${lang}/`) ? path.slice(lang.length + 1) : null
const pageOf = (kind) => list.find((path) => { const r = rest(path); return r !== null && KINDS[kind].test(r) })
const kinds = [...new Set(parts.flatMap((p) => p.kinds))]
const pages = [...new Set(kinds.map(pageOf).filter(Boolean))]
const missing = kinds.filter((k) => !pageOf(k))
if (missing.length) console.log(`· страниц вида ${missing.join(', ')} у сайта нет в карте — не померены`)

/* ── прогон ─────────────────────────────────────────────────────────── */
const results = []
/* Прогрев настоящим браузером: сервер разработки собирает страницу и её
   скрипты при первом открытии, и после перезапуска главная собиралась
   дольше 30 секунд — замер вёрстки ждёт страницу ровно столько и падал
   «Timeout» на здоровой странице. Запрос без браузера собирал только HTML. */
async function warm() {
  const { loadPlaywright } = await import(pathToFileURL(join(SHOP, 'tools/browser.mjs')).href)
  const browser = await (await loadPlaywright()).chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } })
    for (const path of pages) {
      const t = Date.now()
      const res = await page.goto(`${SITE}${path}`, { waitUntil: 'networkidle', timeout: 240000 }).catch(() => null)
      if (Date.now() - t > 10000 || !res?.ok()) console.log(`· прогрев ${path}: ${res?.status() ?? 'нет ответа'} за ${Math.round((Date.now() - t) / 1000)} с`)
    }
  } finally { await browser.close() }
}
if (pages.length) await warm()
if (pages.length) {
  const out = join(tmpdir(), `check-part-${process.pid}.json`)
  console.log(`\n── отрисованная страница: ${pages.join(', ')} (${SITE}, основной язык, по одной)`)
  const r = await runSteady(['tools/check-craft.mjs', '--pages', pages.join(','), '--json', out])
  let count = null
  try { count = Object.values(JSON.parse(readFileSync(out, 'utf8')).found).reduce((n, f) => n + f.length, 0); rmSync(out) } catch { /* не дописал — ниже */ }
  results.push(r.shaken ? { name: 'отрисованная страница', ok: null, note: 'не проверено — витрину переставляли весь замер' }
    : { name: 'отрисованная страница', ok: r.status === 0 && count === 0, note: count === null ? 'не дописала отчёт' : `${count} находок` })
}
if (parts.some((p) => p.press)) {
  console.log('\n── нажатием: счётчики, строка покупки, «в корзину» на полке телефона (Chromium)')
  const r = await runSteady(['tools/check-counters.mjs'], { COUNTER_ENGINES: 'chromium', ...(lang ? { COUNTER_SHELF_LANGS: lang } : {}) })
  results.push(r.shaken || r.status === 2 ? { name: 'нажатием', ok: null, note: r.shaken ? 'не проверено — витрину переставляли весь замер' : 'не проверено' }
    : { name: 'нажатием', ok: r.status === 0, note: r.status === 0 ? 'чисто' : 'есть находки' })
}

console.log('\n━━ Тронутая часть')
for (const r of results) console.log(`   ${r.ok ? '✓' : r.ok === null ? '·' : '✗'} ${r.name} — ${r.note}`)
const bad = results.filter((r) => r.ok === false)
const unsure = results.filter((r) => r.ok === null)
noteChecked(session, bad.length ? 'found' : unsure.length ? 'unchecked' : 'clean')
if (!bad.length && unsure.length) {
  console.log('\n· НЕ ПРОВЕРЕНО до конца — сказать заказчику, что и почему; повторить, когда правки набора затихнут.')
  process.exit(2)
}
if (bad.length) {
  console.log('\nНаходки — в этой же работе: причину в своём слое, потом снова эта проверка. Чужое и давнее — тоже чинится или называется заказчику.')
  process.exit(1)
}
console.log('\n✓ Тронутые части на своих страницах держатся. Полный прогон всех языков и браузеров — большая проверка.')
