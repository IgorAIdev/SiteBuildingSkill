/**
 * Цвет обеих тем (`check:theme`, И766): суд — на подставных красках, без
 * браузера; проверка целиком — на маленькой странице со стилями набора.
 *
 * Суд проверяется обратным ходом каждой семьи: чистые краски — ни одной
 * находки, ломаешь одно правило — находка ровно этой семьи. Страница
 * поднимается своим сервером: чистая берёт `styles/palette.css`,
 * `tokens.css` и `base.css` набора как есть — так проверяется, что сегодняшняя
 * палитра набора проходит правила тёмной темы; грязная переписывает лист
 * карточки ночью в цвет страницы и роль внутри живого листа на палубе. Где
 * Playwright не поставлен (у набора своих node_modules нет), прогон в
 * браузере пропускается с причиной: CRAFT_MODULES=…/node_modules.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { judge, FLOORS, PAIRS, ROLES, THEME_FAMILIES, THEME_LABELS } from '../tools/theme-families.mjs'

const KIT = fileURLToPath(new URL('..', import.meta.url))

/* ── суд на подставных красках ─────────────────────────────────────────── */

const grey = (v) => [v, v, v]
/** Краски одного пола: роли — серые ступени, пары — текст на своём фоне. */
const floor = (roles, pair = { fg: grey(20), bg: grey(250) }) => ({
  floor: roles['--page'] ?? grey(250),
  roles,
  pairs: Object.fromEntries(PAIRS.map((p) => [p.id, pair])),
})
const DAY = { '--page': grey(242), '--plate': grey(252), '--menu-bg': grey(252), '--plate-2': grey(236), '--ctrl': grey(228),
  '--band': grey(236), '--page-deck': [140, 110, 60], '--accent-solid': [140, 110, 60], '--ink': grey(20), '--ink-soft': grey(90) }
const NIGHT_ROLES = { '--page': grey(18), '--plate': grey(42), '--menu-bg': grey(42), '--plate-2': grey(52), '--ctrl': grey(60),
  '--band': grey(34), '--page-deck': [190, 160, 110], '--accent-solid': [190, 160, 110], '--ink': grey(235), '--ink-soft': grey(170) }
const theme = (roles, pair) => ({ sets: { 'как стоит': Object.fromEntries(FLOORS.map((f) => [f.id, floor(roles, pair)])) }, real: [] })
const families = (taken) => [...new Set(judge(taken).found.map((f) => f.family))]

test('у каждой семьи цвета обеих тем есть подпись, роли снимаются для всех ступеней', () => {
  for (const fam of THEME_FAMILIES) assert.ok(THEME_LABELS[fam], `семья ${fam} без подписи`)
  for (const role of ['--page', '--plate', '--ink', '--page-deck', '--accent-solid']) assert.ok(ROLES.includes(role), role)
})

test('чистые краски — находок нет', () => {
  const r = judge({ light: theme(DAY), dark: theme(NIGHT_ROLES) })
  assert.deepEqual(r.found, [], r.found.map((f) => f.text).join('\n'))
  assert.ok(r.rows.length >= 7 + 2 + 5 + PAIRS.length * FLOORS.length, 'таблица неполная')
})

test('обратный ход: каждое правило ломается своей семьёй', () => {
  const night = (patch) => ({ light: theme(DAY), dark: theme({ ...NIGHT_ROLES, ...patch }) })
  assert.deepEqual(families(night({ '--plate': grey(20), '--menu-bg': grey(20) })), ['nightStep'], 'карточка ночью в цвет страницы')
  assert.deepEqual(families(night({ '--page-deck': [70, 40, 20] })), ['colourStep'], 'цветная палуба ночью у самой страницы')
  /* Серая палуба ночью — на ступени карточек (И293, И568): от 6, а не от 20. */
  assert.deepEqual(families(night({ '--page-deck': grey(42) })), [], 'серая палуба ночью на ступени карточки — не находка')
  assert.deepEqual(families(night({ '--page-deck': grey(24) })), ['nightStep'], 'серая палуба ночью вплотную к странице')
  assert.deepEqual(families(night({ '--page': grey(0), '--plate': grey(30), '--menu-bg': grey(30), '--band': grey(16) })), ['blackFloor'], 'чистый чёрный пол')
  assert.deepEqual(families(night({ '--ink': grey(255) })), ['whiteInk'], 'чистый белый текст')
  assert.deepEqual(families(night({ '--accent-solid': [230, 120, 0] })), ['nightChroma'], 'марка ночью насыщеннее дня')
  /* Пара ломается на одном полу — семья по полу. */
  const broken = { fg: grey(120), bg: grey(140) }
  const onPlate = { light: theme(DAY), dark: theme(NIGHT_ROLES) }
  onPlate.dark.sets['как стоит'].plate = floor(NIGHT_ROLES, broken)
  assert.deepEqual(families(onPlate), ['platePair'])
  const onDeck = { light: theme(DAY), dark: theme(NIGHT_ROLES) }
  onDeck.light.sets['как стоит'].deck = floor(DAY, broken)
  assert.deepEqual(families(onDeck), ['inkPair'])
  /* Живой лист на палубе страницы: одна находка на элемент и пару. */
  const live = { light: theme(DAY), dark: theme(NIGHT_ROLES) }
  live.dark.real = [{ page: '/', kind: 'plate', label: 'section.Card.box', ...floor(NIGHT_ROLES, broken) },
    { page: '/en', kind: 'plate', label: 'section.Card.box', ...floor(NIGHT_ROLES, broken) }]
  const r = judge(live)
  assert.deepEqual([...new Set(r.found.map((f) => f.family))], ['platePair'])
  assert.equal(r.found.length, PAIRS.length, 'та же пара того же листа на второй странице — не вторая находка')
})

test('ступень ночью мельче дневной сверх порога различения — находка, в пределах — нет', () => {
  const day = { ...DAY, '--plate-2': grey(200) }
  const deep = judge({ light: theme(day), dark: theme(NIGHT_ROLES) }).found
  assert.ok(deep.some((f) => f.family === 'nightStep' && /плашка в карточке/.test(f.text)), deep.map((f) => f.text).join('\n'))
})

test('роли нет на сайте — «не измерено», а не находка', () => {
  const without = { ...NIGHT_ROLES }
  delete without['--band']
  const r = judge({ light: theme({ ...DAY, '--band': undefined }), dark: theme(without) })
  assert.deepEqual(r.found, [])
  assert.ok(r.skipped.some((s) => /--band/.test(s)), r.skipped.join('\n'))
})

/* ── проверка целиком на странице набора ─────────────────────────────────── */

const modules = (() => {
  if (process.env.CRAFT_MODULES) return existsSync(join(process.env.CRAFT_MODULES, 'playwright')) ? process.env.CRAFT_MODULES : null
  try {
    createRequire(join(KIT, 'package.json')).resolve('playwright')
    return join(KIT, 'node_modules')
  } catch { return null }
})()

const page = (style) => '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Theme</title>'
  + '<link rel="stylesheet" href="/styles/palette.css"><link rel="stylesheet" href="/styles/tokens.css">'
  + '<link rel="stylesheet" href="/styles/base.css"><style>body{background:var(--page)}footer{background:var(--page-deck)}'
  + `.Card-module__ab1__box{background:var(--plate)}${style}</style></head>`
  + '<body><main><h1>Shop</h1></main><footer data-ground="deck"><p>Footer</p>'
  + '<section data-plate class="Card-module__ab1__box"><p>Card on deck</p></section>'
  /* Лист без своей заливки: пол под ним не его — пара «на полу» не меряется. */
  + '<div data-plate class="Wrap-module__cd2__row"><p>Row</p></div></footer></body></html>'
const PAGES = {
  '/': page(''),
  /* Ночью лист карточки — краской страницы; в живом листе на палубе
     приглушённый текст взят краской палубы, а не листа. */
  '/dirty': page(':root{--plate:light-dark(var(--n-1),var(--n-1))}.Card-module__ab1__box{--ink-soft:var(--chrome-fg-2)}'),
}

const serve = () => new Promise((resolve) => {
  const server = createServer((req, res) => {
    const url = req.url.split('?')[0]
    if (PAGES[url]) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(PAGES[url]); return }
    const css = /^\/styles\/(palette|tokens|base)\.css$/.exec(url)
    if (css) { res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' }); res.end(readFileSync(join(KIT, 'styles', `${css[1]}.css`))); return }
    res.writeHead(404); res.end('')
  })
  server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }))
})

const run = (base, args) => new Promise((resolve) => {
  const child = spawn(process.execPath, [join(KIT, 'tools/check-theme.mjs'), ...args], {
    cwd: KIT, env: { ...process.env, SITE: base, PLAYWRIGHT: join(modules, 'playwright/index.mjs') },
  })
  let out = ''
  child.stdout.on('data', (d) => { out += d })
  child.stderr.on('data', (d) => { out += d })
  child.on('close', (status) => resolve({ status, out }))
})

test('check:theme на стилях набора: палитра набора чиста, сломанный лист пойман',
  { skip: modules ? false : 'нет Playwright — CRAFT_MODULES=…/node_modules, где он стоит', timeout: 120_000 }, async () => {
  const { server, base } = await serve()
  try {
    const clean = await run(base, ['--pages', '/'])
    assert.equal(clean.status, 0, clean.out)
    assert.match(clean.out, /живые палубы: 1, листы на палубе: 2/)
    const dirty = await run(base, ['--pages', '/dirty'])
    assert.equal(dirty.status, 1, dirty.out)
    assert.match(dirty.out, /nightStep[\s\S]*ночью «карточка над страницей»/)
    assert.match(dirty.out, /platePair[\s\S]*\/dirty section\.Card\.box: [^\n]*«приглушённый текст на листе»/)
    const gone = await run('http://127.0.0.1:9', ['--pages', '/'])
    assert.equal(gone.status, 2, 'сайт не поднят — «не проверено», а не «чисто»')
  } finally { server.close() }
})
