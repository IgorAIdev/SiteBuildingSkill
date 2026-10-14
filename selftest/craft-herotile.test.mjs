/**
 * Семья `check:craft` `heroLane` — «кнопки героя одного роста». Плитка
 * категории (`data-tile`, вид «сетка девяти» оси «Кнопки категорий») — не
 * кнопка ряда, а своя вещь: знак над именем, рост у неё свой.
 *
 * Дефект: 14.10.2026, четвёртая витрина cbdshop.hr, выбор «сетка девяти».
 * `check:choice` не пустил вид: «кнопки героя разного роста: «Shop all» 40,
 * «CBD oil» 104». Проверка считала плитки кнопками ряда. Исключение названо
 * в разметке (`data-tile`), а не спрятано в проверке; обычная кнопка другого
 * роста по-прежнему находка.
 *
 * Как у craft-field: крошечный сервер, узкий прогон настоящей проверки.
 * Нужны Playwright и sharp — CRAFT_MODULES=…/node_modules, иначе пропуск.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const KIT = fileURLToPath(new URL('..', import.meta.url))

const modules = (() => {
  if (process.env.CRAFT_MODULES) return existsSync(join(process.env.CRAFT_MODULES, 'playwright')) ? process.env.CRAFT_MODULES : null
  try {
    const req = createRequire(join(KIT, 'package.json'))
    req.resolve('playwright'); req.resolve('sharp')
    return join(KIT, 'node_modules')
  } catch { return null }
})()

const page = (title, links) => `<!doctype html><html lang="en"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>`
  + `<style>body{margin:0;font:16px/1.5 sans-serif;color:#111;background:#fff}main{display:flow-root}`
  + `.hero{display:flex;gap:24px;padding:24px}.col{inline-size:360px}h1{margin:0;font-size:28px;line-height:1.2}`
  + `ul{list-style:none;margin:16px 0 0;padding:0;display:flex;gap:8px;flex-wrap:wrap}`
  + `a{display:flex;align-items:center;justify-content:center;border:1px solid #888;border-radius:8px;padding:0 12px;color:#111;text-decoration:none}`
  + `a.pill{block-size:40px}a.box{block-size:104px;flex-direction:column}</style></head>`
  + `<body><header><a href="/">Shop</a></header><main><section class="hero" data-scene="hero"><div class="col"><h1>${title}</h1>`
  + `<nav><ul>${links}</ul></nav></div></section></main></body></html>`

const PAGES = {
  /* «Shop all» 40 и две плитки по 104 с data-tile: плитки ростом не меряются. */
  '/tiles': page('Tiles', '<li><a class="pill" href="/a">Shop all</a></li><li><a class="box" data-tile="" href="/b">Oil</a></li><li><a class="box" data-tile="" href="/c">Capsules</a></li>'),
  /* То же без признака — обычная кнопка другого роста, находка. */
  '/plain': page('Plain', '<li><a class="pill" href="/a">Shop all</a></li><li><a class="box" href="/b">Oil</a></li>'),
}

const serve = () => new Promise((resolve) => {
  const server = createServer((req, res) => {
    const url = req.url.split('?')[0]
    if (PAGES[url]) { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGES[url]) } else { res.writeHead(404); res.end('') }
  })
  server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }))
})

const run = (dir, base, args) => new Promise((resolve) => {
  const child = spawn(process.execPath, [join(dir, 'tools/check-craft.mjs'), ...args], {
    cwd: dir,
    env: { ...process.env, SITE: base, CRAFT_LANES: '2',
      PLAYWRIGHT: join(modules, 'playwright/index.mjs'), SHARP: join(modules, 'sharp/dist/index.mjs') },
  })
  let stdout = '', stderr = ''
  child.stdout.on('data', (d) => { stdout += d })
  child.stderr.on('data', (d) => { stderr += d })
  child.on('close', (status) => resolve({ status, stdout, stderr }))
})

test('craft: плитка категории ростом кнопок героя не меряется; обычная кнопка другого роста — находка',
  { skip: modules ? false : 'нет Playwright и sharp — CRAFT_MODULES=…/node_modules, где они стоят', timeout: 300_000 }, async () => {
  const { server, base } = await serve()
  const dir = mkdtempSync(join(tmpdir(), 'kit-herotile-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    mkdirSync(join(dir, 'styles'), { recursive: true })
    cpSync(join(KIT, 'styles/scale.css'), join(dir, 'styles/scale.css'))
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    for (const p of Object.keys(PAGES)) { mkdirSync(join(dir, 'app', p), { recursive: true }); writeFileSync(join(dir, 'app', p, 'page.tsx'), 'export default () => null\n') }
    const out = join(dir, 'found.json')
    const r = await run(dir, base, ['--pages', Object.keys(PAGES).join(','), '--only', 'heroLane', '--json', out])
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const { found } = JSON.parse(readFileSync(out, 'utf8'))
    const on = (p) => found.heroLane.filter((l) => l.startsWith(`${p} `) && /разного роста/.test(l))

    assert.deepEqual(on('/tiles'), [], found.heroLane.join('\n'))
    assert.ok(on('/plain').length > 0, found.heroLane.join('\n'))
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }) }
})
