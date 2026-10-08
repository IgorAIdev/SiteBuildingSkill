import type { Lang } from './locale.ts'
import type { Para } from './doc-view.ts'
import { intlLocale } from './market.ts'
import { t, type Key } from './i18n/index.ts'
import { optionalIn, type Category, type Optional, type StorageRow } from './consent.ts'
import STORAGE from './storage.json' with { type: 'json' }

/* Реестр хранилищ и слова согласия (И791): из реестра `lib/storage.json` —
   таблицы страницы cookie и окна настроек, слова полосы и окна — из словаря.
   Только сервер и тесты: в браузер едет готовый вид (`ConsentView`), ядро —
   lib/consent.ts. */

export const STORAGE_ROWS = STORAGE as StorageRow[]

/** Необязательные категории реестра магазина. */
export const optionalOf = (rows: readonly StorageRow[] = STORAGE_ROWS): Optional[] => optionalIn(rows)
/** Есть ли у магазина что спрашивать: нет — нет полосы и «Setări cookie». */
export const hasOptional = (rows: readonly StorageRow[] = STORAGE_ROWS): boolean => optionalIn(rows).length > 0

export type StorageTable = { caption: string; head: string[]; rows: Para[][] }

/** Таблица категории из реестра (страница cookie, окно настроек): имя, вид, цель,
 *  срок; у необязательных — и поставщик ссылкой на его политику. */
export function storageTable(lang: Lang, category: Category, rows: readonly StorageRow[] = STORAGE_ROWS): StorageTable {
  const optional = hasOptional(rows)
  const own = rows.filter((r) => r.category === category && (!r.onlyWithConsent || optional))
  const third = category !== 'necessary'
  const head = [t(lang, 'storage.head.name'), t(lang, 'storage.head.kind'), t(lang, 'storage.head.purpose'), t(lang, 'storage.head.lifetime'), ...(third ? [t(lang, 'storage.head.provider')] : [])]
  return {
    caption: category === 'necessary' ? t(lang, 'storage.caption') : t(lang, `consent.cat.${category}` as Key),
    head,
    rows: own.map((r) => {
      const row: Para[] = [
        [{ text: r.alias ? `${r.name}, ${r.alias}` : r.name }],
        [{ text: t(lang, `storage.kind.${r.kind}` as Key) }],
        [{ text: r.purpose[lang] }],
        [{ text: r.lifetime[lang] }],
      ]
      if (third) row.push(r.provider ? [{ text: r.provider.name, href: r.provider.policy, external: true }] : [{ text: t(lang, 'storage.self') }])
      return row
    }),
  }
}

export type ConsentCategoryView = { key: Category; name: string; desc: string; readOnly: boolean; list: string; table: StorageTable }
/** Слова полосы и окна настроек — одни на сайт и дизайн-систему; `rows` — реестр
 *  (дизайн-система показывает полосу на своём реестре-образце). */
export type ConsentView = {
  title: string; lead: string; choose: string; policy: { label: string; href: string } | null
  accept: string; reject: string; open: string; hide: string
  done: { all: string; none: string; some: string; change: string }
  prefs: { title: string; lede: string; always: string; save: string; close: string; categories: ConsentCategoryView[] }
}

export function consentView(lang: Lang, policy: { label: string; href: string } | null, rows: readonly StorageRow[] = STORAGE_ROWS): ConsentView {
  const optional = optionalOf(rows)
  const purposes = new Intl.ListFormat(intlLocale(lang), { type: 'conjunction' }).format(optional.map((c) => t(lang, `consent.why.${c}` as Key)))
  const cats: Category[] = ['necessary', ...optional]
  return {
    title: t(lang, 'consent.title'), lead: t(lang, 'consent.lead', { purposes }), choose: t(lang, 'consent.choose'), policy,
    accept: t(lang, 'consent.accept'), reject: t(lang, 'consent.reject'), open: t(lang, 'consent.open'), hide: t(lang, 'consent.hide'),
    done: { all: t(lang, 'consent.done.all'), none: t(lang, 'consent.done.none'), some: t(lang, 'consent.done.some'), change: t(lang, 'consent.done.change') },
    prefs: {
      title: t(lang, 'consent.open'), lede: t(lang, 'consent.prefs.lede'), always: t(lang, 'consent.prefs.always'), save: t(lang, 'consent.prefs.save'), close: t(lang, 'consent.prefs.close'),
      categories: cats.map((c) => {
        const table = storageTable(lang, c, rows)
        return { key: c, name: t(lang, `consent.cat.${c}` as Key), desc: t(lang, `consent.cat.${c}.desc` as Key), readOnly: c === 'necessary', list: t(lang, 'consent.prefs.list', { n: table.rows.length }), table }
      }),
    },
  }
}
