import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CONSENT_BOOT, CONSENT_COOKIE, CONSENT_DAYS, CONSENT_REVISION, SERVICES,
  allowed, askAgain, consentCookie, expiring, kindOf, parseConsent, revokedOf, type Service, type StorageRow,
} from '../lib/consent.ts'
import { STORAGE_ROWS, consentView, hasOptional, optionalOf, storageTable } from '../lib/consent-view.ts'
import { SESSION_COOKIE } from '../lib/session-cookie.ts'
import { THEME_COOKIE } from '../lib/theme.ts'
import { flowCookie } from '../lib/social.ts'
import { SAVED_KEY } from '../lib/saved.ts'
import { LOCALES } from '../lib/locale.ts'

/* Согласие на cookie (И791; бриф docs/design/документы-и-куки.md). Что меряется:
   реестр хранилищ = имена в коде; cookie выбора туда и обратно; версия и срок;
   первая полоса — «принять» и «отказаться» одним голосом и одной ширины;
   необходимые — включены и погашены, необязательные — выключены; чужого скрипта
   до согласия нет, и внешний адрес скрипта живёт только в `SERVICES`. */
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8')
const walk = (dir: string): string[] => readdirSync(join(ROOT, dir)).flatMap((n) => {
  const rel = `${dir}/${n}`
  return statSync(join(ROOT, rel)).isDirectory() ? walk(rel) : /\.(ts|tsx)$/.test(n) ? [rel] : []
})
const SITE = [...walk('app'), ...walk('components'), ...walk('lib')]

test('everything the code keeps in the browser is a row of the storage registry', () => {
  const names = new Set(STORAGE_ROWS.flatMap((r) => [r.name, ...(r.alias ? [r.alias] : [])]))
  for (const name of [SESSION_COOKIE, THEME_COOKIE, flowCookie(false), flowCookie(true), CONSENT_COOKIE, SAVED_KEY]) {
    assert.ok(names.has(name), `«${name}» кладётся в браузер, а в реестре (lib/storage.json) его нет`)
  }
  /* Кто пишет в браузер — известный список; новый писатель — новая строка реестра. */
  const WRITERS = ['lib/store.ts', 'lib/session.ts', 'lib/consent-save.ts', 'components/ThemeToggle.tsx']
  for (const file of SITE) {
    const text = read(file)
    if (/localStorage\.setItem|sessionStorage\.setItem|document\.cookie\s*=|\.set\(\s*(?:SESSION_COOKIE|flowCookie)/.test(text)) {
      assert.ok(WRITERS.includes(file), `${file} пишет в браузер — его имя должно стоять строкой реестра, а файл — в этом списке`)
    }
  }
  for (const r of STORAGE_ROWS) {
    for (const lang of LOCALES) assert.ok(r.purpose[lang] && r.lifetime[lang], `${r.name}: цель и срок на ${lang}`)
    if (r.category !== 'necessary') assert.ok(r.provider?.policy.startsWith('https://'), `${r.name}: у необязательного — поставщик и его политика`)
  }
})

test('the choice cookie goes there and back, lives half a year and asks again when the registry grows', () => {
  const choice = { revision: CONSENT_REVISION, categories: ['analytics' as const], id: '0123456789abcdef', at: 1791504000 }
  const line = consentCookie(choice, true)
  assert.match(line, new RegExp(`^${CONSENT_COOKIE}=1\\.analytics\\.0123456789abcdef\\.1791504000; path=/; max-age=${CONSENT_DAYS * 86400}; samesite=lax; secure$`))
  assert.equal(CONSENT_DAYS, 182)
  assert.deepEqual(parseConsent(`theme=dark; ${line.split(';')[0]}; other=1`), choice)
  assert.deepEqual(parseConsent(consentCookie({ ...choice, categories: [] }, false).split(';')[0])?.categories, [])
  assert.equal(parseConsent('consent=garbage'), null)
  assert.equal(parseConsent(null), null)
  assert.equal(askAgain(null), true, 'выбора нет — спросить')
  assert.equal(askAgain(choice), false)
  assert.equal(askAgain(choice, CONSENT_REVISION + 1), true, 'выросла версия реестра — спросить снова')
  assert.deepEqual(revokedOf({ ...choice, categories: ['analytics', 'marketing'] }, ['marketing']), ['analytics'])
  assert.deepEqual([kindOf([], ['analytics']), kindOf(['analytics'], ['analytics', 'marketing']), kindOf(['marketing', 'analytics'], ['analytics', 'marketing'])], ['none', 'some', 'all'])
})

test('the boot script asks without a choice and stays quiet with a current one', () => {
  const run = (cookie: string) => {
    const root = { dataset: {} as Record<string, string> }
    new Function('document', CONSENT_BOOT)({ cookie, documentElement: root })
    return root.dataset.consent
  }
  assert.equal(run(''), 'ask')
  assert.equal(run('theme=dark'), 'ask')
  assert.equal(run(`${CONSENT_COOKIE}=${CONSENT_REVISION}.-.0123456789abcdef.1`), 'set')
  assert.equal(run(`${CONSENT_COOKIE}=${CONSENT_REVISION - 1}.-.0123456789abcdef.1`), 'ask')
  /* Скрипт и разбор читают один вид: испорченный выбор — «выбора нет», полоса спрашивает (разбор 08.10.2026). */
  for (const bad of [`${CONSENT_COOKIE}=${CONSENT_REVISION}.x`, `${CONSENT_COOKIE}=${CONSENT_REVISION}.`, `x${CONSENT_COOKIE}=${CONSENT_REVISION}.-.0123456789abcdef.1`]) {
    assert.equal(parseConsent(bad), null)
    assert.equal(run(bad), 'ask', `«${bad}» — испорчен, спросить`)
  }
})

/* Реестр-образец с двумя необязательными категориями — так дизайн-система
   показывает полосу; у шаблона их нет, и полосы нет. */
const SAMPLE: StorageRow[] = [
  ...STORAGE_ROWS,
  { name: '_ga', kind: 'cookie', category: 'analytics', provider: { name: 'Google', policy: 'https://policies.google.com/privacy' }, purpose: { ro: 'a', en: 'a', hu: 'a' }, lifetime: { ro: '1', en: '1', hu: '1' } },
  { name: '_fbp', kind: 'cookie', category: 'marketing', provider: { name: 'Meta', policy: 'https://www.facebook.com/privacy/policy/' }, purpose: { ro: 'm', en: 'm', hu: 'm' }, lifetime: { ro: '1', en: '1', hu: '1' } },
]

test('no optional category — no banner, no settings, no consent cookie row; with them — necessary first, read-only, the rest off', () => {
  assert.equal(hasOptional(), false, 'у шаблона необязательных cookie нет — полосы нет (Legea 506/2004 ст. 4 (6))')
  assert.ok(!storageTable('ro', 'necessary').rows.some((r) => r[0][0].text === CONSENT_COOKIE), 'cookie выбора без выбора не описывают')
  assert.ok(storageTable('ro', 'necessary', SAMPLE).rows.some((r) => r[0][0].text === CONSENT_COOKIE))
  assert.deepEqual(optionalOf(SAMPLE), ['analytics', 'marketing'])
  const view = consentView('ro', { label: 'Politica de cookie-uri', href: '/ro/info/cookie-uri' }, SAMPLE)
  assert.deepEqual(view.prefs.categories.map((c) => [c.key, c.readOnly]), [['necessary', true], ['analytics', false], ['marketing', false]])
  const ga = storageTable('ro', 'analytics', SAMPLE)
  assert.equal(ga.head.length, 5, 'у необязательных — столбец поставщика')
  assert.deepEqual(ga.rows[0][4], [{ text: 'Google', href: 'https://policies.google.com/privacy', external: true }])
  assert.match(view.lead, /măsurarea traficului și reclame/, 'цели названы словами')
  const shell = read('components/Shell.tsx')
  assert.match(shell, /const consent = optional\.length \? consentView\(/)
  assert.match(shell, /\{consent \? <script dangerouslySetInnerHTML=\{\{ __html: CONSENT_BOOT \}\} \/> : null\}/)
  assert.match(shell, /\{consent \? <ConsentBanner view=\{consent\} optional=\{optional\} \/> : null\}\s*<a className=\{p\.skip\}/, 'полоса — в потоке, до ссылки «к содержимому»')
})

test('accept and reject stand side by side in one voice and one width; settings is a word', () => {
  const banner = read('components/ConsentBanner.tsx')
  const pair = banner.match(/<div className=\{`\$\{p\.switcher\} \$\{s\.pair\}`\}>([\s\S]*?)<\/div>/)?.[1] ?? ''
  const buttons = [...pair.matchAll(/<button ([^>]*)>/g)].map((m) => m[1])
  assert.equal(buttons.length, 2, 'в паре две кнопки')
  for (const b of buttons) {
    assert.match(b, /^className=\{b\.btn\} type="button"/, 'один класс — тихая кнопка сайта')
    assert.doesNotMatch(b, /data-voice|data-size/, '«принять» не громче «отказаться» (EDPB Taskforce 2023)')
  }
  assert.match(pair, /choose\(optional\)\}>\{view\.accept\}/)
  assert.match(pair, /choose\(\[\]\)\}>\{view\.reject\}/)
  assert.match(banner, /<ConsentOpen label=\{view\.open\} voice="bare"/)
  assert.match(read('components/ConsentBanner.module.css'), /\.pair\{[^}]*--switch-at:var\(--measure-form\)/, 'одна ширина — примитив switcher')
  const prefs = read('components/ConsentPrefs.tsx')
  assert.match(prefs, /useState<Optional\[\]>\(\[\]\)/, 'необязательные выключены, пока человек не включит (Planet49)')
  assert.match(prefs, /const on = c\.key === 'necessary' \|\| picked\.includes\(c\.key\)/)
  assert.match(prefs, /checked=\{on\} disabled=\{c\.readOnly\}/, 'необходимые — включены и погашены')
  assert.match(prefs, /<dialog ref=\{ref\} id=\{id\} className=\{pn\.pane\} data-pane="dialog"/, 'второй слой — окно (правило 8)')
})

test('no third-party script before consent; an external script address lives only in SERVICES', () => {
  const services: Service[] = [
    { key: 'ga', category: 'analytics', src: 'https://www.googletagmanager.com/gtag/js', clears: [/^_ga/] },
    { key: 'px', category: 'marketing', src: 'https://connect.facebook.net/en_US/fbevents.js', clears: [/^_fbp$/] },
  ]
  assert.deepEqual(allowed(null, services), [], 'выбора нет — ни одной службы')
  assert.deepEqual(allowed({ revision: 1, categories: [], id: 'x', at: 0 }, services), [], 'отказ — ни одной службы')
  assert.deepEqual(allowed({ revision: 1, categories: ['analytics'], id: 'x', at: 0 }, services).map((s) => s.key), ['ga'])
  assert.deepEqual(expiring('_ga=1; _ga_X=2; theme=dark', ['analytics'], 'cbdin.ro', services).filter((l) => !l.includes('domain')), ['_ga=; path=/; max-age=0', '_ga_X=; path=/; max-age=0'])
  assert.equal(SERVICES.length, 0, 'у шаблона служб нет')
  for (const file of SITE) {
    const text = read(file)
    assert.doesNotMatch(text, /<script[^>]*\bsrc=["'{`]*https?:/, `${file}: внешний <script src> мимо согласия`)
    if (file !== 'components/ConsentScripts.tsx') assert.doesNotMatch(text, /createElement\(['"]script['"]\)/, `${file}: скрипт ставится мимо ConsentScripts`)
  }
})

/* Образцы дизайн-системы нажимаются, но выбор сайта не трогают — ни cookie, ни события, ни журнала (И667;
   разбор 08.10.2026: «Принять» на /design ставило `consent=1.analytics+marketing` всему сайту и писало в журнал). */
test('design-system samples never write the site choice; a withdrawal waits for its record; the server stamps the time', () => {
  const banner = read('components/ConsentBanner.tsx')
  assert.match(banner, /const choose = \(cats: Optional\[\]\) => \(sample \? setDone\(kindOf\(cats, optional\)\) : saveChoice\(cats\)\)/, 'полоса-образец — своё состояние, не saveChoice')
  assert.match(banner, /useEffect\(\(\) => \{\s*if \(sample\) return/, 'образец не слушает выбор сайта')
  assert.match(read('components/ConsentPrefs.tsx'), /const save = \(cats: Optional\[\]\) => \{ if \(sample\) setPicked\(cats\); else saveChoice\(cats\)/, 'окно-образец не пишет выбор')
  const save = read('lib/consent-save.ts')
  assert.match(save, /if \(revoked\.length\) void Promise\.race\(\[recorded, [^\]]+\]\)\.then\(\(\) => location\.reload\(\)\)/, 'перезагрузка после отзыва ждёт записи об отзыве')
  assert.match(read('lib/actions/consent.ts'), /at: new Date\(\)\.toISOString\(\)/, 'время записи — часы сервера, не браузера')
  /* Подтверждение несёт путь назад: «Setări cookie» рядом, а не «внизу страницы» — у кассы подвала нет. */
  assert.match(banner, /role="status"[\s\S]*?<ConsentOpen label=\{view\.open\} voice="bare" target=\{target\} \/>\s*<button [^\n]*>\{view\.hide\}<\/button>/)
  for (const lang of LOCALES) {
    const v = consentView(lang, null, SAMPLE)
    assert.doesNotMatch(v.done.change, /subsol|bottom|alján/, `${lang}: подтверждение не шлёт в подвал`)
  }
  /* Первый слой называет право отозвать согласие (GDPR ст. 7 (3); EDPB 05/2020 § 64). */
  for (const [lang, word] of [['ro', /retrage/], ['en', /withdraw/], ['hu', /visszavon/]] as const) assert.match(consentView(lang, null, SAMPLE).choose, word)
})

/* Переключатель в принудительных цветах (ось «контраст»): заливку режим стирает — бегунок и «да» держатся системной парой. */
test('the switch keeps its knob and its on state in forced colours', () => {
  const css = read('styles/form.module.css')
  const forced = css.match(/\.switch:has\(input:disabled\)[\s\S]*?@media \(forced-colors:active\)\{([\s\S]*?)\n\}/)?.[1] ?? ''
  assert.match(forced, /\.thumb\{forced-color-adjust:none;background:CanvasText\}/)
  assert.match(forced, /input:checked \+ \.track\{forced-color-adjust:none;background:Highlight;border-color:Highlight\}/)
  assert.match(read('components/Switch.tsx'), /<input type="checkbox" className=\{p\.said\}/, 'скрыта примитивом said — одно место на сайт')
})
