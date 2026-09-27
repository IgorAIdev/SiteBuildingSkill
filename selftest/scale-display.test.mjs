/**
 * Крупный текст — из строителя шкал, а не рукой (И245).
 *
 * Дефект, найденный проверкой ядра 22.09.2026: заголовок героя, заголовок
 * страницы и вводный абзац стояли в tokens.css пикселями и голым `cqi` —
 * одна строка на все наборы. В «Просторном» заголовок страницы (42) вышел
 * меньше заголовка раздела (49); вводный абзац (17,5) мельче основного
 * текста (18) на макете; при увеличении шрифта в браузере все три не росли.
 * `npm run scale` при этом записывал файл, даже когда замер его браковал.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve, toCss, auditScale, DISPLAY_KNOBS } from '../tools/scale.mjs'

const KIT = fileURLToPath(new URL('..', import.meta.url))
const sets = JSON.parse(readFileSync(join(KIT, 'styles/scale.json'), 'utf8'))
const ROLES = { герой: 'hero', заголовок: 'pagehead', ввод: 'intro' }

test('every shipped set names its display sizes and passes the audit', () => {
  for (const [name, set] of Object.entries(sets)) {
    const r = resolve(set)
    for (const role of Object.keys(ROLES)) assert.ok(r.крупные?.[role], `${name}: нет «${role}»`)
    assert.deepEqual(auditScale(set), [], name)
  }
})

test('display sizes are emitted in every set block, rem at both ends and a non-negative rem intercept', () => {
  const css = toCss(sets)
  const blocks = css.split(/\n(?=\[data-scale=|:root\{)/)
  for (const name of Object.keys(sets)) {
    const block = blocks.find((b) => b.startsWith(`[data-scale="${name}"]`))
    assert.ok(block, name)
    for (const en of Object.values(ROLES)) {
      assert.match(block, new RegExp(`--${en}-size: clamp\\(\\d*\\.?\\d+rem, \\d*\\.?\\d+rem \\+ \\d*\\.?\\d+cqi, \\d*\\.?\\d+rem\\)`), `${name} ${en}`)
      for (const knob of DISPLAY_KNOBS[en]) assert.match(block, new RegExp(`--${en}-${knob}: `), `${name} --${en}-${knob}`)
    }
  }
})

test('the approved set keeps its sizes; the intro is not smaller than body text', () => {
  const r = resolve(sets['Нынешний'])
  assert.deepEqual([r.крупные.заголовок.низ, r.крупные.заголовок.верх], [30, 42])
  assert.deepEqual([r.крупные.герой.низ, r.крупные.герой.верх], [26, 56])
  assert.ok(r.крупные.ввод.низ >= r.размер.base[1])
})

test('in every set the page title is larger than a section heading at both ends', () => {
  for (const [name, set] of Object.entries(sets)) {
    const r = resolve(set)
    assert.ok(r.крупные.заголовок.низ > r.размер.h2[0] && r.крупные.заголовок.верх > r.размер.h2[1], name)
  }
})

const broken = (patch) => {
  const set = structuredClone(sets['Нынешний'])
  Object.assign(set.крупные[patch.role], patch.value)
  return auditScale(set).map((f) => f.rule).join(' | ')
}

test('audit refuses display sizes out of order, shrinking with zoom or too spread', () => {
  assert.match(broken({ role: 'заголовок', value: { верх: 36 } }), /заголовок страницы/)
  assert.match(broken({ role: 'ввод', value: { низ: 17 } }), /вводный абзац/)
  assert.match(broken({ role: 'герой', value: { верх: 40 } }), /герой/)
  assert.match(broken({ role: 'герой', value: { основа: -2 } }), /увеличени/)
  assert.match(broken({ role: 'герой', value: { низ: 20, верх: 56 } }), /разброс/)
  assert.match(broken({ role: 'ввод', value: { низ: 22, верх: 21 } }), /низ/)
})

test('tokens.css no longer hand-writes the display sizes', () => {
  const tokens = readFileSync(join(KIT, 'styles/tokens.css'), 'utf8')
  for (const en of Object.values(ROLES)) assert.doesNotMatch(tokens, new RegExp(`^\\s*--${en}-size\\s*:`, 'm'), en)
})

test('scale-css refuses to write a set the audit rejects, and leaves the old file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scale-refuse-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    mkdirSync(join(dir, 'styles'))
    const bad = structuredClone(sets)
    bad['Нынешний'].крупные.заголовок.верх = 30
    writeFileSync(join(dir, 'styles/scale.json'), JSON.stringify(bad))
    writeFileSync(join(dir, 'styles/scale.css'), '/* old */\n')
    const run = spawnSync(process.execPath, [join(dir, 'tools/scale-css.mjs')], { cwd: dir, encoding: 'utf8' })
    assert.notEqual(run.status, 0, run.stdout)
    assert.match(run.stderr, /заголовок страницы/)
    assert.equal(readFileSync(join(dir, 'styles/scale.css'), 'utf8'), '/* old */\n')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

/* Межстрочье переживает сборку (И465). Дефект — роли текста cbdshop.bg:
   строитель выпускал `--h3-lead: 1.28571429`, сборщик Next писал `1.28571`,
   и строка 36/28 рисовалась 35.99988 — на 1/64 пикселя ниже задуманной. */
test('a role lead is emitted with five decimals, rounded up, and can be named as a pixel pair', async () => {
  const { leadOf } = await import('../tools/scale.mjs')
  const minified = (x) => Number(Number(x).toFixed(5))
  const withLead = (lead) => {
    const first = Object.keys(sets)[0]
    const set = structuredClone(sets[first])
    const role = Object.keys(set.текст)[0]
    set.текст[role].межстрочье = lead
    return { css: toCss({ [first]: set }), role, set }
  }
  const at = (css, role) => Number(css.match(new RegExp(`--${role}-lead: ([0-9.]+);`))[1])
  /* обратный ход: число как есть сборка режет, и строка опускается */
  assert.ok(28 * minified(36 / 28) < 36, 'сборщик не режет — дефект не воспроизведён')
  for (const [given, px, size] of [[36 / 28, 36, 28], ['36/28', 36, 28], ['42/34', 42, 34], [20 / 14, 20, 14], ['56/48', 56, 48]]) {
    const { css, role } = withLead(given)
    const lead = at(css, role)
    assert.equal(minified(lead), lead, `${given}: ${lead} — сборка сдвинет`)
    assert.ok(size * lead >= px, `${given}: строка ${size * lead} ниже ${px}`)
    assert.ok(size * lead - px < size * 1e-5, `${given}: строка ${size * lead} выше лишнего`)
  }
  /* доля, уже короткая, выходит как есть */
  assert.equal(leadOf(1.45), 1.45)
  assert.equal(leadOf(1.1), 1.1)
  /* не число — находка замера, а не молчаливое NaN в стилях */
  const first = Object.keys(sets)[0]
  const bad = structuredClone(sets[first])
  bad.текст[Object.keys(bad.текст)[0]].межстрочье = 'полтора'
  const { auditRoles } = await import('../tools/scale.mjs')
  assert.ok(auditRoles({ [first]: bad }, first).some((f) => f.rule === 'межстрочье не число'), 'кривое межстрочье прошло молча')
})
