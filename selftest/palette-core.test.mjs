/**
 * Ядро палитры: разбор краски, кольцо фокуса на каждой поверхности, APCA по
 * эталону, выпуск только после замера (И246).
 *
 * Дефекты, найденные проверкой ядра 22.09.2026 (1 578 построений): `#FFF`
 * читался как `#000FFF` (синий), `red` и `#FFCC0080` — молча как мусор;
 * кольцо фокуса подбиралось против одной ступени 1 и в тёмной теме
 * выпущенной «Латуни на угле» давало на карточке 2,31 : 1 при норме 3;
 * APCA отсекала шум на 0.001 вместо 0.1 и не знала deltaYmin;
 * `npm run palette` записывал файл, который замер браковал.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { roles, ratio, apca, auditPalette, lightness, groundChecks, deckFor, SOLID_GAP, NEED, redFamily, scale, difference } from '../tools/palette.mjs'

const KIT = fileURLToPath(new URL('..', import.meta.url))
const shipped = {
  ...JSON.parse(readFileSync(join(KIT, 'styles/palette.json'), 'utf8')),
  ...JSON.parse(readFileSync(join(KIT, 'templates/palette.json'), 'utf8')),
}
const themes = (set) => ['light', 'dark'].filter((mode) => set[mode]).map((mode) => [mode, set[mode]])

test('a paint is read as written: #RGB expands, anything else is refused by name', () => {
  assert.equal(ratio('#FFF', '#000'), ratio('#FFFFFF', '#000000'))
  assert.equal(ratio('#fff', '#000').toFixed(2), '21.00')
  for (const bad of ['red', '#FFCC0080', '#12345', 'FFFFFF', '', undefined]) {
    assert.throws(() => ratio(bad, '#000000'), /краск/, String(bad))
  }
  const base = { paper: '#FCFBF9', ink: '#1F1E1C' }
  assert.throws(() => roles({ ...base, accent: 'red' }, 'light'), /accent|краск/)
  assert.doesNotThrow(() => roles({ ...base, accent: '#B79339' }, 'light'))
})

test('the focus ring reaches 3 : 1 on every background step it can sit on (1–5), in every shipped set and theme', () => {
  for (const [name, set] of Object.entries(shipped)) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      const worst = Math.min(...[1, 2, 3, 4, 5].map((i) => ratio(r['--ring'], r[`--n-${i}`])))
      assert.ok(worst >= 3, `${name} · ${mode}: кольцо ${r['--ring']} даёт ${worst.toFixed(2)} на худшей поверхности`)
    }
  }
})

test('the audit measures the ring on the surface where it is weakest', () => {
  for (const [name, set] of Object.entries(shipped)) {
    for (const [mode, paints] of themes(set)) {
      assert.ok(!auditPalette(paints, mode).some((f) => /кольцо/.test(f.rule)), `${name} · ${mode}`)
    }
  }
  const src = readFileSync(join(KIT, 'tools/palette.mjs'), 'utf8')
  assert.match(src, /кольцо фокуса на всех поверхностях/)
})

test('APCA follows the reference: published values, loClip 0.1 and deltaYmin', () => {
  assert.equal(apca('#888888', '#FFFFFF').toFixed(2), '63.06')
  assert.equal(apca('#FFFFFF', '#888888').toFixed(2), '68.54')
  assert.equal(apca('#000000', '#AAAAAA').toFixed(2), '58.15')
  assert.equal(apca('#AAAAAA', '#000000').toFixed(2), '56.24')
  assert.equal(apca('#777777', '#787878'), 0)
  assert.equal(apca('#404040', '#444444'), 0, 'below loClip is zero, not a small number')
})

test('npm run palette refuses to write a set the audit rejects, and leaves the old file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'palette-refuse-'))
  try {
    cpSync(join(KIT, 'tools'), join(dir, 'tools'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), '{"name":"probe","private":true,"type":"module"}')
    mkdirSync(join(dir, 'styles'))
    const bad = { 'Жёлтый': { light: { paper: '#FCFBF9', ink: '#1F1E1C', accent: '#FFFF00' }, dark: { paper: '#161513', ink: '#EDEBE6', accent: '#FFFF00' } } }
    writeFileSync(join(dir, 'styles/palette.json'), JSON.stringify(bad))
    writeFileSync(join(dir, 'styles/palette.css'), '/* old */\n')
    const run = spawnSync(process.execPath, [join(dir, 'tools/palette-css.mjs')], { cwd: dir, encoding: 'utf8' })
    assert.notEqual(run.status, 0, run.stdout)
    assert.match(run.stderr, /не выпущена/)
    assert.equal(readFileSync(join(dir, 'styles/palette.css'), 'utf8'), '/* old */\n')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('--edge — a quiet control edge, seen but not loud on every background 1–5; --edge-hand holds 3 : 1; --border keeps its look (И252, И588)', () => {
  for (const [name, set] of Object.entries(shipped)) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      assert.ok(r['--edge'] && r['--edge-hand'], `${name} · ${mode}: нет --edge или --edge-hand`)
      const worst = (paint) => Math.min(...[1, 2, 3, 4, 5].map((i) => ratio(paint, r[`--n-${i}`])))
      assert.ok(worst(r['--edge']) >= 1.4, `${name} · ${mode}: --edge ${r['--edge']} даёт ${worst(r['--edge']).toFixed(2)}`)
      /* Тихая: не кромка поля. Кричала краской приглушённого текста (И588). */
      assert.ok(worst(r['--edge']) < 3, `${name} · ${mode}: --edge ${r['--edge']} громкая — ${worst(r['--edge']).toFixed(2)}`)
      assert.ok(worst(r['--edge-hand']) >= 3, `${name} · ${mode}: --edge-hand ${r['--edge-hand']} даёт ${worst(r['--edge-hand']).toFixed(2)}`)
      assert.ok(ratio(r['--border'], r['--n-2']) >= 3, `${name} · ${mode}: --border на поле`)
      /* Полшага между покоем и 3 : 1 (И635): темнее покоя, но не как --edge-hand. */
      assert.ok(r['--edge-near'], `${name} · ${mode}: нет --edge-near`)
      assert.ok(worst(r['--edge-near']) >= 2 && worst(r['--edge-near']) < worst(r['--edge-hand']) + 1e-9, `${name} · ${mode}: --edge-near ${r['--edge-near']} даёт ${worst(r['--edge-near']).toFixed(2)}`)
    }
  }
})

/* Роли кнопки и сцены (И295): их выпускает строитель, а не стили. Дефект —
   тона хвоста главной кнопки, кромка выключенной и вуаль героя рождались
   числом в стилях, и их контраст не считал никто; у «Аптеки» тихая строка
   героя под прежними 72 % давала 4.15 : 1. */
test('button and hero roles come from the builder with their guarantees, on every kit set and theme (И295)', () => {
  const G = (r) => [1, 2, 3, 4, 5].map((i) => r[`--n-${i}`])
  for (const [name, set] of Object.entries(shipped)) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      const at = `${name} · ${mode}`
      /* хвост: дальний виден на каждом полу бумаги, ближний — между ним и
         заливкой, оба отстоят от заливки */
      const [fill, near, far] = [r['--a-9'], r['--pop-trail-near-paper'], r['--pop-trail-far-paper']]
      assert.ok(Math.min(...G(r).map((bg) => Math.abs(apca(far, bg)))) >= NEED.decorLc, `${at}: дальний тон хвоста ${far} не виден на полу`)
      assert.ok(Math.abs(lightness(far) - lightness(fill)) >= SOLID_GAP[mode], `${at}: дальний тон слился с заливкой`)
      const [lf, ln, lr] = [lightness(fill), lightness(near), lightness(far)]
      assert.ok((ln - lf) * (lr - ln) > 0, `${at}: ближний тон ${near} не между заливкой и дальним`)
      /* палуба: пара палубы и хвост от её знака к её полу */
      const n = Array.from({ length: 12 }, (_, i) => r[`--n-${i + 1}`])
      /* палуба — заливка марки в любом наборе: основной цвет один (И694) */
      const a = Array.from({ length: 12 }, (_, i) => r[`--a-${i + 1}`])
      const deck = deckFor(n, mode, a)
      assert.equal(r['--chrome-bg'], r['--a-9'], `${at}: палуба — не заливка марки`)
      assert.equal(r['--chosen-paper'], r['--a-9'], `${at}: выбранное — не заливка марки`)
      assert.ok(Math.min(...deck.grounds.map((bg) => Math.abs(apca(r['--pop-trail-far-deck'], bg)))) >= NEED.decorLc, `${at}: хвост на палубе`)
      /* выпущенное — роль, а не формула в стилях: краски, а не ссылки */
      for (const k of ['--quiet-paper', '--scrim', '--scrim-near', '--scrim-far', '--sh-near-paper', '--chrome-fg-2']) assert.match(r[k], /^#[0-9A-F]{8}$/, `${at}: ${k} — вуаль строителя #RRGGBBAA`)
      for (const k of ['--pop-trail-near-paper', '--pop-trail-far-paper', '--edge-off-paper', '--edge-off-deck', '--pop-hover-deck', '--pop-grad']) assert.match(r[k], /^#[0-9A-F]{6}$/, `${at}: ${k}`)
      /* Второй конец градиента главной (И424): надпись держит 4.5 : 1 и на нём. */
      assert.ok(ratio(r['--on-a-9'], r['--pop-grad']) >= NEED.text, `${at}: надпись главной на втором конце градиента`)
      /* Стекло главной (И427): краска долей, не сплошная; надпись держит
         4.5 : 1 над каждым полом и любым снимком, а на бумаге стекло видно —
         это меряет groundChecks ниже. */
      for (const k of ['--pop-glass', '--pop-rim']) assert.match(r[k], /^#[0-9A-F]{8}$/, `${at}: ${k} — стекло строителя #RRGGBBAA`)
      assert.ok(parseInt(r['--pop-glass'].slice(7), 16) < 255, `${at}: стекло просвечивает`)
      /* замер ролей по полу — весь чистый */
      const failed = groundChecks(paints, mode).filter((c) => c.got < c.need)
      assert.deepEqual(failed, [], at)
    }
  }
  /* Вуаль героя берётся замером, а не одной долей на все палитры: у «Аптеки»
     в светлой её дальняя ступень плотнее прежних 72 %. */
  const scrim = roles(shipped['Аптека'].light, 'light')['--scrim-far']
  assert.ok(Number.parseInt(scrim.slice(7), 16) / 255 > 0.72, `Аптека: вуаль героя ${scrim}`)
})

/* Светлая марка вплотную к светлой бумаге: хвост не тянет марку за собой —
   он идёт от заливки к чернилам (И295). */
test('a bright brand keeps its colour: the trail steps away from the ground instead of moving the brand', async () => {
  const { fitPalette } = await import('../tools/palette.mjs')
  const yellow = fitPalette({ brand: '#FFE600', paper: 'warm', tint: 'light' })
  const r = roles(yellow.seed.light, 'light')
  assert.ok(lightness(r['--pop-trail-far-paper']) < lightness(r['--a-9']), 'хвост темнее заливки — со стороны чернил')
  assert.ok(Math.min(...[1, 2, 3, 4, 5].map((i) => Math.abs(apca(r['--pop-trail-far-paper'], r[`--n-${i}`])))) >= NEED.decorLc)
})

/* Палуба марки (И450). Дефект: у cbdin шапка, подвал и нижняя полоса —
   фирменный петроль, а строитель знал палубу только обратной парой
   нейтрали. Тринадцать красок палубы набирались в стилях руками, и тихое
   слово шапки при доле 78 % в тёмной теме давало 3.1 : 1 при норме 4.5. */
const CBDIN = {
  light: { paper: '#FFFFFF', ink: '#231F18', accent: '#0C3A46', sale: '#FABC34' },
  dark: { paper: '#141310', ink: '#EEEDEA', accent: '#2E7C8F', sale: '#FABC34' },
}
const over = (top, floor) => {
  const ch = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16))
  const share = top.length === 9 ? Number.parseInt(top.slice(7), 16) / 255 : 1
  const [t, f] = [ch(top), ch(floor)]
  return `#${t.map((v, i) => Math.round(v * share + f[i] * (1 - share)).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

test('the brand deck: chrome roles stand on the brand fill and hold their norms there (И450)', () => {
  for (const [mode, paints] of themes(CBDIN)) {
    const r = roles(paints, mode)
    const at = `cbdin · ${mode}`
    const deck = r['--chrome-bg']
    assert.equal(deck, r['--a-9'], `${at}: пол палубы — заливка марки`)
    assert.equal(r['--chrome-fg'], r['--on-a-9'], `${at}: знак палубы — знак на заливке`)
    assert.ok(ratio(over(r['--chrome-fg-2'], deck), deck) >= NEED.text, `${at}: тихое слово палубы`)
    for (const k of ['--chrome-hover', '--chrome-plate']) {
      const plate = over(r[k], deck)
      assert.ok(ratio(plate, deck) >= 1.15, `${at}: ${k} не видна на палубе`)
      assert.ok(ratio(r['--chrome-fg'], plate) >= NEED.text, `${at}: знак палубы на ${k}`)
    }
    assert.ok(ratio(r['--ring-deck'], deck) >= NEED.control, `${at}: кольцо фокуса на палубе`)
    for (const k of ['--pop-hover-deck', '--pop-press-deck']) assert.ok(ratio(deck, r[k]) >= NEED.text, `${at}: надпись пилюли на ${k}`)
    assert.deepEqual(auditPalette(paints, mode), [], at)
  }
  /* Обратный ход: прежняя доля 78 % на палубе марки тёмной темы — та самая
     находка; строитель её поднял, а не выпустил. */
  const dark = roles(CBDIN.dark, 'dark')
  const old = `${dark['--chrome-fg']}C7`
  assert.ok(ratio(over(old, dark['--chrome-bg']), dark['--chrome-bg']) < NEED.text, '78 % на марке держали 4.5 — дефект не воспроизведён')
  assert.notEqual(dark['--chrome-fg-2'], old)
  /* Палуба — заливка марки в любом наборе (И694): тихое слово держит 4.5 : 1
     на каждой, доля поднята там, где 78 % мало. */
  for (const [name, set] of Object.entries(shipped)) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      assert.ok(ratio(over(r['--chrome-fg-2'], r['--chrome-bg']), r['--chrome-bg']) >= NEED.text, `${name} · ${mode}: тихое слово палубы`)
    }
  }
})

/* Тень под подписью на снимке (И451). Дефект: краска слоёв стояла у cbdin
   в стилях — чёрный долями силы 40, подобранной заказчиком глазом, — и
   ближайшая роль строителя была в 1.7–2.5 раза гуще. */
test('the caption shadow: strength is the set\'s, the builder raises it until the caption reads (И451)', () => {
  const edge = (r) => over(r['--sh-caption-near'], over(r['--sh-caption-far'], '#FFFFFF'))
  const light = roles(CBDIN.light, 'light')
  assert.equal(light['--sh-caption-near'], '#0000004D', 'сила 40: ближний слой 30 %')
  assert.equal(light['--sh-caption-far'], '#00000033', 'сила 40: дальний слой 20 %')
  for (const [name, set] of Object.entries({ ...shipped, cbdin: CBDIN })) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      const hero = mode === 'light' ? r['--n-1'] : r['--n-12']
      assert.ok(ratio(hero, edge(r)) >= NEED.control, `${name} · ${mode}: подпись у края буквы`)
    }
  }
  /* Обратный ход: слабая сила набора не проходит молча — строитель её
     поднимает; сила вне 1…100 — отказ по имени. */
  const weak = roles({ ...CBDIN.light, caption: 10 }, 'light')
  assert.ok(Number.parseInt(weak['--sh-caption-near'].slice(7), 16) > Math.ceil(0.075 * 255), 'сила 10 выпущена как есть')
  assert.ok(ratio('#FFFFFF', over('#00000013', over('#0000000D', '#FFFFFF'))) < NEED.control, 'сила 10 держала подпись — проверка ничего не меряет')
  for (const bad of [0, 150, '40']) assert.throws(() => roles({ ...CBDIN.light, caption: bad }, 'light'), /сила тени/)
})

/* Тихая плашка на заливке (И452). Дефект: счётчик на кнопке покупки cbdin —
   `color-mix(знак кнопки 22 %, transparent)` в стилях: строитель выпускал
   вуали только из чернил пола. На белой пилюле палубы марки (тёмная тема)
   такая плашка роняла надпись до 3.6 : 1. */
test('the quiet plate on a fill: visible on the button, its number reads — inverted where no veil can (И452)', () => {
  for (const [name, set] of Object.entries({ ...shipped, cbdin: CBDIN })) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      const at = `${name} · ${mode}`
      for (const [fill, floor] of [['--quiet-pop-paper', r['--a-9']], ['--quiet-pop-deck', r['--chrome-fg']]]) {
        const plate = over(r[fill], floor)
        const on = r[fill.replace('--', '--on-')]
        assert.ok(ratio(plate, floor) >= 1.15, `${at}: ${fill} не видна на заливке`)
        assert.ok(ratio(on, plate) >= NEED.text, `${at}: число на ${fill}`)
      }
    }
  }
  const dark = roles(CBDIN.dark, 'dark')
  const veil22 = over(`${dark['--chrome-bg']}38`, dark['--chrome-fg'])
  assert.ok(ratio(dark['--chrome-bg'], veil22) < NEED.text, 'вуаль 22 % на белой пилюле держала надпись — дефект не воспроизведён')
  assert.equal(dark['--quiet-pop-deck'], `${dark['--chrome-bg']}FF`, 'плашка вывернута: заливка — знак пилюли')
  assert.equal(dark['--on-quiet-pop-deck'], dark['--chrome-fg'], 'надпись вывернутой плашки — пол пилюли')
})

/* Тихое слово не у знака палубы (И486). Дефект: у cbdin три места стояли
   `color-mix(… var(--dim) …)` в стилях — строитель выпускал долю 78 % только
   к знаку палубы (`--chrome-fg-2`): полоса настроек на бумаге, метка полной
   корзины на палубе и подсказка в светлом поле подвала. Жёлтая метка на
   бирюзе тёмной темы cbdin не видна и целиком (2.80 : 1). */
test('the quiet word off the deck sign: ink on paper, word on a fill, sale mark on the deck — each holds its norm (И486)', () => {
  for (const [name, set] of Object.entries({ ...shipped, cbdin: CBDIN })) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      const at = `${name} · ${mode}`
      for (const k of ['--ink-dim-paper', '--on-pop-dim-paper', '--on-pop-dim-deck', '--chrome-sale-2']) assert.match(r[k], /^#[0-9A-F]{8}$/, `${at}: ${k} — доля строителя #RRGGBBAA`)
      for (let i = 1; i <= 5; i += 1) assert.ok(ratio(over(r['--ink-dim-paper'], r[`--n-${i}`]), r[`--n-${i}`]) >= NEED.text, `${at}: тихие чернила на n${i}`)
      assert.equal(r['--ink-dim-deck'], r['--chrome-fg-2'], `${at}: на палубе тихие чернила — знак палубы в покое`)
      assert.ok(ratio(over(r['--on-pop-dim-paper'], r['--a-9']), r['--a-9']) >= NEED.text, `${at}: тихое слово на заливке`)
      assert.ok(ratio(over(r['--on-pop-dim-deck'], r['--chrome-fg']), r['--chrome-fg']) >= NEED.text, `${at}: тихое слово на пилюле палубы`)
      assert.ok(ratio(over(r['--chrome-sale-2'], r['--chrome-bg']), r['--chrome-bg']) >= NEED.control, `${at}: метка скидки на палубе в покое`)
      assert.equal(r['--chrome-sale-2'].slice(0, 7), r['--chrome-sale'], `${at}: метка в покое — та же краска долей`)
      assert.deepEqual(auditPalette(paints, mode), [], at)
    }
  }
  const [light, dark] = [roles(CBDIN.light, 'light'), roles(CBDIN.dark, 'dark')]
  assert.equal(light['--chrome-sale'], light['--sale-9'], 'светлая cbdin: жёлтая на бирюзе видна — краска скидки как есть')
  assert.equal(light['--chrome-sale-2'], `${light['--sale-9']}C7`, 'светлая cbdin: доля 78 % держит')
  /* Обратный ход: жёлтая целиком на палубе тёмной темы — та находка. */
  assert.ok(ratio(dark['--sale-9'], dark['--chrome-bg']) < NEED.control, 'жёлтая держала 3 : 1 на бирюзе — дефект не воспроизведён')
  assert.notEqual(dark['--chrome-sale'], dark['--sale-9'], 'тёмная cbdin: невидимая метка выпущена как есть')
})

/* Тихая плашка на плашке скидки (И488). Дефект: чип листа набора cbdin —
   `color-mix(currentColor 18 %, transparent)`: у пары «метка шапки» (заливка
   скидки и знак на ней) своей тихой плашки у строителя не было. */
test('the quiet plate on the sale fill: visible, its word reads (И488)', () => {
  for (const [name, set] of Object.entries({ ...shipped, cbdin: CBDIN })) {
    for (const [mode, paints] of themes(set)) {
      const r = roles(paints, mode)
      const plate = over(r['--quiet-sale'], r['--sale-9'])
      assert.ok(ratio(plate, r['--sale-9']) >= 1.15, `${name} · ${mode}: тихая плашка на скидке не видна`)
      assert.ok(ratio(r['--on-quiet-sale'], plate) >= NEED.text, `${name} · ${mode}: слово на тихой плашке скидки`)
    }
  }
})

/* Тихая марка (И462) и красная семья (И463): у латуни тихая кнопка — вуаль
   марки, у терракоты «Тёплого листа» — вуаль чернил: розовый тон на трети
   экрана читался тревогой (снимок заказчика 27.09.2026). */
test('quiet tint is the brand veil, except for a red-family brand', () => {
  for (const hex of ['#A34627', '#800020', '#722F37', '#E5484D']) assert.ok(redFamily(hex), `${hex} — красная семья`)
  for (const hex of ['#9A7B3F', '#B79339', '#5F6B34', '#0C3A46', '#3A6EA5', '#4E8C7A', '#8A7F76']) assert.ok(!redFamily(hex), `${hex} — не красная`)
  for (const [name, set] of Object.entries(shipped)) {
    for (const mode of ['light', 'dark']) {
      const r = roles(set[mode], mode)
      const brand = set[mode].accent.toUpperCase()
      const tint = r['--quiet-tint-paper'].slice(0, 7)
      if (redFamily(set[mode].accent)) assert.equal(tint, r['--n-12'].toUpperCase(), `${name} ${mode}: красная марка — вуаль чернил`)
      else assert.equal(tint, r['--a-9'].toUpperCase(), `${name} ${mode}: тихая марка — вуаль марки ${brand}`)
      assert.equal(r['--pop-tint-paper'], redFamily(set[mode].accent) ? r['--n-3'] : r['--a-3'], `${name} ${mode}: поле тихой марки`)
    }
  }
})

/* Серые шкалы Radix Colors 3.0.0 (снимок в research/): строитель повторяет их с
   отклонением в среднем меньше 2 ΔE, и в светлой теме, и в тёмной. Замер
   03.10.2026 при разборе чужих палитр (элементы 80–83, убраны): 0.3–1.7 в
   светлой, 0.2–1.3 в тёмной. Тест держит это число, чтобы правка лестницы не
   увела нейтраль от эталона, на котором она стоит. */
const RADIX = join(KIT, 'research/site-building-2026-09-20/raw/sources/radix-colors/npm-colors@3.0.0')
test('the neutral ladder reproduces the Radix grays: mean ΔE under 2, light and dark', { skip: !existsSync(RADIX) && 'нет снимка Radix в research/' }, () => {
  const ground = { light: { paper: '#FCFBF9', ink: '#1F1E1C' }, dark: { paper: '#121110', ink: '#EDEBE8' } }
  const radix = (file, name) => {
    const css = readFileSync(join(RADIX, file), 'utf8').split('@supports')[0]
    return Array.from({ length: 12 }, (_, i) => css.match(new RegExp(`--${name}-${i + 1}:\\s*(#[0-9a-fA-F]{6})`))[1].toUpperCase())
  }
  for (const name of ['gray', 'mauve', 'slate', 'sage', 'olive', 'sand']) {
    for (const mode of ['light', 'dark']) {
      const real = radix(mode === 'light' ? `${name}.css` : `${name}-dark.css`, name)
      const { paper, ink } = ground[mode]
      const ours = scale(paper, ink, real[8], mode, scale(paper, ink, null, mode)[1])
      const steps = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11]
      const mean = steps.reduce((sum, i) => sum + difference(ours[i], real[i]), 0) / steps.length
      assert.ok(mean < 2, `${name} · ${mode}: лестница строителя отстоит от Radix на ${mean.toFixed(2)} ΔE при норме меньше 2`)
    }
  }
})
