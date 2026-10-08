import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blockedBy, clashes, complete, compose, CUSTOM, fieldsOf, migrate, paletteChecks, paletteVars, reresolve, ruleGroup, sectionsOf, STRUCTURE, uncovered } from '../ui/choice.mjs'
import { toCss } from '../../tools/palette.mjs'
import { stripHeaders, stripPanel, stripVariants, OWNED } from '../scripts/remove.mjs'
import { pairsOf } from '../scripts/pairs.mjs'
import { parseFaces } from '../scripts/fonts.mjs'
import { acceptLook, problems, type Facts } from '../../lib/look-rule.ts'
import { valid, type Slots } from '../../lib/look-values.ts'
import { HEADERS } from '../../lib/headers.ts'
import { CARDS } from '../../lib/cards.ts'
import { HOMES } from '../../lib/homes.ts'
import { availability } from '../../tools/buttons.mjs'

/* Тесты панели вида — уходят вместе с ней (`npm run test:panel`). */
const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')
type Paints = { light: Record<string, string>; dark: Record<string, string> }
type Option = { id: string; name: string; line?: string; plan?: string[]; vars?: Record<string, string>; fonts?: { family: string; weights: number[] }[]; seed?: Paints; style?: unknown }
type Pair = { x: { field: string; id: string }; y: { field: string; id: string }; why: string }
const catalog = JSON.parse(read('look-panel/ui/catalog.json')) as { defaults: Record<string, string>; groups: Record<string, Option[]>; axes: { field: string; name: string }[]; pairs: Pair[]; steps: Record<string, Record<string, string>> }
const FIELDS = fieldsOf(catalog) as string[]
const SECTIONS = sectionsOf(catalog)
const { slots, facts } = JSON.parse(read('lib/look-slots.json')) as { slots: Slots; facts: Facts }

test('panel catalog: every variant is values of properties the site declares, each of its kind', () => {
  assert.deepEqual(Object.keys(catalog.groups).sort(), [...FIELDS].sort())
  for (const [field, list] of Object.entries(catalog.groups)) {
    /* Ось кнопки может стоять одним вариантом, пока каталог не вырос (И273). */
    assert.ok(list.length >= (field.startsWith('btn-') ? 1 : 2), `${field}: выбирать есть из чего`)
    for (const o of list) for (const [k, v] of Object.entries(o.vars ?? {})) {
      assert.ok(slots[k], `${field} «${o.id}»: ${k} — свойство сайта`)
      assert.equal(slots[k].group, ruleGroup(field), `${field} «${o.id}»: ${k} — свойство своей группы (ритм углов не меняет)`)
      assert.ok(valid(slots[k].type, v), `${field} «${o.id}»: ${k}: ${v}`)
    }
  }
  for (const f of FIELDS) assert.equal(catalog.defaults[f], catalog.groups[f][0].id, `${f}: умолчание — первый, вариант сайта`)
})

test('panel sections: every field sits in exactly one sub-tab; System is colour, type, spacing, layout, shape, buttons; fields sit on Checkout', () => {
  const placed = SECTIONS.flatMap((s) => s.subs.flatMap((sub) => sub.fields.map((f) => f[0])))
  assert.deepEqual([...placed].sort(), [...FIELDS].sort())
  assert.equal(new Set(placed).size, placed.length)
  assert.deepEqual(SECTIONS[0].subs.map((s) => s.name), ['Color', 'Type', 'Spacing', 'Layout', 'Shape', 'Buttons'])
  /* Вкладка — место на сайте (28.09.2026): у вкладок мест — страница и
     блок; поля — на вкладке оформления заказа. Шрифт, ритм и форма тоже
     ведут на живой образец — шапку товара и его части (И573–И576); без
     места остаются краска (свой образец — страница дизайна, И567), ширина и
     элементы. */
  const subs = SECTIONS.flatMap((s) => s.subs)
  const bare = subs.filter((s) => !s.place).map((s) => s.id)
  assert.deepEqual(bare, ['color', 'layout', 'elements'])
  assert.deepEqual(subs.find((s) => s.id === 'fields')!.place, { page: 'checkout', block: 'main form' })
  /* Варианты каталога — составом, а не порядком: первым каталог ставит
     вариант, выбранный на сайте (siteFirst), и порядок меняется с каждым
     выбором в панели (29.09.2026: заказчик выбрал ссылку «brand»).
     Ссылка под рукой (И397): своя краска, марка — элемент 11. */
  assert.deepEqual(catalog.groups['go-hover'].map((o) => o.id).sort(), ['plain', 'brand'].sort())
  /* Шапка cbdin (И430): знак корзины, сумма — умолчание — как было. Меню телефона,
     знаки шапки и отметка текущего пункта — не ручки (И634). */
  assert.deepEqual(['cart-sign', 'cart-meta'].map((f) => catalog.groups[f].map((o) => o.id).sort()), [['bag', 'cart'], ['count', 'sum']])
  assert.deepEqual(catalog.groups['nav-current'].map((o) => o.id).sort(), ['line', 'word'], 'отметка текущего раздела — черта или слово (И714)')
  for (const gone of ['marker', 'head-icons', 'drawer-look', 'menu-size']) assert.equal(catalog.groups[gone], undefined, `${gone}: ручки в панели нет`)
  /* Поле ввода (И390): один вид на сайт; кромка есть у каждого — вокруг
     или чертой снизу (WCAG 1.4.11); умолчание — то, что стоит у сайта. */
  assert.deepEqual(catalog.groups.field.map((o) => o.id).sort(), ['framed', 'outline', 'tone'].sort())
  for (const o of catalog.groups.field) assert.ok(/^var\(--/.test(o.vars!['--ctrl-field-edge']), `${o.id}: кромка — роль палитры`)
  /* Галочка (И392): одна краска отмеченного на сайт, умолчание — марка. */
  assert.deepEqual(catalog.groups.tick.map((o) => o.id).sort(), ['brand', 'ink'].sort())
  assert.deepEqual(SECTIONS[1].subs.find((s) => s.id === 'fields')!.fields.map((f) => f[0]), ['field', 'field-label', 'tick', 'pair-look', 'say-look'])
  /* Пара «поле и кнопка» (И421): порознь по умолчанию, встык — элемент 42. */
  assert.deepEqual(catalog.groups['pair-look'].map((o) => o.id).sort(), ['apart', 'joined'].sort())
  /* Сообщение формы (И420): строкой по умолчанию, заметкой — элементы 29, 31. */
  assert.deepEqual(catalog.groups['say-look'].map((o) => o.id).sort(), ['line', 'note'].sort())
  /* Место подписи (И394): над полем — умолчание, на кромке — элемент 47. */
  assert.deepEqual(catalog.groups['field-label'].map((o) => o.id).sort(), ['above', 'edge'].sort())
  assert.deepEqual(SECTIONS[1].subs.map((s) => s.name), ['Header', 'Card', 'Home', 'Sections', 'Product page', 'Checkout', 'Sign in', 'Elements'])
  /* Главная — одежда плиток эффектов (lib/homes.ts): варианты каталога — все
     одежды, по порядку; первая, нынешняя, — умолчание. */
  assert.deepEqual(catalog.groups.home.map((o) => o.id), [...HOMES])
  /* Раскладок главной и знаков на фишках в панели нет (И596): во вкладке — регистр имени и одежда. */
  assert.deepEqual(SECTIONS[1].subs.find((s) => s.id === 'home')!.fields.map((f) => f[0]), ['door-case', 'home'])
  assert.deepEqual(catalog.groups['door-case'].map((o) => o.id), ['sentence', 'caps'])
  assert.equal(catalog.groups['chip-sign'], undefined)
  /* Подложка секций (И591): строки — из каталога, по одной на блок реестра; у каждой четыре слова. */
  const rows = sectionsOf(catalog)[1].subs.find((s) => s.id === 'sections')!.fields.map((f) => f[0])
  assert.deepEqual(rows, ['band-effects', 'band-featured', 'band-story', 'band-reviews', 'band-posts', 'band-faq'])
  /* Первой в каталоге стоит выбранная на сайте, поэтому состав сверяется без порядка. */
  for (const f of rows) assert.deepEqual(catalog.groups[f].map((o) => o.id).sort(), ['brand', 'dark', 'none', 'quiet'])
  assert.equal(catalog.defaults.home, HOMES[0])
  for (const o of catalog.groups.home) assert.ok(o.name && o.line, `${o.id}: имя и строка`)
  /* Карта товара (И278): доля ряда, край снимка, миниатюры — значения
     `--pdp-*`, умолчание — то, что стоит у сайта. Полка (И400): одежда,
     пропорция снимка — одна на полку и карту — и плотность полки. */
  const product = SECTIONS[1].subs.find((s) => s.id === 'product')!
  assert.deepEqual(product.fields.map((f) => f[1]), ['Gallery width', 'Picture edge', 'Thumbnails', 'Options', 'Stock', 'Quick order', 'Stars'])
  assert.deepEqual(catalog.groups['seg-look'].map((o) => o.id).sort(), ['chips', 'joined', 'tray', 'tiles', 'tint'].sort(), 'выбор варианта — пилюли по умолчанию (И396), плашки размера двумя видами (элемент 97)')
  assert.deepEqual(catalog.groups['stock-look'].map((o) => o.id), ['sign', 'dot', 'word'], 'наличие — знак в круге по умолчанию, точка и слово вариантами')
  assert.deepEqual(catalog.groups['quick-look'].map((o) => o.id).sort(), ['tiles', 'rows'].sort(), 'быстрый заказ — плитки по умолчанию, строки вариантом (И470)')
  /* Форма входа (И780): своя вкладка, открывает страницу входа; на полу страницы по умолчанию, на листе — вариантом. */
  const signIn = SECTIONS[1].subs.find((s) => s.id === 'account')!
  assert.deepEqual(signIn.fields, [['auth-look', 'Form']])
  assert.equal(signIn.place?.page, 'account')
  assert.deepEqual(catalog.groups['auth-look'].map((o) => o.id).sort(), ['card', 'plain'], 'форма входа — на полу страницы и на листе')
  const card = SECTIONS[1].subs.find((s) => s.id === 'card')!
  assert.deepEqual(card.fields.map((f) => f[1]), ['Product card', 'Show more and pages', 'Filter on a laptop', 'Filter on a phone', 'Heart'])
  /* Листание страниц (образец 95): слова по умолчанию, три вида вариантами. */
  /* Сердце на снимке: стекло и bare; siteFirst первым ставит вид профиля. */
  assert.deepEqual(catalog.groups['save-look'].map((o) => o.id).sort(), ['bare', 'disc'], 'сердце — на стекле или без подложки; первым стоит опубликованный вид сайта')
  assert.deepEqual(catalog.groups['filter-look'].map((o) => o.id), ['drawer', 'bar'], 'фильтр на широком — шторка, как корзина (вид сайта), и строка раскрытий (И739); панель колонками снята 04.10.2026')
  assert.deepEqual(catalog.groups['filter-phone'].map((o) => o.id), ['drawer', 'pills'], 'фильтр на узком — шторка (вид сайта) и пилюли вбок (И739)')
  assert.deepEqual(catalog.groups['pager-look'].map((o) => o.id), ['count', 'rings', 'compact'], 'листание — «Показать ещё» со счётом и полоской по умолчанию, номера в кругах и «2 / 4» вариантами (И721)')
  assert.deepEqual(catalog.groups['pdp-gallery'].map((o) => o.id).sort(), ['40', '50', '60'])
  assert.deepEqual(catalog.groups['pdp-thumbs'].map((o) => o.name).sort(), ['Below', 'Dots', 'On the picture', 'Side'])
  for (const f of ['pdp-gallery', 'pdp-thumbs', 'pdp-edge', 'seg-look', 'stock-look', 'quick-look', 'auth-look']) assert.equal(catalog.groups[f][0].vars![`--${f}`], slots[`--${f}`].value, `${f}: умолчание — значение сайта`)
  const buttons = SECTIONS[0].subs.find((s) => s.id === 'buttons')!
  assert.deepEqual(buttons.fields.map((f) => f[0]), ['go-hover', ...catalog.axes.map((a) => a.field)], 'Buttons — свои поля подраздела (ссылка под рукой), потом оси каталога кнопки')
  assert.deepEqual(catalog.axes.map((a) => a.name), ['Main button', 'Quiet button', 'Button shape', 'Hand response'])
  assert.equal(catalog.groups['btn-letters'], undefined, 'регистр надписи — не ручка (И586)')
  assert.deepEqual(catalog.groups.width.map((o) => o.id).sort(), ['1440', '1280', '1600'].sort(), 'холст по умолчанию — 1440')
  /* У каждого набора углов — близнец «· pill»: кнопки полным кругом (`--r-btn`), остальные
     углы те же (заказчик 04.10.2026: «не реагируют кнопки на настройку панели»). */
  assert.deepEqual(catalog.groups.corners.map((o) => o.name).sort(), ['Crisp', 'Crisp · pill', 'Round', 'Round · pill', 'Square', 'Square · pill', 'Standard', 'Standard · pill'])
  for (const o of catalog.groups.corners) assert.equal(o.vars!['--r-btn'], o.id.endsWith('-pill') ? 'var(--r-pop)' : 'var(--r-ctrl)', o.id)
  /* Состав, а не порядок: первым каталог ставит выбор сайта (`siteFirst`). */
  assert.deepEqual(catalog.groups.shadow.map((o) => o.name).sort(), ['Flat', 'Soft', 'Supersoft'])
  for (const o of catalog.groups.corners) {
    const [ctrl, card, sheet] = ['--r-ctrl', '--r-card', '--r-sheet'].map((k) => Number.parseFloat(o.vars![k]))
    assert.ok(ctrl <= card && card <= sheet, `${o.name}: орган ≤ карточка ≤ лист`)
  }
  assert.ok(STRUCTURE.every((f) => SECTIONS[1].subs.some((s) => s.fields.some((x) => x[0] === f))), 'разметка — в Admin')
})

test('panel palette builder: the kit engine gives each catalog set the values the kit palette writes, and every set passes the checks', () => {
  for (const o of catalog.groups.palette) {
    const kit = Object.fromEntries([...toCss({ [o.id]: o.seed }).split('[data-palette=')[0].matchAll(/ {2}(--[\w-]+): ([^;]+);/g)].map((m) => [m[1], m[2]]))
    assert.deepEqual(paletteVars(o.seed!), kit, `${o.name}: движок панели = tools/palette.mjs`)
    assert.deepEqual(o.vars, kit, `${o.name}: каталог посчитан тем же движком`)
    const m = paletteChecks(o.seed!, catalog.steps)
    assert.ok(m.ok, `${o.name}: ${[...m.rows.filter((r: { pass: boolean }) => !r.pass), ...m.extra].map((r: { label: string; mode: string }) => `${r.label} ${r.mode}`).join(', ')}`)
  }
  const loud = { light: { paper: '#FFFFFF', ink: '#1F1E1C', accent: '#FFE600' }, dark: { paper: '#121110', ink: '#EDEBE8', accent: '#B8955A' } }
  const m = paletteChecks(loud, catalog.steps)
  assert.equal(m.ok, false, 'жёлтая марка на белом — не годится')
  assert.ok([...m.rows.filter((r: { pass: boolean }) => !r.pass), ...m.extra].length > 0)
  const own = compose({ ...catalog.defaults, palette: CUSTOM }, catalog, { name: 'Mine', ...loud })
  assert.equal(own.look.names.palette, CUSTOM)
  assert.deepEqual(own.look.paints, { name: 'Mine', ...loud }, 'три краски на тему — рядом со значениями')
  assert.equal(own.look.vars['--a-9'], paletteVars(loud)['--a-9'])
  assert.equal(compose({ palette: CUSTOM }, catalog).look.names.palette, catalog.defaults.palette, 'своя палитра без красок — умолчание')
})

test('panel catalog: the default look is accepted whole, and the published look gives every site property a value', () => {
  const { look } = compose(catalog.defaults, catalog)
  assert.deepEqual(acceptLook(look, slots, facts).notes, [])
  assert.deepEqual(uncovered(look.vars, slots), [], 'умолчание каталога покрывает каждое свойство сайта')
  /* И353: вид, старше каталога, не смешивается с умолчаниями стилей чужой
     палитры — сборка каталога пересчитывает его из имён (И352). */
  const published = JSON.parse(read('lib/source/sample/look.json'))
  assert.deepEqual(acceptLook(published, slots, facts).notes, [])
  assert.deepEqual(uncovered(published.vars, slots), [], 'опубликованный вид — значение каждому свойству сайта')
})


test('published look re-resolved from its names: new properties get values of the owner\'s choice, names stay, a vanished name keeps its group', () => {
  const palette = catalog.groups.palette.find((o) => o.id !== catalog.defaults.palette)!
  const names = { palette: palette.id, face: catalog.groups.face.at(-1)!.id, field: catalog.groups.field.at(-1)!.id }
  const full = compose(names, catalog).look
  /* Вид, опубликованный до новых ролей палитры, теней и формы кнопки. Роли
     приклеенного и окна (`--sh-sticky`, `--sh-modal`) пришли с шестью ролями
     теней (И726): прежние значения «Soft» (`was`) их не знают. */
  const newer = [...Object.keys(palette.vars!).slice(-5), '--sh-raised', '--sh-sticky', '--sh-modal']
  const old = { header: 'classic', vars: Object.fromEntries(Object.entries(full.vars).filter(([k]) => !newer.includes(k))), fonts: [], names }
  const r = reresolve(old, catalog)
  assert.deepEqual(r.look.names, names, 'имена — как были')
  assert.equal(r.look.names, names, 'тот же объект имён')
  assert.deepEqual(r.look.vars, full.vars, 'значения — из выбора заказчика, как у свежей публикации')
  assert.deepEqual([...r.added].sort(), [...newer].sort())
  assert.deepEqual([r.changed, r.dropped, r.kept, r.same], [[], [], [], false])
  assert.equal(reresolve(r.look, catalog).same, true, 'второй пересчёт ничего не меняет')
  /* Имени в каталоге больше нет — не угадывается: группа держит прежнее. */
  const gone = reresolve({ ...old, names: { ...names, face: 'gone' }, vars: { ...old.vars, '--face': "'Gone', var(--face-stack)" } }, catalog)
  assert.deepEqual(gone.kept, [{ field: 'face', id: 'gone', why: '«gone» is no longer in the catalog' }])
  assert.equal(gone.look.vars['--face'], "'Gone', var(--face-stack)")
  /* Поля не было при публикации: умолчание каталога — если прежние значения
     группы и есть умолчание; иначе прежние остаются и называются. */
  const width = catalog.groups.width.find((o) => o.id !== catalog.defaults.width)!
  const unnamed = reresolve({ ...old, vars: { ...old.vars, ...width.vars } }, catalog)
  assert.deepEqual(unnamed.kept.map((k) => k.field), ['width'])
  assert.equal(unnamed.look.vars['--wrap'], width.vars!['--wrap'])
  /* Умолчание, которое набор переписал (И385): прежние значения «Soft»
     узнаются по `was` — группа без имени пересчитывается на нынешнее. */
  /* «Мягкая» — по имени: умолчание каталога — выбор сайта, и у сайта может
     стоять другая тень (30.09.2026 опубликована супермягкая). */
  const soft = catalog.groups.shadow.find((o) => o.id === 'soft')!
  const was = (soft as { was?: Record<string, string>[] }).was?.[0]
  assert.ok(was, 'у умолчания теней нет прежних значений')
  const moved = reresolve({ ...old, vars: { ...old.vars, ...was } }, catalog)
  assert.deepEqual(moved.kept, [])
  assert.equal(moved.look.vars['--sh-in'], soft.vars!['--sh-in'])
  /* Своя палитра — из её трёх красок на тему, тем же движком. */
  const own = { light: { paper: '#FBFAF7', ink: '#1F1E1C', accent: '#2F6B4F' }, dark: { paper: '#121110', ink: '#EDEBE8', accent: '#7FB89A' } }
  const custom = reresolve({ ...old, names: { ...names, palette: CUSTOM }, paints: { name: 'Mine', ...own } }, catalog)
  assert.deepEqual(Object.fromEntries(Object.keys(paletteVars(own)).map((k) => [k, custom.look.vars[k]])), paletteVars(own))
  assert.deepEqual(custom.kept, [])
})

test('panel pairs: each listed pair is a problem of the site rule, and the guard finds it from both sides', () => {
  const base = Object.fromEntries(Object.entries(slots).map(([k, s]) => [k, s.value]))
  /* Наборы набора доведены строителем (И285), и каталог может не нести ни
     одной пары. Сторож при этом жив: бледная палитра не носится с вуалью тихой
     кнопки, и та же функция, что у /look-panel/guard, это находит. Чернила
     «Аптеки» до 24.09.2026 (#24352B) строитель теперь кладёт вуалью плотнее
     (1.17 : 1 — проходит), поэтому образец — чернила светлее, #4A5550: вуаль
     1.13 : 1 при пороге 1.15, а надпись и поле ещё читаются (замер 04.10.2026). */
  const pale = { light: { paper: '#FEFCF5', ink: '#4A5550', accent: '#B79339' }, dark: { paper: '#0C1510', ink: '#EDECE9', accent: '#B79339' } }
  const guard = pairsOf({ groups: { ...catalog.groups, palette: [{ id: CUSTOM, vars: paletteVars(pale) }] }, fields: FIELDS.filter((f) => !STRUCTURE.includes(f)), base, facts, problems, only: 'palette' })
  assert.ok(guard.some((p) => p.y.field === 'btn-quiet' && /quiet button fades/.test(p.why)), JSON.stringify(guard))
  const opt = (field: string, id: string) => catalog.groups[field].find((o) => o.id === id)!
  for (const p of catalog.pairs) {
    const x = opt(p.x.field, p.x.id)
    const y = opt(p.y.field, p.y.id)
    const fonts = [x, y].flatMap((o, i) => ([p.x.field, p.y.field][i] === 'face' ? o.fonts ?? [] : []))
      .map((f) => ({ family: f.family, files: f.weights.map((w) => ({ url: '', weight: String(w), range: '' })) }))
    assert.ok(problems({ ...base, ...x.vars, ...y.vars }, fonts, facts).some((q) => q.why === p.why), `${p.x.id} × ${p.y.id}`)
    const names = complete({ [p.x.field]: p.x.id, [p.y.field]: p.y.id }, catalog)
    assert.equal(clashes(names, catalog.pairs).length >= 1, true)
    assert.equal(blockedBy(p.x.field, p.x.id, names, catalog.pairs)?.id, p.y.id)
    assert.equal(blockedBy(p.y.field, p.y.id, names, catalog.pairs)?.id, p.x.id)
  }
})

test('panel pairs: every button axis option × palette agrees with the kit button audit on every catalog palette', () => {
  /* Каталог кнопки — оси: вариант каждой оси меряется набором своими ролями. */
  const buttons = Object.fromEntries(catalog.axes.map((a) => [a.field.slice(4), { имя: a.name, name: a.name, варианты: Object.fromEntries(catalog.groups[a.field].map((o) => [o.id, { имя: o.name, name: o.name, что: o.name, роли: o.vars }])) }]))
  const palettes = Object.fromEntries(catalog.groups.palette.map((o) => [o.id, o.seed]))
  const { off, clash } = availability(buttons, palettes) as unknown as { off: Record<string, unknown>; clash: Record<string, Record<string, unknown>> }
  for (const a of catalog.axes) {
    for (const o of catalog.groups[a.field]) {
      const style = `${a.field.slice(4)}/${o.id}`
      for (const palette of Object.keys(palettes)) {
        const kit = Boolean(off[style] || clash[style]?.[palette])
        const site = catalog.pairs.some((p) => p.x.field === 'palette' && p.x.id === palette && p.y.field === a.field && p.y.id === o.id)
        assert.equal(site, kit, `${style} × ${palette}`)
      }
    }
  }
})

test('panel removal: the panel lines go, the chosen header stays without its marks', () => {
  assert.deepEqual(OWNED, ['look-panel', 'app/look-panel', 'app/[lang]/(look-panel)'])
  const shell = stripPanel(read('components/Shell.tsx'))
  assert.ok(!shell.includes('look-panel'))
  assert.match(shell, /<style href="look" precedence="look">/)
  for (const chosen of HEADERS) {
    const tsx = stripHeaders(read('components/Header.tsx'), chosen)
    assert.ok(!tsx.includes('look-header'), `${chosen}: меток не осталось`)
    for (const h of HEADERS) assert.equal(tsx.includes(`data-variant="${h}"`), h === chosen, `${chosen}: ${h}`)
    const list = stripHeaders(read('lib/headers.ts'), chosen)
    assert.match(list, new RegExp(`HEADERS = \\[\\n  '${chosen}',\\n\\] as const`))
    const css = stripHeaders(read('components/Header.module.css'), chosen)
    assert.ok(!css.includes('look-header'))
    assert.equal(css.includes("[data-variant='boutique']"), chosen === 'boutique')
    assert.equal(css.includes('.field{'), chosen === 'search', `${chosen}: широкое поле поиска — только у search`)
  }
  for (const chosen of CARDS) {
    const css = stripVariants(read('components/ProductCard.module.css'), 'look-card', chosen)
    assert.ok(!css.includes('look-card'), `${chosen}: меток не осталось`)
    for (const c of CARDS) assert.equal(css.includes(`[data-card='${c}']`), c === chosen, `${chosen}: ${c}`)
    assert.ok(!/\/\*[^*]*$/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), `${chosen}: комментарии закрыты`)
    assert.match(stripVariants(read('lib/cards.ts'), 'look-card', chosen), new RegExp(`CARDS = \\[\\n  '${chosen}',\\n\\] as const`))
  }
  /* Главная: снятие оставляет одежду плиток и её правила только выбранной;
     метки и следы снятия уходят, комментарии закрыты. */
  const HOME_FILES = ['lib/homes.ts', 'components/blocks/Doors.tsx', 'components/blocks/blocks.module.css']
  for (const chosen of HOMES) {
    for (const f of HOME_FILES) {
      const text = stripVariants(read(f), 'look-home', chosen)
      assert.ok(!text.includes('look-home') && !text.includes('look:remove'), `${chosen}: ${f} — меток не осталось`)
      assert.ok(!/\/\*[^*]*$/.test(text.replace(/\/\*[\s\S]*?\*\//g, '')), `${chosen}: ${f} — комментарии закрыты`)
      for (const other of HOMES.filter((h) => h !== chosen)) assert.ok(!new RegExp(`^\\s+${other}: `, 'm').test(text), `${chosen}: ${f} — нет строки варианта ${other}`)
    }
    assert.match(stripVariants(read('lib/homes.ts'), 'look-home', chosen), new RegExp(`HOMES = \\[\\n  '${chosen}',\\n\\] as const`))
    assert.equal((stripVariants(read('components/blocks/blocks.module.css'), 'look-home', chosen).match(/data-door='[a-z]+'\]/g) ?? []).every((m: string) => m.includes(`'${chosen}'`)), true, `${chosen}: правила только своей одежды`)
  }
})

test('panel fonts: the Google CSS gives one file per face of the latin and cyrillic subsets, variable fonts as a weight range', () => {
  const css = ['latin-ext', 'latin', 'cyrillic'].flatMap((subset) => [400, 700].map((w) => `/* ${subset} */\n@font-face {\n  font-family: 'Inter';\n  font-weight: ${w};\n  src: url(https://fonts.gstatic.com/s/inter/v1/${subset}.woff2) format('woff2');\n  unicode-range: U+0000-00FF, U+0131;\n}`)).join('\n')
  const faces = parseFaces(css)
  assert.deepEqual(faces.map((f) => [f.subset, f.weights]), [['latin-ext', [400, 700]], ['latin', [400, 700]], ['cyrillic', [400, 700]]])
})

/* Рынок с другим письмом (греческий) берёт и своё подмножество: оно выбирается
   по диапазону знаков, а не по имени из списка (И769). */
test('panel fonts: a subset beyond latin and cyrillic is fetched when a market letter falls in its range', () => {
  const block = (subset: string, range: string) => `/* ${subset} */\n@font-face {\n  font-family: 'Inter';\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/inter/v1/${subset}.woff2) format('woff2');\n  unicode-range: ${range};\n}`
  const css = [block('greek', 'U+0370-03FF'), block('vietnamese', 'U+0102-0103'), block('latin-ext', 'U+0100-02BA'), block('latin', 'U+0000-00FF')].join('\n')
  assert.deepEqual(parseFaces(css).map((f) => f.subset), ['latin-ext', 'latin'])
  assert.deepEqual(parseFaces(css, new Set([0x3b1, 0x61])).map((f) => f.subset), ['greek', 'latin-ext', 'latin'])
  /* ă — румынская, и она уже в расширенной латинице: вьетнамский файл не нужен. */
  assert.deepEqual(parseFaces(css, new Set([0x103])).map((f) => f.subset), ['latin-ext', 'latin'])
})

/* Скрипт панели отдаётся браузеру как есть, без сборки: ни tsc, ни сборка
   сайта его не разбирают. 28.09.2026 перенос строки внутри строки в
   look.js («join('↵')») уронил весь скрипт — панели не стало на витрине,
   а все проверки стояли зелёными. Разбор — здесь. */
test('panel scripts parse: the browser gets look.js as is, and a syntax error removes the whole panel', () => {
  for (const file of ['../ui/look.js']) {
    const src = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.doesNotThrow(() => new Function(src), `${file} не разбирается`)
  }
})

/* Пилюля кнопки переехала из оси Buttons → Shape в Corners (04.10.2026): вид, выбранный
   до переезда, переносится без потерь — форма под нынешним id, углы — свой близнец «· pill». */
test('a look chosen with the old pill button shape moves to the pill twin of its corners', () => {
  assert.deepEqual(migrate({ corners: 'crisp', 'btn-shape': 'pill' }), { corners: 'crisp-pill', 'btn-shape': 'standard' })
  assert.deepEqual(migrate({ 'btn-shape': 'arrow-end-outline' }), { corners: 'standard-pill', 'btn-shape': 'arrow-outline' })
  const today = { corners: 'crisp', 'btn-shape': 'arrow' }
  assert.equal(migrate(today), today, 'нынешний выбор не трогается')
  assert.equal(complete({ corners: 'standard', 'btn-shape': 'pill' }, catalog).corners, 'standard-pill')
})
