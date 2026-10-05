/* Состояние выбора вида — ОДНО на страницу: плавающая панель (look.js) и
   страница дизайн-системы (design/*, `/<язык>/design`) выбирают через него
   (слово заказчика 29.09.2026: «переносить регулировку дизайна в дизайн
   систему на страницу… последовательно, начнём с палитры»). Два своих
   состояния на одной странице затирали бы черновик друг другу: панель,
   открытая после выбора палитры на странице, писала бы в черновик прежнюю.

   Модуль — синглтон браузера: оба берут его одним адресом
   (`/look-panel/studio.mjs`), и `studio()` отдаёт один и тот же объект.
   В нём — имена выбора, своя палитра, пары, которые не носятся, черновик,
   предпросмотр, публикация и строка итога; рисунок выбора — у того, кто
   выбирает. Где какой выбор рисуется — `SECTIONS` в choice.mjs (`page`). */
import * as choice from './choice.mjs'

const base = new URL('.', import.meta.url)

export function send(method, path, body) {
  return fetch(new URL(path, base).href, {
    method, credentials: 'same-origin',
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json().catch(() => ({ ok: r.ok })))
}

export function later(fn, ms) {
  let t = 0
  return () => { clearTimeout(t); t = setTimeout(fn, ms) }
}

/* Роли тени — на списке полов, как их кладёт сайт (`floors` каталога,
   lib/look-values.ts, И385): на палубе и листе предпросмотр пересчитывает
   их из своих ингредиентов, а не наследует корневую строку. */
function cssText(vars, floors) {
  const on = (keep) => Object.keys(vars).filter(keep).map((k) => k + ':' + vars[k]).join(';')
  const shadow = (k) => Boolean(floors) && floors.names.includes(k)
  const rest = on((k) => !shadow(k))
  const roles = on(shadow)
  return ':root{' + rest + '}' + (roles ? '\n' + floors.selector + '{' + roles + '}' : '')
}

/* Опубликованное доходит до статических страниц пересчётом: первый запрос
   к языку запускает его и ещё получает прежнюю страницу. Каждый язык
   просится без cookie (как гость), и ждётся блок нового вида на главной. */
function live(r) {
  const style = /<style[^>]*data-href="look"[^>]*>([\s\S]*?)<\/style>/
  const page = (lang) => fetch('/' + lang, { cache: 'no-store', credentials: 'omit' }).then((x) => (x.ok ? x.text() : ''), () => '')
  let tries = 0
  const poll = () => page(r.main).then((html) => {
    const m = html.match(style)
    if (m && m[1] === r.css) return true
    if (++tries > 20) return false
    return new Promise((done) => setTimeout(done, 500)).then(poll)
  })
  return Promise.all(r.langs.map(page)).then(poll)
}

/** Строки итога по-английски — панели; страница дизайн-системы говорит своими. */
export const SAID = {
  saving: 'Saving draft…', saved: 'Draft saved — only you see it.', notSaved: 'Draft not saved.', draftSilent: 'Draft not saved: the server did not answer.',
  checking: 'Checking this combination — about a minute…', failed: 'Not published: the site check did not pass.', passed: 'Passed the check. Publishing…',
  published: 'Published. Every visitor now sees this look.', publishedSoon: 'Published. Pages pick it up within a minute.', publishSilent: 'Not published: the server did not answer.',
}

let made = null
/** Состояние выбора этой страницы — один объект на всех, кто выбирает. */
export function studio() {
  made ||= Promise.all([
    fetch(new URL('catalog.json', base).href).then((r) => r.json()),
    fetch(new URL('state', base).href, { credentials: 'same-origin' }).then((r) => r.json()),
  ]).then(([catalog, state]) => make(catalog, state))
  return made
}

function make(catalog, state) {
  const names = choice.complete((state.previewing && state.draft) || state.published || {}, catalog)
  const saved = (state.previewing && state.draftPaints) || state.publishedPaints
  const custom = () => names.palette === choice.CUSTOM
  const setOf = (id) => catalog.groups.palette.find((o) => o.id === id)
  /** Своя палитра: имя, краски тем и намерение, из которого они собраны. */
  let paints = custom() && saved ? { name: saved.name || 'Custom', light: saved.light, dark: saved.dark, intent: saved.intent || choice.intentOf(saved) } : null
  let own = [] /* пары своей палитры — от сервера (POST guard) */
  const heard = new Set()
  const tell = (what, data) => heard.forEach((fn) => fn(what, data))

  const s = {
    catalog, choice, names,
    drafting: Boolean(state.previewing && state.draft),
    /** Слушать перемены: `change` — выбор, `say` — строка итога. */
    on(fn) { heard.add(fn); return () => heard.delete(fn) },
    custom,
    /** Набор палитры, который стоит (или первый), — у своей палитры это её исток. */
    current: () => setOf(names.palette) || catalog.groups.palette[0],
    get paints() { return paints },
    pairs: () => catalog.pairs.concat(own),
    clashes: () => choice.clashes(names, s.pairs()),
    blockedBy: (field, id) => choice.blockedBy(field, id, names, s.pairs()),
    title: (field, id) => choice.title(catalog, field, id),
    /** Какие слова стоят в полосе «Look»: палитра · шрифт · ритм. */
    words: () => [custom() ? (paints && paints.name) || 'Custom' : s.title('palette', names.palette), s.title('face', names.face), s.title('scale', names.scale)].join(' · '),
    /** Строка итога — кодом (`SAID`): слова — у того, кто показывает. */
    say(code, detail) { tell('say', { code, detail }) },
    body: () => Object.assign({}, names, custom() ? { paints } : {}),
    preview() {
      let tag = document.getElementById('look-preview')
      if (!tag) { tag = document.createElement('style'); tag.id = 'look-preview'; document.head.appendChild(tag) }
      tag.textContent = cssText(choice.compose(names, catalog, custom() ? paints : null).look.vars, catalog.floors)
    },
    draft(reload) {
      s.drafting = true
      s.say('saving')
      tell('change')
      return send('POST', 'draft', s.body()).then((r) => {
        s.say(r.ok ? 'saved' : 'notSaved', r.ok ? '' : (r.error || 'error'))
        if (r.ok && reload) { try { sessionStorage.setItem('look-panel-open', '1') } catch { /* без памяти */ } location.reload() }
      }, () => s.say('draftSilent'))
    },
    /** Выбрать вариант: разметка — черновик и перезагрузка; значения — предпросмотр и черновик. */
    pick(field, id) {
      if (names[field] === id) return
      names[field] = id
      if (field === 'palette') { paints = null; own = [] }
      tell('change')
      if (choice.RELOADS(field)) s.draft(true)
      else { s.preview(); s.draft(false) }
    },
    /** Несколько осей разом (главная кнопка: заливка и форма) — значения, без разметки. */
    pickMany(set) {
      if (Object.keys(set).every((f) => names[f] === set[f])) return
      Object.assign(names, set)
      tell('change'); s.preview(); s.draft(false)
    },
    /** Своя палитра из строителя: краски уже прошли замер (`fitPalette`). */
    setPaints(p) {
      paints = p
      names.palette = choice.CUSTOM
      s.preview(); guard(); tell('change'); draftLater()
    },
    rename(name) { if (paints) { paints.name = name || 'Custom'; tell('change'); draftLater() } },
    publish() {
      s.say('checking')
      return send('POST', 'publish', s.body()).then((r) => {
        if (!r.ok) { s.say('failed', r.verdict ? r.verdict.join(' · ') : r.error); return false }
        s.say('passed')
        return live(r).then((done) => { s.say(done ? 'published' : 'publishedSoon'); return true })
      }, () => { s.say('publishSilent'); return false })
    },
    /** Снова опубликованное: черновой режим снят, страница перезагружается. */
    stop() {
      document.getElementById('look-preview')?.remove()
      return send('DELETE', 'preview').then(() => location.reload())
    },
  }
  const draftLater = later(() => s.draft(false), 700)
  const guard = later(() => {
    if (!custom()) { own = []; tell('change'); return }
    send('POST', 'guard', { paints }).then((r) => { own = r.ok ? r.pairs : []; tell('change') }, () => { /* без ответа — пары каталога */ })
  }, 250)
  if (custom() && paints) { s.preview(); guard() }
  return s
}
