/**
 * Запуск витрины догоняет набор (И751): правка, сделанная, пока сервер
 * стоял, ложится в `.storefront/` при старте — тем же решением, что у
 * слежки. 05.10.2026 после ночной остановки правки шаблона в витрину не
 * легли: витрина ставилась, только если её нет.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { route, skip, sources, plan, readStamp, writeStamp, stampOne, hash, STAMP } from '../tools/storefront-sync.mjs'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')

/** Набор в миниатюре: только папки и файлы, которые берёт витрина, и мусор рядом. */
function kit() {
  const dir = mkdtempSync(join(tmpdir(), 'sf-sync-'))
  const put = (rel, body = rel) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), body) }
  for (const rel of ['templates/storefront/lib/catalog-view.ts', 'templates/storefront/components/Filters.tsx',
    'templates/storefront/package.json', 'styles/tokens.css', 'tools/check-css.mjs',
    'skills/site-building/assets/vendure/money.mjs', 'install.mjs', 'scripts.mjs']) put(rel)
  for (const rel of ['templates/storefront/node_modules/x/index.js', 'templates/storefront/.next/cache.json',
    'templates/storefront/lib/a.ts.tmp.123', 'tools/storefront.mjs', 'docs/rules.md', 'CLAUDE.md']) put(rel)
  return { dir, put }
}

test('файл шаблона кладётся прямо; выпущенное, панель, удалённое и всё вне шаблона — поверх', () => {
  for (const rel of ['lib/catalog-view.ts', 'components/Filters.tsx', 'tests/traits.test.ts', 'app/[lang]/page.tsx', 'styles/storefront.css']) {
    assert.equal(route(`templates/storefront/${rel}`), 'direct', rel)
  }
  for (const rel of ['package.json', 'lib/look-slots.json', 'lib/look-values.ts', 'lib/source/sample/look.json',
    'styles/look.css', 'scripts/look-slots.mjs', 'look-panel/ui/panel.tsx']) {
    assert.equal(route(`templates/storefront/${rel}`), 'overlay', `${rel}: выпускается переустановкой, прямая копия затёрла бы выпуск`)
  }
  assert.equal(route('templates/storefront/lib/catalog-view.ts', true), 'overlay', 'удалённое снимает только переустановка')
  for (const rel of ['styles/tokens.css', 'tools/check-css.mjs', 'skills/site-building/assets/vendure/money.mjs', 'install.mjs', 'scripts.mjs']) {
    assert.equal(route(rel), 'overlay', rel)
  }
})

test('не источник: зависимости, сборка, временные файлы редактора, сам запускатель', () => {
  for (const rel of ['templates/storefront/node_modules/x/y.js', 'templates/storefront/.next/a', 'tools/storefront.mjs',
    'templates/storefront/lib/a.ts.tmp.42', 'styles/x.css~', 'tools/.x.mjs.swp']) assert.ok(skip(rel), rel)
  assert.ok(!skip('templates/storefront/lib/catalog-view.ts'))
})

test('источники — каждый файл, который берёт витрина, хешем содержимого; мусор и чужое — мимо', () => {
  const { dir } = kit()
  try {
    const files = sources(dir)
    assert.deepEqual(Object.keys(files).sort(), ['install.mjs', 'scripts.mjs', 'skills/site-building/assets/vendure/money.mjs',
      'styles/tokens.css', 'templates/storefront/components/Filters.tsx', 'templates/storefront/lib/catalog-view.ts',
      'templates/storefront/package.json', 'tools/check-css.mjs'])
    assert.equal(files['styles/tokens.css'], hash(readFileSync(join(dir, 'styles/tokens.css'))))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('правка без сервера: запуск видит её и кладёт файл шаблона тем же путём (дефект 05.10.2026)', () => {
  const { dir, put } = kit()
  try {
    const before = sources(dir)
    assert.deepEqual(plan(before, sources(dir)), { overlay: [], direct: [] }, 'ничего не менялось — ничего не делается')
    put('templates/storefront/lib/catalog-view.ts', 'export const zero = true\n')
    put('templates/storefront/tests/traits.test.ts', 'test\n')
    assert.deepEqual(plan(before, sources(dir)), { overlay: [], direct: ['lib/catalog-view.ts', 'tests/traits.test.ts'] })
    put('styles/tokens.css', ':root{}\n')
    assert.deepEqual(plan(before, sources(dir)).overlay, ['styles/tokens.css'], 'правка стилей набора — поверх')
    rmSync(join(dir, 'templates/storefront/components/Filters.tsx'))
    assert.ok(plan(before, sources(dir)).overlay.includes('templates/storefront/components/Filters.tsx'), 'удалённый файл — поверх')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('витрина, которая не помнит, с чем сведена, ставится поверх; частная запись этого не скрывает', () => {
  const { dir } = kit()
  const site = mkdtempSync(join(tmpdir(), 'sf-site-'))
  try {
    assert.equal(readStamp(site), null)
    assert.deepEqual(plan(readStamp(site), sources(dir)), { overlay: [STAMP], direct: [] })
    stampOne(site, 'lib/catalog-view.ts', 'x')
    assert.ok(!existsSync(join(site, STAMP)), 'прямая запись слежки не заводит запись, которой не было')
    writeFileSync(join(site, STAMP), '{ испорчена')
    assert.equal(readStamp(site), null, 'испорченная запись — не помнит')

    const files = sources(dir)
    writeStamp(site, files)
    assert.deepEqual(readStamp(site), files)
    stampOne(site, 'lib/catalog-view.ts', 'новое')
    const after = readStamp(site)
    assert.equal(after['templates/storefront/lib/catalog-view.ts'], hash('новое'))
    assert.equal(after['styles/tokens.css'], files['styles/tokens.css'], 'остальное — как было')
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(site, { recursive: true, force: true })
  }
})

test('запускатель сводит витрину с набором до сервера, а слежка — тем же решением и с записью', () => {
  const src = readFileSync(join(ROOT, 'tools/storefront.mjs'), 'utf8')
  const sync = src.indexOf('plan(readStamp(SITE)')
  assert.ok(sync > 0, 'запуск сверяет запись с набором')
  assert.ok(sync < src.indexOf("args.includes('--prepare')"), 'до выхода --prepare: сервер собирает сведённую витрину')
  assert.ok(sync < src.indexOf('\n  boot()'), 'до запуска сервера')
  assert.match(src, /route\(rel, gone\) === 'direct'/, 'слежка решает тем же route')
  assert.match(src, /writeFileSync\(to, body\)\s*\n\s*stampOne\(SITE, rel, body\)/, 'прямая запись слежки запоминается')
  assert.doesNotMatch(src, /const REBUILD|const WATCHED/, 'второго списка источников в запускателе нет')
})
