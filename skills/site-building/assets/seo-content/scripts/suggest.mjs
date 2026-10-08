#!/usr/bin/env node
/**
 * Подсказки Google по затравкам — бесплатный первый слой досье рынка.
 *
 *   node suggest.mjs --hl ro --gl ro --seeds seeds.txt [--expand "ulei cbd,cbd"] --out ac-ro.json
 *   node suggest.mjs --hl hu --gl ro --seed "cbd olaj" --out ac-hu-ro.json
 *
 * Открытая точка подсказок, одна фраза в секунду; при отказе — пауза и
 * продолжение, без обхода защиты. Выход: сырьё с датой и сводка
 * «фраза → затравка, место». Подсказка доказывает, что фразу набирают;
 * объёма не даёт (origin: AC).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const ENDPOINT = 'https://suggestqueries.google.com/complete/search'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Разбор ответа client=firefox: ["фраза", ["подсказка", …]]. */
export function parseSuggest(body) {
  const d = JSON.parse(body)
  return Array.isArray(d) && Array.isArray(d[1]) ? d[1].map(String) : []
}

/** Сводка: каждая уникальная фраза — с лучшим местом и затравками. */
export function summarize(raw) {
  const by = new Map()
  for (const { seed, suggestions } of raw) {
    suggestions.forEach((phrase, rank) => {
      const k = phrase.toLowerCase()
      const e = by.get(k) ?? { phrase, best: rank + 1, seeds: [] }
      e.best = Math.min(e.best, rank + 1)
      if (!e.seeds.includes(seed)) e.seeds.push(seed)
      by.set(k, e)
    })
  }
  return [...by.values()].sort((a, b) => b.seeds.length - a.seeds.length || a.best - b.best)
}

export async function fetchSuggest(q, { hl, gl, fetcher = fetch, tries = 3 } = {}) {
  const url = `${ENDPOINT}?client=firefox&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}&q=${encodeURIComponent(q)}`
  for (let i = 0; i < tries; i++) {
    const r = await fetcher(url, { headers: { 'user-agent': 'Mozilla/5.0 seo-content/suggest' } })
    if (r.ok) return parseSuggest(await r.text())
    await sleep(5000 * (i + 1))
  }
  return null
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null }
  const hl = arg('--hl'), gl = arg('--gl'), out = arg('--out')
  if (!hl || !gl || !out) { console.error('нужны --hl, --gl и --out'); process.exit(2) }
  if (existsSync(out)) { console.error(`${out} уже есть — новый файл, старый не перезаписывается`); process.exit(2) }
  const seeds = [
    ...(arg('--seeds') ? readFileSync(arg('--seeds'), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')) : []),
    ...(arg('--seed') ? [arg('--seed')] : []),
  ]
  for (const e of (arg('--expand') ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    for (const ch of 'abcdefghijklmnopqrstuvwxyz') seeds.push(`${e} ${ch}`)
  }
  const raw = []
  for (const seed of [...new Set(seeds)]) {
    const suggestions = await fetchSuggest(seed, { hl, gl })
    raw.push({ seed, suggestions: suggestions ?? [], error: suggestions === null ? 'blocked' : undefined })
    process.stdout.write(`${seed}: ${suggestions ? suggestions.length : 'отказ'}\n`)
    await sleep(1000)
  }
  const doc = { origin: 'AC', source: 'Google Autocomplete', hl, gl, collectedAt: new Date().toISOString(), seeds: raw.length, raw, phrases: summarize(raw) }
  writeFileSync(out, JSON.stringify(doc, null, 2) + '\n')
  console.log(`\n${raw.length} затравок · ${doc.phrases.length} фраз → ${out}`)
}
