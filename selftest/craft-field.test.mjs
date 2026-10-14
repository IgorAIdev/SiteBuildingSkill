/**
 * Семья `check:craft` `field` — «лист без поля»: буква на краю собственного
 * пола. Лента, которую обрезает предок (`overflow`), листом не мерится.
 *
 * Дефект: 14.10.2026, четвёртая витрина cbdshop.hr, вид «Небо» (голубые
 * подложки под блоками). Проверка нашла девять «нарушений» на главной —
 * «поле -46px, буква на краю пола» у «Shop by effect» и «What customers say».
 * Это были карточки лент за правым краем окна: ленту обрезает её `overflow`,
 * до края листа они не доходят и не видны. Проверка брала текст по его
 * коробке, а не по видимому.
 *
 * Как у craft-seam: крошечный сервер, узкий прогон настоящей проверки.
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

const page = (title, inside) => `<!doctype html><html lang="en"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>`
  + `<style>body{margin:0;font:16px/1.5 sans-serif;color:#111;background:#fff}main{display:flow-root}`
  + `p{margin:0}.band{display:flow-root;margin-block-start:48px;background:#eee;padding:48px 0}`
  + `.in{padding:0 24px}.tight{padding:0 2px}.rail{display:flex;gap:16px;overflow-x:auto;padding:0 24px}.card{flex:none;inline-size:600px}`
  + `h1,h2{margin:0;font-size:28px;line-height:1.2}</style></head>`
  + `<body><header><a href="/">Shop</a></header><main><section class="in"><h1>${title}</h1></section>`
  + `<div class="band">${inside}</div></main></body></html>`

const PAGES = {
  /* Поле 24 у заголовка, а лента карточек уходит за правый край окна: её
     обрезает overflow — до края листа буквы не доходят. Находки нет. */
  '/rail': page('Rail', '<div class="in"><h2>Effects</h2></div><div class="rail"><p class="card">calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days</p><p class="card">calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days</p><p class="card">calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days calm sleep and gentle evening routine for tired days</p></div>'),
  /* Заголовок в два пикселя от края листа — находка. */
  '/tight': page('Tight', '<div class="tight"><h2>Effects</h2><p>Copy lying on the sheet edge.</p></div>'),
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


test('craft: лист без поля — ленту, которую обрезает предок, лист не мерит; буква у самого края — находка',
  { skip: modules ? false : 'нет Playwright и sharp — CRAFT_MODULES=…/node_modules, где они стоят', timeout: 300_000 }, async () => {
  const { server, base } = await serve()
  const dir = mkdtempSync(join(tmpdir(), 'kit-field-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    mkdirSync(join(dir, 'styles'), { recursive: true })
    cpSync(join(KIT, 'styles/scale.css'), join(dir, 'styles/scale.css'))
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    for (const p of Object.keys(PAGES)) { mkdirSync(join(dir, 'app', p), { recursive: true }); writeFileSync(join(dir, 'app', p, 'page.tsx'), 'export default () => null\n') }
    const out = join(dir, 'found.json')
    const r = await run(dir, base, ['--pages', Object.keys(PAGES).join(','), '--only', 'field', '--json', out])
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const { found } = JSON.parse(readFileSync(out, 'utf8'))
    const on = (p) => found.field.filter((l) => l.startsWith(`${p} `))

    assert.deepEqual(on('/rail'), [], found.field.join('\n'))
    assert.ok(on('/tight').some((l) => /буква на краю пола/.test(l)), found.field.join('\n'))
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }) }
})
