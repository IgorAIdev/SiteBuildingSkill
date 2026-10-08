import type { Lang } from './locale.ts'

/* Согласие на cookie (И791; бриф docs/design/документы-и-куки.md). Устройство
   данных — порт orestbida/cookieconsent v3 (MIT, © 2020–2025 Orest Bida): два
   слоя, категории с «необходимой» только для чтения, службы по категориям и их
   уборка при отзыве, версия согласия и срок 182 дня. Код не взят — устройство.

   Реестр `lib/storage.json` — всё, что сайт кладёт в браузер: имя, вид, категория,
   поставщик, цель и срок на трёх языках. Из него строятся таблицы страницы cookie
   и окна настроек — рукописной таблицы нет (она уже разошлась с кодом: не было
   `shop_oauth`, И787). Тест держит реестр согласным с именами в коде
   (tests/consent.test.ts). Необязательной категории в реестре нет — нет ни полосы,
   ни «Setări cookie», а страница cookie объясняет почему (Legea 506/2004 ст. 4 (6));
   появилась первая (аналитика в монорепозитории) — полоса, окно, «Setări cookie» и
   разделы `when` документов (по `hasOptional()`) встают сами; но о новой обработке
   политика данных сама не узнаёт — строка в `date-si-scopuri`, получатель и
   основание передачи вне ЕС пишутся вместе с поставщиком (GDPR ст. 13; docs/open.md).

   Здесь — ядро без слов и без реестра: его берут компоненты в браузере (полоса,
   окно, службы), и словари трёх языков в браузер не едут. Реестр, таблицы и слова
   — lib/consent-view.ts. */

export type Category = 'necessary' | 'analytics' | 'marketing'
export type Optional = Exclude<Category, 'necessary'>
export const CATEGORIES: readonly Category[] = ['necessary', 'analytics', 'marketing']
type L = Record<Lang, string>
/** Строка реестра. `alias` — второе имя того же (`__Host-` на https);
 *  `onlyWithConsent` — строка есть, только когда есть что спрашивать (cookie выбора). */
export type StorageRow = {
  name: string; alias?: string; kind: 'cookie' | 'cookie-http' | 'local'; category: Category
  provider: { name: string; policy: string } | null; purpose: L; lifetime: L; onlyWithConsent?: boolean
}

/** Cookie выбора: `<версия>.<категории через + или ->.<id>.<секунды>`. */
export const CONSENT_COOKIE = 'consent'
/** Версия реестра: выросла (новый поставщик) — спросить снова. */
export const CONSENT_REVISION = 1
/** Срок выбора — полгода (orestbida: 182 дня); потом спросить снова. */
export const CONSENT_DAYS = 182
/** id окна настроек — его открывают «Setări cookie» подвала, полосы и страницы. */
export const CONSENT_PREFS = 'consent-prefs'
/** Событие выбора: полоса показывает подтверждение, службы встают. */
export const CONSENT_EVENT = 'consent:change'
/** Событие «открыть настройки»: окно само читает текущий выбор перед показом. */
export const CONSENT_OPEN = 'consent:open'

/** Служба — чужой скрипт необязательной категории (GA4, пиксель): ставится только
 *  после согласия своей категории; `clears` — её cookie, стираемые при отзыве. У
 *  шаблона служб нет; в магазине — из его настроек (docs/open.md). */
export type Service = { key: string; category: Optional; src: string; init?: string; clears: RegExp[] }
export const SERVICES: readonly Service[] = []

/** Необязательные категории, о которых есть строки в реестре. */
export const optionalIn = (rows: readonly StorageRow[]): Optional[] =>
  CATEGORIES.filter((c): c is Optional => c !== 'necessary' && rows.some((r) => r.category === c))

export type Choice = { revision: number; categories: Optional[]; id: string; at: number }

/** Строка `Set-Cookie` выбора для `document.cookie`: весь сайт, полгода. */
export function consentCookie(choice: Choice, secure: boolean): string {
  const cats = choice.categories.length ? choice.categories.join('+') : '-'
  return `${CONSENT_COOKIE}=${choice.revision}.${cats}.${choice.id}.${choice.at}; path=/; max-age=${CONSENT_DAYS * 86400}; samesite=lax${secure ? '; secure' : ''}`
}

const OPTIONAL = new Set<string>(CATEGORIES.filter((c) => c !== 'necessary'))
/** Вид cookie выбора — одна строка на разбор и на скрипт до отрисовки: испорченный
 *  выбор оба читают как «выбора нет» (скрипт смотрел только версию и при
 *  `consent=1.x` прятал полосу на полгода; разбор 08.10.2026). */
const CHOICE_RE = `(?:^|;\\s*)${CONSENT_COOKIE}=(\\d+)\\.([a-z+-]+)\\.([a-z0-9]+)\\.(\\d+)(?:;|$)`
/** Выбор из строки cookie (`document.cookie`); нет или испорчен — `null`. */
export function parseConsent(jar: string | null | undefined): Choice | null {
  const m = new RegExp(CHOICE_RE).exec(jar ?? '')
  if (!m) return null
  const categories = m[2] === '-' ? [] : m[2].split('+').filter((c): c is Optional => OPTIONAL.has(c))
  return { revision: Number(m[1]), categories, id: m[3], at: Number(m[4]) }
}

/** Спросить снова: выбора нет или он старше версии реестра. */
export const askAgain = (choice: Choice | null, revision = CONSENT_REVISION): boolean => !choice || choice.revision < revision

/** Что выбрано — для строки подтверждения полосы: всё, ничего или часть. */
export const kindOf = (picked: readonly Optional[], all: readonly Optional[]): 'all' | 'none' | 'some' =>
  picked.length === 0 ? 'none' : all.every((c) => picked.includes(c)) ? 'all' : 'some'

/** Скрипт до первой отрисовки, как у темы (`THEME_BOOT`): `data-consent` на корне —
 *  `ask` (полоса видна) или `set`. Без скрипта его нет — и полосы нет, и чужих
 *  скриптов без скрипта тоже нет. Строкой, потому что исполняется до React. */
export const CONSENT_BOOT = `(function(){var m=new RegExp(${JSON.stringify(CHOICE_RE)}).exec(document.cookie);document.documentElement.dataset.consent=m&&+m[1]>=${CONSENT_REVISION}?'set':'ask'})()`

/** Случайный id выбора — без IP и без имени (GDPR ст. 7 (1): доказать согласие). */
export function choiceId(): string {
  const bytes = new Uint8Array(8)
  globalThis.crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Отозванные категории: были в прежнем выборе, нет в новом. */
export const revokedOf = (before: Choice | null, after: Optional[]): Optional[] => (before?.categories ?? []).filter((c) => !after.includes(c))

/** Строки, которые стирают cookie отозванной категории на этом сайте: путь `/`,
 *  без домена, с доменом хоста и с точкой перед ним (orestbida, `autoClear`). */
export function expiring(jar: string, revoked: readonly Optional[], host: string, services: readonly Service[] = SERVICES): string[] {
  const rules = services.filter((s) => revoked.includes(s.category)).flatMap((s) => s.clears)
  const names = jar.split(';').map((x) => x.trim().split('=')[0]).filter((n) => n && rules.some((r) => r.test(n)))
  return names.flatMap((n) => ['', `; domain=${host}`, `; domain=.${host}`].map((d) => `${n}=; path=/; max-age=0${d}`))
}

/** Службы, разрешённые выбором. */
export const allowed = (choice: Choice | null, services: readonly Service[] = SERVICES): Service[] =>
  choice ? services.filter((s) => choice.categories.includes(s.category)) : []
