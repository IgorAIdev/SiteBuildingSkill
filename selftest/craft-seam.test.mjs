/**
 * Семья `check:craft` `bandSeam` — шов у края полосы меряется по видимому
 * (И738, поправка 06.10.2026).
 *
 * Дефект: большая проверка 06.10.2026 — «div.band «CBD oils…», верхний край
 * полосы — над краем 48px, под ним 36px» на главной @390. Под краем стоял
 * заголовок ряда на 48 и «View all» — прозрачная цель под палец 44 при строке
 * 20, поднятая к середине заглавных: коробка начиналась на 36, буквы — на 48.
 * Проверка брала коробку ссылки за видимое.
 *
 * Как у craft-anchor: крошечный сервер, узкий прогон настоящей проверки.
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

/* Блок без подложки, под ним полоса во всю ширину на 48 ниже; внутри полосы
   первая вещь — `inside` (разметка) с полем сверху `pad`. */
const page = (title, { pad, inside }) => `<!doctype html><html lang="en"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>`
  + `<style>body{margin:0;font:16px/1.5 sans-serif;color:#111;background:#fff}main{display:flow-root}`
  + `p{margin:0}.band{display:flow-root;margin-block-start:48px;background:#eee}`
  + `.lead{padding:24px 24px 0}.tail{padding:48px 24px}.part{padding:${pad}px 24px 48px}.row{display:flex;justify-content:space-between;align-items:flex-start}`
  + `h1,h2{margin:0;font-size:28px;line-height:1}`
  + `.go{display:inline-flex;align-items:center;min-block-size:44px;margin-block-start:-12px;line-height:20px;color:#111}</style></head>`
  + `<body><header><a href="/">Shop</a></header><main><section class="lead"><h1>${title}</h1><p>Before the band.</p></section>`
  + `<div class="band">${inside}</div><section class="tail"><p>After the band.</p></section></main></body></html>`

const PAGES = {
  /* Заголовок на 48 и прозрачная цель «View all», поднятая на 12: коробка
     ссылки начинается на 36, буквы — на 48. Шов ровный. */
  '/target': page('Target', { pad: 48, inside: '<section class="part"><div class="row"><h2>Oils</h2><a class="go" href="/target">View all</a></div><p>Hemp oils.</p></section>' }),
  /* Текст в самом деле на 36 — находка. */
  '/short': page('Short', { pad: 36, inside: '<section class="part"><h2>Oils</h2><p>Hemp oils.</p></section>' }),
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

test('craft: шов полосы — по буквам, прозрачная цель под палец видимым не считается',
  { skip: modules ? false : 'нет Playwright и sharp — CRAFT_MODULES=…/node_modules, где они стоят', timeout: 300_000 }, async () => {
  const { server, base } = await serve()
  const dir = mkdtempSync(join(tmpdir(), 'kit-seam-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    /* Проверка читает роли текста из styles/scale.css (typeRole, И674) — без файла падает до замера. */
    mkdirSync(join(dir, 'styles'), { recursive: true })
    cpSync(join(KIT, 'styles/scale.css'), join(dir, 'styles/scale.css'))
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    for (const p of Object.keys(PAGES)) { mkdirSync(join(dir, 'app', p), { recursive: true }); writeFileSync(join(dir, 'app', p, 'page.tsx'), 'export default () => null\n') }
    const out = join(dir, 'found.json')
    const r = await run(dir, base, ['--pages', Object.keys(PAGES).join(','), '--only', 'bandSeam', '--json', out])
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const { found } = JSON.parse(readFileSync(out, 'utf8'))
    const on = (p) => found.bandSeam.filter((l) => l.startsWith(`${p} `))

    assert.deepEqual(on('/target'), [], found.bandSeam.join('\n'))
    assert.ok(on('/short').some((l) => /верхний край полосы — над краем 48px, под ним 36px/.test(l)), found.bandSeam.join('\n'))
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }) }
})
