#!/usr/bin/env node
/**
 * Проверка текста страниц до сборки — форма, запрос покупателя, запреты.
 *
 *   node lint-copy.mjs --pages pages.json [--profile profile.json] [--json]
 *   import { lintPages } from './lint-copy.mjs'
 *
 * Страница — объект формата assets/page-copy.md. Семьи — таблица в SKILL.md.
 * Без зависимостей: ставится и в чужой проект.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLAIMS = join(HERE, '..', 'assets', 'claims')

/** Нижний регистр без диакритики; ș/ş и ț/ţ сводятся к s/t. */
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const words = (s) => norm(s).replace(/(\d)\s+%/g, '$1%').match(/[\p{L}\p{N}%]+/gu) ?? []
const stem = (w) => (w.length <= 4 ? w : w.slice(0, Math.max(4, w.length - 2)))
const sentences = (s) => String(s ?? '').split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)

/** Есть ли фраза в тексте: все её слова (по основе) — в окне длиной фразы + 2. */
export function hasPhrase(text, phrase) {
  const t = words(text)
  const p = words(phrase).map(stem)
  if (!p.length) return false
  const span = p.length + 2
  for (let i = 0; i < t.length; i++) {
    const win = t.slice(i, i + span)
    if (p.every((s) => win.some((w) => w.startsWith(s)))) return true
  }
  return false
}

const lexicons = new Map()
function lexicon(lang) {
  if (!lexicons.has(lang)) {
    const f = join(CLAIMS, `${lang}.json`)
    const d = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { condition: [], conditionAllow: [], hedge: [], rules: [] }
    lexicons.set(lang, {
      condition: d.condition.map((c) => new RegExp(`(^|[^\\p{L}])${c}`, 'u')),
      allow: (d.conditionAllow ?? []).map(norm),
      hedge: d.hedge.map((h) => new RegExp(h)),
      rules: d.rules.map((r) => ({ ...r, re: r.patterns.map((p) => new RegExp(p)) })),
    })
  }
  return lexicons.get(lang)
}

const DEFAULT_PROFILE = { faq: { home: [6, 8], category: [5, 10], hub: [5, 10], slice: [3, 10], product: [5, 8], guide: [3, 10], faq: [10, 30] } }
const GENERIC = new Set(['descriere', 'informatii', 'detalii', 'description', 'information', 'details', 'leiras', 'informacio', 'reszletek'])
const ANSWER_DODGE = /^(depinde|it depends|attol fugg|ez attol fugg)\b/
const CURRENCY = /(€|\$|\beur\b|\blei\b|\bron\b|\bft\b|\bhuf\b)/
const SELLING = new Set(['home', 'category', 'hub', 'product', 'slice', 'faq', 'trust'])

function heads(p) {
  return [
    ['title', p.title], ['heading', p.heading], ['name', p.name], ['caption', p.caption], ['faq.title', p.faq?.title],
    ...(p.sections ?? []).map((s, i) => [`sections[${i}].heading`, s.heading]),
    ...(p.faq?.items ?? []).map((it, i) => [`faq[${i}].q`, it.q]),
  ].filter(([, v]) => v)
}
function bodies(p) {
  return [
    ['description', p.description], ['lede', p.lede],
    ...(p.sections ?? []).flatMap((s, i) => s.paragraphs.map((t, j) => [`sections[${i}].p${j}`, t])),
    ...(p.faq?.items ?? []).map((it, i) => [`faq[${i}].a`, it.a]),
  ].filter(([, v]) => v)
}
const allText = (p) => [...heads(p), ...bodies(p)].map(([, v]) => v).join(' \n ')
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); let n = 0; for (const x of A) if (B.has(x)) n++; return A.size + B.size ? n / (A.size + B.size - n) : 0 }
const shingles = (s, k = 5) => { const w = words(s); const out = []; for (let i = 0; i + k <= w.length; i++) out.push(w.slice(i, i + k).join(' ')); return out }

/** Находки одной страницы и пар страниц одного языка. */
export function lintPages(pages, { profile = DEFAULT_PROFILE } = {}) {
  const out = []
  const add = (p, family, level, field, message) => out.push({ id: p.id, lang: p.lang, family, level, field, message })
  for (const p of pages) {
    const lex = lexicon(p.lang)
    const selling = (p.level ?? 'A') === 'A' && SELLING.has(p.type)
    // fields
    for (const f of ['title', 'description', 'heading', 'lede']) if (!p[f]) add(p, 'fields', 'fail', f, 'поле пустое')
    if (!p.query?.primary) add(p, 'fields', 'fail', 'query.primary', 'нет главного запроса')
    if (!p.query?.origin) add(p, 'fields', 'warn', 'query.origin', 'у запроса нет происхождения')
    // primary
    const q = p.query?.primary
    if (q) {
      if (!hasPhrase(p.title, q) && !hasPhrase(p.heading, q)) add(p, 'primary', 'fail', 'title', `главного запроса «${q}» нет ни в title, ни в H1`)
      if (!hasPhrase(sentences(p.lede).slice(0, 2).join(' '), q)) add(p, 'primary', 'fail', 'lede', `главного запроса «${q}» нет в первых предложениях над сеткой`)
      const sub = [...(p.sections ?? []).map((s) => s.heading), ...(p.faq?.items ?? []).map((it) => it.q)]
      if (sub.length && !sub.some((h) => hasPhrase(h, q))) add(p, 'primary', 'warn', 'sections', `главного запроса «${q}» нет ни в подзаголовке, ни в вопросе`)
    }
    // secondary
    const sec = p.query?.secondary ?? []
    if (sec.length) {
      const text = allText(p)
      const hit = sec.filter((s) => hasPhrase(text, s))
      if (hit.length < Math.ceil(sec.length / 2)) add(p, 'secondary', 'warn', 'query.secondary', `в тексте ${hit.length} из ${sec.length} вторичных запросов; нет: ${sec.filter((s) => !hit.includes(s)).join(', ')}`)
    }
    // echo
    const trio = [['description', p.description], ['lede', p.lede], ['caption', p.caption]].filter(([, v]) => v)
    for (let i = 0; i < trio.length; i++) for (let j = i + 1; j < trio.length; j++) {
      if (norm(trio[i][1]) === norm(trio[j][1]) || jaccard(words(trio[i][1]), words(trio[j][1])) > 0.8) add(p, 'echo', 'fail', `${trio[i][0]}/${trio[j][0]}`, 'два места — один текст')
    }
    // length
    if (p.title && (p.title.length < 30 || p.title.length > 65)) add(p, 'length', 'warn', 'title', `title ${p.title.length} знаков (ориентир 30–65)`)
    if (p.description && (p.description.length < 110 || p.description.length > 165)) add(p, 'length', 'warn', 'description', `description ${p.description.length} знаков (ориентир 110–165)`)
    // claims
    const isHead = new Set(heads(p).map(([k]) => k))
    for (const [field, text] of [...heads(p), ...bodies(p)]) {
      const t = norm(text)
      for (const r of lex.rules) {
        if (!r.re.some((re) => re.test(t))) continue
        const level = r.level === 'fail' ? 'fail' : (isHead.has(field) && selling ? 'fail' : 'warn')
        add(p, 'claims', level, field, `${r.id}: «${text.slice(0, 80)}» → ${r.rewrite}`)
      }
    }
    // condition
    if (selling) {
      for (const [field, text] of heads(p)) {
        let t = norm(text)
        for (const a of lex.allow) t = t.replaceAll(a, ' ')
        const c = lex.condition.find((re) => re.test(t))
        if (c) add(p, 'condition', 'fail', field, `состояние здоровья на продающей странице: «${text}»`)
      }
    }
    // hedge
    for (const [field, text] of [['description', p.description], ['lede', p.lede], ['caption', p.caption]]) {
      if (text && lex.hedge.some((re) => re.test(norm(text)))) add(p, 'hedge', 'fail', field, `оговорка в сниппете или над сеткой: «${text.slice(0, 80)}»`)
    }
    const body = bodies(p).filter(([k]) => k.startsWith('sections') || k.startsWith('faq')).flatMap(([, v]) => sentences(v))
    const hedged = body.filter((s) => lex.hedge.some((re) => re.test(norm(s)))).length
    if (body.length && hedged / body.length > 0.15) add(p, 'hedge', 'warn', 'sections', `оговорок ${hedged} из ${body.length} предложений`)
    // currency
    for (const [field, text] of [...heads(p), ...bodies(p)]) if (CURRENCY.test(norm(text))) add(p, 'currency', 'fail', field, 'литерал валюты — цена и пороги приходят из данных')
    // faq
    const items = p.faq?.items ?? []
    const range = profile.faq?.[p.type]
    if (range && p.type !== 'faq' && (items.length < range[0] || items.length > range[1])) add(p, 'faq', 'fail', 'faq', `вопросов ${items.length}, норма ${range[0]}–${range[1]}`)
    items.forEach((it, i) => {
      if (!/\?\s*$/.test(it.q)) add(p, 'faq', 'warn', `faq[${i}].q`, 'вопрос без «?»')
      if (ANSWER_DODGE.test(norm(it.a))) add(p, 'faq', 'fail', `faq[${i}].a`, 'ответ начинается с «зависит» — первое предложение должно отвечать')
      if (words(it.a).length > 90) add(p, 'faq', 'warn', `faq[${i}].a`, `ответ ${words(it.a).length} слов (ориентир ≤ 80)`)
    })
    // generic
    for (const s of p.sections ?? []) {
      const h = norm(s.heading)
      if (GENERIC.has(h) || h === norm(p.heading)) add(p, 'generic', 'warn', 'sections', `подзаголовок «${s.heading}» ничего не называет`)
    }
  }
  // dup — пары страниц одного языка
  for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
    const a = pages[i], b = pages[j]
    if (a.lang !== b.lang) continue
    const sim = jaccard(shingles(allText(a)), shingles(allText(b)))
    if (sim > 0.5) add(a, 'dup', 'warn', '*', `похожа на ${b.id} (${sim.toFixed(2)})`)
  }
  return out
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null }
  const file = arg('--pages')
  if (!file) { console.error('нужен --pages <файл.json>'); process.exit(2) }
  const pages = JSON.parse(readFileSync(file, 'utf8'))
  const prof = arg('--profile') ? JSON.parse(readFileSync(arg('--profile'), 'utf8')) : DEFAULT_PROFILE
  const found = lintPages(pages, { profile: prof })
  if (process.argv.includes('--json')) console.log(JSON.stringify(found, null, 2))
  else for (const f of found) console.log(`${f.level.padEnd(4)} ${f.family.padEnd(9)} ${f.lang} ${f.id} ${f.field}: ${f.message}`)
  const fails = found.filter((f) => f.level === 'fail').length
  console.log(`\n${pages.length} страниц · fail ${fails} · warn ${found.length - fails}`)
  process.exit(fails ? 1 : 0)
}
