import { test } from 'node:test'
import assert from 'node:assert/strict'
import { badLinks, docView, fill, runsOf, TOC_MIN, unknownMarks } from '../lib/doc-view.ts'
import { COMPANY } from '../lib/company.ts'
import { LOCALES } from '../lib/locale.ts'
import DOCS from '../lib/docs.json' with { type: 'json' }

type L = Record<string, string>
type Raw = { slug: string; updated?: string; title: L; summary: L; sections: { id: string; heading: L; body: L; list?: Record<string, string[]>; table?: { head: Record<string, string[]>; rows: Record<string, string[][]> }; form?: string }[]; faq?: { q: L; a: L }[]; table?: string }
const RAW = DOCS as Raw[]

/* Документы магазина (И748): реквизиты — подстановкой из одного места, ссылки —
   на страницы, которые есть, у трёх языков одно устройство. */
test('every link in the documents leads somewhere and every mark is a known shop fact', () => {
  const slugs = new Set(RAW.map((d) => d.slug))
  for (const d of RAW) {
    const texts: string[] = []
    for (const lang of LOCALES) {
      texts.push(d.title[lang], d.summary[lang])
      for (const s of d.sections) {
        texts.push(s.heading[lang], s.body[lang], ...(s.list?.[lang] ?? []), ...(s.table?.head[lang] ?? []), ...(s.table?.rows[lang] ?? []).flat())
      }
      for (const f of d.faq ?? []) texts.push(f.q[lang], f.a[lang])
    }
    for (const x of texts) {
      assert.equal(typeof x, 'string', `${d.slug}: пустое место у одного из языков`)
      assert.deepEqual(badLinks(x), [], `${d.slug}: ссылка в никуда`)
      assert.deepEqual(unknownMarks(x), [], `${d.slug}: незнакомый реквизит`)
      for (const m of x.matchAll(/\]\(doc:([a-z0-9-]+)\)/g)) assert.ok(slugs.has(m[1]), `${d.slug}: ссылка на документ «${m[1]}», которого нет`)
      assert.doesNotMatch(x, /[şţŞŢ]/, `${d.slug}: седиль вместо запятой снизу (ș, ț)`)
    }
  }
})

test('the three languages of a document have the same shape', () => {
  for (const d of RAW) {
    for (const s of d.sections) {
      assert.match(s.id, /^[a-z0-9-]+$/, `${d.slug}: якорь раздела`)
      const paras = (lang: string) => s.body[lang].split(/\n\s*\n/).length
      for (const lang of LOCALES) {
        assert.equal(s.list?.[lang]?.length, s.list?.[LOCALES[0]]?.length, `${d.slug}/${s.id}: длина списка у ${lang}`)
        assert.equal(paras(lang), paras(LOCALES[0]), `${d.slug}/${s.id}: абзацев у ${lang}`)
        if (s.table) {
          const width = s.table.head[lang].length
          assert.ok(s.table.rows[lang].every((row) => row.length === width), `${d.slug}/${s.id}: строка таблицы не той ширины у ${lang}`)
          assert.equal(s.table.rows[lang].length, s.table.rows[LOCALES[0]].length, `${d.slug}/${s.id}: строк таблицы у ${lang}`)
        }
      }
    }
    assert.equal(new Set(d.sections.map((s) => s.id)).size, d.sections.length, `${d.slug}: якоря разделов повторяются`)
  }
})

/* Румынский рынок (И748): обязательные страницы есть, отказ от договора —
   кнопкой на странице возврата. */
test('the Romanian shop has its mandatory documents and the withdrawal button', () => {
  const slugs = RAW.map((d) => d.slug)
  for (const need of ['termeni', 'livrare-si-plata', 'retur', 'garantie', 'confidentialitate', 'cookie-uri', 'contact']) assert.ok(slugs.includes(need), `нет документа «${need}»`)
  const retur = RAW.find((d) => d.slug === 'retur')!
  assert.ok(retur.sections.some((s) => s.form === 'withdrawal'), 'на странице возврата нет кнопки отказа')
  assert.ok(RAW.find((d) => d.slug === 'termeni')!.sections.some((s) => /reclamatiisal\.anpc\.ro/.test(s.body.ro)), 'в условиях нет SAL ANPC')
  assert.ok(!JSON.stringify(RAW).includes('ec.europa.eu/consumers/odr'), 'ссылка на закрытую платформу ODR')
})

test('marks are filled from the shop data, links become hrefs, long documents get a table of contents', () => {
  assert.equal(fill('{company.name}, CUI {company.cui}'), `${COMPANY.name}, CUI ${COMPANY.cui}`)
  assert.deepEqual(runsOf('ro', 'Vezi [retur](doc:retur) sau [ANPC](https://reclamatiisal.anpc.ro).'), [
    { text: 'Vezi ' }, { text: 'retur', href: '/ro/info/retur', external: false }, { text: ' sau ' },
    { text: 'ANPC', href: 'https://reclamatiisal.anpc.ro', external: true }, { text: '.' },
  ])
  assert.deepEqual(runsOf('en', '[here](nowhere)'), [{ text: 'here' }], 'незнакомая цель — словами без ссылки')
  const sections = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, heading: `H${i}`, body: 'a\n\nb' }))
  assert.equal(docView('ro', { title: 'T', summary: 'S', sections: sections(TOC_MIN - 1) }).toc, null, 'короткому — без оглавления')
  const long = docView('ro', { title: 'T', summary: 'S', updated: '2026-10-04', sections: sections(TOC_MIN) })
  assert.equal(long.toc?.items.length, TOC_MIN)
  assert.equal(long.sections[0].paras.length, 2, 'абзацы — через пустую строку')
  assert.match(long.updated ?? '', /2026/)
  const lead = docView('ro', { title: 'T', summary: 'S', sections: sections(3) }, { id: 'doc-table', heading: 'Metode' })
  assert.equal(lead.toc?.items[0].id, 'doc-table', 'таблица способов — первым пунктом оглавления')
})

/* Статьи блога — тот же документ (И748): ссылки в тексте ведут на существующее. */
test('every link in the blog posts leads somewhere', async () => {
  type Ls = Record<string, string[]>
  const blog = (await import('../lib/blog.json', { with: { type: 'json' } })).default as { slug: string; topic?: string; tldr?: L; sections: { heading: L; body: L; list?: Ls; note?: L }[]; faq: { q: L; a: L }[]; sources?: { url: string }[] }[]
  const topics = new Set(((await import('../lib/blog-meta.json', { with: { type: 'json' } })).default as { topics: { slug: string }[] }).topics.map((x) => x.slug))
  const slugs = new Set(RAW.map((d) => d.slug))
  const posts = new Set(blog.map((b) => b.slug))
  for (const post of blog) {
    if (post.topic) assert.ok(topics.has(post.topic), `${post.slug}: рубрики «${post.topic}» нет`)
    for (const src of post.sources ?? []) assert.match(src.url, /^https:\/\//, `${post.slug}: источник не адресом https`)
    for (const lang of LOCALES) {
      for (const x of [post.tldr?.[lang] ?? '', ...post.sections.flatMap((s) => [s.heading[lang], s.body[lang], ...(s.list?.[lang] ?? []), s.note?.[lang] ?? '']), ...post.faq.flatMap((f) => [f.q[lang], f.a[lang]])]) {
        assert.deepEqual(badLinks(x), [], `${post.slug}: ссылка в никуда`)
        for (const m of x.matchAll(/\]\(doc:([a-z0-9-]+)\)/g)) assert.ok(slugs.has(m[1]), `${post.slug}: документа «${m[1]}» нет`)
        for (const m of x.matchAll(/\]\(post:([a-z0-9-]+)\)/g)) assert.ok(posts.has(m[1]), `${post.slug}: статьи «${m[1]}» нет`)
        assert.doesNotMatch(x, /[şţŞŢ]/, `${post.slug}: седиль`)
      }
    }
  }
})
