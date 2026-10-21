import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/* Один знак — один смысл на сайте (слово заказчика 21.10.2026; craft, references/icons.md,
   «Знак при слове — на своём настоящем росте», п. 3). Знак при слове ставится данными:
   `{ icon: '<знак>' as const, text: t(lang, '<ключ>') }`. Один знак при двух ключах — щит
   стоял и при возврате, и при «THC < 0.2 %» — находка. */
test('one sign carries one meaning across the storefront data', () => {
  const dir = new URL('../templates/storefront/lib/', import.meta.url)
  const seen = new Map()
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
    const src = readFileSync(new URL(f, dir), 'utf8')
    for (const m of src.matchAll(/icon: '([a-z0-9-]+)' as const, text: tn?\(lang, '([A-Za-z0-9.]+)'/g)) {
      const keys = seen.get(m[1]) ?? new Set()
      keys.add(m[2]); seen.set(m[1], keys)
    }
  }
  const twice = [...seen].filter(([, keys]) => keys.size > 1).map(([sign, keys]) => `${sign}: ${[...keys].join(', ')}`)
  assert.deepEqual(twice, [], `знак при двух смыслах: ${twice.join('; ')}`)
  assert.ok(seen.size > 0, 'сторож ничего не нашёл — форма записи знака изменилась')
})
