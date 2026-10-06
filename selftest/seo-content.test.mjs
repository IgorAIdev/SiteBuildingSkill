import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { normalizeMarket, importMarket } from '../skills/site-building/assets/seo-content/scripts/import-market.mjs'

const options = { country: 'BG', language: 'bg', sourceRef: 'owner-research@fixture' }
const exportOf = () => ({ country: 'BG', language: 'bg', import: {
  demand: [
    { keyword: 'example known zero', volume: 0, competition: 0.7, kd: 18, source: 'measured', measuredAt: '2026-09-02T00:00:00Z' },
    { keyword: 'example unmeasured', volume: null, competition: null, kd: null, source: 'assumed' },
  ],
  questions: [
    { text: 'A real observed question?', origin: 'people_also_ask', source: 'bought' },
    { text: 'A related search', origin: 'people_also_search' },
    { text: 'An old list entry' },
  ],
} })

test('market import preserves unknown and zero metrics, and separates Ads competition from organic difficulty', () => {
  const result = normalizeMarket(exportOf(), options)
  assert.equal(result.demand[0].volume, 0)
  assert.equal(result.demand[1].volume, null)
  assert.equal(result.demand[0].adsCompetition, 0.7)
  assert.equal(result.demand[0].organicDifficulty, 18)
  assert.equal(result.demand[1].source, 'assumed')
  assert.equal(result.demand[1].measuredAt, null)
  assert.equal(result.publicationStatus, 'not_reviewed')
})

test('a market cannot be reused as another country or language by relabelling it', () => {
  assert.throws(() => normalizeMarket(exportOf(), { ...options, country: 'RO', language: 'ro' }), /mismatch/)
  assert.throws(() => normalizeMarket(exportOf(), { ...options, language: 'en' }), /mismatch/)
  assert.throws(() => normalizeMarket(exportOf(), { ...options, sourceRef: '' }), /source reference/)
})

test('related searches and unknown legacy entries are not upgraded to verified FAQ questions', () => {
  const result = normalizeMarket(exportOf(), options)
  assert.deepEqual(result.questions.map(row => row.kind), ['question_candidate', 'related_query', 'unverified_candidate'])
  assert.equal(result.questions[1].origin, 'people_also_search')
  assert.ok(result.warnings.some(text => text.includes('People Also Ask')))
})

test('malformed measurements and empty exports fail instead of producing apparently usable research', () => {
  for (const value of [-1, NaN, Infinity, '880']) {
    const data = exportOf(); data.import.demand[0].volume = value
    assert.throws(() => normalizeMarket(data, options), /Invalid volume/)
  }
  const dated = exportOf(); dated.import.demand[0].measuredAt = 'yesterday'
  assert.throws(() => normalizeMarket(dated, options), /ISO date/)
  assert.throws(() => normalizeMarket({ country: 'BG', language: 'bg', import: {} }, options), /no demand/)
})

test('normalization copies only editorial evidence and does not mutate the private source', () => {
  const input = exportOf(); input.collectRuns = [{ startedBy: 'private-user', error: 'internal connection details' }]
  input.import.demand[0].internalNote = 'private-note'
  const before = JSON.stringify(input)
  const output = JSON.stringify(normalizeMarket(input, options))
  assert.equal(JSON.stringify(input), before)
  assert.ok(!output.includes('private-user') && !output.includes('private-note') && !output.includes('connection details'))
})

test('SERP evidence retains the observed date and never invents a device or page type', () => {
  const input = exportOf()
  input.import.serpSnapshots = [{ norm: 'example', measuredOn: '2026-09-03', items: [{ url: 'https://example.test/category', title: 'Example', position: 1 }] }]
  const result = normalizeMarket(input, options)
  assert.equal(result.serp[0].measuredAt, '2026-09-03')
  assert.equal(result.serp[0].device, null)
  assert.equal(result.serp[0].items[0].pageType, null)
})

test('file import refuses overwrite, leaving both original export and previous editorial data intact', () => {
  const temp = mkdtempSync(join(tmpdir(), 'seo-market-'))
  try {
    const input = join(temp, 'source.json'), output = join(temp, 'market.json')
    const original = JSON.stringify(exportOf()); writeFileSync(input, original)
    const result = importMarket({ ...options, input, output })
    assert.equal(result.questionCandidates, 1)
    const previous = readFileSync(output, 'utf8')
    assert.throws(() => importMarket({ ...options, input, output }), /EEXIST/)
    assert.equal(readFileSync(output, 'utf8'), previous)
    assert.equal(readFileSync(input, 'utf8'), original)
  } finally { rmSync(temp, { recursive: true, force: true }) }
})
