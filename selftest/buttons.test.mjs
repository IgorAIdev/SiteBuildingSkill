/**
 * Каталог кнопки (И252, И273): оси данных — буквы, главная, тихая; вариант
 * оси — роли ОДНОЙ кнопки основы; каждый вариант меряется на палитре сайта в
 * обеих темах; выпуск только после замера. Угла, рода нажатия и тени в
 * каталоге нет: угол — Shape, нажатие — одно на всё нажимаемое.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, cpSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { axesOf, buttonRoles, auditButtons, availability, toCss, ROLES } from '../tools/buttons.mjs'

const KIT = fileURLToPath(new URL('..', import.meta.url))
const catalog = JSON.parse(readFileSync(join(KIT, 'styles/buttons.json'), 'utf8'))
const sitePalette = JSON.parse(readFileSync(join(KIT, 'styles/palette.json'), 'utf8'))
const samples = JSON.parse(readFileSync(join(KIT, 'templates/palette.json'), 'utf8'))
/* Бледный набор — «Аптека» до 24.09.2026: чернила #24352B давали тихой вуали
   1.14 : 1 на полу страницы. Сам набор с тех пор доведён строителем (И285),
   а замер кнопки должен по-прежнему называть такую вуаль — на образце. */
/* Бледный набор — чернила светлее, чем у живых наборов: вуаль тихой на странице не видна
   (1.13 : 1). С 04.10.2026 страница днём на второй ступени нейтрали (И699) — прежние чернила
   #24352B давали вуаль 1.15 и проходили. */
const pale = { 'Бледная': { light: { paper: '#FEFCF5', ink: '#3A4A40', accent: '#B79339' }, dark: { paper: '#0C1510', ink: '#EDECE9', accent: '#B79339' } } }
const btn = readFileSync(join(KIT, 'styles/btn.module.css'), 'utf8')

test('the catalog is independent axes of data; the defaults pass on the site palette', () => {
  assert.deepEqual(axesOf(catalog).map((a) => a.id), ['loud', 'quiet', 'shape', 'hand'])
  assert.deepEqual(axesOf(catalog)[2].options.map((o) => o.name), ['Standard', 'Standard · outline', 'Arrow end', 'Arrow end · outline', 'Chevron trail', 'Chevron trail · joined', 'Circle arrow', 'Circle arrow · outline'], 'форма главной — обычная по умолчанию')
  assert.deepEqual(axesOf(catalog)[1].options.map((o) => o.id), ['veil', 'outline', 'dash'], 'тихая — вуалью по умолчанию, как в ролях палитры; тон марки — вариант (И472)')
  assert.deepEqual(auditButtons(catalog, {}), [], 'каталог устроен')
  const { structure, off, on } = availability(catalog, sitePalette)
  assert.deepEqual(structure, [])
  assert.deepEqual(off, {})
  for (const a of axesOf(catalog)) assert.ok(on.includes(`${a.id}/${a.options[0].id}`), `${a.id}: вариант по умолчанию проходит`)
  assert.deepEqual(buttonRoles(catalog), { '--ctrl-btn-fill-pop': 'var(--pop)', '--ctrl-btn-ink-pop': 'var(--on-pop)', '--ctrl-btn-edge-pop': 'transparent', '--ctrl-btn-tint-pop': 'var(--pop)', '--ctrl-btn-frost-pop': '0', '--ctrl-btn-rim-pop': 'transparent', '--ctrl-btn-fill': 'var(--quiet)', '--ctrl-btn-ink': 'var(--ink)', '--ctrl-btn-edge': 'transparent', '--ctrl-btn-edge-hand': 'transparent', '--ctrl-btn-dash': '0', '--ctrl-btn-tip': '0', '--ctrl-btn-tip-at': '0', '--ctrl-btn-notch': '0', '--ctrl-btn-echo': 'none', '--ctrl-btn-trail-1': '0', '--ctrl-btn-trail-2': '0', '--ctrl-btn-mark': '0', '--ctrl-btn-glyph': '0', '--ctrl-btn-still': '0', '--ctrl-btn-swap': '0', '--ctrl-btn-hollow': '0', '--ctrl-btn-draw': '0', '--ctrl-btn-hand-edge': '1', '--ctrl-btn-hand-fill': '0' })
  assert.deepEqual(axesOf(catalog)[3].options.map((o) => o.id), ['darken', 'hold'], 'ответ на руку — кромка темнеет по умолчанию; держится — вариант (И588)')
})

test('the button reads every role the catalog may declare, each with a fallback; corners come from Shape; press is one', () => {
  for (const role of Object.keys(ROLES)) assert.ok(btn.includes(`var(${role},`), `btn.module.css не читает ${role}`)
  assert.doesNotMatch(btn, /--ctrl-btn-(r|r-pop|press|sh)\b/, 'угол, нажатие и тень — не роли каталога')
  assert.match(btn, /--btn-r:var\(--r-btn, var\(--r-ctrl\)\)/, 'угол — роль формы --r-btn: ручка Shape → Corners, близнец «· pill» — полный круг (04.10.2026)')
  /* Нажатие одно и у короткого касания пальцем: `data-press-feedback` ставит
     PressFeedback на миг касания, когда `:active` на телефоне мелькает невидимо. */
  assert.match(btn, /\.press:not\(:disabled\):not\(\[aria-disabled='true'\]\):active(?:,\s*\.press\[data-press-feedback\])?\{[^}]*transform:var\(--press-move\)/, 'нажатие — одна роль движения (И477)')
  assert.match(readFileSync(join(KIT, 'styles/tokens.css'), 'utf8'), /--press-drop:1px;\s*--press-shrink:\.97;\s*--press-move:translateY\(var\(--press-drop\)\) scale\(var\(--press-shrink\)\)/, 'нажатие: чуть меньше и на пиксель ниже')
  assert.match(btn, /\.btn\{\s*composes:press;/, 'кнопка берёт нажатие, а не рисует своё')
  assert.match(btn, /prefers-reduced-motion:reduce[\s\S]*transform:none/, 'меньше движения — только цвет')
  /* Форма главной (И276): режется подложка, а не кнопка — кольцо фокуса и
     цель остаются прямоугольником; надпись не заходит в остриё и в кружок у
     конца (форма «Кружок со стрелкой», 25.09.2026). */
  assert.match(btn, /\.btn\[data-voice='loud'\]::before\{[^}]*clip-path:polygon\(0 0, calc\(100% - var\(--btn-tip\)\) 0/)
  assert.match(btn, /--btn-tip:calc\(var\(--btn-h\) \* var\(--ctrl-btn-tip, 0\)\)/, 'контур — от высоты самой кнопки')
  assert.match(btn, /padding-inline-end:calc\(var\(--btn-h\) \* \.45 \+ var\(--btn-tip\) \* \.7 \+ var\(--btn-h\) \* \.8 \* var\(--btn-mark\) \+ var\(--btn-h\) \* \.32 \* var\(--btn-glyph\)\)/, 'надпись не заходит в остриё, в кружок и в стрелку у конца')
  /* Стрелка в кружке — знак из листа (вид `#arrow-right-view`), не свой рисунок. */
  assert.match(btn, /--btn-sign:var\(--sign-mask-arrow-right\)/, 'стрелка кружка — маска знака из его файла, не фрагмент листа')
  /* Маска заливки не держится за краску надписи: проверка контраста красит
     буквы в прозрачное, чтобы снять дно, — и заливка гасла вместе с ними. */
  assert.doesNotMatch(btn, /mask:[^;]*currentColor/, 'сплошной слой маски — не currentColor')
  assert.doesNotMatch(btn.match(/\.btn\{[^}]*\}/)[0], /clip-path/, 'сама кнопка не режется')
  /* Ответ знака на руку (И622, И623): хвост наливается волной — тоны на
     кнопке и в переходе; стрелка без кружка вытягивается в окне маски;
     в кружке — смена или рост; кнопка формы со знаком при нажатии стоит. */
  assert.match(btn, /--btn-trail-far var\(--hover-t\) var\(--ease\) calc\(var\(--hover-t\) \* \.4\)/, 'хвост наливается волной: дальний — с задержкой')
  assert.match(btn, /--btn-reveal:calc\(var\(--btn-glyph\)/, 'стрелка у конца вытягивается в окне маски')
  assert.match(btn, /var\(--btn-sign\) var\(--btn-arrow-in\)/, 'в кружке — входящая стрелка')
  assert.match(btn, /(?::active|\[data-press-feedback\])\{--press-fill:color-mix\(in oklab, var\(--press-bg\), var\(--press-ink\) var\(--state-press\)\);--btn-go:var\(--nudge\);--btn-hand:1;[^}]*transform:translateY\(calc\(var\(--press-drop\) \* \(1 - var\(--ctrl-btn-still, 0\)\)\)\)/, 'кнопка со знаком при нажатии стоит')
  for (const o of axesOf(catalog)[2].options) for (const k of ['--ctrl-btn-tip', '--ctrl-btn-tip-at', '--ctrl-btn-notch']) assert.ok(Number(o.роли[k]) >= 0 && Number(o.роли[k]) <= 1.5, `${o.id}: ${k} — доля высоты`)
  const css = toCss(catalog)
  assert.match(css, /^:root\{[\s\S]*?--ctrl-btn-fill-pop: var\(--pop\);/m)
  for (const a of axesOf(catalog)) for (const o of a.options) assert.ok(css.includes(`[data-button-${a.id}="${o.id}"]{`), `${a.id}/${o.id}`)
})

test('the audit runs on every sample palette and names option, palette and theme; a quiet veil too pale for its floor is named', () => {
  assert.deepEqual(auditButtons(catalog, samples), [], 'каждый набор набора носит каждую кнопку каталога (И285)')
  const found = auditButtons(catalog, { ...samples, ...pale })
  for (const f of found) assert.ok(f.style && f.palette && f.theme && f.rule, JSON.stringify(f))
  assert.ok(found.some((f) => f.style === 'quiet/veil' && f.palette === 'Бледная' && f.part === 'quiet-fill'), 'вуаль тихой на бледном наборе 1.13 : 1')
  const { clash } = availability(catalog, { ...samples, ...pale })
  assert.ok(clash['quiet/veil']?.['Бледная'])
  assert.ok(!clash['quiet/veil']?.['Аптека'], '«Аптека» доведена: вуаль видна')
})

/* Каталог растёт осями данными: новый вариант — запись в JSON; замер и
   выпуск подхватывают его без правки кода. */
test('a new option is data: the audit measures it and the emitter writes it', () => {
  const grown = structuredClone(catalog)
  grown.loud.варианты.tone = { имя: 'Тон', name: 'Tone', что: 'тон марки, тёмная надпись', роли: { '--ctrl-btn-fill-pop': 'var(--a-4)', '--ctrl-btn-ink-pop': 'var(--a-11)', '--ctrl-btn-edge-pop': 'transparent', '--ctrl-btn-tint-pop': 'transparent', '--ctrl-btn-frost-pop': '0', '--ctrl-btn-rim-pop': 'transparent' } }
  grown.quiet.варианты.edge = { имя: 'Кромка', name: 'Edge', что: 'без вуали, кромка органа', роли: { '--ctrl-btn-fill': 'transparent', '--ctrl-btn-ink': 'var(--ink)', '--ctrl-btn-edge': 'var(--edge)', '--ctrl-btn-edge-hand': 'var(--edge-hand)', '--ctrl-btn-dash': '0' } }
  assert.deepEqual(auditButtons(grown, {}), [])
  const { clash, off, on } = availability(grown, { ...samples, ...pale })
  assert.ok(on.includes('quiet/edge'), 'кромка тихой проходит')
  assert.ok(!clash['quiet/edge']?.['Бледная'] && clash['quiet/veil']?.['Бледная'], 'кромка тихой на бледном наборе проходит там, где вуаль — нет')
  assert.ok(off['loud/tone']?.every((f) => f.part === 'loud-fill'), 'тон марки не виден на полу ни одного образца — назван и не выпускается')
  assert.doesNotMatch(toCss(grown, off, clash), /data-button-loud="tone"/, 'не прошедший замер не выпущен')
  assert.match(toCss(grown), /\[data-button-loud="tone"\]\{\n {2}--ctrl-btn-fill-pop: var\(--a-4\);/)
})

const one = (roles) => auditButtons({ x: { имя: 'x', name: 'x', варианты: { o: { имя: 'o', name: 'o', что: 'o', роли: roles } } } }, sitePalette).map((f) => f.rule).join(' | ')

test('audit refuses what the foundation forbids and the fields the button no longer takes', () => {
  assert.match(one({ '--ctrl-btn-case': 'uppercase' }), /неизвестна/, 'регистр — не роль каталога (И586)')
  assert.match(one({ '--ctrl-btn-r': '8px' }), /неизвестна/, 'угол — не роль каталога')
  assert.match(one({ '--ctrl-btn-press': 'scale(.9)' }), /неизвестна/, 'нажатие — не роль каталога')
  assert.match(one({ '--ctrl-btn-fill': 'transparent', '--ctrl-btn-edge': 'transparent' }), /не видна как орган/)
  const two = { a: { имя: 'a', name: 'a', варианты: { o: { имя: 'o', name: 'o', что: 'o', роли: { '--ctrl-btn-glyph': '0' } } } }, b: { имя: 'b', name: 'b', варианты: { o: { имя: 'o', name: 'o', что: 'o', роли: { '--ctrl-btn-glyph': '0' } } } } }
  assert.match(auditButtons(two, {}).map((f) => f.rule).join(), /объявляют две оси/)
})

test('buttons emitter refuses to write a catalog the audit rejects', () => {
  const dir = mkdtempSync(join(tmpdir(), 'buttons-refuse-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    mkdirSync(join(dir, 'styles'))
    writeFileSync(join(dir, 'styles/palette.json'), JSON.stringify(sitePalette))
    const bad = structuredClone(catalog)
    bad.shape.варианты.standard.роли['--ctrl-btn-tip'] = '9'
    writeFileSync(join(dir, 'styles/buttons.json'), JSON.stringify(bad))
    writeFileSync(join(dir, 'styles/buttons.css'), '/* old */\n')
    const run = spawnSync(process.execPath, [join(dir, 'tools/buttons.mjs')], { cwd: dir, encoding: 'utf8' })
    assert.notEqual(run.status, 0, run.stdout)
    assert.match(run.stderr, /не выпущен/)
    assert.equal(readFileSync(join(dir, 'styles/buttons.css'), 'utf8'), '/* old */\n')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

/* Органы полосы полки (И707, пересмотр И740): кнопки граней и порядка, кнопка шторки и
   «сбросить» — словом без плиты (`data-voice="bare"`; Allbirds, Gymshark — текст без
   кромки), фишки выбранного — пилюлями. Плиты-прямоугольника среди органов нет;
   форма — у кнопки и у фишки, блок ставит только признак. */
test('shelf bar organs: words without a plate, chosen chips as pills (И707, И740)', () => {
  const src = (f) => readFileSync(join(KIT, 'templates/storefront/components', f), 'utf8').split('\n')
  const line = (lines, mark) => lines.find((l) => l.includes(mark)) ?? ''
  const filters = src('Filters.tsx'), sort = src('SortMenu.tsx'), shelf = src('Catalog.tsx')
  for (const [name, l] of [
    ['кнопка грани', line(filters, '${s.trigger}`}')],
    ['кнопка шторки', line(filters, '${s.open}`}')],
    ['кнопка порядка', line(sort, '${fs.trigger}`}')],
    ['сбросить фильтры', line(shelf, '{view.clear ? <a className=')],
  ]) assert.match(l, /data-voice="bare"/, `${name} — словом без плиты (И740)`)
  assert.match(line(shelf, 'view.chips.map'), /data-pill/, 'фишка выбранного — пилюлей')
  assert.doesNotMatch(btn, /\.btn\[data-(?:pill|pager)\]\{[^}]*--btn-r/, 'признак формы у кнопки снят: форму всех кнопок решает ось Buttons → Shape (04.10.2026)')
  const prims = readFileSync(join(KIT, 'styles/primitives.module.css'), 'utf8')
  assert.match(prims, /\.chip\[data-pill\]\{border-radius:calc\(var\(--chip-h\) \/ 2\)\}/, 'фишка-пилюля — угол в половину своего роста (`--chip-h`, И764)')
})

/* Заливка маркой под рукой у листания полки (И704), кнопка-пол держит краску надписи
   (И705) — устройство в модуле кнопки, узлы ставят признак; герой — светлая половина и
   снимок рядом, ряд пути одной строкой (И708, И710). */
test('brand under the hand, a floor button keeps its ink, the hero is a light half with the shot beside (И704, И705, И708, И710)', () => {
  const site = (rel) => readFileSync(join(KIT, 'templates/storefront', rel), 'utf8')
  assert.match(btn, /\.btn\[data-plate\]\{color:var\(--press-ink\)\}/, 'кнопка, объявившая себя полом, красит надпись своей краской')
  assert.match(btn, /\.btn\[data-hand='pop'\]\{--ctrl-btn-hand-fill:1;--ctrl-btn-hand-edge:1;--ctrl-btn-edge-hand:var\(--pop\)\}/, 'заливка маркой под рукой — долей тихой, кромка марки')
  /* Признаки — каждый у кнопки, порядок атрибутов не важен (`data-rail-nav` встал между ними 04.10.2026). */
  assert.equal((site('components/RailPager.tsx').match(/<button\b(?=[^>]*\bdata-pager\b)(?=[^>]*\bdata-hand="pop")[^>]*>/g) ?? []).length, 2, 'обе стрелки листания')
  assert.match(site('components/RailHead.tsx'), /<a className=\{`\$\{b\.btn\} \$\{s\.wide\}`\}(?=[^>]*\bdata-hand="pop")[^>]*>/, '«View all» на широкой шапке — тем же ответом; на узкой — слово (И761)')
  const hero = site('components/blocks/Hero.tsx')
  assert.match(hero, /p\.lede\}/, 'герой — примитив «текст и кадр»')
  assert.match(hero, /p\.frame\}/, 'снимок — кадр с потолком')
  assert.doesNotMatch(hero, /data-ground="deck"/, 'тёмной сцены нет: текст на полу страницы')
  assert.equal((hero.match(/<ul /g) ?? []).length, 1, '«В магазин» и полки — один ряд пути')
})

/* Кнопка порядка — знак и выбранное слово, без подписи на виду и без стрелки
   раскрытия (И709): «Sort by» — только имя для чтения вслух. Знак — сортировки
   элемента 63 (образец заказчика). */
test('sort button is the sort sign and the chosen order, no visible «Sort by» (И709)', () => {
  const sort = readFileSync(join(KIT, 'templates/storefront/components/SortMenu.tsx'), 'utf8')
  const button = sort.split('\n').find((l) => l.includes('${fs.trigger}`}')) ?? ''
  assert.match(button, /<Icon id="list-filter" \/><span className=\{s\.sortWord\}>\{sort\.current\}<\/span>/, 'знак сортировки и выбранный порядок')
  assert.match(button, /aria-label=\{sort\.said\}/, 'имя вслух — «Sort by: …»')
  assert.doesNotMatch(button, /<Turn/, 'стрелки раскрытия нет: знак сам говорит «меню»')
  assert.doesNotMatch(sort, /sort\.label\}<\/span>|sortLabel/, 'подписи «Sort by» на виду нет')
  assert.match(readFileSync(join(KIT, 'styles/icons.svg'), 'utf8'), /<symbol id="list-filter"/, 'знак есть в листе набора')
})
