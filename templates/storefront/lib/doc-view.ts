import type { Lang } from './locale.ts'
import type { DocSection } from './source/contract.ts'
import { hrefFor } from './href.ts'
import { dayOf } from './format.ts'
import { t } from './i18n/index.ts'
import { COMPANY } from './company.ts'
import { CONTACTS } from './contacts.ts'

/* Вид документа (И748): текст данных — в разметку страницы. Документ пишет
   абзацы через пустую строку, ссылки `[слова](цель)` и реквизиты
   `{company.name}`; здесь они становятся кусками строки, а реквизиты — данными
   магазина из одного места (lib/company.ts, lib/contacts.ts): текст условий их
   не повторяет, и смена реквизитов не требует правки документов. */

/** Кусок строки: текст или ссылка (`external` — на чужой сайт). */
export type Run = { text: string; href?: string; external?: boolean }
export type Para = Run[]
export type SectionView = { id: string; heading: string; paras: Para[]; list: Para[] | null; table: { head: string[]; rows: Para[][] } | null; note: Para | null; form: 'withdrawal' | null }
/** `toc` — оглавление ссылками к разделам, когда разделов не меньше `TOC_MIN`:
 *  у короткого документа оглавление было бы длиннее самого текста. */
export type DocPageView = { title: string; summary: string; updated: string | null; toc: { label: string; items: { id: string; label: string }[] } | null; sections: SectionView[] }

export const TOC_MIN = 4

/** Реквизиты, которые документ может назвать. Других нет: незнакомое имя
 *  остаётся в тексте как написано и ловится тестом (`unknownMarks`). */
const MARKS: Record<string, string> = {
  'company.name': COMPANY.name, 'company.cui': COMPANY.cui, 'company.regCom': COMPANY.regCom, 'company.address': COMPANY.address,
  'contacts.phone': CONTACTS.phone, 'contacts.email': CONTACTS.email,
}
const MARK = /\{([a-z]+\.[a-zA-Z]+)\}/g
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

export const fill = (text: string): string => text.replace(MARK, (all, key: string) => MARKS[key] ?? all)

/** Куда ведёт цель ссылки; незнакомая — `null`, и слова стоят текстом. */
export function targetOf(lang: Lang, target: string): { href: string; external: boolean } | null {
  if (target.startsWith('doc:')) return { href: hrefFor(lang, { doc: target.slice(4) }), external: false }
  if (target === 'withdraw') return { href: hrefFor(lang, { withdraw: true }), external: false }
  if (target === 'catalog') return { href: hrefFor(lang, { catalog: true }), external: false }
  if (target.startsWith('post:')) return { href: hrefFor(lang, { post: target.slice(5) }), external: false }
  if (/^https:\/\/[^\s]+$/.test(target)) return { href: target, external: true }
  return null
}

/** Строка документа — куски: текст и ссылки. */
export function runsOf(lang: Lang, text: string): Para {
  const out: Para = []
  const src = fill(text)
  let at = 0
  for (const m of src.matchAll(LINK)) {
    if (m.index > at) out.push({ text: src.slice(at, m.index) })
    const to = targetOf(lang, m[2])
    out.push(to ? { text: m[1], ...to } : { text: m[1] })
    at = m.index + m[0].length
  }
  if (at < src.length) out.push({ text: src.slice(at) })
  return out
}

/** Строка без разметки ссылок — для разметки поиска (FAQPage) и подписей. */
export const plainOf = (text: string): string => fill(text).replace(LINK, '$1')

const parasOf = (lang: Lang, body: string): Para[] => body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => runsOf(lang, p))

/** Раздел без своего якоря (статья блога) получает `doc-N`. */
type AnySection = Pick<DocSection, 'heading' | 'body'> & Partial<Omit<DocSection, 'heading' | 'body'>>

/** `lead` — раздел, который страница ставит первым сама (таблица способов
 *  доставки): он входит в оглавление первым пунктом. */
export function docView(lang: Lang, doc: { title: string; summary: string; updated?: string | null; sections: AnySection[] }, lead: { id: string; heading: string } | null = null): DocPageView {
  const sections = doc.sections.map((s, i): SectionView => ({
    id: s.id ?? `doc-${i + 1}`,
    heading: fill(s.heading),
    paras: parasOf(lang, s.body),
    list: s.list?.length ? s.list.map((x) => runsOf(lang, x)) : null,
    table: s.table ? { head: s.table.head.map(fill), rows: s.table.rows.map((row) => row.map((cell) => runsOf(lang, cell))) } : null,
    note: s.note ? runsOf(lang, s.note) : null,
    form: s.form ?? null,
  }))
  const items = [...(lead ? [{ id: lead.id, label: lead.heading }] : []), ...sections.map((s) => ({ id: s.id, label: s.heading }))]
  return {
    title: fill(doc.title), summary: fill(doc.summary),
    updated: doc.updated ? t(lang, 'doc.updated', { date: dayOf(lang, doc.updated) }) : null,
    toc: items.length >= TOC_MIN ? { label: t(lang, 'doc.toc'), items } : null,
    sections,
  }
}

/** Слова формы отказа от договора (components/WithdrawForm.tsx, И748): одни на
 *  странице `/withdraw` и в дизайн-системе. */
export const withdrawWords = (lang: Lang) => ({
  name: t(lang, 'withdraw.name'), order: t(lang, 'withdraw.order'), email: t(lang, 'withdraw.email'), confirm: t(lang, 'withdraw.confirm'),
})

/** Ссылки документа, которые никуда не ведут, и реквизиты без значения — для
 *  теста: документ из CMS проверяется тем же. */
export function badLinks(text: string): string[] {
  return [...text.matchAll(LINK)].filter((m) => !targetOf('ro', m[2])).map((m) => m[0])
}
export function unknownMarks(text: string): string[] {
  return [...text.matchAll(MARK)].filter((m) => !(m[1] in MARKS)).map((m) => m[0])
}
