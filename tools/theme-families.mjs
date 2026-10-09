/**
 * Цвет обеих тем (`check:theme`, И766) — семьи, мерка и суд, без браузера.
 *
 * Отдельным файлом по той же причине, что `craft-families.mjs`: сверка
 * скилла (`check:rules`) и самопроверка набора ввозят список семей и суд
 * над снятыми красками, а саму проверку ввозить нельзя — она поднимает
 * браузер при чтении. Функции `probe` и `paletteSets` уезжают в страницу
 * строкой (`page.evaluate`), поэтому ничего снаружи себя не трогают.
 *
 * Заведено по счёту: реестр «по словам» и скиллы `craft` и `palette`
 * описывали `check:theme` подробно — «открывает собранный сайт в обеих темах,
 * читает токены…», шесть правил тёмной темы «меряются check:theme», — а
 * инструмента не было ни файлом, ни командой. Правило без реализации хуже
 * отсутствующего (CLAUDE.md). Правила и числа — `.claude/skills/craft/
 * references/color.md`, «Тёмная тема — не инверсия светлой»; пороги — `NIGHT`
 * в `tools/thresholds.mjs`.
 *
 * Мера — с ЖИВОЙ страницы, а не разбором файла: половина ролей — смеси и
 * производные (`color-mix`, `light-dark()`, переназначения полов), и
 * раскрываются они только там, где стоят. Краска снимается так, как её
 * кладёт экран: роль ставится фоном точки-измерителя, браузер раскрывает её,
 * холст накладывает слоями на пол под ней — полупрозрачная роль палубы
 * меряется на палубе, а не на белом.
 */

import { CONTRAST, NIGHT } from './thresholds.mjs'
import { ratio, oklch } from './palette.mjs'

export const THEME_FAMILIES = ['nightStep', 'colourStep', 'blackFloor', 'whiteInk', 'nightChroma', 'inkPair', 'platePair']

/** Что ловит каждая семья — один текст на отчёт и на таблицу в `color.md`
 *  (собирается `check:rules --tables`). */
export const THEME_LABELS = {
  nightStep: `ступень между нейтральными поверхностями ночью мельче нормы — карточка, меню и серая палуба над страницей от ${NIGHT.lift}, плашка и орган в карточке и полоса секции от ${NIGHT.inner} (светлота OKLab ×100) — или мельче дневной сверх порога различения (правило 1)`,
  colourStep: `цветная поверхность — палуба шапки и подвала, заливка марки — ближе ${NIGHT.colour} к странице в любой теме: марка тонет в полу (правила 2 и 3); серая палуба ночью судится как предмет над полом`,
  blackFloor: `страница ночью темнее ${NIGHT.floor} — почти чистый чёрный: на нём нет ни тени, ни ступени (правило 4)`,
  whiteInk: `текст ночью светлее ${NIGHT.ink} — почти чистый белый на тёмном «звенит» (правило 4)`,
  nightChroma: `поверхность ночью насыщеннее дневной больше чем на ${NIGHT.jnd} — насыщенное на тёмном вибрирует (правило 5)`,
  inkPair: `пара краски на корне, на палубе или в живой палубе страницы ниже ${CONTRAST.text} : 1 — текст и приглушённый текст на листе, слово на органе, знак на тёмной пилюле, выбранное, знак на фирменной заливке, текст прямо на полу (правило 6)`,
  platePair: `та же пара ВНУТРИ листа, лежащего на палубе (измеритель и живые листы страницы), ниже ${CONTRAST.text} : 1 — лист вернул роль не тем значением (правило 6, «Лист — это тоже пол»)`,
}

/** Полы, на которые ставится измеритель: корень, палуба и лист на палубе.
 *  Лист вложен в палубу — так он лежит на витрине (блок на Ground: Deck). */
export const FLOORS = [
  { id: 'root', name: 'корень', attrs: {}, paint: '--page' },
  { id: 'deck', name: 'палуба', attrs: { 'data-ground': 'deck' }, paint: '--page-deck', inside: 'root' },
  { id: 'plate', name: 'лист на палубе', attrs: { 'data-plate': '' }, paint: '--plate', inside: 'deck' },
]

/** Семь ступеней: что над чем лежит. Нейтральные ночью держат свою норму
 *  (`NIGHT.lift` или `NIGHT.inner`) и не мельче дня. Палуба и заливка марки
 *  с днём не сравниваются — тёмная палуба, повторённая ночью на 59 от листа,
 *  засветила бы (правило 2); цветная (насыщенность выше порога различения от
 *  серого) держит `NIGHT.colour` в обеих темах, серая ночью — предмет над
 *  полом, `NIGHT.lift`: так палуба стоит ночью у набора на ступени карточек
 *  (И293, И568), и правило 2 о цветной её не судит. Найдено первым прогоном
 *  на стилях набора: серая ночная палуба в 10.5 от страницы шла находкой
 *  «ближе 20». */
export const STEPS = [
  { id: 'card', name: 'карточка над страницей', top: '--plate', under: '--page', need: 'lift' },
  { id: 'menu', name: 'меню над страницей', top: '--menu-bg', under: '--page', need: 'lift' },
  { id: 'plaque', name: 'плашка в карточке', top: '--plate-2', under: '--plate', need: 'inner' },
  { id: 'ctrl', name: 'орган в карточке', top: '--ctrl', under: '--plate', need: 'inner' },
  { id: 'band', name: 'полоса секции на странице', top: '--band', under: '--page', need: 'inner' },
  { id: 'deck', name: 'палуба на странице', top: '--page-deck', under: '--page', need: 'colour' },
  { id: 'brand', name: 'заливка марки на странице', top: '--accent-solid', under: '--page', need: 'colour' },
]

/** Семь пар краски. Роли — те, что полы переназначают (`[data-ground]`,
 *  `[data-plate]` в styles/base.css): на каждом полу пара своя. `bg: null` —
 *  сам пол под измерителем. */
export const PAIRS = [
  { id: 'text', name: 'текст на листе', fg: '--ink', bg: '--surface' },
  { id: 'soft', name: 'приглушённый текст на листе', fg: '--ink-soft', bg: '--surface' },
  { id: 'word', name: 'слово на органе', fg: '--ink', bg: '--ctrl' },
  { id: 'pill', name: 'знак на тёмной пилюле', fg: '--on-ink', bg: '--ink' },
  { id: 'chosen', name: 'выбранное', fg: '--on-chosen', bg: '--chosen' },
  { id: 'pop', name: 'знак на фирменной заливке', fg: '--on-pop', bg: '--pop' },
  { id: 'floor', name: 'текст прямо на полу', fg: '--ink', bg: null },
]

/** Края (правило 4) и насыщенность (правило 5). */
export const EDGES = [
  { id: 'floor', family: 'blackFloor', name: 'пол страницы ночью', role: '--page' },
  { id: 'ink', family: 'whiteInk', name: 'текст ночью', role: '--ink' },
]
export const CHROMA = ['--page', '--plate', '--band', '--page-deck', '--accent-solid']

/** Роли, которые снимаются на каждом полу: из ступеней, краёв и насыщенности. */
export const ROLES = [...new Set([...STEPS.flatMap((s) => [s.top, s.under]), ...EDGES.map((e) => e.role), ...CHROMA, '--ink-soft'])]

export const spec = (real = false, limit = 8) => ({ floors: FLOORS, roles: ROLES, pairs: PAIRS, real, limit })

/* ── в странице ──────────────────────────────────────────────────────────── */

/** Наборы палитры, которые отдают стили страницы: `[data-palette="…"]`. */
export function paletteSets() {
  const names = new Set()
  const walk = (rules) => {
    for (const r of rules) {
      for (const m of (r.selectorText ?? '').matchAll(/\[data-palette="([^"]+)"\]/g)) names.add(m[1])
      if (r.cssRules) walk(r.cssRules)
    }
  }
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules) } catch { /* чужой лист без доступа — не наш */ }
  }
  return [...names]
}

/** Снять краски: измеритель на три пола и, если просят, в живые палубы и
 *  листы на палубе этой страницы. Возвращает sRGB 0–255, уже наложенные на
 *  то, что под ними. */
export function probe(spec) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  /* Слоями, как экран: белое окно, затем каждая краска поверх. */
  const paint = (layers) => {
    ctx.globalCompositeOperation = 'copy'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1, 1)
    ctx.globalCompositeOperation = 'source-over'
    for (const c of layers) {
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
    }
    return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3))
  }
  /* Роль раскрывает браузер там, где стоит точка: `var()` внутри роли
     раскрывается на месте объявления, и пол меняет пару только у себя. */
  const read = (box, role) => {
    const dot = document.createElement('i')
    dot.style.cssText = 'position:absolute;width:0;height:0;transition:none'
    box.append(dot)
    const declared = getComputedStyle(dot).getPropertyValue(role).trim()
    dot.style.backgroundColor = `var(${role})`
    const value = getComputedStyle(dot).backgroundColor
    dot.remove()
    return declared ? value : null
  }
  /* `own` — элемент сам закрашивает свой пол. Живой лист или палуба без
     своей заливки (краску кладёт ребёнок или предок) — пара «на полу»
     у него не меряется: пол под ним не его, а остальные пары идут с явной
     ролью фона. Найдено первым прогоном: лист без заливки давал 1.00. */
  const measure = (box, stack, roles, own = true) => {
    const out = { floor: paint(stack), roles: {}, pairs: {} }
    for (const r of roles) {
      const v = read(box, r)
      out.roles[r] = v === null ? null : paint([...stack, v])
    }
    for (const p of spec.pairs) {
      if (!p.bg && !own) { out.pairs[p.id] = null; continue }
      const fg = read(box, p.fg)
      const bg = p.bg ? read(box, p.bg) : null
      if (fg === null || (p.bg && bg === null)) { out.pairs[p.id] = null; continue }
      const base = p.bg ? [...stack, bg] : stack
      out.pairs[p.id] = { fg: paint([...base, fg]), bg: paint(base) }
    }
    return out
  }

  const host = document.createElement('div')
  host.setAttribute('data-theme-probe', '')
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:8px;height:8px;overflow:hidden'
  document.body.append(host)
  const boxes = {}
  const floors = {}
  for (const f of spec.floors) {
    const box = document.createElement('div')
    for (const [k, v] of Object.entries(f.attrs)) box.setAttribute(k, v)
    box.style.backgroundColor = `var(${f.paint})`
    ;(f.inside ? boxes[f.inside].box : host).append(box)
    const stack = [...(f.inside ? boxes[f.inside].stack : []), getComputedStyle(box).backgroundColor]
    boxes[f.id] = { box, stack }
    floors[f.id] = measure(box, stack, spec.roles)
  }
  host.remove()

  const real = []
  if (spec.real) {
    const label = (el) => {
      /* Имя класса модуля без хеша: `Footer-module__x1Y__deck` (Turbopack) и
         `Footer_deck__x1Y` (webpack) — оба `Footer.deck`. */
      const cls = [...el.classList].slice(0, 2).map((c) => c.replace(/^(.+?)-module__[^_]+__(.+)$/, '$1.$2').replace(/^([A-Z]\w*)_(.+?)__[\w-]{5,}$/, '$1.$2'))
      return `${el.tagName.toLowerCase()}${cls.length ? '.' + cls.join('.') : ''}`
    }
    /* Под элементом — всё, что закрашено от корня до него. Снимок или
       градиент под полом не видны: мерится краска, а не картинка. */
    const painted = (n) => {
      const bg = getComputedStyle(n).backgroundColor
      return bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' ? bg : null
    }
    const under = (el) => {
      const layers = []
      for (let n = el; n; n = n.parentElement) if (painted(n)) layers.unshift(painted(n))
      return layers
    }
    const seen = new Set()
    const take = (selector, kind) => {
      for (const el of document.querySelectorAll(selector)) {
        if (real.length >= spec.limit * 2) break
        const name = label(el)
        if (seen.has(kind + name)) continue
        seen.add(kind + name)
        real.push({ kind, label: name, ...measure(el, under(el), [], Boolean(painted(el))) })
      }
    }
    take('[data-ground="deck"]', 'deck')
    take('[data-ground="deck"] [data-plate]', 'plate')
  }
  return { floors, real }
}

/* ── суд ─────────────────────────────────────────────────────────────────── */

const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('')
/** Светлота OKLab ×100 и насыщенность — той же математикой, что строитель. */
export const okl = (rgb) => {
  const [L, C] = oklch(hex(rgb))
  return { L: L * 100, C }
}
export const contrast = (fg, bg) => ratio(hex(fg), hex(bg))
const f1 = (v) => v.toFixed(1)
const f3 = (v) => v.toFixed(3)
const MODE = { light: 'днём', dark: 'ночью' }

/**
 * Суд над снятым. `taken` = { light, dark }, у каждой темы
 * `{ sets: { [набор]: floors }, real: [{ page, kind, label, pairs }] }`.
 * Возвращает находки по семьям, строки таблицы и то, что не измерено
 * (роли нет на этом сайте).
 */
export function judge(taken) {
  const found = []
  const rows = []
  const skipped = new Set()
  const say = (family, where, text) => found.push({ family, where, text })
  const L = (m, role) => (m.root.roles[role] ? okl(m.root.roles[role]).L : null)

  for (const set of Object.keys(taken.light.sets)) {
    const day = taken.light.sets[set]
    const night = taken.dark.sets[set]
    if (!night) continue
    const where = `набор ${set}`

    /* Ступени — правила 1–3. */
    for (const s of STEPS) {
      const step = (m) => {
        const [a, b] = [L(m, s.top), L(m, s.under)]
        return a === null || b === null ? null : Math.abs(a - b)
      }
      const [d, n] = [step(day), step(night)]
      if (d === null || n === null) { skipped.add(`ступень «${s.name}»: нет ${s.top} или ${s.under}`); continue }
      rows.push({ set, part: 'ступень', name: s.name, day: f1(d), night: f1(n), need: s.need === 'colour' ? `цветная ≥ ${NIGHT.colour} обе, серая ночью ≥ ${NIGHT.lift}` : `ночью ≥ ${NIGHT[s.need]}, ≥ дня − ${NIGHT.jnd * 100}` })
      if (s.need === 'colour') {
        for (const [mode, m, v] of [['light', day, d], ['dark', night, n]]) {
          const tinted = okl(m.root.roles[s.top]).C > NIGHT.jnd
          if (tinted && v < NIGHT.colour) say('colourStep', where, `${MODE[mode]} «${s.name}» ${f1(v)} при норме ${NIGHT.colour}`)
          if (!tinted && mode === 'dark' && v < NIGHT.lift) say('nightStep', where, `ночью «${s.name}» (серая) ${f1(v)} при норме ${NIGHT.lift}`)
        }
      } else if (n < NIGHT[s.need]) {
        say('nightStep', where, `ночью «${s.name}» ${f1(n)} при норме ${NIGHT[s.need]} (днём ${f1(d)})`)
      } else if (n < d - NIGHT.jnd * 100) {
        say('nightStep', where, `ночью «${s.name}» мельче дневной: ${f1(n)} против ${f1(d)}`)
      }
    }

    /* Края — правило 4. */
    for (const e of EDGES) {
      const v = L(night, e.role)
      if (v === null) { skipped.add(`край «${e.name}»: нет ${e.role}`); continue }
      rows.push({ set, part: 'край', name: e.name, day: f1(L(day, e.role) ?? NaN), night: f1(v), need: e.family === 'blackFloor' ? `ночью ≥ ${NIGHT.floor}` : `ночью ≤ ${NIGHT.ink}` })
      if (e.family === 'blackFloor' && v < NIGHT.floor) say('blackFloor', where, `${e.name} ${f1(v)} при норме не ниже ${NIGHT.floor}`)
      if (e.family === 'whiteInk' && v > NIGHT.ink) say('whiteInk', where, `${e.name} ${f1(v)} при норме не выше ${NIGHT.ink}`)
    }

    /* Насыщенность — правило 5. */
    for (const role of CHROMA) {
      const [d, n] = [day.root.roles[role], night.root.roles[role]]
      if (!d || !n) { skipped.add(`насыщенность: нет ${role}`); continue }
      const [cd, cn] = [okl(d).C, okl(n).C]
      rows.push({ set, part: 'насыщенность', name: role, day: f3(cd), night: f3(cn), need: `ночью ≤ дня + ${NIGHT.jnd}` })
      if (cn > cd + NIGHT.jnd) say('nightChroma', where, `${role} ночью ${f3(cn)} против ${f3(cd)} днём`)
    }

    /* Пары — правило 6, на трёх полах в обеих темах. */
    for (const mode of ['light', 'dark']) {
      const m = taken[mode].sets[set]
      for (const f of FLOORS) {
        for (const p of PAIRS) {
          const got = m[f.id]?.pairs[p.id]
          if (!got) { skipped.add(`пара «${p.name}» (${f.name}): нет ${p.fg}${p.bg ? ` или ${p.bg}` : ''}`); continue }
          const r = contrast(got.fg, got.bg)
          rows.push({ set, part: `пара · ${f.name}`, name: p.name, [mode === 'light' ? 'day' : 'night']: r.toFixed(2), need: `≥ ${CONTRAST.text}` })
          if (r < CONTRAST.text) say(f.id === 'plate' ? 'platePair' : 'inkPair', where, `${MODE[mode]}, ${f.name}: «${p.name}» ${r.toFixed(2)} при норме ${CONTRAST.text}`)
        }
      }
    }
  }

  /* Живые палубы и листы на палубе — те же пары там, где их поставила
     страница: местное переобъявление роли видно только здесь. Одна находка
     на элемент и пару, с первой страницы, где она встретилась. */
  const once = new Set()
  for (const mode of ['light', 'dark']) {
    for (const el of taken[mode].real ?? []) {
      for (const p of PAIRS) {
        const got = el.pairs[p.id]
        if (!got) continue
        const r = contrast(got.fg, got.bg)
        const key = `${mode}·${el.kind}·${el.label}·${p.id}`
        if (r >= CONTRAST.text || once.has(key)) continue
        once.add(key)
        say(el.kind === 'plate' ? 'platePair' : 'inkPair', `${el.page} ${el.label}`, `${MODE[mode]}, ${el.kind === 'plate' ? 'лист на палубе' : 'палуба'}: «${p.name}» ${r.toFixed(2)} при норме ${CONTRAST.text}`)
      }
    }
  }

  /* Строки пар двух тем — одной строкой. */
  const merged = []
  for (const row of rows) {
    const twin = merged.find((x) => x.set === row.set && x.part === row.part && x.name === row.name && row.part.startsWith('пара'))
    if (twin) Object.assign(twin, Object.fromEntries(Object.entries(row).filter(([k]) => k === 'day' || k === 'night')))
    else merged.push({ ...row })
  }
  return { found, rows: merged, skipped: [...skipped] }
}
