import type { Lang } from './locale.ts'
import type { DocSection, DocSlot } from './source/contract.ts'
import { hasOptional } from './consent-view.ts'
import { hrefFor } from './href.ts'
import { dayOf } from './format.ts'
import { t } from './i18n/index.ts'
import { COMPANY, EU_GUARANTEE_NOTICE } from './company.ts'
import { CONTACTS } from './contacts.ts'

/* Вид документа (И748): текст данных — в разметку страницы. Документ пишет
   абзацы через пустую строку, ссылки `[слова](цель)` и реквизиты
   `{company.name}`; здесь они становятся кусками строки, а реквизиты — данными
   магазина из одного места (lib/company.ts, lib/contacts.ts): текст условий их
   не повторяет, и смена реквизитов не требует правки документов. */

/** Кусок строки: текст или ссылка (`external` — на чужой сайт). */
export type Run = { text: string; href?: string; external?: boolean }
export type Para = Run[]
/** `num` — номер раздела договорного документа (`numbered`, И791): текстом в
 *  заголовке и в оглавлении, на пункт можно сослаться; `slot` — вещь сайта после
 *  текста (кнопка отказа, «Setări cookie», таблицы cookie, уведомление ЕС). */
export type SectionView = { id: string; num: string | null; heading: string; paras: Para[]; list: Para[] | null; table: { head: string[]; rows: Para[][] } | null; note: Para | null; slot: DocSlot | null }
/** `toc` — оглавление ссылками к разделам, когда разделов не меньше `TOC_MIN`:
 *  у короткого документа оглавление было бы длиннее самого текста. */
/** `updatedIso` — та же дата машиночитаемо (`<time datetime>`: поиск и ответы GEO
 *  видят дату правки, И791); `lead` — раздел, который страница ставит первым сама. */
export type DocPageView = { title: string; summary: string; updated: string | null; updatedIso: string | null; lead: { id: string; num: string | null; heading: string } | null; toc: { label: string; items: { id: string; label: string }[] } | null; sections: SectionView[] }

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

/** Строка оглавления: у договорного документа — с номером («1. Cine vinde»). */
const tocLabel = (x: { num: string | null; heading: string }) => (x.num ? `${x.num}. ${x.heading}` : x.heading)

/** Раздел без своего якоря (статья блога) получает `doc-N`. */
type AnySection = Pick<DocSection, 'heading' | 'body'> & Partial<Omit<DocSection, 'heading' | 'body'>>

/** `lead` — раздел, который страница ставит первым сама (таблица способов
 *  доставки, таблица строго необходимых cookie): он входит в оглавление первым
 *  пунктом и первым номером. `optional` — есть ли у магазина необязательные
 *  cookie (реестр lib/storage.json): раздел с `when` стоит только при своём
 *  состоянии — текст о согласии меняется сам, без правки документа (И791).
 *  `notice` — есть ли файл уведомления ЕС о гарантии на этом языке: раздел со
 *  слотом `guarantee-notice` обещает показ, и без файла его нет — текст не
 *  обещает того, чего страница не рисует (разбор 08.10.2026). */
export function docView(lang: Lang, doc: { title: string; summary: string; updated?: string | null; numbered?: boolean; sections: AnySection[] }, lead: { id: string; heading: string } | null = null, { optional = hasOptional(), notice = EU_GUARANTEE_NOTICE[lang] !== null }: { optional?: boolean; notice?: boolean } = {}): DocPageView {
  const shown = doc.sections.filter((s) => (!s.when || (s.when === 'consent') === optional) && (s.slot !== 'guarantee-notice' || notice))
  const first = doc.numbered && lead ? 2 : 1
  const numOf = (i: number) => (doc.numbered ? String(i + first) : null)
  const sections = shown.map((s, i): SectionView => ({
    id: s.id ?? `doc-${i + 1}`,
    num: numOf(i),
    heading: fill(s.heading),
    paras: parasOf(lang, s.body),
    list: s.list?.length ? s.list.map((x) => runsOf(lang, x)) : null,
    table: s.table ? { head: s.table.head.map(fill), rows: s.table.rows.map((row) => row.map((cell) => runsOf(lang, cell))) } : null,
    note: s.note ? runsOf(lang, s.note) : null,
    slot: s.slot ?? null,
  }))
  const head = lead ? { ...lead, num: doc.numbered ? '1' : null } : null
  const items = [...(head ? [{ id: head.id, label: tocLabel(head) }] : []), ...sections.map((s) => ({ id: s.id, label: tocLabel(s) }))]
  return {
    title: fill(doc.title), summary: fill(doc.summary),
    updated: doc.updated ? t(lang, 'doc.updated', { date: dayOf(lang, doc.updated) }) : null,
    updatedIso: doc.updated ?? null,
    lead: head,
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
