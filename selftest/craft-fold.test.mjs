/**
 * Семьи `check:craft` «встаёт в окно ноутбука» и «строка цены» — на настоящем
 * браузере (И510).
 *
 *   cardFold — карточка товара ниже края окна, когда её верх подвели под
 *              прилипшую шапку (окно ноутбука 657 и 730);
 *   heroFold — первый экран (`data-hero`) выше окна за вычетом шапки;
 *   wasPrice — прежняя цена этажом над нынешней или перед ней в строке.
 *
 * Дефект: 28.09.2026 заказчик на 13" ноутбуке (окно ≈ 1536×730): герой
 * главной выше окна, у карточки полки цена и «Добави» под краем, прежняя
 * цена стоит своей строкой над нынешней. Потолок снимка (`60svh`) закон
 * держал, а блок целиком — никто.
 *
 * Как у craft-fields: крошечный сервер, узкий прогон настоящей проверки.
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

/* Шапка прилипает (80px), под ней — первый экран и полка из одной карточки. */
const shell = (title, body, style = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>`
  + `<style>body{margin:0;font:16px/1.5 sans-serif;color:#111;background:#fff}`
  + `header{position:sticky;top:0;block-size:80px;background:#fff;display:flex;align-items:center;padding:0 24px}`
  + `main{padding:24px}section,article{box-sizing:border-box}.shelf{display:flex;gap:24px;margin-block:40px 900px}`
  + `article{inline-size:260px;display:flex;flex-direction:column;justify-content:flex-end}${style}</style></head>`
  + `<body><header><a href="/">Shop</a></header><main>${body}</main></body></html>`

const card = (h, price) => `<div class="shelf"><article data-product-card style="block-size:${h}px">`
  + `<h3>Oil 10%</h3>${price}</article></div>`

const PAGES = {
  /* Всё не так: герой 640 под шапкой 80 в окне 657, карточка 680 (и в 730), прежняя
     цена этажом над нынешней. */
  '/tall': shell('Tall',
    '<section data-hero style="block-size:640px"><h1>Oil</h1></section>'
    + card(680, '<p class="price"><s>€42</s><br><b>€30</b></p>')),
  /* Прежняя цена перед нынешней в одной строке. */
  '/before': shell('Before',
    '<section data-hero style="block-size:300px"><h1>Oil</h1></section>'
    + card(400, '<p class="price" style="display:flex;gap:8px;align-items:baseline"><s>€42</s><b>€30</b></p>')),
  /* Как надо: герой и карточка встают под шапку, прежняя справа. */
  '/fit': shell('Fit',
    '<section data-hero style="block-size:400px"><h1>Oil</h1></section>'
    + card(420, '<p class="price" style="display:flex;gap:8px;align-items:baseline"><b>€30</b><s>€42</s></p>')),
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

test('craft: карточка и герой встают в окно ноутбука под шапкой; прежняя цена — справа',
  { skip: modules ? false : 'нет Playwright и sharp — CRAFT_MODULES=…/node_modules, где они стоят', timeout: 300_000 }, async () => {
  const { server, base } = await serve()
  const dir = mkdtempSync(join(tmpdir(), 'kit-fold-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    for (const p of Object.keys(PAGES)) { mkdirSync(join(dir, 'app', p), { recursive: true }); writeFileSync(join(dir, 'app', p, 'page.tsx'), 'export default () => null\n') }
    const out = join(dir, 'found.json')
    const r = await run(dir, base, ['--pages', Object.keys(PAGES).join(','), '--only', 'cardFold,heroFold,wasPrice', '--json', out])
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const { found } = JSON.parse(readFileSync(out, 'utf8'))
    const on = (fam, page) => found[fam].filter((l) => l.startsWith(`${page} `))

    const card = on('cardFold', '/tall')
    assert.ok(card.length >= 1, found.cardFold.join('\n'))
    assert.ok(card.every((l) => /^\/tall @(1024|1200|1440|1600)  /.test(l)), 'окно ноутбука — ширины стола')
    assert.ok(card.some((l) => /657/.test(l)) && card.some((l) => /730/.test(l)), card.join('\n'))

    const hero = on('heroFold', '/tall')
    assert.ok(hero.length >= 1, found.heroFold.join('\n'))
    assert.ok(hero.every((l) => /657/.test(l)), 'в 730 герой 640 под шапкой 80 помещается')

    assert.ok(on('wasPrice', '/tall').some((l) => /над нынешней/.test(l)), found.wasPrice.join('\n'))
    assert.ok(on('wasPrice', '/before').some((l) => /перед нынешней/.test(l)), found.wasPrice.join('\n'))

    for (const fam of ['cardFold', 'heroFold']) assert.deepEqual(on(fam, '/before'), [], fam)
    for (const fam of ['cardFold', 'heroFold', 'wasPrice']) assert.deepEqual(on(fam, '/fit'), [], fam)
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }) }
})
