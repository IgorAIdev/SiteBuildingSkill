/**
 * Семья `check:craft` `anchor` — «цель уедет под шапку» считается только там,
 * где шапка в самом деле держится у верха окна, когда цель приехала (И773).
 *
 * Дефект: 29.09.2026 на cbdshop.bg 620 находок «отступ 0 при занятом верхе
 * 132» — а шапка там не прилипает (`position: relative`), уезжает вместе со
 * страницей, и заголовок раздела после перехода по якорю виден целиком.
 * Проверка при нуле `--float` и `--chrome-stuck` брала за занятый верх
 * высоту шапки как она есть — прилипает она или нет, не спрашивал никто.
 *
 * Как у craft-fold: крошечный сервер, узкий прогон настоящей проверки.
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

/* Шапка 80, ссылка на раздел в самом верху, раздел далеко внизу. `head` —
   как держится шапка, `wrap` — во что она вложена, `margin` — отступ цели. */
const page = (title, { head, wrap = false, margin = 0 }) => `<!doctype html><html lang="en"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>`
  + `<style>body{margin:0;font:16px/1.5 sans-serif;color:#111;background:#fff}`
  + `header{${head};top:0;inset-inline:0;block-size:80px;background:#fff;display:flex;align-items:center;gap:24px;padding:0 24px;box-sizing:border-box}`
  + `main{padding:${head.includes('fixed') ? 104 : 24}px 24px 2400px}h2{margin-block:1600px 0;scroll-margin-top:${margin}px}</style></head>`
  + `<body>${wrap ? '<div class="top">' : ''}<header><a href="/">Shop</a><a href="#part">Part</a></header>`
  + `${wrap ? '<p>Free delivery over €50</p></div>' : ''}`
  + `<main><h1>${title}</h1><h2 id="part">Part</h2></main></body></html>`

const PAGES = {
  /* Шапка уезжает со страницей — закрыть цель ей нечем. */
  '/still': page('Still', { head: 'position:relative' }),
  /* Прилипает к своей обёртке, а обёртка кончается над страницей: к приезду
     цели шапки у верха окна уже нет. */
  '/wrapped': page('Wrapped', { head: 'position:sticky', wrap: true }),
  /* Прилипает к странице, отступа у цели нет — цель под шапкой. */
  '/sticky': page('Sticky', { head: 'position:sticky' }),
  /* Стоит в окне всегда — то же. */
  '/fixed': page('Fixed', { head: 'position:fixed' }),
  /* Прилипает, но цель держит отступ больше шапки. */
  '/kept': page('Kept', { head: 'position:sticky', margin: 96 }),
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

test('craft: цель под шапкой — только когда шапка держится у верха окна',
  { skip: modules ? false : 'нет Playwright и sharp — CRAFT_MODULES=…/node_modules, где они стоят', timeout: 300_000 }, async () => {
  const { server, base } = await serve()
  const dir = mkdtempSync(join(tmpdir(), 'kit-anchor-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    /* Проверка читает роли текста из styles/scale.css (typeRole, И674) — без файла падает до замера. */
    mkdirSync(join(dir, 'styles'), { recursive: true })
    cpSync(join(KIT, 'styles/scale.css'), join(dir, 'styles/scale.css'))
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    for (const p of Object.keys(PAGES)) { mkdirSync(join(dir, 'app', p), { recursive: true }); writeFileSync(join(dir, 'app', p, 'page.tsx'), 'export default () => null\n') }
    const out = join(dir, 'found.json')
    const r = await run(dir, base, ['--pages', Object.keys(PAGES).join(','), '--only', 'anchor', '--json', out])
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const { found } = JSON.parse(readFileSync(out, 'utf8'))
    const on = (page) => found.anchor.filter((l) => l.startsWith(`${page} `))

    for (const p of ['/sticky', '/fixed']) {
      assert.ok(on(p).length >= 1, `${p}: ${found.anchor.join('\n')}`)
      assert.ok(on(p).every((l) => /#part — отступ 0 при занятом верхе 80/.test(l)), on(p).join('\n'))
    }
    for (const p of ['/still', '/wrapped', '/kept']) assert.deepEqual(on(p), [], p)
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }) }
})
