import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { badLinks, docView, fill, runsOf, TOC_MIN, unknownMarks } from '../lib/doc-view.ts'
import { COMPANY } from '../lib/company.ts'
import { DOC_SLOTS } from '../lib/source/contract.ts'
import { sampleContent } from '../lib/source/sample/content.ts'
import { LOCALES } from '../lib/locale.ts'
import DOCS from '../lib/docs.json' with { type: 'json' }

type L = Record<string, string>
type Raw = { slug: string; updated?: string; numbered?: boolean; title: L; summary: L; sections: { id: string; heading: L; body: L; list?: Record<string, string[]>; table?: { head: Record<string, string[]>; rows: Record<string, string[][]> }; slot?: string; when?: string }[]; faq?: { q: L; a: L }[]; table?: string }
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
    /* Один якорь — дважды только парой «с согласием / без» (`when`, И791): после
       отбора по состоянию реестра якоря уникальны. */
    for (const optional of [false, true]) {
      const shown = d.sections.filter((s) => !s.when || (s.when === 'consent') === optional)
      assert.equal(new Set(shown.map((s) => s.id)).size, shown.length, `${d.slug}: якоря разделов повторяются (optional=${optional})`)
    }
    for (const s of d.sections) if (s.when) assert.ok(['consent', 'no-consent'].includes(s.when), `${d.slug}/${s.id}: when «${s.when}»`)
  }
})

/* Румынский рынок (И748): обязательные страницы есть, отказ от договора —
   кнопкой на странице возврата. */
test('the Romanian shop has its mandatory documents and the withdrawal button', () => {
  const slugs = RAW.map((d) => d.slug)
  for (const need of ['termeni', 'livrare-si-plata', 'retur', 'garantie', 'confidentialitate', 'cookie-uri', 'contact']) assert.ok(slugs.includes(need), `нет документа «${need}»`)
  const retur = RAW.find((d) => d.slug === 'retur')!
  assert.ok(retur.sections.some((s) => s.slot === 'withdrawal'), 'на странице возврата нет кнопки отказа')
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

/* Правовые страницы (И791): каждая — на трёх языках со своими обязательными
   разделами; договорные — с номерами подряд в заголовках и в оглавлении; разделы
   о согласии — по состоянию реестра; вещи сайта в разделах — только из списка. */
const REQUIRED: Record<string, string[]> = {
  termeni: ['vanzator', 'definitii', 'produse', 'comanda', 'cont', 'preturi', 'plata', 'livrare', 'retragere', 'garantie', 'recenzii', 'reclamatii', 'restrictii', 'legea', 'modificari'],
  confidentialitate: ['operator', 'date-si-scopuri', 'sursa', 'destinatari', 'transfer', 'drepturi', 'plangere', 'automat', 'minori', 'securitate', 'cookie'],
  'cookie-uri': ['fara-acord', 'stergere', 'intrebari'],
  retur: ['termen', 'cum', 'buton', 'formular', 'rambursare', 'exceptii', 'defecte'],
  garantie: ['ce-este', 'ce-acopera', 'cum', 'remedii', 'eticheta-ue', 'litigii'],
  'livrare-si-plata': ['unde-livram', 'cost', 'plata'],
  contact: ['cum-ne-contactati', 'firma', 'reclamatii', 'retragere'],
  'despre-noi': ['date-firma'],
  accesibilitate: ['nivel', 'semnalare', 'autoritate'],
}
const NUMBERED = ['termeni', 'confidentialitate', 'cookie-uri', 'retur', 'garantie']
type Sec = Raw['sections'][number]
const inLang = (d: Raw, lang: string, keep: (s: Sec) => boolean = () => true) => ({
  title: d.title[lang], summary: d.summary[lang], numbered: d.numbered,
  sections: d.sections.filter(keep).map((s) => ({ id: s.id, heading: s.heading[lang], body: s.body[lang], slot: s.slot as never, when: s.when as never })),
})

test('every legal page exists in every language with its required sections', async () => {
  for (const [slug, ids] of Object.entries(REQUIRED)) {
    for (const lang of LOCALES) {
      const r = await sampleContent.doc(lang, slug)
      assert.ok(r.ok, `${lang}: нет документа «${slug}»`)
      if (!r.ok) continue
      assert.ok(r.value.title && r.value.summary, `${lang}/${slug}: без имени или строки о нём`)
      for (const id of ids) {
        const s = r.value.sections.find((x) => x.id === id)
        assert.ok(s?.heading && s.body, `${lang}/${slug}: нет раздела «${id}»`)
      }
    }
  }
  const ro = (slug: string, id: string) => RAW.find((d) => d.slug === slug)!.sections.find((s) => s.id === id)!.body.ro
  assert.match(ro('termeni', 'plata'), /Nu percepem nicio taxă în plus pentru metoda de plată aleasă \(OUG 34\/2014\)/, 'условия: без доплаты за способ оплаты')
  /* Номер статьи — только прочитанный в первоисточнике: «19^1» взят из вторичных (разбор 08.10.2026, docs/open.md «Юристу»). */
  for (const d of RAW) for (const s of d.sections) for (const lang of LOCALES) assert.doesNotMatch(s.body[lang] ?? '', /19\^1/, `${d.slug}/${s.id}/${lang}: статья 19^1 не сверена`)
  assert.match(ro('termeni', 'recenzii'), /Legea 363\/2007/, 'условия: как проверяем отзывы')
  assert.match(ro('accesibilitate', 'autoritate'), /Autoritatea pentru Digitalizarea României/, 'доступность: орган надзора — ADR (Legea 232/2022 ст. 19)')
  assert.match(ro('confidentialitate', 'minori'), /18 ani/)
})

test('contract documents carry section numbers in a row, in the heading and in the contents', () => {
  for (const d of RAW) assert.equal(Boolean(d.numbered), NUMBERED.includes(d.slug), `${d.slug}: numbered`)
  for (const slug of NUMBERED) {
    const d = RAW.find((x) => x.slug === slug)!
    for (const lang of LOCALES) {
      for (const [optional, notice] of [[false, false], [true, true]]) {
        const lead = d.table ? { id: 'doc-table', heading: 'Lead' } : null
        const v = docView(lang, inLang(d, lang), lead, { optional, notice })
        const nums = [...(v.lead ? [v.lead.num] : []), ...v.sections.map((s) => s.num)]
        assert.deepEqual(nums, nums.map((_, i) => String(i + 1)), `${lang}/${slug}: номера подряд`)
        assert.ok(v.toc, `${lang}/${slug}: оглавление`)
        assert.ok(v.toc!.items.every((it, i) => it.label.startsWith(`${i + 1}. `)), `${lang}/${slug}: номер в оглавлении`)
      }
    }
  }
  const plain = docView('ro', { title: 'T', summary: 'S', updated: '2026-10-08', sections: [{ id: 'a', heading: 'A', body: 'x' }] })
  assert.equal(plain.sections[0].num, null, 'без numbered — без номеров')
  assert.equal(plain.updatedIso, '2026-10-08', 'дата правки машиночитаемо (<time datetime>)')
})

test('consent sections follow the registry: no optional cookies — why there is no banner; with them — tables and the settings button', () => {
  const ck = RAW.find((d) => d.slug === 'cookie-uri')!
  assert.equal(ck.table, 'storage', 'первым разделом — таблица из реестра')
  assert.ok(!ck.sections.some((s) => s.table), 'рукописная таблица cookie')
  const off = docView('ro', inLang(ck, 'ro'), null, { optional: false })
  assert.ok(off.sections.some((s) => s.id === 'fara-banner'))
  assert.ok(!off.sections.some((s) => s.slot === 'cookie-settings' || s.slot === 'cookie-optional'))
  const on = docView('ro', inLang(ck, 'ro'), null, { optional: true })
  assert.ok(!on.sections.some((s) => s.id === 'fara-banner'))
  assert.ok(on.sections.some((s) => s.slot === 'cookie-settings') && on.sections.some((s) => s.slot === 'cookie-optional'))
  const privacy = RAW.find((d) => d.slug === 'confidentialitate')!.sections.filter((s) => s.id === 'cookie')
  assert.deepEqual(privacy.map((s) => s.when).toSorted(), ['consent', 'no-consent'], 'раздел о cookie в политике данных — парой')
})

test('a section slot is one of the site things a document may hold', () => {
  for (const d of RAW) for (const s of d.sections) if (s.slot) assert.ok((DOC_SLOTS as readonly string[]).includes(s.slot), `${d.slug}/${s.id}: slot «${s.slot}»`)
  const g = RAW.find((d) => d.slug === 'garantie')!
  assert.ok(g.sections.some((s) => s.slot === 'guarantee-notice'), 'гарантия обещает уведомление ЕС — слот на месте')
  /* Раздел обещает показ уведомления — без файла на этом языке раздела нет (разбор 08.10.2026). */
  for (const lang of LOCALES) {
    const has = (notice: boolean) => docView(lang, inLang(g, lang), null, { notice }).sections.some((s) => s.slot === 'guarantee-notice')
    assert.equal(has(false), false, `${lang}: файла уведомления нет — раздел «${g.sections.find((s) => s.slot === 'guarantee-notice')!.heading[lang]}» не стоит`)
    assert.equal(has(true), true, `${lang}: файл есть — раздел и картинка на месте`)
  }
})

/* Телефон и бумага (И791): ниже шва 820 оглавление — одной свёрнутой строкой меню под шапкой
   (колонка сбоку там не встаёт); дата правки — машиночитаемо; шапка, крошки, оглавление,
   подвал, стопка помощи и ссылка «к содержимому» не печатаются — одним правилом основания. */
test('the contents fold into one line on a narrow box; dates are machine-readable; print skips the chrome', () => {
  const at = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
  const view = at('../components/DocView.tsx')
  const css = at('../components/DocView.module.css')
  assert.match(view, /<nav className=\{s\.peek\} aria-label=\{view\.toc\.label\} data-print="skip">\s*<details className=\{m\.fold\}>\s*<summary>\{view\.toc\.label\} \(\{view\.toc\.items\.length\}\)<Turn \/><\/summary>/, 'свёртка оглавления — вид свёртки меню, в своём ориентире nav')
  assert.match(css, /\.peek\{display:none\}\s*@container \(max-width:819px\)\{\s*\.toc\{display:none\}\s*\.peek\{display:block\}/, 'свёртка — только ниже шва 820, колонка — только выше')
  assert.match(view, /<time dateTime=\{view\.updatedIso \?\? undefined\}>\{view\.updated\}<\/time>/)
  assert.match(view, /aria-labelledby="doc-toc" data-print="skip"/)
  assert.match(at('../styles/base.css'), /@media print\{\s*\[data-print='skip'\]\{display:none !important\}\s*:root, :root:root\[data-theme\]\{color-scheme:light\}/, 'бумага — дневные роли и у выбравшего ночь ([data-theme] токенов сильнее голого :root)')
  for (const [file, mark] of [['../components/Header.tsx', /<header className=\{s\.head\} data-variant="classic" data-print="skip">/], ['../components/Breadcrumbs.tsx', /data-print="skip"/], ['../components/HelpDock.tsx', /className=\{s\.dock\} data-print="skip"/], ['../components/Shell.tsx', /<a className=\{p\.skip\} href="#main" data-print="skip">/]] as const) {
    assert.match(at(file), mark, `${file}: печатается служебное`)
  }
})
