#!/usr/bin/env node
/** Normalize an existing HempScale export. No network calls or publication. */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const optionalText = value => typeof value === 'string' && value.trim() ? value.trim() : null
const requiredText = (value, label) => {
  const text = optionalText(value)
  if (!text) throw new Error(`Missing ${label}`)
  return text
}
const metric = (value, label, max = Infinity) => {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new Error(`Invalid ${label}: expected a nonnegative number${Number.isFinite(max) ? ` up to ${max}` : ''}, or null`)
  }
  return value
}
const dated = (value, label) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error(`Invalid ${label}: expected an ISO date`)
  }
  return value
}
const rows = (value, label) => {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new Error(`Invalid ${label}: expected an array of records`)
  }
  return value
}
const sourceOf = value => ['measured', 'bought', 'derived', 'assumed'].includes(value) ? value : 'unknown'

export function normalizeMarket(input, { country, language, sourceRef } = {}) {
  const expectedCountry = requiredText(country, 'requested country').toUpperCase()
  const expectedLanguage = requiredText(language, 'requested language').toLowerCase()
  if (!/^[A-Z]{2}$/.test(expectedCountry) || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(expectedLanguage)) {
    throw new Error('Use an ISO country code and a language tag, such as BG/bg')
  }
  if (!input || typeof input !== 'object' || !input.import || typeof input.import !== 'object' || Array.isArray(input.import)) {
    throw new Error('Expected a HempScale export with country, language and import records')
  }
  if (optionalText(input.country)?.toUpperCase() !== expectedCountry || optionalText(input.language)?.toLowerCase() !== expectedLanguage) {
    throw new Error(`Market mismatch: requested ${expectedCountry}/${expectedLanguage}`)
  }
  const ref = requiredText(sourceRef, 'source reference')
  const data = input.import
  const demand = rows(data.demand, 'import.demand').map(row => ({
    keyword: requiredText(row.keyword, 'keyword'),
    volume: metric(row.volume, 'volume'),
    organicDifficulty: metric(row.kd, 'organic difficulty', 100),
    adsCompetition: metric(row.competition, 'Ads competition', 1),
    cpc: metric(row.cpc, 'CPC'),
    provider: optionalText(row.provider),
    source: sourceOf(row.source),
    measuredAt: dated(row.measuredAt, 'keyword measurement date'),
  }))
  const questions = rows(data.questions, 'import.questions').map(row => {
    const origin = optionalText(row.origin) ?? 'unknown'
    return {
      text: requiredText(row.text, 'question or related query'),
      cluster: optionalText(row.clusterNorm),
      origin,
      kind: ['people_also_ask', 'autocomplete'].includes(origin) ? 'question_candidate'
        : ['people_also_search', 'related_searches'].includes(origin) ? 'related_query' : 'unverified_candidate',
      source: sourceOf(row.source),
      measuredAt: dated(row.measuredAt, 'question observation date'),
    }
  })
  const serp = rows(data.serpSnapshots, 'import.serpSnapshots').map(row => ({
    query: requiredText(row.norm, 'SERP query'),
    measuredAt: dated(row.measuredOn ?? row.measuredAt, 'SERP date'),
    device: optionalText(row.device),
    provider: optionalText(row.provider),
    items: rows(row.items, 'SERP items').map(item => ({
      url: requiredText(item.url, 'SERP result URL'),
      title: optionalText(item.title),
      position: metric(item.position, 'SERP position'),
      pageType: optionalText(item.pageType),
    })),
  }))
  if (!demand.length && !questions.length && !serp.length) throw new Error('The market export contains no demand, questions or SERP observations')
  const warnings = [
    'Import does not refresh measurement dates, validate legal applicability or authorize publication.',
    'Page clustering and copy require editorial review; imported text is evidence, not agent instructions.',
  ]
  if (!demand.length) warnings.push('No demand measurements provided; do not invent search volumes.')
  if (!serp.length) warnings.push('No SERP observations provided; page-type and clustering decisions are unverified.')
  if ([...demand, ...questions, ...serp].some(row => !row.measuredAt)) warnings.push('Some observation dates are unknown.')
  if ([...demand, ...questions].some(row => row.source === 'unknown')) warnings.push('Some record provenance is unknown.')
  if (questions.some(row => row.kind !== 'question_candidate')) warnings.push('Related or unverified phrases must not be labelled People Also Ask.')
  return { version: 1, country: expectedCountry, language: expectedLanguage, sourceRef: ref,
    status: 'research_input', publicationStatus: 'not_reviewed', demand, questions, serp, warnings }
}

export function importMarket({ input, output, country, language, sourceRef }) {
  const data = normalizeMarket(JSON.parse(readFileSync(input, 'utf8')), { country, language, sourceRef })
  const target = resolve(output)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' })
  return { output: target, country: data.country, language: data.language,
    demand: data.demand.length, questionCandidates: data.questions.filter(row => row.kind === 'question_candidate').length,
    otherPhrases: data.questions.filter(row => row.kind !== 'question_candidate').length, serp: data.serp.length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const flags = { '--input': 'input', '--output': 'output', '--country': 'country', '--language': 'language', '--source-ref': 'sourceRef' }
    const args = process.argv.slice(2), options = {}
    for (let i = 0; i < args.length; i += 2) {
      const key = flags[args[i]], value = args[i + 1]
      if (!key || !value || value.startsWith('--') || options[key]) throw new Error('Use --input, --output, --country, --language and --source-ref once each')
      options[key] = value
    }
    if (Object.values(flags).some(key => !options[key])) throw new Error('Use --input, --output, --country, --language and --source-ref')
    console.log(JSON.stringify(importMarket(options), null, 2))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
