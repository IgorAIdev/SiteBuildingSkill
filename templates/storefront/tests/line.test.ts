import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lineOf } from '../lib/source/line.ts'
import { optionLinks, readSelection, titleOf } from '../lib/variant.ts'
import { sampleSource } from '../lib/source/sample/catalog.ts'

const NAMES = { strength: 'Strength', volume: 'Volume' }

/* И503: у магазина отдельный товар на каждую силу и меру; выбор на карте
   строится из соседей той же марки и того же имени. */
const mate = (id: string, name: string, strength: string | null, volume: string | null) => ({ id, name, brand: 'NatureCBD', strength, volume, stock: 'in' as const })

test('a line groups products of one brand whose names differ only by the measure', () => {
  const all = [
    mate('oil-10', 'CBD масло 10% пълен спектър', '1000mg', '10ml'),
    mate('oil-30', 'CBD масло 30% пълен спектър', '3000mg', '10ml'),
    mate('oil-10-30', 'CBD масло 10% пълен спектър', '3000mg', '30ml'),
    mate('iso-5', 'CBD масло 5% изолат', '500mg', '10ml'),
  ]
  const line = lineOf(all[0], all, NAMES)
  assert.ok(line)
  assert.deepEqual(line.axes.map((g) => [g.code, g.options.map((o) => o.code)]), [['strength', ['10%', '30%']], ['volume', ['10ml', '30ml']]])
  assert.deepEqual(line.members.map((m) => m.id), ['oil-10', 'oil-30', 'oil-10-30'], 'изолят — другая линейка')
  assert.deepEqual(line.members[2].options, { strength: '10%', volume: '30ml' })
})

test('one product, or products that differ in nothing, make no line', () => {
  const one = mate('a', 'CBD масло 10% пълен спектър', '1000mg', '10ml')
  assert.equal(lineOf(one, [one], NAMES), null)
  assert.equal(lineOf(one, [one, { ...one, id: 'b' }], NAMES), null)
})

test('each strength and volume of the sample is its own product page, and the picker links to the neighbours', async () => {
  const src = sampleSource()
  const ids = await src.productIds()
  assert.ok(ids.ok)
  assert.ok(ids.value.includes('ulei-cbd-full-spectrum') && ids.value.includes('ulei-cbd-full-spectrum-20-10ml'), 'у каждой силы свой адрес')
  const r = await src.product('en', 'ulei-cbd-full-spectrum')
  assert.ok(r.ok)
  assert.equal(r.value.variants.length, 1)
  assert.deepEqual(readSelection({}, r.value), r.value.variants[0].options, 'выбор товара линейки — он сам')
  const strength = optionLinks('en', r.value, {}).find((g) => g.code === 'putere')
  assert.equal(strength?.options.find((o) => o.code === '20')?.href, '/en/product/ulei-cbd-full-spectrum-20-10ml')
  assert.equal(strength?.options.find((o) => o.current)?.code, '10')
  assert.notEqual(titleOf(r.value), r.value.name, 'имя страницы несёт силу и меру — страницы соседей не дубли')
})
