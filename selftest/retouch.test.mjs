/**
 * Переустановка витрины повторяет запись (И682): файлы, записанные ею,
 * трогаются временем чуть погодя, и сервер разработки, поймавший «файл
 * занят» (os error 32), читает их заново. Зависимости и сборка не трогаются.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, statSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { retouch } from '../tools/retouch.mjs'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')

test('трогаются только файлы новее начала переустановки, без зависимостей и сборки', () => {
  const dir = mkdtempSync(join(tmpdir(), 'retouch-'))
  try {
    const old = new Date('2026-01-01T00:00:00Z')
    const put = (rel, when) => {
      const f = join(dir, rel)
      mkdirSync(join(f, '..'), { recursive: true })
      writeFileSync(f, 'x')
      if (when) utimesSync(f, when, when)
      return f
    }
    const fresh = put('components/A.tsx')
    const stale = put('components/B.tsx', old)
    put('node_modules/pkg/index.js')
    put('.next/cache/x.json')
    /* Начало берём с файла: подготовка каталогов на загруженном Windows
       может занять больше секунды и не должна превращать fresh в stale. */
    const since = statSync(fresh).mtimeMs
    const now = new Date(Date.now() + 5000)
    const touched = retouch(dir, since, now)
    assert.deepEqual(touched, [fresh])
    assert.equal(Math.round(statSync(fresh).mtimeMs / 1000), Math.round(now.getTime() / 1000))
    assert.equal(statSync(stale).mtimeMs, old.getTime())
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('наблюдатель витрины трогает файлы после переустановки', () => {
  const src = readFileSync(join(ROOT, 'tools/storefront.mjs'), 'utf8')
  /* `overlay()` — переустановка поверх с записью, с чем витрина сведена (И751). */
  assert.match(src, /overlay\(\)\s*\n\s*setTimeout\(\(\) => retouch\(SITE, since\), \d+\)/)
})
