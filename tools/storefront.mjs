/*
 * Витрина из шаблона — для правки шаблона (И432).
 *
 * Шаблон витрины (`templates/storefront`) сам не запускается: его ставят в
 * папку (`install.mjs --storefront`), и уже поставленная витрина
 * собирается и открывается. Правят при этом ШАБЛОН — в копии правка
 * никуда не попадёт. Эта команда держит обе стороны вместе:
 *
 *   1. ставит витрину из шаблона в `.storefront/` (в git не идёт), если её
 *      там нет, кладёт ей вид витрины шаблона из `showcase/` и ставит
 *      зависимости; уже стоящую — сводит с набором: правка, сделанная, пока
 *      сервер стоял, ложится при запуске тем же путём, что у слежки (И751);
 *   2. запускает её сервером разработки (порт 3020 или `PORT`, панель вида
 *      включена, `LOOK_PICKER=on`);
 *   3. следит за набором: правка файла шаблона сразу кладётся в витрину
 *      тем же путём, и сервер разработки её подхватывает; правка всего
 *      остального (стили и инструменты набора, каталог панели, удалённый
 *      файл) — ставит витрину поверх заново (`--force`, ~10 с). Данные
 *      витрины — опубликованный вид, черновик, шрифты, `.env` — переустановка
 *      не трогает.
 *
 *   npm run storefront                 поставить (если нет), запустить, следить
 *   npm run storefront -- --fresh      снести `.storefront/` и поставить заново
 *   npm run storefront -- --no-watch   только запустить
 *   npm run storefront -- --sample     новая постановка без вида витрины —
 *                                      вид шаблона по умолчанию
 *   npm run storefront -- --save-look  опубликованный в панели вид — в showcase/
 *   npm run storefront -- --port 3030  свой порт (или PORT=3030)
 *   npm run storefront -- --variant minimal  отдельная витрина, порт 3021
 *   npm run storefront -- --prepare    только поставить (витрина, вид, зависимости),
 *                                      не запускать — так её собирает сервер
 *                                      (deploy/storefront.Dockerfile, И434)
 *
 * Вид витрины шаблона, выбранный заказчиком в панели (палитра, шрифт,
 * ритм …), лежит в `showcase/` набора: `look.json` — опубликованный вид,
 * `fonts/` — его шрифты. Шаблон его не везёт: витрина, поставленная
 * установщиком, встречает видом по умолчанию — решённым набором набора
 * (docs/decisions.md).
 *
 * Торговля — движок Vendure магазина cbdin, как на сервере (`CATALOG` ниже).
 * Образец данных — `SOURCE=sample` в окружении сессии или в
 * `.storefront/.env`; они важнее. Ключи в репозиторий не идут.
 */

import { existsSync, rmSync, watch, mkdirSync, copyFileSync, statSync, readdirSync, readFileSync, writeFileSync, openSync, readSync, closeSync } from 'node:fs'
import { retouch } from './retouch.mjs'
import { SOURCES, TEMPLATE_DIR, STAMP, route, skip, sources, plan, readStamp, writeStamp, stampOne } from './storefront-sync.mjs'
import { join, dirname, relative, sep } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { networkInterfaces } from 'node:os'
import { storefrontVariant } from './storefront-variants.mjs'

const args = process.argv.slice(2)
const opt = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined }
const KIT = fileURLToPath(new URL('..', import.meta.url))
const variant = storefrontVariant(KIT, args)
const SITE = variant.site
const TEMPLATE = join(KIT, 'templates', 'storefront')
const SHOWCASE = variant.showcase
const PUBLISHED = join(SITE, 'lib', 'source', 'sample', 'look.json')
const WIN = process.platform === 'win32'
const say = (line) => console.log(`[storefront] ${line}`)

const run = (cmd, argv, cwd, quiet = false) => {
  const r = spawnSync(cmd, argv, { cwd, stdio: quiet ? 'pipe' : 'inherit', shell: WIN && cmd === 'npm', encoding: 'utf8' })
  if (r.status !== 0) {
    if (quiet) process.stderr.write(`${r.stdout ?? ''}${r.stderr ?? ''}`)
    throw new Error(`${cmd} ${argv.join(' ')} — код ${r.status}`)
  }
}
/* Торговля витрины шаблона — движок Vendure магазина cbdin, как на сервере
   (deploy/storefront.Dockerfile; слово заказчика 30.09.2026: «подключи сайт
   к нашему вертексу, чтоб реальные товары и данные показывать»). Адрес Shop
   API и код канала — не ключи. Важнее них — окружение и `.storefront/.env`
   (`SOURCE=sample` — образец); заказы выключены, это действующий магазин. */
const CATALOG = {
  SOURCE: 'vendure',
  VENDURE_SHOP_API_URL: 'https://vendure.cbdshop.bg/shop-api',
  VENDURE_CHANNEL_TOKEN: 'cbdin',
  VENDURE_FALLBACK_LANG: 'en',
}
function catalogEnv() {
  const file = join(SITE, '.env')
  const own = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const set = (key) => process.env[key] !== undefined || new RegExp(`^\\s*${key}\\s*=\\s*\\S`, 'm').test(own)
  return Object.fromEntries(Object.entries(CATALOG).filter(([key]) => !set(key)))
}
const install = (force) => run(process.execPath, [join(KIT, 'install.mjs'), '--storefront', ...(force ? ['--force'] : []), SITE], KIT, force)
/* Переустановка поверх — и запись, с какими файлами набора витрина теперь
   сведена (И751). Файлы снимаются до постановки: правка, легшая во время
   неё, при следующей сверке покажется изменённой, а не пропадёт. */
const overlay = (now = sources(KIT)) => {
  install(true)
  writeStamp(SITE, now)
}

/* Вид витрины шаблона — в поставленную витрину, и пересчитать им каталог
   панели и стили (И352: значения выводятся из имён нынешним каталогом). */
function applyShowcase() {
  const look = join(SHOWCASE, 'look.json')
  if (!existsSync(look)) return
  copyFileSync(look, PUBLISHED)
  for (const fonts of new Set([join(KIT, 'showcase', 'fonts'), join(SHOWCASE, 'fonts')])) {
    if (!existsSync(fonts)) continue
    mkdirSync(join(SITE, 'public', 'fonts'), { recursive: true })
    for (const f of readdirSync(fonts)) copyFileSync(join(fonts, f), join(SITE, 'public', 'fonts', f))
  }
  run(process.execPath, [join(SITE, 'look-panel', 'scripts', 'build-catalog.mjs'), '--from', KIT], SITE, true)
  run(process.execPath, [join(SITE, 'scripts', 'look-slots.mjs')], SITE, true)
  say(`вид витрины — из ${relative(KIT, SHOWCASE)}/`)
}

/* Опубликованный в панели вид — в `showcase/`, чтобы его взяли следующая
   постановка, сервер и облачная сессия. С `--from <адрес>` — с витрины
   скилла на сервере (панель отдаёт его по /look-panel/published, И434), без
   него — из `.storefront/`. Шрифты — ровно те, что называет вид: сперва всё
   скачивается, потом пишется, прежние файлы шрифтов уходят. */
async function saveLook() {
  const from = opt('--from')?.replace(/\/+$/, '')
  const get = async (path) => {
    const res = await fetch(`${from}${path}`)
    if (!res.ok) throw new Error(`${from}${path} — ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  const body = from ? await get('/look-panel/published') : readFileSync(PUBLISHED)
  const look = JSON.parse(body.toString('utf8'))
  const urls = (look.fonts ?? []).flatMap((f) => f.files.map((x) => x.url))
  const files = []
  for (const url of urls) files.push([url.split('/').pop(), from ? await get(url) : readFileSync(join(SITE, 'public', url))])
  const fonts = join(SHOWCASE, 'fonts')
  rmSync(fonts, { recursive: true, force: true })
  mkdirSync(fonts, { recursive: true })
  writeFileSync(join(SHOWCASE, 'look.json'), body)
  for (const [name, data] of files) writeFileSync(join(fonts, name), data)
  say(`вид ${from ? `с ${from}` : 'витрины'} сохранён в ${relative(KIT, SHOWCASE)}/ — закоммитьте его`)
}

/** Файлы витрины, целиком забитые нулями (кроме `node_modules`). Мерится
 *  начало файла: запись, прерванная выключением, оставляет нули с первого
 *  байта. */
function zeroFiles(dir) {
  const out = []
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue
      const p = join(d, e.name)
      if (e.isDirectory()) { walk(p); continue }
      if (!e.isFile()) continue
      let head
      try { head = readFileSync(p).subarray(0, 64) } catch { continue }
      if (head.length && head.every((b) => b === 0)) out.push(p)
    }
  }
  walk(dir)
  return out
}

/* Постановка, запуск и слежка. Отдельно от сохранения вида: после `fetch`
   Node на Windows падает на `process.exit` (UV_HANDLE_CLOSING), поэтому
   сохранение просто заканчивается, а остальное не запускается. */
function start() {
  if (args.includes('--fresh') && existsSync(SITE)) {
    say(`сношу ${relative(KIT, SITE)}/ и ставлю заново`)
    rmSync(SITE, { recursive: true, force: true })
  }
  /* Файлы, забитые нулями, — след аварийного выключения (29.09.2026: ноутбук
     выключился, 716 файлов витрины и 14 файлов кэша сборки стали нулями, и
     сервер падал на первом же скрипте: «Invalid or unexpected token»). Такой
     файл не восстановить — он убирается, кэш сборки сносится целиком,
     витрина ставится поверх из шаблона; вид и черновик ставщик не трогает,
     а если забит и опубликованный вид — он берётся из showcase/.
     `node_modules` не обходится: его чинит `npm install`. */
  const zeroed = existsSync(SITE) ? zeroFiles(SITE) : []
  if (zeroed.length) {
    say(`${zeroed.length} файл(ов) витрины забиты нулями — похоже на аварийное выключение; убираю их, сношу кэш сборки и ставлю витрину поверх`)
    for (const f of zeroed) rmSync(f, { force: true })
    rmSync(join(SITE, '.next'), { recursive: true, force: true })
    if (existsSync(join(SITE, '.site-kit-install.json'))) {
      overlay()
      if (!existsSync(PUBLISHED) && !args.includes('--sample')) applyShowcase()
    }
  }
  /* Поставлена — значит, есть запись ставщика: `package.json` остаётся и от
     постановки, прерванной на полпути. Папка не пуста, а витрины в ней нет —
     ставится поверх. */
  if (!existsSync(join(SITE, '.site-kit-install.json'))) {
    say(`ставлю витрину из шаблона в ${relative(process.cwd(), SITE) || '.'}`)
    const now = sources(KIT)
    install(existsSync(SITE) && readdirSync(SITE).length > 0)
    if (!args.includes('--sample')) applyShowcase()
    writeStamp(SITE, now)
  }
  /* Набор менялся, пока сервер стоял (И751): слежки тогда не было, а витрина
     ставилась, только если её нет, — 05.10.2026 после ночной остановки
     правки шаблона (lib/catalog-view.ts, components/Filters.tsx) в витрину не
     легли. Запуск сводит её с набором сам, тем же решением, что слежка ниже:
     файл шаблона — тем же путём, остальное — переустановкой поверх. */
  const state = sources(KIT)
  const { overlay: changed, direct: copies } = plan(readStamp(SITE), state)
  if (changed.length) {
    const shown = changed.slice(0, 3).join(', ') + (changed.length > 3 ? ` и ещё ${changed.length - 3}` : '')
    say(changed[0] === STAMP
      ? 'витрина не помнит, с какими файлами набора сведена, — ставлю её поверх'
      : `набор менялся, пока сервер стоял (${shown}) — ставлю витрину поверх`)
    overlay(state)
  } else if (copies.length) {
    for (const rel of copies) {
      mkdirSync(dirname(join(SITE, rel)), { recursive: true })
      copyFileSync(join(TEMPLATE, rel), join(SITE, rel))
      say(`→ ${rel}`)
    }
    writeStamp(SITE, state)
  }
  /* Витрина внутри репозитория набора — свой репозиторий (И447). Набор
     исключает `.storefront/` в `.gitignore`, а линтер (oxlint) уважает
     `.gitignore` репозитория, в котором лежит: все файлы витрины выпадали, и
     `check:lint` печатал «не отдал разбираемый отчёт — НЕ ПРОВЕРЕНО ничего».
     Свой `.git` — граница: чужой `.gitignore` сквозь неё не читается. Набор
     папку по-прежнему не видит — она у него исключена. */
  if (!relative(KIT, SITE).startsWith('..') && !existsSync(join(SITE, '.git'))) {
    try {
      run('git', ['init', '-q'], SITE, true)
    } catch {
      say('git не найден — линтер в витрине увидит ноль файлов (check:lint)')
    }
  }
  /* Зависимости шаблона поменялись без сервера — ставятся до его запуска:
     живой Next на Windows держит файлы `node_modules`. */
  if (!existsSync(join(SITE, 'node_modules', 'next')) || changed.includes(`${TEMPLATE_DIR}package.json`)) {
    say('ставлю зависимости витрины (npm install)')
    run('npm', ['install', '--no-audit', '--no-fund'], SITE)
  }
  /* «Publish» панели вида прогоняет отрисованную проверку (check:craft) на
     выбранном сочетании, а ей нужен браузер: Playwright, sharp и Chromium.
     Установщик магазину их только советует — у витрины шаблона их не
     ставил никто, и публикация падала «Нет Playwright — НЕ ПРОВЕДЕНА»
     (заказчик 28.09.2026: «паблишинг что не работает?»). Витрине панель
     нужна всегда — ставит запускатель, один раз. */
  if (!existsSync(join(SITE, 'node_modules', 'playwright'))) {
    say('ставлю браузер для проверок (playwright, sharp, chromium) — нужен кнопке Publish панели')
    run('npm', ['install', '-D', 'playwright', 'sharp', '--no-audit', '--no-fund'], SITE)
    run('npx', ['playwright', 'install', 'chromium'], SITE)
  }
  if (args.includes('--prepare')) {
    say('витрина поставлена')
    process.exit(0)
  }

  /* То же, что `npm run dev` витрины, но порт — из `--port` или PORT (по
     умолчанию 3020, как у витрины): где 3020 занят другой витриной — свой. */
  const PORT = opt('--port') ?? process.env.PORT ?? variant.port
  run(process.execPath, [join(SITE, 'scripts', 'copy-icons.mjs')], SITE, true)
  run(process.execPath, [join(SITE, 'scripts', 'look-slots.mjs')], SITE, true)
  say(`запускаю: http://localhost:${PORT} (панель вида — полоса «Look» внизу)`)
  say('localhost открывается на компьютере, где запущена эта команда; облачной среде нужен отдельный внешний адрес')
  /* С телефона в той же сети — по адресу компьютера: сервер слушает все
     адреса, а свои файлы отдаёт только тем, что названы (next.config.ts,
     DEV_ORIGINS). Windows при первом запуске спрашивает про брандмауэр —
     «частные сети» разрешить. */
  const lan = Object.values(networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => a.address)
  for (const ip of lan) say(`с телефона (та же сеть Wi-Fi): http://${ip}:${PORT}`)
  /* Next — прямо этим же node, без оболочки: через `npx` в оболочке Windows
     остановка команды убивала оболочку, а сервер оставался сиротой — держал
     порт и файлы `.storefront/`, и следующая постановка падала с EPERM. */
  /* Опубликованный вид сайт держит в кэше данных (`unstable_cache`, метка
     «look»): переустановка поверх пишет новый look.json, а страница рисует
     прежний — и после перезапуска тоже, кэш лежит в `.next/`. Поэтому
     серверу даётся ключ сброса, а переустановка зовёт /api/revalidate тем же
     путём, что админка живого магазина (И498). */
  const secret = process.env.REVALIDATE_SECRET || randomUUID()
  /* Сброс повторяется, пока сервер не ответит: переустановка нередко совпадает
     с перезапуском сервера сторожем (ниже), и единственная попытка падала
     «fetch failed» — страница держала прежний вид из кэша (04.10.2026, И725). */
  const refresh = async (tries = 12) => {
    for (let i = 1; ; i++) {
      try {
        const res = await Promise.all(['look', 'catalog'].map((tag) => fetch(`http://localhost:${PORT}/api/revalidate`, {
          method: 'POST', headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret }, body: JSON.stringify({ tag }),
        })))
        if (res.every((r) => r.ok)) { say('кэш вида и каталога сброшен'); return }
        throw new Error(`ответ ${res.map((r) => r.status).join(', ')}`)
      } catch (e) {
        if (i >= tries) { say(`кэш не сброшен: ${e.message}`); return }
        await new Promise((ok) => setTimeout(ok, 5000))
      }
    }
  }
  const devEnv = { ...catalogEnv(), ...process.env, LOOK_PICKER: process.env.LOOK_PICKER ?? 'on', REVALIDATE_SECRET: secret, DEV_ORIGINS: lan.join(',') }
  let dev = null
  let restarting = false
  const boot = () => {
    dev = spawn(process.execPath, [join(SITE, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '--port', PORT], { cwd: SITE, stdio: 'inherit', env: devEnv })
    dev.on('exit', (code) => {
      if (!restarting) process.exit(code ?? 0)
      restarting = false
      /* Порт отпускается не сразу: новый сервер встаёт чуть погодя; сброс кэша,
         который мог упасть, пока сервера не было, — следом. */
      setTimeout(() => { boot(); void refresh() }, 1500)
    })
  }
  /* Next в Windows держит сервер дочерним процессом: `kill()` снимает только
     родителя, а сирота держит порт. Дерево снимает `taskkill /T`. */
  const stop = () => WIN ? spawnSync('taskkill', ['/PID', String(dev.pid), '/T', '/F'], { stdio: 'ignore' }) : dev.kill('SIGTERM')
  /* Кэш данных лежит в `.next/` и переживает перезапуск: вид, переписанный, пока
     сервера не было, страница иначе рисовала бы прежним. */
  boot()
  void refresh()
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { restarting = false; stop(); process.exit(0) })

  /* Сторож сборщика (И725). Turbopack на Windows при частых переустановках
     застревает в петле «[Server HMR] Subscription error, resubscribing:
     TurbopackInternalError: Cell … no longer exists»: процессор занят ею,
     файлы страницы отдаются по десять секунд, браузер скрипта не дожидается —
     и всё, что рисует скрипт, молча пропадает: уголки листания рядов, подменю
     по наведению (04.10.2026: 718 таких строк за 32 минуты; заказчик: «куда
     пропали… почему отменил»). Сторож читает прирост журнала сервера и при
     пяти таких строках за минуту перезапускает Next сам. */
  const LOG = join(SITE, '.next', 'dev', 'logs', 'next-development.log')
  const LOOP = /Subscription error, resubscribing/g
  let seen = existsSync(LOG) ? statSync(LOG).size : 0
  let hits = []
  setInterval(() => {
    if (restarting || !existsSync(LOG)) return
    const size = statSync(LOG).size
    if (size < seen) seen = 0
    if (size === seen) return
    const len = Math.min(size - seen, 4 << 20)
    const buf = Buffer.alloc(len)
    const fd = openSync(LOG, 'r')
    try { readSync(fd, buf, 0, len, size - len) } finally { closeSync(fd) }
    seen = size
    const now = Date.now()
    hits = [...hits, ...Array((buf.toString('utf8').match(LOOP) ?? []).length).fill(now)].filter((t) => now - t < 60_000)
    if (hits.length < 5) return
    hits = []
    say('сборщик застрял в петле обновления (в журнале «Subscription error») — перезапускаю сервер')
    restarting = true
    stop()
  }, 10_000).unref()

  if (!args.includes('--no-watch')) {
    /* Что кладётся прямо, что ставит поверх и что не источник вовсе — одно
       решение с запуском (`route`, `skip`, tools/storefront-sync.mjs, И751). */
    let pending = null
    let reinstall = false
    const direct = new Set()
    const flush = () => {
      pending = null
      try {
        if (reinstall) {
          say('правка набора — ставлю витрину поверх заново')
          /* Переустановка, как и одиночная запись ниже, повторяется чуть погодя:
             записанные ею файлы трогаются временем, и сервер, поймавший «файл
             занят» (os error 32), читает их заново (И682, `tools/retouch.mjs`). */
          const since = Date.now() - 1000
          overlay()
          setTimeout(() => retouch(SITE, since), 700)
          /* Лист знаков сайт отдаёт из `public/icons.svg`, а его кладёт только
             запуск (`copy-icons`, выше): переустановка обновляла
             `styles/icons.svg`, и новые знаки стояли пустыми до перезапуска
             (01.10.2026, И610). Что делает запуск со свежим набором —
             делает и переустановка. */
          run(process.execPath, [join(SITE, 'scripts', 'copy-icons.mjs')], SITE, true)
          void refresh()
          say('готово')
        } else {
          for (const rel of direct) {
            if (!existsSync(join(TEMPLATE, rel))) continue
            const to = join(SITE, rel)
            mkdirSync(dirname(to), { recursive: true })
            /* Одной записью и ещё раз чуть погодя: на Windows сервер
               разработки читает файл, пока его пишут, получает «файл занят»
               (os error 32) и держит ошибку до следующей правки — повторная
               запись её снимает. */
            const body = readFileSync(join(TEMPLATE, rel))
            writeFileSync(to, body)
            stampOne(SITE, rel, body)
            setTimeout(() => { try { writeFileSync(to, body) } catch { /* следующая правка положит */ } }, 700)
            say(`→ ${rel}`)
          }
        }
      } catch (e) { say(`не вышло: ${e.message}`) }
      reinstall = false
      direct.clear()
    }
    const changedAt = (rel) => {
      if (skip(rel)) return
      const full = join(KIT, rel)
      const gone = !existsSync(full)
      if (rel.startsWith(TEMPLATE_DIR)) {
        /* Удалён — только то, что было в витрине: редактор сохраняет через
           временный файл рядом, и тот «исчезает» сразу после записи. */
        if (gone && !existsSync(join(SITE, rel.slice(TEMPLATE_DIR.length)))) return
        if (!gone && statSync(full).isDirectory()) return
      }
      if (route(rel, gone) === 'direct') direct.add(rel.slice(TEMPLATE_DIR.length))
      else reinstall = true
      clearTimeout(pending)
      pending = setTimeout(flush, 400)
    }
    /* Папки — со всем вложенным; файлы ставщика лежат в корне набора, и корень
       слушается без вложенного, по их именам. */
    const dirs = SOURCES.filter((p) => existsSync(join(KIT, p)) && statSync(join(KIT, p)).isDirectory())
    const files = new Set(SOURCES.filter((p) => !dirs.includes(p)))
    for (const root of dirs) {
      watch(join(KIT, root), { recursive: true }, (_event, file) => {
        if (file) changedAt(relative(KIT, join(KIT, root, file.toString())).split(sep).join('/'))
      })
    }
    watch(KIT, (_event, file) => { if (file && files.has(file.toString())) changedAt(file.toString()) })
    say(`слежу за ${SOURCES.join(', ')}: правьте шаблон, витрина подхватит сама`)
  }
}

if (args.includes('--save-look')) await saveLook()
else start()
