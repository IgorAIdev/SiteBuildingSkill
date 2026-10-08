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

/* ── lint-copy, suggest, volumes (переписанный навык, 08.10.2026) ─────────── */
import { lintPages, hasPhrase } from '../skills/site-building/assets/seo-content/scripts/lint-copy.mjs'
import { parseSuggest, summarize } from '../skills/site-building/assets/seo-content/scripts/suggest.mjs'
import { parseVolumes, request } from '../skills/site-building/assets/seo-content/scripts/volumes.mjs'

const good = () => ({
  id: 'category:oil', lang: 'ro', type: 'category', level: 'A',
  query: { primary: 'ulei cbd', secondary: ['ulei de canabis', 'ulei cbd full spectrum'], origin: 'AC 2026-10-08' },
  title: 'Ulei CBD (ulei de canabis): full spectrum, broad și izolat | CBDin',
  description: 'Ulei CBD și ulei de canabis în mai multe concentrații: full spectrum, broad și izolat, cu miligramele pe picătură scrise la fiecare produs.',
  heading: 'Ulei CBD (ulei de canabis)',
  lede: 'Uleiul CBD se alege după trei cifre: procentul, miligramele din flacon și miligramele dintr-o picătură.',
  caption: 'Full spectrum, broad și izolat, în flacoane cu pipetă.',
  sections: [{ heading: 'Ce concentrație de ulei CBD să alegeți?', paragraphs: ['Un ulei de 10 % are 100 mg de CBD în fiecare mililitru.'] }],
  faq: { title: 'Întrebări despre uleiul CBD', items: Array.from({ length: 5 }, (_, i) => ({ q: `Întrebarea ${i + 1} despre ulei CBD?`, a: `Da. Răspunsul ${i + 1} începe cu răspunsul.` })) },
})
const families = (pages) => lintPages(pages).filter((f) => f.level === 'fail').map((f) => f.family)

test('lint-copy passes a page that carries the buyer query, facts and distinct snippet texts', () => {
  assert.deepEqual(families([good()]), [])
  assert.ok(hasPhrase('Uleiurile CBD de la noi', 'ulei cbd'), 'inflected forms count as the query')
})

test('lint-copy fails the defects of the 06.10 copy: no query in head, echo, hedge, condition in a heading, currency literal', () => {
  const p = good()
  p.title = 'Uleiuri — concentrații și volume | CBDin'; p.heading = 'Uleiuri'
  assert.ok(families([p]).includes('primary'))
  const e = good(); e.description = e.lede
  assert.ok(families([e]).includes('echo'))
  const h = good(); h.lede = 'Ulei CBD pentru seară, fără a presupune un beneficiu pentru somn.'
  assert.ok(families([h]).includes('hedge'))
  const c = good(); c.faq.items[0].q = 'Ajută uleiul CBD la somn?'
  assert.ok(families([c]).includes('condition'))
  const m = good(); m.sections[0].paragraphs[0] = 'Livrare gratuită de la 100 €.'
  assert.ok(families([m]).includes('currency'))
})

test('lint-copy: a forbidden claim fails even when negated on a selling page; fix-level claims fail only in heads', () => {
  const p = good(); p.sections[0].paragraphs.push('Nu spunem că ameliorează durerile.')
  assert.ok(families([p]).includes('claims'))
  const q = good(); q.sections[0].paragraphs.push('Mod de utilizare: sublingual, conform etichetei.')
  assert.ok(!families([q]).includes('claims'), 'fix-level in body is a warning')
  const r = good(); r.sections[0].heading = 'Ulei CBD sublingual'
  assert.ok(families([r]).includes('claims'))
})

test('lint-copy counts FAQ by the project profile and rejects a dodge as the first sentence', () => {
  const p = good(); p.faq.items = p.faq.items.slice(0, 3)
  assert.ok(families([p]).includes('faq'))
  const d = good(); d.faq.items[0].a = 'Depinde de produs.'
  assert.ok(families([d]).includes('faq'))
  assert.deepEqual(lintPages([good()], { profile: { faq: { category: [3, 4] } } }).filter((f) => f.family === 'faq' && f.level === 'fail').length, 1)
})

test('suggest parses the autocomplete answer and ranks phrases by seeds and place', () => {
  assert.deepEqual(parseSuggest('["ulei cbd",["ulei cbd pret","ulei cbd caini"]]'), ['ulei cbd pret', 'ulei cbd caini'])
  const s = summarize([{ seed: 'ulei cbd', suggestions: ['ulei cbd pret', 'ulei cbd caini'] }, { seed: 'cbd', suggestions: ['ulei cbd pret'] }])
  assert.equal(s[0].phrase, 'ulei cbd pret'); assert.equal(s[0].seeds.length, 2); assert.equal(s[0].best, 1)
})

test('volumes builds a DataForSEO request and keeps unmeasured volume as null', () => {
  assert.deepEqual(request(['ulei cbd'], { location: '2642', language: 'ro' }), [{ keywords: ['ulei cbd'], location_code: 2642, language_code: 'ro' }])
  const rows = parseVolumes({ status_code: 20000, tasks: [{ status_code: 20000, result: [{ keyword: 'ulei cbd', search_volume: 2400, cpc: 0.4, competition: 'LOW', monthly_searches: [] }, { keyword: 'x', search_volume: null }] }] }, '2026-10-08')
  assert.equal(rows[0].volume, 2400); assert.equal(rows[1].volume, null); assert.equal(rows[0].origin, 'VOL')
  assert.throws(() => parseVolumes({ status_code: 40100, status_message: 'auth' }), /DataForSEO/)
})

test('lint-copy: a section name the owner chose like the market is a label, not a claim; the text around still is checked', () => {
  const p = good(); p.type = 'hub'; p.name = 'Somn'; p.heading = 'Somn'; p.title = 'Somn: uleiuri CBD, capsule și ceai pentru seară'
  p.query.primary = 'cbd somn'; p.lede = 'Colecția Somn adună uleiuri CBD, capsule și ceai. Comparați CBD-ul pe porție.'
  assert.ok(families([p]).includes('condition'), 'without the owner decision the name is a condition')
  p.nameIsLabel = 'owner 08.10.2026'
  assert.ok(!families([p]).includes('condition'))
  p.faq.items[0].q = 'Ajută uleiul CBD la somn?'
  assert.ok(families([p]).includes('condition'), 'the label does not cover a question about the condition')
})
