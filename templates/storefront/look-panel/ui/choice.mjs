/* Выбор вида — чистый модуль панели: и в браузере (ui/look.js), и в Node
   (scripts/, routes/, tests/). Из имён вариантов каталога (ui/catalog.json)
   собирает вид значениями — таким, каким его примет сайт (lib/look-values.ts)
   — и говорит, какой вариант с текущими не носится. Пары, которые не
   носятся, посчитаны при сборке каталога правилом сайта
   (lib/look-rule.ts, scripts/build-catalog.mjs); здесь — только поиск по
   ним.

   Своя палитра строится здесь же — движком набора (ui/engine/palette.mjs —
   копия skills/site-building/assets/studio/engine набора, её кладёт сборка
   каталога; второй математики у панели нет): три краски на тему → семь
   семей по двенадцать ступеней → роли → замер. */
import { apca, auditPalette, difference, fitPalette, GROUNDS, groundChecks, inkOn, intentOf, NEED, ratio, roles, scale, STATUS, withSale } from './engine/palette.mjs'
/* Строитель заказчика верен по построению (И275): намерение → набор, который
   проходит замер набора; та же функция у мастерской набора. */
export { fitPalette, intentOf }

/** Разделы панели и их подразделы: поле выбора и его подпись. System — по
 *  договору мастерской (design-studio.md: «цветовые роли и темы,
 *  типографика, расстояния, контейнер/поля, форма, размеры и состояния
 *  контролов»); Admin — разметка страницы. */
/** Место вкладки на сайте (заказчик 28.09.2026: «элементы показываются на
 *  соответствующей вкладке: открываешь вкладку — сайт открывается на
 *  соответствующем блоке соответствующей страницы»; у панели cbdin так и
 *  было). `page` — страница из адресов панели (`/look-panel/places`: home,
 *  catalog, product, cart, checkout; нет — та, что открыта), `block` — что на
 *  ней показать (селектор). Вкладки общего вида сайта (краска, шрифт,
 *  ритм…) места не имеют: они везде. */
/** @typedef {{ page?: 'home' | 'catalog' | 'product' | 'cart' | 'checkout', block: string }} Place */
/* `page` — вкладка страницы дизайн-системы (`/<язык>/design?t=<page>`, у подвкладки — `system&s=color`), где
   этот выбор стоит ЕЩЁ И рядом со своим образцом. Выбор вида живёт в
   панели; на странице дизайн-системы — только палитра, со строителем своей
   палитры (слово заказчика 29.09.2026: «в дизайн-системе на странице
   показывается только дизайн-система, выбора на ней не делаем; выбор
   делаем только в панели Look… выбор палитры делаем и в панели, и в
   дизайн-системе»; И572). У такого подраздела панель рисует выбор и ссылку
   туда. */
/** @typedef {{ id: string, name: string, hint?: string, fields: [string, string][], axes?: boolean, place?: Place, page?: string }} Sub */
/** @type {{ id: string, name: string, subs: Sub[] }[]} */
export const SECTIONS = [
  { id: 'system', name: 'System', subs: [
    { id: 'color', name: 'Color', hint: 'Start from a set, or build your own from your brand colour. Every palette here passes the kit checks.', fields: [['palette', 'Palette']], page: 'system&s=color' },
    { id: 'type', name: 'Type', hint: 'The typeface of the whole shop, served from the shop itself. Text size and heading size are two knobs: every smaller label, note and subheading follows them.', fields: [['face', 'Typeface'], ['head-size', 'Headings'], ['text-size', 'Text size']], place: { page: 'product', block: 'main h1', sample: "[class*='ProductView-module'][class*='__identity']" } },
    { id: 'spacing', name: 'Spacing', hint: 'The air between sections, cards and rows. Text sizes are chosen under Type.', fields: [['scale', 'Rhythm']], place: { page: 'catalog', block: '[data-product-card]', sample: 'main#main', below: true } },
    { id: 'layout', name: 'Layout', hint: 'How wide the page grows on a large screen.', fields: [['width', 'Width']] },
    { id: 'shape', name: 'Shape', hint: 'Corners and shadows for controls, cards and sheets. The sample below is drawn with the same roles as the site, so it answers every pick. Corners reach buttons too: each set gives them the control corner, and its «· pill» twin rounds every button fully; Buttons → Shape adds only the arrow, trail or circle. Shadows reach menus, panes and windows; product cards stay flat at rest, and only the Sheet and Edged card designs lift under the hand (Framed and Inset answer with a line). No shadow leaves a hairline instead.', fields: [['corners', 'Corners'], ['shadow', 'Shadows']], place: { page: 'catalog', block: '[data-product-card]' }, demo: 'shape' },
    /* Оси кнопки — из каталога (catalog.axes): новая ось в каталоге набора
       встаёт сюда сама (И273). */
    { id: 'buttons', name: 'Buttons', hint: 'Press is the same for every button: the colour deepens, the button gets a touch smaller and moves 1 px down. Corners come from Shape.', fields: [['go-hover', 'Link under the hand']], axes: true, place: { page: 'product', block: '#buy' } },
  ] },
  { id: 'admin', name: 'Admin', subs: [
    { id: 'header', name: 'Header', hint: 'The layout of the header.', fields: [['logo', 'Logo'], ['header', 'Layout'], ['nav-current', 'Current page'], ['cart-sign', 'Cart sign'], ['cart-meta', 'Cart shows']], place: { block: 'body' } },
    /* Полка (И400): одежда карточки, пропорция снимка — одна с картой
       товара, — место кнопки «в корзину» и сколько карточек в ряд на полке
       каталога. */
    { id: 'card', name: 'Card', hint: 'How a product card sits on the shelf. Pictures are square everywhere: on shelves and on the product page.', fields: [['card', 'Product card'], ['pager-look', 'Show more and pages'], ['filter-look', 'Filter on a laptop'], ['filter-phone', 'Filter on a phone'], ['save-look', 'Heart']], place: { page: 'catalog', block: '[data-product-card]' } },
    /* Главная (lib/homes.ts): одежда плиток эффектов; раскладок главной
       на выбор больше нет (И596). */
    { id: 'home', name: 'Home', hint: 'How the effect tiles on the home page are dressed, and whether their text is capitalised or all capitals. The pictures and names stay the same. Categories stand as buttons on the hero picture.', fields: [['door-case', 'Tile text'], ['home', 'Tiles']], place: { page: 'home', block: '#effects-rail' } },
    /* Подложка секций главной (И591): строка на каждый блок реестра — список
       приходит из каталога (`bands`), новый блок добавляется сам. */
    { id: 'sections', name: 'Sections', hint: 'The background of each section of the home page: none, a quiet band, the brand tint or the dark tone. Sections appear here by themselves when the shop gets a new one.', fields: [], bands: true, place: { page: 'home', block: 'body' }, page: 'home&s=sections' },
    /* Карта товара (И278): доля ряда под галерею, край снимка, место
       миниатюр — значения `--pdp-*`; галерея при любом выборе помещается в
       экран. Пропорция снимка — в Card: она одна с полкой (И400). */
    { id: 'product', name: 'Product page', hint: 'How the product page shows its pictures. The gallery always fits the screen; open a product to see the change.', fields: [['pdp-gallery', 'Gallery width'], ['pdp-edge', 'Picture edge'], ['pdp-thumbs', 'Thumbnails'], ['seg-look', 'Options'], ['stock-look', 'Stock'], ['quick-look', 'Quick order'], ['star', 'Stars']], place: { page: 'product', block: 'body' } },
    /* Поле ввода (И390): одно на весь сайт — поиск, почта, касса; выбирается
       там, где полей больше всего, — на оформлении заказа (заказчик
       28.09.2026: «поля для чекаута должны быть на вкладке чекаута»). */
    { id: 'fields', name: 'Checkout', hint: 'The fields of the whole shop, shown on the checkout: the same field is the search in the header and the email box. One colour for every ticked box and radio, and how a form says «done» or «error». Corners come from Shape. A sample product is put in your cart so the checkout has its fields.', fields: [['field', 'Field'], ['field-label', 'Label'], ['tick', 'Ticked boxes'], ['pair-look', 'Field and button'], ['say-look', 'Messages']], place: { page: 'checkout', block: 'main form' } },
    /* Нарисованные элементы набора (build-catalog.mjs, copyElements): все
       живьём; у стоящего выбором — где он в панели, у прочих — «места на
       витрине пока нет». */
    { id: 'elements', name: 'Elements', hint: 'Every element drawn for the kit, live in the kit palette. Where an element is already a choice in this panel, it says where; the rest have no place on the shop yet — name the number and it gets one.', fields: [] },
  ] },
]
/** Поля-разметка: другой вариант — другая разметка страницы, черновик и перезагрузка. */
export const STRUCTURE = ['header', 'card', 'home']
/** Выбор, который меняет разметку страницы: другой вариант — черновик и перезагрузка. Подложка секции — значение вида, но рисуется разметкой (`data-tone`, И591). */
export const RELOADS = (field) => STRUCTURE.includes(field) || field.startsWith('band-')
/** Разделы этого каталога: подраздел Buttons — оси кнопки каталога. */
/** @param {{ axes?: { field: string, name: string }[], bands?: { field: string, name: string }[] }} catalog @returns {{ id: string, name: string, subs: Sub[] }[]} */
export const sectionsOf = (catalog) => SECTIONS.map((s) => ({ ...s, subs: s.subs.map((sub) => (sub.axes ? { ...sub, fields: [...sub.fields, ...(catalog.axes ?? []).map((a) => [a.field, a.name])] } : sub.bands ? { ...sub, fields: (catalog.bands ?? []).map((a) => [a.field, a.name]) } : sub)) }))
/** Поля выбора этого каталога. */
/** @param {{ axes?: { field: string, name: string }[] }} catalog @returns {string[]} */
export const fieldsOf = (catalog) => sectionsOf(catalog).flatMap((s) => s.subs.flatMap((sub) => sub.fields.map((f) => f[0])))
/** Поля-значения: вариант — значения свойств сайта. */
/** @param {{ axes?: { field: string, name: string }[] }} catalog @returns {string[]} */
export const valuesOf = (catalog) => fieldsOf(catalog).filter((f) => !STRUCTURE.includes(f))
/** Группа правила сайта (lib/look-rule.ts) для поля: оси кнопки — `button`. */
export const ruleGroup = (field) => (field.startsWith('btn-') ? 'button' : field)
/** Своя палитра из строителя — вариант палитры вне каталога. */
export const CUSTOM = 'custom'

const option = (catalog, field, id) => (catalog.groups[field] ?? []).find((o) => o.id === id) ?? null

/** Поля, переехавшие под новое имя: новое ← прежнее. Вид, опубликованный до
 *  переезда, несёт выбор под прежним именем — он переносится, а не
 *  теряется: пропорция снимка стала одной на полку и карту (И400). */
/** Имя поля в выборе — под нынешним именем или, у переехавшего, под прежним. */
const nameOf = (names, f) => names?.[f]

/** Пилюля кнопки переехала из оси Buttons → Shape в ручку Shape → Corners: у
 *  каждого набора углов близнец «· pill» (слово заказчика 04.10.2026: «не реагируют
 *  кнопки на настройку панели, не меняется форма» — Corners кнопок не трогал, их
 *  держала пилюля оси). Вид, опубликованный до переезда, несёт прежний id формы:
 *  форма получает нынешний, углы — своего близнеца с пилюлей, и сайт выглядит как
 *  прежде. Прежние id в каталоге больше не стоят, поэтому перенос однозначен и
 *  второй раз ничего не меняет. */
const MOVED_SHAPES = { pill: 'standard', 'pill-outline': 'outline', 'arrow-end': 'arrow', 'arrow-end-outline': 'arrow-outline' }
/** Имена вида, выбранные до переезда, — под нынешними; без переезда — тот же объект. */
export function migrate(names) {
  const was = names?.['btn-shape']
  if (!was || !Object.hasOwn(MOVED_SHAPES, was)) return names
  const corners = names.corners ?? 'standard'
  return { ...names, 'btn-shape': MOVED_SHAPES[was], corners: corners.endsWith('-pill') ? corners : `${corners}-pill` }
}

/** Имена → полный выбор: чего нет или что незнакомо — умолчание каталога.
 *  Своя палитра остаётся своей. */
export function complete(names, catalog) {
  names = migrate(names)
  return Object.fromEntries(fieldsOf(catalog).map((f) => [f, option(catalog, f, nameOf(names, f)) || (f === 'palette' && names?.[f] === CUSTOM) ? nameOf(names, f) : catalog.defaults[f]]))
}

/* ── Своя палитра: движок набора ─────────────────────────────────────── */

const HEX = /^#[0-9a-f]{6}$/i
const PAINTS = ['paper', 'ink', 'accent']
/** Три краски на тему годны: `#RRGGBB` у бумаги, чернил и марки. */
export const validPaints = (p) => !!p && ['light', 'dark'].every((t) => p[t] && PAINTS.every((k) => HEX.test(p[t][k] ?? '')))
/** Краски палитры значениями: роли обеих тем парой `light-dark()` — так же,
 *  как их пишет styles/palette.css набора (tools/palette.mjs, toCss). */
export function paletteVars(paints) {
  const light = roles(paints.light, 'light')
  const dark = roles(paints.dark, 'dark')
  return Object.fromEntries(Object.keys(light).map((k) => [k, `light-dark(${light[k]}, ${dark[k] ?? light[k]})`]))
}
/** Краски карточки товара для образца палитры в развёрнутой панели — те же
 *  роли, которыми сайт красит карточку (`steps` каталога — какими ступенями),
 *  по теме: пол страницы, лист, чернила, тихий текст, главная кнопка и знак
 *  на ней, плашка скидки, вуаль под снимком (И295: краски — строителя). */
export function tileOf(paints, steps) {
  return Object.fromEntries(['light', 'dark'].map((mode) => {
    const r = roles(paints[mode], mode)
    const at = (role) => r[steps[role][mode]]
    /* Образец набора — кусок магазина его красками (его рисует ui/swatch.mjs
       в развёрнутой панели и на странице дизайн-системы;
       И569, И575): шапка, карточка, лист корзины с полем, сигналы, подвал. */
    return [mode, {
      page: at('page'), plate: at('plate'), ink: at('ink'), soft: at('inkSoft'), pop: at('pop'), onPop: at('onPop'), sale: r['--sale-9'], onSale: r['--on-sale-9'], pic: r['--quiet-on-paper'],
      deck: r['--chrome-bg'], onDeck: r['--chrome-fg'], deckSoft: r['--chrome-fg-2'], quiet: r['--quiet-paper'], rule: r['--rule-paper'],
      ok: r['--ok-11'], okTint: r['--ok-2'], warn: r['--warn-11'], warnTint: r['--warn-2'], err: r['--e-11'], errTint: r['--e-2'], info: r['--info-11'], infoTint: r['--info-2'],
      field: r['--field-paper'], edge: r['--border'], star: r['--star-trade'], popInk: r['--a-11'],
    }]
  }))
}
/** Семь семей по двенадцать ступеней в теме — для сетки шкалы. */
export function families(paints, mode) {
  const set = withSale(paints[mode], mode)
  const n = scale(set.paper, set.ink, null, mode)
  const names = { error: 'Error', sale: 'Sale', warn: 'Warn', ok: 'In stock', info: 'Info' }
  return [['Neutral', n], ['Brand', scale(set.paper, set.ink, set.accent, mode, n[1])],
    ...STATUS.map((job) => [names[job], scale(set.paper, set.ink, set[job], mode, n[1])])]
}
/** Замер своей палитры: строки для людей (обе темы, число и норма) и
 *  находки замера набора (`auditPalette`) — все, и те, что в строки не
 *  вошли. `steps` — какими ступенями сайт красит страницу (каталог, `steps`). */
export function paletteChecks(paints, steps) {
  const rows = []
  const extra = []
  for (const mode of ['light', 'dark']) {
    const r = roles(paints[mode], mode)
    const set = withSale(paints[mode], mode)
    const at = (role) => r[steps[role][mode]]
    const n = Array.from({ length: 12 }, (_, i) => r[`--n-${i + 1}`])
    const row = (id, label, got, need, unit = ':1') => rows.push({ id, label, mode, got: Math.floor(got * 100) / 100, need, unit, pass: got >= need })
    row('page', 'Text on page', ratio(at('ink'), at('page')), NEED.text)
    row('card', 'Text on card', ratio(n[11], n[1]), NEED.text)
    row('card-lc', 'Text on card', apca(n[11], n[1]), NEED.mainLc, 'Lc')
    row('muted', 'Muted text', ratio(n[10], n[1]), NEED.text)
    row('muted-lc', 'Muted text', apca(n[10], n[1]), NEED.mutedLc, 'Lc')
    row('loud', "Loud button's text", ratio(inkOn(r['--a-9']), r['--a-9']), NEED.text)
    row('apart', 'Brand apart from signals', Math.min(...['error', 'sale', 'warn', 'ok', 'info'].map((j) => difference(set.accent, set[j]))), NEED.brandApart, 'ΔE')
    row('sale', 'Sale badge text', ratio(r['--on-sale-9'], r['--sale-9']), NEED.text)
    row('ring', 'Focus ring on every surface', Math.min(...GROUNDS(n).map((bg) => ratio(r['--ring'], bg))), NEED.control)
    /* Роли кнопки и сцены — строки замера строителя (groundChecks, И295): те
       же числа, что у check:palette, из той же копии движка. */
    const g = Object.fromEntries(groundChecks(paints[mode], mode).map((c) => [c.id, c]))
    for (const [id, label] of Object.entries(GROUND_LABELS)) row(id, label, g[id].got, g[id].need, g[id].unit)
    for (const f of auditPalette(paints[mode], mode)) extra.push({ label: f.rule, mode, got: f.got, need: f.need, pass: false })
  }
  return { rows, extra, ok: rows.every((x) => x.pass) && !extra.length }
}

/** Строки замера ролей по полу — по-английски для заказчика. */
const GROUND_LABELS = {
  quiet: 'Quiet button on the page and cards', 'quiet-deck': 'Quiet button on the dark band',
  trail: "Main button's trail chevrons on the page and cards", 'trail-deck': "Main button's trail chevrons on the dark band",
  'edge-off': "Disabled button's edge on the page and cards", 'edge-off-deck': "Disabled button's edge on the dark band",
  'pop-deck': 'Main button on the dark band, under the hand', scrim: 'Hero text over a white photo',
  /* Палуба на своём полу, счётчик на кнопке, подпись на снимке (И450–И452). */
  'chrome-fg-2': 'Quiet words on the band', 'chrome-hover': 'A control at rest on the band', 'chrome-hover-text': 'Words on a control at rest on the band',
  'chrome-plate': 'A plate on the band', 'chrome-plate-text': 'Words on a plate on the band', 'ring-deck': 'Focus ring on the band',
  'pop-press-deck': 'Main button on the band, pressed',
  'quiet-pop': 'Counter on the buy button', 'quiet-pop-text': 'Number on the buy button counter',
  'quiet-pop-deck': 'Counter on the buy button on the band', 'quiet-pop-deck-text': 'Number on the counter on the band',
  caption: 'Caption over a white photo, at the letter edge',
  /* Поле на палубе и целое сайта (И549, И554). */
  'border-deck': 'Field edge on the dark band',
  'deck-order': 'At night the dark band stays below the cards, as by day',
  'sale-kin': "Sale is red (or the shop's own colour), not a third hue",
  /* Каждый пол, а не один (И556). */
  'border-floors': 'Field and checkbox edges show on every surface',
  'soft-floors': 'Muted text reads on every surface',
  /* Полоса отличима от страницы в обеих темах (И568). */
  'deck-apart': 'The dark band and footer stand apart from the page, day and night',
}

/** Обещания палитры для заказчика — спокойным списком: что гарантировано и
 *  числа для любопытных. Строка — несколько правил замера сразу. */
export function guarantees(paints, steps) {
  const m = paletteChecks(paints, steps)
  const of = (ids) => m.rows.filter((r) => ids.includes(r.id))
  return [
    { id: 'text', label: 'Text reads on the page and on cards', rows: of(['page', 'card', 'card-lc', 'muted', 'muted-lc']) },
    { id: 'buttons', label: 'Button and badge labels read', rows: of(['loud', 'sale', 'pop-deck']) },
    /* Кнопка по полу (И295): роли выпускает строитель, и каждая держит своё. */
    { id: 'quiet', label: 'The quiet button shows on the page, on cards and on the dark band', rows: of(['quiet', 'quiet-deck']) },
    { id: 'trail', label: "The main button's trail chevrons show on every surface", rows: of(['trail', 'trail-deck']) },
    { id: 'edge-off', label: 'A disabled button keeps a visible edge', rows: of(['edge-off', 'edge-off-deck']) },
    { id: 'hero', label: 'Hero text reads over any photo', rows: of(['scrim']) },
    { id: 'apart', label: 'The brand stands apart from sale and stock colours', rows: of(['apart']) },
    { id: 'ring', label: 'The focus ring shows on every surface', rows: of(['ring', 'ring-deck']) },
    { id: 'band', label: 'Words, controls and plates read on the band', rows: of(['chrome-fg-2', 'chrome-hover', 'chrome-hover-text', 'chrome-plate', 'chrome-plate-text', 'pop-press-deck']) },
    { id: 'counter', label: 'The counter on the buy button shows and its number reads', rows: of(['quiet-pop', 'quiet-pop-text', 'quiet-pop-deck', 'quiet-pop-deck-text']) },
    { id: 'caption', label: 'Captions over photos read without a veil', rows: of(['caption']) },
    { id: 'whole', label: 'Day and night keep one order of surfaces; no extra hues', rows: of(['deck-order', 'deck-apart', 'sale-kin', 'border-deck', 'border-floors', 'soft-floors']) },
  ].map((g) => ({ ...g, ok: g.rows.every((r) => r.pass) && (g.id !== 'text' || !m.extra.length) }))
}

/* ── Вид значениями ──────────────────────────────────────────────────── */

/** Вид значениями: свойства вариантов, шапка, карточка, главная, имена; шрифты —
 *  какие семейства и толщины загрузить (`need`); файлы кладёт публикация
 *  (scripts/fonts.mjs), до того `fonts` пуст. Своя палитра (`paints`) —
 *  значения из строителя и три краски на тему рядом, чтобы строитель её
 *  открыл снова. */
/** @typedef {{ name?: string, light: Record<string, string>, dark: Record<string, string>, intent?: Record<string, unknown> }} Paints */
/** @param {Record<string, string>} names @param {any} catalog @param {Paints | null} [paints] */
export function compose(names, catalog, paints = null) {
  const chosen = complete(names, catalog)
  const custom = chosen.palette === CUSTOM && validPaints(paints)
  if (chosen.palette === CUSTOM && !custom) chosen.palette = catalog.defaults.palette
  /** @type {Record<string, string>} */
  const vars = {}
  for (const f of valuesOf(catalog)) Object.assign(vars, f === 'palette' && custom ? paletteVars(paints) : option(catalog, f, chosen[f])?.vars ?? {})
  const need = option(catalog, 'face', chosen.face)?.fonts ?? []
  const set = option(catalog, 'palette', chosen.palette)
  const meta = custom ? { name: paints.name || 'Custom', light: paints.light, dark: paints.dark, ...(paints.intent ? { intent: paints.intent } : {}) } : set?.seed ? { name: set.name, ...set.seed } : null
  return { look: { header: chosen.header, card: chosen.card, home: chosen.home, vars, fonts: [], names: chosen, ...(meta ? { paints: meta } : {}) }, need }
}

/* ── Опубликованный вид — заново из имён (И352) ──────────────────────── */

/** Свойства, которые пишет поле: всё, что несут его варианты. */
const keysOf = (catalog, field) => new Set((catalog.groups[field] ?? []).flatMap((o) => Object.keys(o.vars ?? {})))
const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v)

/** Опубликованный вид, пересчитанный из ИМЁН нынешним каталогом и движком.
 *  Решение заказчика — имена; значения из них выводит набор, и когда каталог
 *  или движок меняются (у палитры появилась роль, у кнопки — ось), значения
 *  выводятся заново — из его выбора, а не из умолчаний стилей другой
 *  палитры. Имена, шапка, карточка, шрифты и краски — как были; меняются
 *  только значения.
 *
 *  Имя, которого в каталоге больше нет, не угадывается: группа держит
 *  прежние значения, имя называется (`kept`). Поле, которого при публикации
 *  ещё не было (в именах его нет), берёт умолчание каталога — то же, что
 *  показывает панель (`complete`); если прежние значения этой группы не
 *  совпадают с умолчанием, они остаются и называются: без слова заказчика
 *  видимое не меняется.
 *  @param {{ vars?: Record<string, string>, names?: Record<string, string>, paints?: Paints }} look @param {any} catalog */
export function reresolve(look, catalog) {
  const old = look?.vars ?? {}
  const given = look?.names ?? {}
  const names = migrate(given)
  /** @type {{ field: string, id: string | null, why: string }[]} */
  const kept = []
  /** @type {Record<string, string>} */
  const vars = {}
  const hold = (field, id, why) => {
    kept.push({ field, id, why })
    for (const k of keysOf(catalog, field)) if (Object.hasOwn(old, k)) vars[k] = old[k]
  }
  for (const f of valuesOf(catalog)) {
    const id = nameOf(names, f)
    if (f === 'palette' && id === CUSTOM) {
      if (validPaints(look?.paints)) Object.assign(vars, paletteVars(look.paints))
      else hold(f, id, 'own palette without its three paints per theme')
      continue
    }
    if (id !== undefined) {
      const o = option(catalog, f, id)
      if (o) Object.assign(vars, o.vars ?? {})
      else hold(f, id, `«${id}» is no longer in the catalog`)
      continue
    }
    const base = option(catalog, f, catalog.defaults[f])
    const def = base?.vars ?? {}
    const had = Object.fromEntries([...keysOf(catalog, f)].filter((k) => Object.hasOwn(old, k)).map((k) => [k, old[k]]))
    const is = (vs) => !Object.keys(had).some((k) => had[k] !== vs[k])
    /* Вариант, чьи значения набор переписал, узнаётся по прежним (`was` —
       псевдоним со сроком, как у переименованного имени): группа без имени
       стояла на нём и остаётся на нём, с нынешними значениями (И385).
       Прежние значения сверяются у каждого варианта группы, а не только у
       умолчания: умолчание каталога — выбор сайта, и он может быть другим
       (30.09.2026 сайт опубликовал супермягкую тень, а прежние значения
       есть у мягкой). */
    const prev = is(def) ? base : (catalog.groups[f] ?? []).find((o) => (o.was ?? []).some(is))
    if (prev) Object.assign(vars, prev.vars ?? {})
    else hold(f, null, 'no name, and its values are not the catalog default')
  }
  const added = Object.keys(vars).filter((k) => !Object.hasOwn(old, k))
  const changed = Object.keys(vars).filter((k) => Object.hasOwn(old, k) && old[k] !== vars[k])
  const dropped = Object.keys(old).filter((k) => !Object.hasOwn(vars, k))
  return { look: { ...look, ...(names !== given ? { names } : {}), vars }, added, changed, dropped, kept, same: same(old, vars) && names === given }
}

/** Свойства сайта, которым вид не даёт значения (И353): каждое из них взяло
 *  бы умолчание стилей сайта — краску или меру другого выбора рядом с
 *  выбранным. Годный вид не оставляет ни одного. */
/** @param {Record<string, string> | undefined} vars @param {Record<string, unknown>} slots */
export const uncovered = (vars, slots) => Object.keys(slots).filter((k) => !Object.hasOwn(vars ?? {}, k))

/** Пары, которые выбор нарушает. */
export const clashes = (names, pairs) => pairs.filter((p) => names[p.x.field] === p.x.id && names[p.y.field] === p.y.id)

/** С каким из текущих вариант не носится: { field, id, why } или null. */
export function blockedBy(field, id, names, pairs) {
  for (const p of pairs) {
    if (p.x.field === field && p.x.id === id && names[p.y.field] === p.y.id) return { field: p.y.field, id: p.y.id, why: p.why }
    if (p.y.field === field && p.y.id === id && names[p.x.field] === p.x.id) return { field: p.x.field, id: p.x.id, why: p.why }
  }
  return null
}

/** Имя варианта для людей. */
export const title = (catalog, field, id) => (field === 'palette' && id === CUSTOM ? 'Custom' : option(catalog, field, id)?.name ?? id)
