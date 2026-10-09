import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { storefrontVariant } from '../tools/storefront-variants.mjs'

test('a named storefront isolates runtime and published look from the original', () => {
  const kit = mkdtempSync(join(tmpdir(), 'storefront-variant-'))
  try {
    mkdirSync(join(kit, 'showcase/variants/minimal'), { recursive: true })
    writeFileSync(join(kit, 'showcase/variants/minimal/look.json'), '{}')
    const original = storefrontVariant(kit, [])
    const minimal = storefrontVariant(kit, ['--variant', 'minimal'])
    assert.equal(original.site, join(kit, '.storefront'))
    assert.equal(original.port, '3020')
    assert.equal(minimal.site, join(kit, '.storefront-minimal'))
    assert.equal(minimal.showcase, join(kit, 'showcase/variants/minimal'))
    assert.equal(minimal.port, '3021')
    for (const name of [undefined, '../minimal', '/tmp', '--fresh', 'unknown']) {
      assert.throws(() => storefrontVariant(kit, ['--variant', ...(name ? [name] : [])]))
    }
  } finally { rmSync(kit, { recursive: true, force: true }) }
})
