#!/usr/bin/env node
/**
 * Частоты запросов DataForSEO (Google Ads search volume) — когда есть ключ.
 *
 *   DATAFORSEO_LOGIN=… DATAFORSEO_PASSWORD=… \
 *   node volumes.mjs --location 2642 --language ro --keywords phrases.txt --out vol-ro.json
 *
 * Ключ — только из окружения или файла вне git (--env <файл> со строками
 * DATAFORSEO_LOGIN= и DATAFORSEO_PASSWORD=). Один вызов — до 1000 фраз;
 * цена — по прайсу DataForSEO в день замера, трата — решение владельца.
 * Коды мест: Румыния 2642, Венгрия 2348, Болгария 2100.
 * Ноль у CBD может значить запрет рекламы, а не отсутствие спроса.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const ENDPOINT = 'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live'

export function request(keywords, { location, language }) {
  return [{ keywords: keywords.slice(0, 1000), location_code: Number(location), language_code: language }]
}

/** Ответ → строки: фраза, частота (null, если не мерили), CPC, помесячно. */
export function parseVolumes(body, measuredAt) {
  const d = typeof body === 'string' ? JSON.parse(body) : body
  if (d.status_code !== 20000) throw new Error(`DataForSEO: ${d.status_code} ${d.status_message}`)
  const task = d.tasks?.[0]
  if (!task || task.status_code !== 20000) throw new Error(`DataForSEO task: ${task?.status_code} ${task?.status_message}`)
  return (task.result ?? []).map((r) => ({
    phrase: r.keyword,
    volume: Number.isFinite(r.search_volume) ? r.search_volume : null,
    cpc: Number.isFinite(r.cpc) ? r.cpc : null,
    adsCompetition: r.competition ?? null,
    monthly: r.monthly_searches ?? [],
    origin: 'VOL',
    measuredAt,
  }))
}

function readEnv(file) {
  const env = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null }
  const location = arg('--location'), language = arg('--language'), list = arg('--keywords'), out = arg('--out')
  if (!location || !language || !list || !out) { console.error('нужны --location, --language, --keywords и --out'); process.exit(2) }
  if (existsSync(out)) { console.error(`${out} уже есть — старый замер не перезаписывается`); process.exit(2) }
  const env = { ...(arg('--env') ? readEnv(arg('--env')) : {}), ...process.env }
  const login = env.DATAFORSEO_LOGIN, password = env.DATAFORSEO_PASSWORD
  if (!login || !password) {
    console.error('нет ключа DataForSEO (DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD). Частоты не сняты: бриф держит origin AC.')
    process.exit(3)
  }
  const keywords = [...new Set(readFileSync(list, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean))]
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { authorization: `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`, 'content-type': 'application/json' },
    body: JSON.stringify(request(keywords, { location, language })),
  })
  const at = new Date().toISOString().slice(0, 10)
  const rows = parseVolumes(await r.text(), at)
  writeFileSync(out, JSON.stringify({ origin: 'VOL', source: 'DataForSEO google_ads/search_volume', location: Number(location), language, measuredAt: at, rows }, null, 2) + '\n')
  console.log(`${rows.length} фраз, с частотой ${rows.filter((x) => x.volume !== null).length} → ${out}`)
}
