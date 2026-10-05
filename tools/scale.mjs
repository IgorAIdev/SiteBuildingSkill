/*
 * Строитель шкал: два числа на ступень → рампа, которая между ними течёт.
 *
 * ЧТО ЭТО ТАКОЕ, одной фразой: станок, который из списка «сколько на
 * телефоне и сколько на мониторе» считает весь CSS размеров и воздуха.
 * Владелец говорит «между разделами — 56 и 80», машина пишет
 * `clamp(56px, 30.15px + 4.62vw, 80px)` и ручается, что на телефоне это
 * ровно 56, на макете ровно 80, а между ними течёт без ступенек.
 *
 * ЗАЧЕМ. До 21.09.2026 двадцать пять таких строк стояли в
 * `styles/tokens.css` набранными рукой, а формула к ним — словами в
 * комментарии рядом: «наклон = (макс − мин) / 5.2, свободный член =
 * мин − (макс − мин) × 1.0769, концы на 560 и 1080». Формула, живущая
 * словами, исполняется головой, а голова ошибается ровно там, где числа
 * похожи: у `--sp-11` свободный член скопирован у `--sp-9` (оба 30.77),
 * и ступень, обещавшая 100 на макете, доходила там до 93. Никто этого не
 * видел: ни один сторож набора не умел читать рампу.
 *
 * Это ровно тот же дефект, которым куплена палитра (И194): правило
 * записано, сторож считает, а сделать этим нечего — числа всё равно
 * набирает рука. Поэтому устройство то же самое, и намеренно:
 *
 *   styles/scale.json   — числа ВЛАДЕЛЬЦА: что на телефоне, что на макете
 *   tools/scale.mjs     — эта математика: одна на выпуск и на замер
 *   styles/scale.css    — выпущенное машиной, руками не правится
 *
 * Считает ОДИН код и для выпуска, и для проверки: иначе зелёный отчёт
 * перестанет говорить что-либо о том, чем сайт размечен.
 *
 * Разбор, числа и источники — `.claude/skills/craft/references/scale.md`.
 */

import { PREFIX, BREAKPOINTS } from './kit-config.mjs'
import { RHYTHM, AIR, TARGET, TEXT, TYPE, CONTROL, LAYOUT, SHAPE } from './thresholds.mjs'

/** Корень браузера. Поле пишется в rem (правило «поле растёт с буквами»),
 *  а считается в тех же пикселях, что и всё остальное: делить на 16
 *  приходится в одном месте, и это место здесь. */
export const ROOT_FS = 16

/** Число в CSS так, как его пишут в этом наборе: без нуля впереди
 *  (`.19vw`), без хвостовых нулей (`5vw`, а не `5.00vw`). */
export const num = (n, dp = 2) => {
  const r = Number(n.toFixed(dp))
  const s = String(r)
  if (s.startsWith('0.')) return s.slice(1)
  if (s.startsWith('-0.')) return `-${s.slice(2)}`
  return s
}

/** Межстрочье так, чтобы его не сдвинула сборка (И491). Сборщик стилей
 *  Next (Lightning CSS) пишет число в переменной пятью знаками после
 *  запятой: `1.28571429` уезжает как `1.28571`, и строка 36/28 рисуется
 *  35.99988 вместо 36 — на 1/64 пикселя ниже (cbdshop.bg, роли текста).
 *  Поэтому доля выпускается уже пятью знаками и округляется ВВЕРХ: сборка
 *  её не трогает, а строка не опускается ниже задуманной. Межстрочье можно
 *  назвать и парой пикселей — `"36/28"`: строка на кегль, как их пишет
 *  макет; доля считается здесь, а не калькулятором владельца. */
export const LEAD_DP = 5
export const leadOf = (value) => {
  const pair = typeof value === 'string' && value.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/)
  const x = pair ? Number(pair[1]) / Number(pair[2]) : Number(value)
  if (!Number.isFinite(x) || x <= 0) return NaN
  const k = 10 ** LEAD_DP
  let r = Math.round(x * k)
  if (r / k < x - 1e-12) r += 1
  return r / k
}

const write = (px, unit) => (unit === 'rem' ? `${num(px / ROOT_FS, 4)}rem` : `${num(px)}px`)

/**
 * Рампа одной ступени.
 *
 * `clamp(низ, свободный член + наклон·vw, верх)`, где прямая проходит
 * ЧЕРЕЗ ДВЕ НАЗВАННЫЕ ШИРИНЫ: на узкой она даёт низ, на широкой — верх.
 * Слагаемое в px обязательно: голый `vw` не растёт при зуме (WCAG 1.4.4,
 * F94) — за этим же следит семья `bareVw` в `check:css`.
 *
 * Свободный член считается по НЕокруглённому наклону и округляется после:
 * округлив сначала, получаем прямую, промахивающуюся мимо своих же концов
 * на полпикселя.
 */
export const ramp = ([min, max], [wMin, wMax], unit = 'px') => {
  if (min === max) return write(min, unit)
  const slope = (max - min) / ((wMax - wMin) / 100)
  const base = Number((min - slope * (wMin / 100)).toFixed(2))
  return `clamp(${write(min, unit)}, ${write(base, unit)} + ${num(slope)}vw, ${write(max, unit)})`
}

/** Где рампа окажется на данной ширине — тем же счётом, каким её выпустили.
 *  Нужен замеру: обещание «на 560 будет 56» проверяется подстановкой, а не
 *  доверием к формуле. */
export const at = ([min, max], [wMin, wMax], width) => {
  if (min === max) return min
  const slope = (max - min) / ((wMax - wMin) / 100)
  const base = Number((min - slope * (wMin / 100)).toFixed(2))
  return Math.min(max, Math.max(min, base + Number(num(slope)) * (width / 100)))
}

/* ── чтение набора ───────────────────────────────────────────────────────
 *
 * Ключи по-русски, и это не украшение: файл открывает владелец, а не
 * машина. «воздух → между разделами» он прочтёт, `air.page` — нет.
 *
 * Набор пишется ФОРМУЛОЙ, а не таблицей чисел (И221). Владелец называет:
 *   тело       — два кегля тела: телефон и макет (слой 4 — база);
 *   отношение  — два отношения лестницы размера: телефон и макет;
 *   размер     — имя ступени → показатель степени (base = 0, h2 = 4, xs = −2);
 *   ритм       — имя ступени → множитель тела (Utopia: 0.25 … 6), ступень
 *                округляется к клетке: 2 до 16, 4 до 64, дальше 8 (Tailwind 4);
 *   поле       — роль → имя ступени ритма (одна ступень, в rem);
 *   воздух     — роль → [ступень на телефоне, ступень на макете]: пара «через
 *                ступень» (Utopia), так воздух растёт быстрее текста, как у
 *                живых люкс-магазинов (×1.33…1.5 при росте тела ×1.1);
 *   зазор      — роль → [под курсором, под пальцем];
 *   холст      — ширина коробки страницы в px (`--wrap`): Utopia — max
 *                viewport конфигурации, cbdshop `--layout-canvas` (слой 8);
 *   край       — [ступень на телефоне, ступень на макете] → `--gut`, поле
 *                от края окна до страницы: отдельная роль от зазора сетки
 *                (Carbon: «margins … fixed … even when columns are fluid»),
 *                растёт не больше LAYOUT.edgeGrowth (люкс ×1…1.75,
 *                Atlassian ×2, Utopia ×2.2);
 *   радиус     — роль → px из лестницы SHAPE.radii (M3 ∪ Carbon): xs, ctrl,
 *                card, sheet; полный круг (`--r-pop`) — только главное
 *                действие, его не выбирают (слой 9, И228).
 * Пара чисел [низ, верх] на любом из этих мест тоже читается — так набор
 * писался до И221, и так удобно ПРОБОВАТЬ число, — но клетка и коридоры
 * спрашиваются с неё так же.
 */

/** Ступень ритма по её имени в наборе: `"10"` → `var(--sp-10)`. */
const stepVar = (n) => `var(${PREFIX.space}${n})`

/** Округление к клетке ритма: 2 до 16, 4 до 64, дальше 8. Клетка —
 *  ступенчатая, как у Tailwind 4: шагов больше у базы, меньше вдали. */
export const snap = (px) => {
  const cell = RHYTHM.cell(px)
  return Math.round(px / cell) * cell
}

/** Концы ступени кегля — целыми пикселями (заказчик 28.09.2026: «почему
 *  такие неокруглённые числа… округли до целых»; И516): 25.5 → 26. Так
 *  пишут кегли системы с таблицей (Material 3, Tailwind: 14, 16, 20, 24, 30,
 *  36); между концами размер течёт с шириной, и дробь там — свойство
 *  плавного набора (Utopia), а не запись. Вниз, а не к ближнему: к ближнему
 *  подпись вставала 13 рядом с надписью 14 (+8 % — ступени неразличимы), а
 *  заголовок раздела 26 — под заголовком страницы 32 (1.23 при норме 1.25);
 *  вниз ступень не перерастает свою лестницу, и обе нормы держатся. */
const whole = (px) => Math.floor(px + 1e-9)

const isPair = (v) => Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number')

/** Роли крупного текста: имя в наборе → имя переменной. */
export const DISPLAY = { герой: 'hero', заголовок: 'pagehead', ввод: 'intro' }
/** Какие концы роли кто-то читает, кроме самой кривой: примитив `lede`
 *  считает по ним размер в миг расхождения колонок. Прочее не выпускается —
 *  число про запас (семья `unread`). */
export const DISPLAY_KNOBS = { hero: ['max', 'base', 'slope'], pagehead: [], intro: ['min', 'max', 'base', 'slope'] }

/** Ступень размера: показатель степени → пара по двум отношениям.
 *  Отрицательные ступени считаются телефонным отношением на обоих концах:
 *  с бóльшим отношением макета мелкий текст на макете выходил бы МЕЛЬЧЕ,
 *  чем на телефоне (у Utopia это известная оговорка), а лестница обязана
 *  расти вместе с телом на обоих концах. */
const sizeStep = (body, ratio, n, name) => {
  const [r0, r1] = n < 0 ? [ratio[0], ratio[0]] : ratio
  /* Вниз — но не ниже пола ступени (`TYPE.floor`): у просторного набора
     подпись 11.8 вниз давала 11 при норме 12. */
  const lo = (px) => Math.max(whole(px), Math.min(Math.ceil(px), TYPE.floor[name] ?? 0))
  return [lo(body[0] * r0 ** n), lo(body[1] * r1 ** n)]
}

/** Ступень размера долей одной из двух ручек (И561): `{ от: 'тело', доля:
 *  0.8, пол: 14 }` — вторичный текст, 0.8 основного и не мельче 14px;
 *  `{ от: 'заголовок', доля: 0.8 }` — подзаголовок и цена, 0.8 заголовка.
 *  Ручек две — размер основного текста и размер заголовков (заказчик
 *  29.09.2026: «размер текстов 16/18/20, заголовков 34/36/39 … чтобы второ-
 *  и третьестепенные элементы в размере подстраивались»); всё прочее —
 *  долей одной из них, поэтому ступень не спорит с соседней ручкой. Концы —
 *  целыми вниз, как у всей лестницы (И516), но не ниже пола. */
const shareStep = (knobs, v, name) => {
  const from = v.от ?? 'тело'
  const pair = knobs[from]
  if (!pair) throw new Error(`размер «${name}» — доля «${from}», а пары «${from}» в наборе нет`)
  if (typeof v.доля !== 'number' || !(v.доля > 0)) throw new Error(`размер «${name}»: доля — число больше нуля`)
  const floor = typeof v.пол === 'number' ? v.пол : 0
  return pair.map((px) => Math.max(whole(px * v.доля), floor))
}

/** Ступень ритма: множитель тела → пара на клетке. Ступень, чей телефонный
 *  конец не выше пола (8), — оптика и внутренность органа: она не течёт
 *  (CLAUDE.md, правило 2: геометрия контрола не течёт). */
const rhythmStep = (body, k) => {
  const lo = snap(body[0] * k)
  if (lo <= RHYTHM.floor) return [lo, lo]
  return [lo, snap(body[1] * k)]
}

/** Развёрнутый набор: каждое имя → пара чисел (низ, верх) в пикселях.
 *  Одна таблица на выпуск, на замер и на стенд — чтобы стенд показывал
 *  ровно то, что выпущено. */
export const resolve = (set) => {
  const out = {
    ширины: set.ширины, тело: set.тело, отношение: set.отношение,
    размер: {}, ритм: {}, поле: {}, воздух: {}, зазор: {},
  }
  const body = isPair(set.тело) ? set.тело : null
  const head = isPair(set.заголовок) ? set.заголовок : null
  if (head) out.заголовок = head
  /* Ярус от другой ступени (`{ от: 'h2' }`) или между двумя (`{ между:
     ['base', 'h2'] }`, И712) считается, когда те уже посчитаны; порядок
     ступеней — как записан в наборе: по нему меряется лестница. */
  const later = []
  const fromStep = (v) => Boolean(v.между) || (v.от !== undefined && v.от !== 'тело' && v.от !== 'заголовок')
  for (const [name, v] of Object.entries(set.размер ?? {})) {
    const tier = v === 'ярус' ? TYPE.tiers[name] : v
    if (v === 'ярус' && !tier) throw new Error(`размер «${name}» — «ярус», а яруса «${name}» в TYPE.tiers нет (tools/thresholds.mjs)`)
    if (tier && typeof tier === 'object' && !Array.isArray(tier) && fromStep(tier)) { later.push([name, tier]); continue }
    if (isPair(v)) out.размер[name] = v
    else if (v === 'ярус') {
      out.размер[name] = shareStep({ тело: body, заголовок: head }, tier, name)
    } else if (v === 'заголовок') {
      if (!head) throw new Error(`размер «${name}» — «заголовок», а пары «заголовок» в наборе нет`)
      out.размер[name] = [head[0], head[1]]
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.размер[name] = shareStep({ тело: body, заголовок: head }, v, name)
    } else if (typeof v === 'number') {
      if (!body || !isPair(set.отношение)) throw new Error(`размер «${name}» задан показателем, а тела или отношения в наборе нет`)
      out.размер[name] = sizeStep(body, set.отношение, v, name)
    } else throw new Error(`размер «${name}»: «ярус», «заголовок», доля { от, доля, пол }, показатель степени или пара [низ, верх]`)
  }
  for (const [name, tier] of later) {
    if (tier.между) {
      const [a, b] = tier.между.map((k) => out.размер[k])
      if (!a || !b) throw new Error(`размер «${name}»: между ${tier.между.join(' и ')} — такой ступени в наборе нет`)
      /* `доля` — не ниже этой доли второй ступени (И712). */
      out.размер[name] = [0, 1].map((i) => Math.max(whole(Math.max(Math.sqrt(a[i] * b[i]), b[i] * (tier.доля ?? 0))), tier.пол ?? 0))
    } else out.размер[name] = shareStep(out.размер, tier, name)
  }
  out.размер = Object.fromEntries(Object.keys(set.размер ?? {}).map((k) => [k, out.размер[k]]))
  for (const [name, v] of Object.entries(set.ритм ?? {})) {
    if (isPair(v)) out.ритм[name] = v
    else if (typeof v === 'number') {
      if (!body) throw new Error(`ритм «${name}» задан множителем, а тела в наборе нет`)
      out.ритм[name] = rhythmStep(body, v)
    } else throw new Error(`ритм «${name}»: множитель тела или пара [низ, верх]`)
  }
  /* Поле — одна ступень ритма: «одна ступень — полям, через ступень —
     воздуху» (Utopia, docs/layers.md §3.4). */
  for (const [name, v] of Object.entries(set.поле ?? {})) {
    if (isPair(v)) { out.поле[name] = v; continue }
    const pair = out.ритм[String(v)]
    if (!pair) throw new Error(`поле «${name}» просит ступень ритма ${v}, которой в наборе нет`)
    out.поле[name] = Object.assign([pair[0], pair[1]], { step: String(v) })
  }
  /* Воздух не заводит своих чисел: он ССЫЛАЕТСЯ на ступени ритма. Вторая
     шкала чисел для воздуха — путь, который Carbon прошёл (`layout-01…07`)
     и отменил обратно в единую: «do not use in new work». Пара ступеней —
     низ одной на телефоне, верх другой на макете. */
  for (const [name, v] of Object.entries(set.воздух ?? {})) {
    const [a, b] = Array.isArray(v) ? v.map(String) : [String(v), String(v)]
    const pa = out.ритм[a], pb = out.ритм[b]
    if (!pa || !pb) throw new Error(`воздух «${name}» просит ступень ритма ${!pa ? a : b}, которой в наборе нет`)
    out.воздух[name] = { step: a, steps: [a, b], pair: [pa[0], pb[1]] }
  }
  /* Зазор — пара [под курсором, под пальцем] в px, либо имя ступени ритма:
     тогда это зазор в сетке или ряду, и он течёт со ступенью. */
  for (const [name, v] of Object.entries(set.зазор ?? {})) {
    if (isPair(v)) { out.зазор[name] = v; continue }
    const pair = out.ритм[String(v)]
    if (!pair) throw new Error(`зазор «${name}» просит ступень ритма ${v}, которой в наборе нет`)
    out.зазор[name] = Object.assign([pair[0], pair[1]], { step: String(v) })
  }
  /* Холст и край — раскладка (слой 8, И227): числа коробки страницы тоже
     из набора, а не рукой в tokens.css. Край — пара ступеней, как воздух:
     он лежит между окном и предметом, с текстом не связан, в px. */
  if (set.холст !== undefined) {
    if (typeof set.холст !== 'number') throw new Error('холст — ширина коробки страницы числом в px')
    out.холст = set.холст
  }
  if (set.край !== undefined) {
    const [a, b] = Array.isArray(set.край) ? set.край.map(String) : [String(set.край), String(set.край)]
    const pa = out.ритм[a], pb = out.ритм[b]
    if (!pa || !pb) throw new Error(`край просит ступень ритма ${!pa ? a : b}, которой в наборе нет`)
    out.край = { steps: [a, b], pair: [pa[0], pb[1]] }
  }
  /* Крупный текст (И245) — заголовок героя, заголовок страницы, вводный
     абзац. Он мерит СВОЮ КОЛОНКУ (`cqi`), а не окно: в двух колонках героя
     колонка узкая, в одной — широкая. Поэтому это не ступень лестницы, а
     прямая по ширине колонки: низ и верх в px, наклон — px на 1cqi,
     основа — свободный член в px. Раньше эти три строки стояли в
     tokens.css одной на все наборы, и «Просторный» получал заголовок
     страницы мельче заголовка раздела. */
  if (set.крупные !== undefined) {
    out.крупные = {}
    for (const [role, v] of Object.entries(set.крупные)) {
      if (!DISPLAY[role]) throw new Error(`крупные: «${role}» — не роль; есть ${Object.keys(DISPLAY).join(', ')}`)
      const bad = ['низ', 'верх', 'наклон', 'основа'].filter((k) => typeof v?.[k] !== 'number' || !Number.isFinite(v[k]))
      if (bad.length) throw new Error(`крупные «${role}»: нужны числа ${bad.join(', ')}`)
      /* Потолок по высоте окна (И660) — необязателен: доля малого окна
         (`svh`), выше которой роль не растёт. Низкое окно ноутбука
         (1280 × 587) не вмещало первый экран: заголовок героя 54–60 px с
         шапкой занимал всё. Так делают по высоте и профессионалы (Shadeed,
         «Responsive design height»); увеличение шрифта держит `низ` в rem
         и разброс не больше ×2.5 (`TYPE.displaySpread`, Barvian). */
      const tall = v['по высоте']
      if (tall !== undefined && !(typeof tall === 'number' && tall > 0)) throw new Error(`крупные «${role}»: «по высоте» — доля окна числом больше 0`)
      out.крупные[role] = { низ: v.низ, верх: v.верх, наклон: v.наклон, основа: v.основа, ...(tall ? { высота: tall } : {}) }
    }
  }
  /* Радиусы — роли по узлу, числом из лестницы (слой 9, И228): Spectrum —
     угол растёт с масштабом, Radix — px × множитель; у нас — своё число в
     каждом наборе, и набор «Тихий» острее прочих. */
  if (set.радиус !== undefined) {
    if (!set.радиус || typeof set.радиус !== 'object') throw new Error('радиус — роли числом: { xs, ctrl, card, sheet }')
    out.радиус = {}
    for (const [name, v] of Object.entries(set.радиус)) {
      if (typeof v !== 'number') throw new Error(`радиус «${name}»: число в px из лестницы ${SHAPE.radii.join(', ')}`)
      out.радиус[name] = v
    }
  }
  return out
}

/* ── выпуск ──────────────────────────────────────────────────────────── */

const block = (sets, name, indent = '  ') => {
  const set = sets[name]
  const r = resolve(set)
  const w = set.ширины
  const lines = []
  const put = (name, value, why) =>
    lines.push(`${indent}${name}: ${value};${why ? `${' '.repeat(Math.max(1, 46 - name.length - value.length))}/* ${why} */` : ''}`)

  for (const [name, pair] of Object.entries(r.размер)) {
    put(`${PREFIX.font}${name}`, ramp(pair, w, 'rem'), set.подписи?.размер?.[name])
  }
  /* Крупный текст — в каждом наборе свой и весь в rem: низ, верх и основа
     растут, когда человек поднял шрифт в браузере (WCAG 1.4.4). Наклон и
     основа названы отдельно — по ним примитив `lede` считает размер,
     который текст будет иметь в миг, когда колонки разойдутся (И243). */
  for (const [role, d] of Object.entries(r.крупные ?? {})) {
    const en = DISPLAY[role]
    const knob = { min: write(d.низ, 'rem'), max: write(d.верх, 'rem'), base: write(d.основа, 'rem'), slope: num(d.наклон, 3) }
    for (const k of DISPLAY_KNOBS[en]) put(`--${en}-${k}`, knob[k])
    const fluid = `${write(d.основа, 'rem')} + ${num(d.наклон, 3)}cqi`
    const mid = d.высота ? `min(${fluid}, ${num(d.высота, 3)}svh)` : fluid
    put(`--${en}-size`, `clamp(${write(d.низ, 'rem')}, ${mid}, ${write(d.верх, 'rem')})`, `${role}: мерит свою колонку${d.высота ? ` и не выше ${num(d.высота, 3)} % окна (И660)` : ''}`)
  }
  for (const [name, pair] of Object.entries(r.ритм)) {
    put(`${PREFIX.space}${name}`, ramp(pair, w), set.подписи?.ритм?.[name])
  }
  /* Поле — в rem: оно лежит вокруг ТЕКСТА, и когда покупатель поднял шрифт
     в телефоне, буквы выросли, а поле в px осталось бы прежним (WCAG 1.4.4,
     Comeau). Воздух и зазор с текстом не связаны и растут только с шириной
     — они в px. Семья `padPx` не пускает поле обратно. */
  for (const [name, pair] of Object.entries(r.поле)) {
    put(`--pad-${name}`, ramp([pair[0], pair[1]], w, 'rem'), set.подписи?.поле?.[name])
  }
  /* Воздух одной ступени — ссылка на неё; пара ступеней — рампа от низа
     первой к верху второй, и это по-прежнему не своё число. */
  for (const [name, { steps, pair }] of Object.entries(r.воздух)) {
    const why = set.подписи?.воздух?.[name]
    const value = steps[0] === steps[1] ? stepVar(steps[0]) : ramp(pair, w)
    put(`--air-${name}`, value, steps[0] === steps[1] ? why : `${why ? `${why} — ` : ''}ступени ${steps[0]} → ${steps[1]}`)
  }
  for (const [gap, pair] of Object.entries(r.зазор)) {
    put(`--gap-${gap}`, pair.step ? ramp([pair[0], pair[1]], w) : `${num(pair[0])}px`, set.подписи?.зазор?.[gap])
  }
  /* Коробка страницы (слой 8): холст и край — роли раскладки из набора.
     `.wrap` берёт меньшее из холста и окна за вычетом двух краёв. */
  if (r.холст !== undefined) put('--wrap', `${num(r.холст)}px`, 'холст: ширина коробки страницы')
  if (r.край) {
    const { steps, pair } = r.край
    put('--gut', steps[0] === steps[1] ? stepVar(steps[0]) : ramp(pair, w), `край страницы: от окна до предмета — ступени ${steps[0]} → ${steps[1]}`)
  }
  /* Лестница управления: надпись органа не течёт с окном — пункт меню это
     мишень, а не абзац (scales.md, «Надпись контрола живёт в шкале
     управления»). Верхний конец каждой ступени размера, в px, — роль
     --ctrl-fs-*, а не число рукой в tokens.css (И224). */
  /* Ступень h1 — только заголовок страницы (И521): надписи органа такого
     роста нет, и роль про запас ловит check:css. */
  for (const [name, pair] of Object.entries(r.размер)) {
    if (name === 'h1') continue
    put(`--ctrl-fs-${name}`, write(pair[1], 'rem'), 'надпись органа — не течёт')
  }
  /* Размер органа (слой 7, И226): три высоты из порогов CONTROL, своя семья,
     не ступень ритма. Под пальцем — те же имена, значения в блоке
     @media (pointer: coarse) ниже (coarse()). Текущий размер — `--ctrl-h` и
     `--ctrl-fs`; атрибут data-size="sm|lg" переобъявляет их (base.css). */
  const [sm, md, lg] = CONTROL.heights.fine
  put('--ctrl-h-sm', `${num(sm)}px`, 'орган малый: фишка, сегмент')
  put('--ctrl-h', `${num(md)}px`, 'орган средний: кнопка, поле, лоток — текущий размер')
  put('--ctrl-h-lg', `${num(lg)}px`, 'орган крупный: кнопка покупки, счётчик, строка меню')
  put('--ctrl-target', `${num(CONTROL.target.fine)}px`, 'цель у знака мельче органа (WCAG 2.5.8)')
  put('--ctrl-face', `${num(CONTROL.face)}px`, 'рисунок малого органа с целью наружу — под пальцем не растёт')
  put('--ctrl-face-md', `${num(CONTROL.faceMd)}px`, 'рисунок кнопки в тесной ячейке (карточка полки) — под пальцем не растёт')
  put('--ctrl-fs', `var(--ctrl-fs-${CONTROL.text[1]})`, 'надпись текущего размера')
  /* Форма (слой 9, И228): радиусы — роли по узлу из набора; полный круг —
     только главное действие; линия и кольцо — из порогов и не текут. */
  if (r.радиус) {
    for (const [role, px] of Object.entries(r.радиус)) put(`--r-${role}`, `${num(px)}px`, set.подписи?.радиус?.[role] ?? `радиус: ${role}`)
    put('--r-pop', '999px', 'главное действие — единственный полный круг')
    /* Угол кнопки — роль формы, а не оси кнопки (слово заказчика 04.10.2026: «не
       реагируют кнопки на настройку панели, не меняется форма» — Shape → Corners
       не трогал кнопок, их держала пилюля оси «Форма кнопки»). Умолчание — угол
       контрола; ручка Corners панели ставит его вместе с остальными углами, её
       вариант Pill — полным кругом (как `radius="full"` у Radix Themes). */
    put('--r-btn', 'var(--r-ctrl)', 'угол кнопки — угол контрола; Corners → Pill — полный круг')
  }
  put('--line-w', `${num(SHAPE.line.hair)}px`, 'линия: поле, разделитель, тег — не течёт')
  put('--ring-w', `${num(SHAPE.ring.width)}px`, 'кольцо фокуса (WCAG 2.4.13)')
  put('--ring-off', `${num(SHAPE.ring.offset)}px`, 'отступ кольца от органа')
  put('--frost-blur', `${num(SHAPE.frost.blur)}px`, 'стекло: размытие того, что под органом — не течёт')
  put('--frost-sat', num(SHAPE.frost.saturate), 'стекло: насыщенность размытого')
  const roles = roleBlock(sets, name, indent)
  return roles ? `${lines.join('\n')}

${roles}` : lines.join('\n')
}

/** Зазор под пальцем — второе значение той же переменной, а не вторая
 *  переменная: Primer держит `controlStack.gap` 8 под курсором и 16 под
 *  пальцем одним именем, и всё про палец у набора живёт в этом запросе. */
const coarse = (set, sel) => {
  const pairs = Object.entries(set.зазор ?? {}).filter(([, p]) => isPair(p) && p[1] !== p[0])
  const [sm, md, lg] = CONTROL.heights.coarse
  const body = [
    ...pairs.map(([name, p]) => `--gap-${name}:${num(p[1])}px`),
    `--ctrl-h-sm:${num(sm)}px`, `--ctrl-h:${num(md)}px`, `--ctrl-h-lg:${num(lg)}px`, `--ctrl-target:${num(CONTROL.target.coarse)}px`,
    /* Рисунок органа с целью наружу под пальцем тот же: растёт запас, а не
       рисунок. Строка стоит и здесь, чтобы роль была парой «мышь · палец»,
       а не ручкой вида (scripts/look-slots.mjs берёт в ручки только то,
       чего нет в этом блоке). */
    `--ctrl-face:${num(CONTROL.face)}px`, `--ctrl-face-md:${num(CONTROL.faceMd)}px`,
  ].join('; ')
  return `\n@media (pointer:coarse){ ${sel}{ ${body} } }\n${fingerAt(sel)}{ ${body} }\n`
}

/** Близнец блока пальца — тот же текст на рамке `data-pointer='coarse'`
 *  (И768): медиазапрос о пальце страница не подделает, а дизайн-системе на
 *  ноутбуке надо показать органы ростом телефона — настоящими, не копией.
 *  Тело одно (`body` выше), второго набора чисел нет; `:where()` не
 *  прибавляет веса, поэтому близнец спорит с соседями так же, как блок
 *  пальца. Корень — сама рамка, набор `[data-scale]` — рамка внутри него. */
export const FINGER = ":where([data-pointer='coarse'])"
const fingerAt = (sel) => (sel === ':root' ? FINGER : `${sel} ${FINGER}`)

/**
 * Весь файл: `styles/scale.json` → `styles/scale.css`.
 *
 * Первый набор стоит на корне — он показывается, когда никто ничего не
 * выбирал, — И под своим именем, как все (И198: иначе переключатель наборов
 * работает во все стороны, кроме возврата к первому).
 */
export const toCss = (sets) => {
  const names = Object.keys(sets)
  const head =
    `/* Собран tools/scale-css.mjs из styles/scale.json. Руками не правят:\n` +
    `   первый же выпуск сотрёт правку. Числа владельца — в scale.json, здесь\n` +
    `   они СЧИТАНЫ по одной формуле (шкал: ${names.length}).\n\n` +
    `   Рампа каждой ступени проходит через две названные ширины: на узкой\n` +
    `   даёт свой низ, на широкой — свой верх. Концы — швы раскладки. */\n\n`
  let out = head + `:root{\n${block(sets, names[0])}\n}\n` + coarse(sets[names[0]], ':root')
  for (const name of names) {
    const sel = `[data-scale="${name}"]`
    out += `\n${sel}{\n${block(sets, name)}\n}\n` + coarse(sets[name], sel)
  }
  return out
}

/** The exact same declarations as the CSS emitter, for React and exports.
 * There is no second implementation of the scale formula in the application. */
export const variables = (set) => Object.fromEntries(
  [...block({ current: set }, 'current').matchAll(/(--[\w-]+):\s*([^;]+);/g)]
    .map(([, name, value]) => [name, value]),
)

/** Static input-axis declarations shared by live studio and exported CSS.
 * Keep these out of inline styles, which would override the coarse media rule. */
export const inputCss = (set, selector) => {
  const inputs = Object.entries(variables(set)).filter(([key]) => /^--ctrl-(h(?:-sm|-lg)?|target)$/.test(key) || Object.entries(set.зазор ?? {}).some(([name, pair]) => isPair(pair) && key === `--gap-${name}`))
  return `${selector}{${inputs.map(([key, value]) => `${key}:${value}`).join(';')}}\n${coarse(set, selector)}`
}

/* ── замер ───────────────────────────────────────────────────────────────
 *
 * Меряется НАБОР ЧИСЕЛ, а не выпущенный файл: все дефекты, которыми эта
 * работа куплена, рождаются в числах, а файл — их следствие. Отстал ли файл
 * от чисел, спрашивает `scale-css.mjs --check`.
 */

/** Порог различимости соседних ступеней. Тот же, что у семьи `nearStep` в
 *  `check:css`, и по той же причине: ниже 8% разница в 13 и 14 пикселей не
 *  видна никому, включая того, кто её ставил. */
export const NEAR = RHYTHM.near
/** Разброс одной ступени. Utopia роняет ступень, когда верх больше низа в
 *  2.5 раза: выше этого рампа при зуме 200% упирается в потолок раньше,
 *  чем текст вырастет вдвое (WCAG 1.4.4). */
export const SPREAD = RHYTHM.spread
/** Воздух между разделами к полю карточки. Замер семи живых люкс-магазинов
 *  20.09.2026: Muji 2.6…3.5 : 1, Glossier 5 : 1 (docs/layers.md, §3.3).
 *  Ниже трёх предметы и промежутки одного размера — ритма нет. */
export const AIR_TO_PAD = AIR.toPad
/** Насколько роль растёт от телефона к макету. Тот же замер: ×1.33…1.5 у
 *  всех семи. Спрашивается с воздуха — он и держит «дорогой» вид. */
export const GROWTH = AIR.growth
/** Поле не бывает нулём: предмет, содержимое которого лежит на его
 *  собственном крае, — не предмет, а обрыв. Ниже 8 — доводка, не ступень. */
export const PAD_FLOOR = RHYTHM.floor
/** Зазор между соседними целями под пальцем. WCAG 2.2 «Target Size
 *  (Minimum)» засчитывает цель меньше 24 только при таком же просвете;
 *  Primer держит 16. */
export const TAP_GAP = TARGET.gap.coarse

const ladder = (pairs, kind, findings) => {
  const names = Object.keys(pairs)
  for (let i = 1; i < names.length; i++) {
    const a = pairs[names[i - 1]], b = pairs[names[i]]
    for (const end of [0, 1]) {
      const where = end === 0 ? 'узкий конец' : 'широкий конец'
      if (b[end] <= a[end]) {
        findings.push({
          rule: `лестница ${kind} не убывает`,
          got: `${names[i - 1]} → ${names[i]}: ${a[end]} → ${b[end]}px (${where})`,
          need: 'следующая ступень больше предыдущей на обоих концах',
        })
      } else if (b[end] / a[end] < NEAR) {
        findings.push({
          rule: `ступени ${kind} различимы`,
          got: `${names[i - 1]} → ${names[i]}: ${a[end]} → ${b[end]}px (+${Math.round((b[end] / a[end] - 1) * 100)}%, ${where})`,
          need: `не ближе ${Math.round((NEAR - 1) * 100)}%`,
        })
      }
    }
  }
}

/** Набор с выбранными ручками типографики (И561): основной текст и его
 *  крупный текст — от ручки текста, заголовки и их крупный — от ручки
 *  заголовков; ритм, поле и воздух остаются у набора. Панель выпускает
 *  варианты «Text size» и «Headings» этим же вызовом. */
export const withKnobs = (set, { текст, заголовок } = {}) => {
  const t = текст === undefined ? null : TYPE.knobs.текст[текст]
  const h = заголовок === undefined ? null : TYPE.knobs.заголовок[заголовок]
  if (текст !== undefined && !t) throw new Error(`ручка текста «${текст}»: есть ${Object.keys(TYPE.knobs.текст).join(', ')}`)
  if (заголовок !== undefined && !h) throw new Error(`ручка заголовков «${заголовок}»: есть ${Object.keys(TYPE.knobs.заголовок).join(', ')}`)
  return {
    ...set,
    ...(t ? { тело: t.тело } : {}),
    ...(h ? { заголовок: h.заголовок } : {}),
    /* Ручка меняет концы и наклон роли, а не роль целиком: потолок по
       высоте окна (`по высоте`, И660) — свойство набора, и ручка заголовков
       его прежде стирала. */
    крупные: Object.fromEntries([...new Set([set.крупные, t?.крупные, h?.крупные].flatMap((x) => Object.keys(x ?? {})))]
      .map((role) => [role, { ...(set.крупные?.[role] ?? {}), ...(t?.крупные?.[role] ?? {}), ...(h?.крупные?.[role] ?? {}) }])),
  }
}

/** Все сочетания ручек — на них замер размера спрашивается так же, как на
 *  самом наборе: выбор в панели не должен ломать порядок ни в одной паре. */
/* Набор, чья лестница записана степенями (магазин до И561), ручками не
   управляется: его заголовок — степень тела, а не ручка, и крупный текст
   ручки с ним не сверяется. */
const onKnobs = (set) => Object.values(set.размер ?? {}).some((v) => v === 'ярус' || v === 'заголовок' || (v && typeof v === 'object' && !Array.isArray(v)))
const knobSets = (set) => !onKnobs(set) ? [] : Object.keys(TYPE.knobs.текст).flatMap((t) =>
  Object.keys(TYPE.knobs.заголовок).map((h) => ({ label: `текст ${t}, заголовки ${h}`, set: withKnobs(set, { текст: t, заголовок: h }) })))

/** Замер размера: лестница кегля и крупный текст одного развёрнутого
 *  набора. Зовётся на наборе как он записан И на каждом сочетании ручек
 *  типографики (И561): заказчик выбирает размер текста и заголовков в
 *  панели независимо от ритма, и порядок обязан держаться при любом
 *  выборе, а не только при умолчании набора. */
const auditType = (r, findings) => {
  ladder(r.размер, 'размера', findings)

  for (const [kind, table] of [['размера', r.размер]]) {
    for (const [name, [min, max]] of Object.entries(table)) {
      if (max < min) {
        findings.push({ rule: `верх не ниже низа (${kind})`, got: `${name}: ${min} → ${max}px`, need: 'на макете не меньше, чем на телефоне' })
      }
    }
  }
  /* Нижний конец каждой ступени — телефонный размер по нормам (scales.md,
     «Нижний конец шкалы — это телефонный размер, и он по нормам»). */
  for (const [name, floor] of Object.entries(TYPE.floor)) {
    const pair = r.размер[name]
    if (pair && pair[0] < floor) {
      findings.push({ rule: 'нижний конец по нормам', got: `${name}: ${pair[0]}px на телефоне`, need: `не меньше ${floor}px` })
    }
  }
  /* Заголовок к телу — верхний заголовок лестницы: имя страницы `h1`, где
     оно своей ступенью (И712), иначе раздел `h2`. */
  const top = r.размер.h1 ?? r.размер.h2
  if (top && r.размер.base && top[0] / r.размер.base[0] < TYPE.headContrast) {
    findings.push({ rule: 'заголовок к телу', got: `${top[0]} : ${r.размер.base[0]} = ${(top[0] / r.размер.base[0]).toFixed(2)} : 1 на телефоне`, need: `не меньше ${TYPE.headContrast} : 1` })
  }
  /* Крупный текст (И245): порядок против лестницы ЭТОГО набора, рост при
     увеличении шрифта и разброс, который масштаб страницы ещё догоняет.
     Колонка у крупного текста своя, поэтому порядок спрашивается с концов,
     которые он достигает на любой колонке: низ и верх. */
  const d = r.крупные
  if (d) {
    for (const [role, v] of Object.entries(d)) {
      if (!(v.низ < v.верх)) findings.push({ rule: `крупный текст: низ ниже верха (${role})`, got: `${v.низ} → ${v.верх}px`, need: 'низ меньше верха' })
      if (v.основа < 0) findings.push({ rule: `крупный текст не мельчает при увеличении шрифта (${role})`, got: `основа ${v.основа}px`, need: 'основа не меньше 0: при увеличении текста она растёт вместе с ним' })
      if (!(v.наклон > 0)) findings.push({ rule: `крупный текст растёт с колонкой (${role})`, got: `наклон ${v.наклон}`, need: 'больше 0' })
      if (v.верх / v.низ > TYPE.displaySpread) findings.push({ rule: `разброс крупного текста (${role})`, got: `×${(v.верх / v.низ).toFixed(2)}`, need: `не больше ×${TYPE.displaySpread}: масштаб страницы догоняет только низ` })
    }
    const h2 = r.размер.h2, base = r.размер.base, h3 = r.размер.h3
    const { заголовок: page, герой: hero, ввод: intro } = d
    if (page && h2 && !(page.низ > h2[0] && page.верх > h2[1])) {
      findings.push({ rule: 'заголовок страницы крупнее заголовка раздела', got: `${page.низ}…${page.верх} против h2 ${h2[0]}…${h2[1]}`, need: 'оба конца выше' })
    }
    if (page && h2 && (page.низ / h2[0] < TYPE.pageToSection || page.верх / h2[1] < TYPE.pageToSection)) {
      findings.push({ rule: 'заголовок страницы отделён от заголовка раздела', got: `${page.низ} : ${h2[0]} = ${(page.низ / h2[0]).toFixed(2)} на телефоне, ${page.верх} : ${h2[1]} = ${(page.верх / h2[1]).toFixed(2)} на макете`, need: `не меньше ${TYPE.pageToSection} : 1 на обоих концах` })
    }
    if (hero && page && hero.верх < page.верх) {
      findings.push({ rule: 'герой не мельче заголовка страницы', got: `верх ${hero.верх} против ${page.верх}`, need: 'не меньше' })
    }
    if (hero && h2 && hero.низ < h2[0]) {
      findings.push({ rule: 'герой не мельче заголовка раздела', got: `низ ${hero.низ} против h2 ${h2[0]}`, need: 'не меньше' })
    }
    if (intro && base && intro.низ < base[1]) {
      findings.push({ rule: 'вводный абзац не мельче основного текста', got: `низ ${intro.низ} против тела ${base[1]} на макете`, need: `не меньше ${base[1]}: колонка ввода бывает узкой и на макете` })
    }
    /* Концы сравниваются на одной ширине: верх ввода — с верхом подзаголовка
       на макете, низ — с низом на телефоне. Прежде верх ввода (макет) мерился
       низом подзаголовка (телефон) — ширинами, которые рядом не стоят. */
    if (intro && h3 && (intro.низ > h3[0] || intro.верх > h3[1])) {
      findings.push({ rule: 'вводный абзац не спорит с подзаголовком', got: `ввод ${intro.низ}…${intro.верх} против h3 ${h3[0]}…${h3[1]}`, need: 'не больше на каждом конце' })
    }
  }
}

/** Находки одного набора. Пустой список — набор в норме. */
export const auditScale = (set) => {
  const findings = []
  const w = set.ширины

  if (!Array.isArray(w) || w.length !== 2 || !(w[0] < w[1])) {
    findings.push({ rule: 'две ширины', got: JSON.stringify(w ?? null), need: 'узкая и широкая, узкая меньше' })
    return findings
  }
  /* Концы рампы — НАЗВАННЫЕ швы, а не произвольные числа. Иначе шкала
     течёт мимо тех ширин, на которых раскладка меняет смысл, и «ступенька
     размера на шве» (запрет 3) появляется там, где её никто не искал. */
  for (const width of w) {
    if (!BREAKPOINTS.includes(width)) {
      findings.push({
        rule: 'концы рампы — швы раскладки',
        got: `${width}px`,
        need: `один из швов ${BREAKPOINTS.join(', ')}`,
      })
    }
  }

  let r
  try { r = resolve(set) } catch (e) {
    findings.push({ rule: 'набор читается', got: e.message, need: 'см. заголовок tools/scale.mjs' })
    return findings
  }
  /* Основание (слой 4): два кегля тела и отношение лестницы — в коридоре.
     Ниже малой секунды ступени неразличимы, выше квинты между телом и
     заголовком не помещается подзаголовок. */
  if (isPair(set.отношение)) {
    for (const [i, ratio] of set.отношение.entries()) {
      if (ratio < TYPE.ratio[0] || ratio > TYPE.ratio[1]) {
        findings.push({ rule: 'отношение лестницы', got: `${i ? 'макет' : 'телефон'}: ${ratio}`, need: `${TYPE.ratio[0]}…${TYPE.ratio[1]}` })
      }
    }
  }
  ladder(r.ритм, 'ритма', findings)
  for (const [kind, table] of [['ритма', r.ритм], ['поля', r.поле]]) {
    for (const [name, [min, max]] of Object.entries(table)) {
      if (max < min) {
        findings.push({ rule: `верх не ниже низа (${kind})`, got: `${name}: ${min} → ${max}px`, need: 'на макете не меньше, чем на телефоне' })
      }
    }
  }
  auditType(r, findings)
  for (const { label, set: knobbed } of knobSets(set)) {
    const own = []
    auditType(resolve(knobbed), own)
    for (const x of own) findings.push({ ...x, rule: `${x.rule} (${label})` })
  }
  /* Клетка: концы ступени ритма лежат на клетке — 2 до 16, 4 до 64, дальше 8.
     Почти все числа семи люкс-магазинов кратны 4, большинство — 8. */
  for (const [name, pair] of Object.entries(r.ритм)) {
    for (const [i, px] of pair.entries()) {
      if (px !== snap(px)) {
        findings.push({ rule: 'клетка ритма', got: `${name}: ${px}px (${i ? 'макет' : 'телефон'})`, need: `на клетке ${RHYTHM.cell(px)} — ${snap(px)}px` })
      }
    }
  }

  for (const [kind, table] of [['размера', r.размер], ['ритма', r.ритм], ['поля', r.поле]]) {
    for (const [name, [min, max]] of Object.entries(table)) {
      if (max / min > SPREAD) {
        findings.push({
          rule: `разброс ступени ${kind}`,
          got: `${name}: ${min} → ${max}px (×${(max / min).toFixed(2)})`,
          need: `верх не больше ${SPREAD} низов`,
        })
      }
      /* Обещание подстановкой: на узкой ширине рампа обязана дать свой низ,
         на широкой — свой верх. Так ловится свободный член, списанный у
         соседней ступени: `--sp-11` обещал 100 и давал 93. */
      for (const [width, want] of [[w[0], min], [w[1], max]]) {
        const got = at([min, max], w, width)
        if (Math.abs(got - want) > 0.1) {
          findings.push({
            rule: `рампа держит свой конец (${kind})`,
            got: `${name}: на ${width}px даёт ${got.toFixed(2)}px`,
            need: `${want}px`,
          })
        }
      }
    }
  }

  for (const [name, [min]] of Object.entries(r.поле)) {
    if (min < PAD_FLOOR) {
      findings.push({ rule: 'поле не ноль', got: `${name}: ${min}px на узком конце`, need: `не меньше ${PAD_FLOOR}px` })
    }
  }

  /* Воздух страницы к полю карточки — то, чем держится дорогой вид. Роли
     названы в наборе; если владелец назвал их иначе, правило молчит, а не
     придумывает себе предмет. */
  const air = r.воздух['page'] ?? r.воздух['страница']
  const pad = r.поле['card'] ?? r.поле['карточка']
  if (air && pad) {
    for (const end of [0, 1]) {
      const ratio = air.pair[end] / pad[end]
      if (ratio < AIR_TO_PAD) {
        findings.push({
          rule: 'воздух к полю',
          got: `${air.pair[end]} : ${pad[end]} = ${ratio.toFixed(1)} : 1 (${end === 0 ? 'узкий' : 'широкий'} конец)`,
          need: `не меньше ${AIR_TO_PAD} : 1`,
        })
      }
    }
  }
  /* Рост спрашивается с КАЖДОГО воздуха, взятого парой ступеней: это те роли,
     что держат «дорогой» вид, и у живых магазинов все они растут в одном
     коридоре. Воздух одной ступени растёт с текстом — с него не спрашивается. */
  for (const [name, { steps, pair }] of Object.entries(r.воздух)) {
    if (steps[0] === steps[1]) continue
    const growth = pair[1] / pair[0]
    const [lo, hi] = name === 'page' || name === 'страница' ? GROWTH.page : GROWTH.other
    if (growth < lo || growth > hi) {
      findings.push({
        rule: 'воздух растёт в коридоре',
        got: `${name}: ${pair[0]} → ${pair[1]}px (×${growth.toFixed(2)}, ступени ${steps[0]} → ${steps[1]})`,
        need: `×${lo}…${hi} — ${lo === GROWTH.page[0] ? 'замер воздуха между разделами у живых магазинов' : 'от роста текста до самого широкого замеренного расстояния'}`,
      })
    }
  }

  for (const [name, [fine, tap]] of Object.entries(r.зазор)) {
    /* Зазор ступенью — не пара под указатель: с него спрашивается клетка, не палец. */
    if (r.зазор[name].step) continue
    if (tap < TAP_GAP) {
      findings.push({ rule: 'зазор под пальцем', got: `${name}: ${tap}px`, need: `не меньше ${TAP_GAP}px` })
    }
    if (tap < fine) {
      findings.push({ rule: 'палец не теснее курсора', got: `${name}: ${tap} против ${fine}px`, need: 'под пальцем не меньше' })
    }
  }

  /* Коробка страницы (слой 8). Холст не уже верхнего шва — иначе верх рамп
     недостижим: страница кончилась раньше, чем шкала дошла до макета. Край
     растёт в своём коридоре: люкс держит его почти постоянным, системы — до
     ×2.2; выше — край съедает телефон или пустует на макете. */
  if (r.холст !== undefined && r.холст < w[1]) {
    findings.push({ rule: 'холст не уже верхнего шва', got: `${r.холст}px`, need: `не меньше ${w[1]}px` })
  }
  /* Форма (слой 9): каждый радиус — ступень лестницы M3 ∪ Carbon, лист
     скруглён не меньше карточки, карточка — не меньше органа (концентрика:
     внешний угол не острее внутреннего). */
  if (r.радиус) {
    for (const [role, px] of Object.entries(r.радиус)) {
      if (!SHAPE.radii.includes(px)) {
        findings.push({ rule: 'радиус из лестницы', got: `${role}: ${px}px`, need: `одна из ступеней ${SHAPE.radii.join(', ')} (M3, Carbon)` })
      }
    }
    const order = ['ctrl', 'card', 'sheet'].filter((k) => k in r.радиус).map((k) => [k, r.радиус[k]])
    for (let i = 1; i < order.length; i++) {
      if (order[i][1] < order[i - 1][1]) {
        findings.push({ rule: 'радиусы вложены', got: `${order[i][0]} ${order[i][1]}px < ${order[i - 1][0]} ${order[i - 1][1]}px`, need: 'внешний предмет не острее вложенного: орган ≤ карточка ≤ лист' })
      }
    }
  }
  if (r.край) {
    const { steps, pair } = r.край
    const growth = pair[1] / pair[0]
    const [lo, hi] = LAYOUT.edgeGrowth
    if (growth < lo || growth > hi) {
      findings.push({
        rule: 'край растёт в коридоре',
        got: `${pair[0]} → ${pair[1]}px (×${growth.toFixed(2)}, ступени ${steps[0]} → ${steps[1]})`,
        need: `×${lo}…${hi} — люкс держит край почти постоянным (Diptyque 12 / 12, Byredo ×1.75), Atlassian 16 → 32, Utopia 18 → 40`,
      })
    }
  }

  return findings
}

/* ── вторая половина замера: шкала объявлена в одном месте ────────────────
 *
 * Строитель отвечает за свои числа, но не мешает написать рядом ещё одну
 * ступень рукой — а это тот самый признак заплатки из правил проекта: на
 * вопрос «где это решается?» ответов стало два. Ровно так и жил `--sp-11`:
 * рампа, набранная рукой рядом с формулой, описанной словами.
 */

/** Имена, которые выпускает строитель: их объявляет он и только он. */
export const builtNames = (sets) => {
  const names = new Set()
  for (const set of Object.values(sets)) {
    const r = resolve(set)
    for (const name of Object.keys(r.размер)) names.add(`${PREFIX.font}${name}`)
    for (const name of Object.keys(r.ритм)) names.add(`${PREFIX.space}${name}`)
    for (const name of Object.keys(r.поле)) names.add(`--pad-${name}`)
    for (const name of Object.keys(r.воздух)) names.add(`--air-${name}`)
    for (const name of Object.keys(r.зазор)) names.add(`--gap-${name}`)
    for (const name of Object.keys(r.размер)) names.add(`--ctrl-fs-${name}`)
    for (const name of ['--ctrl-h-sm', '--ctrl-h', '--ctrl-h-lg', '--ctrl-target', '--ctrl-fs']) names.add(name)
    if (r.холст !== undefined) names.add('--wrap')
    if (r.край) names.add('--gut')
    if (r.радиус) { for (const role of Object.keys(r.радиус)) names.add(`--r-${role}`); names.add('--r-pop'); names.add('--r-btn') }
    for (const name of ['--line-w', '--ring-w', '--ring-off', '--frost-blur', '--frost-sat']) names.add(name)
  }
  for (const setName of Object.keys(sets)) {
    for (const [role, r] of Object.entries(rolesOf(sets, setName))) {
      for (const part of ['lead', 'weight', 'track']) names.add(`--${role}-${part}`)
      if (Array.isArray(r.размер) || r.размер !== `--${role}-size`) names.add(`--${role}-size`)
      if (r.мера && r.мера !== 'нет') names.add(`--${role}-measure`)
    }
  }
  return names
}

/** Разбор рампы обратно в числа: `clamp(48px, 30.77px + 3.08vw, 64px)` →
 *  низ, верх, свободный член, наклон. Не рампа — `null`. */
export const readRamp = (value) => {
  const m = String(value).match(
    /clamp\(\s*(-?[\d.]+)(px|rem)\s*,\s*(-?[\d.]+)(px|rem)\s*\+\s*(-?[\d.]+)vw\s*,\s*(-?[\d.]+)(px|rem)\s*\)/)
  if (!m) return null
  const k = (n, unit) => Number(n) * (unit === 'rem' ? ROOT_FS : 1)
  return { min: k(m[1], m[2]), base: k(m[3], m[4]), slope: Number(m[5]), max: k(m[6], m[7]) }
}

/**
 * Держит ли рукописная рампа свои концы на названных ширинах.
 *
 * Тот самый замер, которого не было: `--sp-11` обещал 100 пикселей на
 * макете и давал там 93, потому что свободный член был списан у `--sp-9`.
 * Глазом это не видно — числа правдоподобные, — а подстановкой видно сразу.
 */
export const missesEnds = (value, [wMin, wMax]) => {
  const r = readRamp(value)
  if (!r) return null
  const on = (width) => r.base + r.slope * (width / 100)
  const lo = on(wMin), hi = on(wMax)
  const off = []
  if (Math.abs(lo - r.min) > 0.5) off.push(`на ${wMin}px даёт ${lo.toFixed(1)} вместо ${r.min}`)
  if (Math.abs(hi - r.max) > 0.5) off.push(`на ${wMax}px даёт ${hi.toFixed(1)} вместо ${r.max}`)
  return off.length ? off.join('; ') : null
}

/**
 * Находки по файлам стилей: имя строителя, объявленное мимо него, и
 * рукописная рампа, промахивающаяся мимо своих концов.
 *
 * `sheets` — список `{ rel, css }` (выпущенный файл в него не входит: его
 * пишет машина). `widths` — две названные ширины первого набора.
 */
export const auditSheets = (sheets, sets) => {
  const built = builtNames(sets)
  const widths = Object.values(sets)[0]?.ширины ?? [560, 1080]
  const findings = []
  for (const { rel, css } of sheets) {
    for (const m of css.matchAll(/(?:^|[;{])\s*(--[\w-]+)\s*:\s*([^;}]+)/g)) {
      const [, name, value] = m
      const line = css.slice(0, m.index).split('\n').length
      if (built.has(name)) {
        /* Переобъявить роль РОЛЬЮ — законно и нужно: лист на тёмной палубе
           берёт поле карточки (`--pad-sheet:var(--pad-card)`), витрина
           переобъявляет роли, а не шкалу (docs/layers.md, §3.4). Находка —
           только ЧИСЛО на имени строителя: это и есть второй источник.
           Чего правило не ловит, сказано вслух: подмену роли ролью на корне
           — она тоже второй источник выбора, но отличить её от законной
           местной подмены чтением файла нельзя. */
        if (/-?[\d.]+(px|rem|em|vw|vh|cqi|cqw|%)/.test(value.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, ' '))) {
          findings.push({
            rule: 'число на имени строителя',
            got: `${rel}:${line}  ${name}: ${value.trim().slice(0, 40)}`,
            need: 'ступени и роли выпускает строитель — правьте styles/scale.json',
          })
        }
        continue
      }
      if (!new RegExp(`^(?:${PREFIX.font}|${PREFIX.space}|--pad-)`).test(name)) continue
      const off = missesEnds(value, widths)
      if (off) {
        findings.push({ rule: 'рампа мимо своих концов', got: `${rel}:${line}  ${name}: ${off}`, need: 'считать по формуле — npm run scale' })
      }
    }
  }
  return findings
}

/**
 * Ступень — по просителю. Ступень, которую не читает ни роль набора, ни один
 * файл стилей, — не ступень, а число про запас: у Radix девять ступеней
 * ритма потому, что девять просят, у Tailwind 4 в теме ни одного `--spacing-N`
 * (docs/layers.md, §3.2). Так жил `--sp-11`: выпускался, не читался никем и
 * промахивался мимо своего конца — и никто не видел.
 */
/**
 * Кто просит ступень: имя ступени → «набор: роль». Просители собираются по
 * ВСЕМ наборам файла: ступени у них общие («один и тот же ряд ступеней у
 * всех», references/sets.md), и ступень, которую просит воздух хотя бы
 * одного набора, живая.
 *
 * Третий проситель, кроме роли и файла стилей, — набор каталога, которого в
 * файле нет (`каталог`, И343). Витрина носит один вид (И270): ставщик
 * оставляет в её `styles/scale.json` один набор, остальные уходят в каталог
 * панели вида. Ряд у набора остаётся общим — по нему панель передаёт сайту
 * любой набор каталога, и опубликованный вид несёт весь ряд, — а просители
 * ушедших наборов из файла пропадали: `--sp-11`, который просит воздух
 * разделов «Тихого», на витрине стал «ступенью без просителя». Оставшийся
 * набор называет их сам: `"каталог": { "--sp-11": ["Тихий: воздух page"] }`
 * — пишет ставщик, считая этой же функцией (`alone`).
 */
export const requesters = (sets) => {
  const by = new Map()
  const put = (step, who) => {
    if (!by.has(step)) by.set(step, [])
    if (!by.get(step).includes(who)) by.get(step).push(who)
  }
  for (const name of Object.keys(sets)) {
    const rs = resolve(sets[name])
    for (const [role, p] of Object.entries(rs.поле)) if (p.step) put(`${PREFIX.space}${p.step}`, `${name}: поле ${role}`)
    for (const [role, a] of Object.entries(rs.воздух)) for (const st of a.steps) put(`${PREFIX.space}${st}`, `${name}: воздух ${role}`)
    for (const [role, g] of Object.entries(rs.зазор)) if (g.step) put(`${PREFIX.space}${g.step}`, `${name}: зазор ${role}`)
    if (rs.край) for (const st of rs.край.steps) put(`${PREFIX.space}${st}`, `${name}: край`)
    for (const [role, r] of Object.entries(rolesOf(sets, name))) {
      if (typeof r.размер === 'string') put(r.размер, `${name}: текст ${role}`)
    }
    for (const [step, who] of Object.entries(sets[name].каталог ?? {})) {
      for (const w of [].concat(who)) put(step, `каталог — ${w}`)
    }
  }
  return by
}

/**
 * Набор, который остаётся в файле один (витрина, И270), — с просителями
 * общего ряда из наборов, ушедших в каталог (И343). Ступень, которую просят
 * его собственные роли, называть не нужно; ступень, которую не просит никто
 * и в каталоге, не называется — её найдёт «ступень без просителя», и это
 * верно: она мёртвая везде.
 */
export const alone = (sets, name) => {
  if (!sets[name]) throw new Error(`набора «${name}» в файле нет`)
  const { каталог: _was, ...set } = sets[name]
  /* Роли текста набор без своих берёт у первого в файле (`rolesOf`) —
     поэтому просители считаются по всему файлу, а своими считаются те, что
     названы именем набора. */
  const all = requesters({ ...sets, [name]: set })
  const r = resolve(set)
  const каталог = {}
  for (const step of [...Object.keys(r.размер).map((n) => `${PREFIX.font}${n}`), ...Object.keys(r.ритм).map((n) => `${PREFIX.space}${n}`)]) {
    const who = all.get(step) ?? []
    if (who.some((w) => w.startsWith(`${name}:`))) continue
    const others = who.filter((w) => !w.startsWith('каталог — '))
    if (others.length) каталог[step] = others
  }
  return Object.keys(каталог).length ? { ...set, каталог } : set
}

export const auditReaders = (sheets, sets) => {
  const findings = []
  const first = Object.values(sets)[0]
  if (!first) return findings
  const r = resolve(first)
  const css = sheets.map((s) => s.css).join('\n')
  const asked = requesters(sets)
  /* Названный набором каталога проситель — ступенью ряда: имя, которого в
     ряду нет, — опечатка или ряд, ушедший из-под записи. */
  for (const [name, set] of Object.entries(sets)) {
    const own = resolve(set)
    for (const step of Object.keys(set.каталог ?? {})) {
      const known = step.startsWith(PREFIX.font) ? step.slice(PREFIX.font.length) in own.размер : step.startsWith(PREFIX.space) && step.slice(PREFIX.space.length) in own.ритм
      if (!known) findings.push({ rule: 'проситель ступени, которой нет', got: `${name}: каталог ${step}`, need: 'ключ «каталог» называет ступень ряда этого набора' })
    }
  }
  const names = [
    ...Object.keys(r.размер).map((n) => `${PREFIX.font}${n}`),
    ...Object.keys(r.ритм).map((n) => `${PREFIX.space}${n}`),
  ]
  for (const name of names) {
    if (asked.has(name)) continue
    if (new RegExp(`var\\(${name}[,)]`).test(css)) continue
    /* Лестница управления берёт верх ступени размера числом: орган, читающий
       --ctrl-fs-sm, просит и ступень --fs-sm. */
    if (name.startsWith(PREFIX.font) && new RegExp(`var\\(--ctrl-fs-${name.slice(PREFIX.font.length)}[,)]`).test(css)) continue
    findings.push({ rule: 'ступень без просителя', got: name, need: 'ступень заводится там, где её просит роль, файл стилей или набор каталога (ключ «каталог», И343) — уберите из styles/scale.json или назовите просителя' })
  }
  return findings
}

/* ── роли текста ─────────────────────────────────────────────────────────
 *
 * Ступень отвечает на «какого размера», но набор текста — это пять фактов,
 * а не один: размер, межстрочье, вес, разрядка и мера строки. Пока названа
 * одна пятая, остальные четыре набирает каждое место само — и набирает
 * по-разному.
 *
 * Замер 21.09.2026 показал это ровно: два крупных заголовка в одном файле
 * примитивов. `.ledeText h1` — межстрочье 1.1, вес 700, разрядка −.04em.
 * `.pagehead h1` — вес 700, разрядка −.03em и НИ ОДНОГО межстрочья, то есть
 * наследует 1.45 от тела страницы: на 42 пикселях это 61 пиксель между
 * строками там, где канон крупного заголовка — 46. Заголовок из двух строк
 * разваливается, и виноватого в файле не видно: там просто нечего смотреть.
 *
 * Поэтому роль объявляется целиком и в одном месте. Размер она БЕРЁТ —
 * ступень шкалы или названную кривую (`--hero-size`, `--fs-page` считаются
 * от своего контейнера, а не от окна, и остаются там, где объявлены).
 */

/** Вес, который вообще бывает у текста. 800 и выше — это счётчик на
 *  контроле, а не роль набора. */
export const WEIGHTS = TEXT.weights
/** Межстрочье заголовка: 1.1…1.25 — канон крупного кегля, он уже был
 *  записан словами в примитиве. Выше — строки разъезжаются. */
export const HEAD_LEAD = TEXT.headLead
/** Межстрочье текста: ниже 1.35 строки склеиваются; 1.5 обязан не ломать
 *  вёрстку (WCAG 1.4.12), и коридор держится вокруг него. */
export const TEXT_LEAD = TEXT.textLead
/** Разрядка: больше 0.05em в любую сторону — это уже не набор, а приём. */
export const TRACK_MAX = TEXT.trackMax

/** Роли текста набора. Объявляет их ПЕРВЫЙ набор: межстрочье и вес — факты
 *  типографики, а не плотности, и от «тесно/просторно» не зависят. Набор,
 *  объявивший своё, берёт своё. */
export const rolesOf = (sets, name) =>
  sets[name]?.текст ?? sets[Object.keys(sets)[0]]?.текст ?? {}

const roleBlock = (sets, name, indent = '  ') => {
  const roles = rolesOf(sets, name)
  const w = sets[name].ширины
  const lines = []
  for (const [role, r] of Object.entries(roles)) {
    /* Размер роли — ступень (`--fs-base`), пара [низ, верх] или доля ручки
       (`{ от: 'тело', доля: 1.2 }`, И583): роль растёт с ручкой, но на
       лестницу ступенью не встаёт — между текстом и подзаголовком на
       телефоне при мелких заголовках места для ступени нет. */
    const own = r.размер && typeof r.размер === 'object' && !Array.isArray(r.размер)
      ? shareStep({ тело: sets[name].тело, заголовок: sets[name].заголовок }, r.размер, role)
      : r.размер
    /* `пол` — размер роли не мельче этого (`max(1rem, var(--fs-sm))`): меню
       встаёт ярусом ниже тела, но мельче 16 оно читается сноской (И580). */
    const floor = r.пол && typeof own === 'string' ? (v) => `max(${r.пол}, ${v})` : (v) => v
    const size = Array.isArray(own) ? ramp(own, w, 'rem') : floor(`var(${own})`)
    /* Роль, чей размер ЕСТЬ переменная того же имени (`hero` ← `--hero-size`),
       своего `--hero-size` не объявляет: это ссылка на саму себя, и браузер
       погасит её вместе со всей ролью. */
    if (Array.isArray(own) || own !== `--${role}-size`) {
      lines.push(`${indent}--${role}-size: ${size};`)
    }
    lines.push(`${indent}--${role}-lead: ${leadOf(r.межстрочье)};`)
    lines.push(`${indent}--${role}-weight: ${r.вес};`)
    lines.push(`${indent}--${role}-track: ${r.разрядка};`)
    if (r.мера && r.мера !== 'нет') lines.push(`${indent}--${role}-measure: var(${r.мера});`)
  }
  return lines.join('\n')
}

/** Соотношения ролей — что с чем стоит рядом и какая из них старше, числом
 *  ступеней лестницы (`размер` набора), а не пикселями: набор меняет
 *  отношение, а порядок держится. `steps` — ровно на столько ступеней выше;
 *  `min` — не меньше стольких.
 *
 *  Шапка карты товара: марка → имя → описание. Марка — на ступень выше
 *  описания и ниже имени (заказчик 28.09.2026: «шрифт бренда должен быть на
 *  шаг больше, чем описание»). До того марку дважды двигали одну, без
 *  соседей: «на шаг больше» тела — и она догоняла имя (И502), «на шаг
 *  меньше» тела — и становилась мельче описания (И509). Ступень выше тела у
 *  лестницы — уже ступень имени, поэтому соседей держит соотношение, а не
 *  число у одной роли (И511). */
export const ROLE_ORDER = [
  /* Марка не мельче описания под именем (И563, И579): описание — подпись имени
     страницы (`lede`, ростом текста), марка — ростом текста, жирная. Прежде
     марка стояла на шаг над описанием, а описание — вторичным ярусом (И511),
     и описание выходило мельче текста страницы. */
  { below: 'lede', above: 'byline', min: 0, why: 'марка не мельче описания под именем' },
  { below: 'byline', above: 'prodhead', min: 1, why: 'имя товара крупнее марки' },
  /* Марка на карточке полки — своя роль `maker` (заказчик 30.09.2026 со
     снимком полки: «явно название бренда должно быть меньше»): на полке
     она стояла ростом имени (20 при имени 20) и спорила с ним. На ступень
     ниже имени, но не мельче строки фактов под ним (`note`) — правило
     29.09.2026 «бренд не может быть мельче текста описания» держится и
     здесь. На карте товара марка — прежняя `byline`: там описание ростом
     текста. */
  /* Имя и цена в карточке — свои роли `cardname`, `cardprice` (заказчик
     03.10.2026: «только новые роли для текста карточки»): на ступень ниже
     текста страницы — подпись к снимку, а не абзац; так у Allbirds (имя 14)
     и Shopify Dawn (13 при теле 16), замер 03.10.2026. Прежде имя на полке
     читало роль тела и мельчить его значило мельчить весь текст сайта.
     Марка — ступенью ниже имени в карточке; строка фактов — не крупнее
     марки (слово 29.09.2026 «бренд не может быть мельче текста описания» —
     «не мельче», ровня допустима). */
  /* 03.10.2026, позже тем же днём (И674): у профессионалов имя в карточке не
     мельче меню и равно тексту страницы (медиана 1.0; Glossier 14 = 14,
     Gymshark 14 = 14, Byredo 16 при 14), у нас оно стояло 14 при меню 16 и
     тексте 18 — порядок перевёрнут; слово заказчика: «текст на карточке
     сильно меньше текста в меню… может чуть меньше или такой как основной
     текст страницы товара». Имя и цена в карточке — ростом текста. */
  { below: 'cardname', above: 'body', steps: 0, why: 'имя товара в карточке ростом текста страницы и не мельче меню (И674: Glossier, Gymshark — имя = текст; Allbirds — имя крупнее меню)' },
  { below: 'cardprice', above: 'cardname', steps: 0, why: 'цена в карточке ростом имени' },
  { below: 'maker', above: 'cardname', steps: 1, why: 'марка на полке на ступень ниже имени товара в карточке' },
  { below: 'note', above: 'maker', min: 0, why: 'марка на полке не мельче строки фактов под именем' },
  /* Цена и имя (заказчик 28.09.2026: «название на 2 позиции выше и цену на
     3 позиции выше» — про размер): цена на две ступени над телом, имя —
     ступенью над ценой; лестница продлена ступенью `h1` (И513). Тем же
     днём, выбрав глазами: «на шаг меньше оставляем» — имя `h2`, цена `h3`,
     ступень `h1` без просителя снята (И515). */
  { below: 'price', above: 'prodhead', steps: 1, why: 'имя товара на ступень крупнее цены' },
  /* Раздел и полка — ступенью ниже имени страницы (И712): на карте товара
     имя и «Similar products» стояли одним ростом — два главных на странице. */
  { below: 'h2', above: 'prodhead', steps: 1, why: 'заголовок раздела на ступень ниже имени страницы' },
  /* Заголовок окна — ступенью ниже заголовка раздела (заказчик 29.09.2026:
     «уменьши заголовок у всех шторок на шаг»): окно в 400, а не страница. */
  { below: 'panehead', above: 'h2', steps: 1, why: 'заголовок окна на ступень ниже заголовка раздела' },
]

/** Толщина ролей относительно друг друга — ступенями лестницы WEIGHTS:
 *  `role` легче `of` на столько ступеней, сколько перечислено в `steps`.
 *  Слово заказчика 30.09.2026: «название и цена должны иметь одинаковый вес,
 *  это правило, и в скил запиши. Бренд на шаг меньший вес (или на два)»
 *  (И589). До того имя стояло 600 при цене 700, и цена читалась главнее
 *  имени. Имя на полке, в поиске и на карте товара — толщиной `prodhead`. */
export const WEIGHT_ORDER = [
  { role: 'prodhead', of: 'price', steps: [0], why: 'имя товара и цена — одной толщины' },
  { role: 'byline', of: 'price', steps: [1, 2], why: 'марка на шаг или два легче имени и цены' },
  { role: 'cardname', of: 'cardprice', steps: [0], why: 'имя и цена в карточке — одной толщины' },
  { role: 'maker', of: 'cardprice', steps: [1, 2], why: 'марка на полке на шаг или два легче имени и цены в карточке' },
  /* ДВА ГОЛОСА ТОЛЩИНЫ (И674; слово заказчика 03.10.2026: «разрозненно,
     нецельно… как из разных дизайн-систем; сделать как у профессионалов»).
     Замер: у Glossier, Dawn, Byredo, Gymshark, Allbirds в тексте 1–2 веса,
     иерархию держат размер, регистр и цвет; заголовки премиальных — 400–500;
     Material 3 — два веса, «выделенный» набор только у главного. У нас было
     четыре (400 / 500 / 600 / 700) без закона, кто каким говорит. Теперь:
     всё, что называет или нажимается (заголовки, имя и цена товара, меню,
     надписи органов), — одной толщиной; всё, что читают (текст, подписи,
     справка), — на ступень легче. Логотип — знак марки, не голос текста. */
  { role: 'h2', of: 'prodhead', steps: [0], why: 'заголовок раздела и имя товара — один голос заголовка' },
  { role: 'h3', of: 'h2', steps: [0], why: 'подзаголовок — тем же голосом, что раздел' },
  { role: 'hero', of: 'h2', steps: [0], why: 'крупный текст первого экрана — тем же голосом, что раздел' },
  { role: 'pagehead', of: 'h2', steps: [0], why: 'имя страницы — тем же голосом, что раздел' },
  { role: 'panehead', of: 'h2', steps: [0], why: 'заголовок окна — тем же голосом, что раздел' },
  { role: 'parthead', of: 'h2', steps: [0], why: 'подзаголовок части описания — тем же голосом' },
  { role: 'cardname', of: 'prodhead', steps: [0], why: 'имя товара в карточке той же толщины, что на странице товара' },
  { role: 'menu', of: 'cardname', steps: [0], why: 'пункт меню и имя товара — одной толщины (Allbirds 500 / 500)' },
  { role: 'label', of: 'menu', steps: [0], why: 'надписи органов (кнопка, фишка, вкладка) — толщиной пункта меню' },
  { role: 'cardbtn', of: 'label', steps: [0], why: 'надпись кнопки карточки — толщиной надписей органов (И752)' },
  { role: 'eyebrow', of: 'label', steps: [0], why: 'надзаголовок — надпись, толщиной надписей' },
  { role: 'body', of: 'h2', steps: [1], why: 'текст на ступень легче заголовка: два голоса толщины на сайт' },
  { role: 'lede', of: 'body', steps: [0], why: 'подпись заголовка читается — толщиной текста' },
  { role: 'intro', of: 'body', steps: [0], why: 'вводный абзац — толщиной текста' },
  { role: 'blurb', of: 'body', steps: [0], why: 'вторичный текст — толщиной текста' },
  { role: 'note', of: 'body', steps: [0], why: 'сноска — толщиной текста' },
]

/** Находки по ролям текста. Числа порогов — выше, каждое со своей причиной. */
export const auditRoles = (sets, name) => {
  const findings = []
  const roles = rolesOf(sets, name)
  /* Ступень роли — место её размера на лестнице набора; роль на своей
     кривой (`--hero-size`) в соотношениях не участвует. */
  /* Порядок ступеней — по размеру на макете, а не по записи: ступень пишется
     и степенью, и долей ручки (И561), и сравнить их можно только числом. */
  let sized = {}
  try { sized = resolve(sets[name]).размер } catch { /* нечитаемый набор назовёт auditScale */ }
  const ladder = Object.entries(sized).sort((a, b) => a[1][1] - b[1][1] || a[1][0] - b[1][0]).map(([k]) => k)
  const stepOf = (role) => ladder.indexOf(String(roles[role]?.размер ?? '').replace(/^--fs-/, ''))
  for (const o of ROLE_ORDER) {
    /* Соотношение спрашивается у пары, которая есть: набор без карты
       товара марки и описания не объявляет, и молчание здесь — не дефект. */
    if (!roles[o.below] || !roles[o.above]) continue
    const lo = stepOf(o.below), hi = stepOf(o.above)
    if (lo < 0 || hi < 0) {
      findings.push({ rule: 'соотношение ролей', got: `${o.below} → ${o.above}: роль не стоит на ступени лестницы`, need: o.why })
      continue
    }
    const gap = hi - lo
    if (o.steps !== undefined ? gap !== o.steps : gap < o.min) {
      findings.push({ rule: 'соотношение ролей', got: `${o.above} выше ${o.below} на ${gap} ступ.`, need: `${o.steps !== undefined ? `ровно ${o.steps}` : `не меньше ${o.min}`} — ${o.why}` })
    }
  }
  /* Толщина — тоже соотношение, ступенями лестницы WEIGHTS (И589). */
  for (const o of WEIGHT_ORDER) {
    if (!roles[o.role] || !roles[o.of]) continue
    const gap = WEIGHTS.indexOf(roles[o.of].вес) - WEIGHTS.indexOf(roles[o.role].вес)
    if (!o.steps.includes(gap)) findings.push({ rule: 'толщина ролей', got: `${o.role} ${roles[o.role].вес} при ${o.of} ${roles[o.of].вес}`, need: `легче на ${o.steps.join(' или ')} ступ. — ${o.why}` })
  }
  /* Голосов толщины не больше TEXT.voices (И674): то, что называет и
     нажимается, и то, что читают. Логотип — знак марки, не голос текста. */
  const voices = [...new Set(Object.entries(roles).filter(([role]) => role !== 'logo').map(([, r]) => r.вес))].sort()
  if (voices.length > TEXT.voices) findings.push({ rule: 'голоса толщины', got: `в ролях текста ${voices.length} толщины: ${voices.join(' / ')}`, need: `не больше ${TEXT.voices}: называет и нажимается — одна, читается — на ступень легче (И674)` })
  for (const [role, r] of Object.entries(roles)) {
    const need = (field, what) => {
      if (r[field] === undefined || r[field] === null || r[field] === '') {
        findings.push({ rule: 'роль текста неполна', got: `${role}: нет «${field}»`, need: what })
        return false
      }
      return true
    }
    /* Мера спрашивается наравне с остальными, и «нет» — законный ответ:
       заголовку меру назначают вёрсткой, а не шкалой. Незаполненной она
       быть не может: молчание и «нет» — разные вещи. */
    const full = ['размер', 'межстрочье', 'вес', 'разрядка', 'род', 'мера']
      .map((f) => need(f, 'роль объявляется целиком: размер, межстрочье, вес, разрядка, род, мера'))
      .every(Boolean)
    if (!full) continue

    if (!['заголовок', 'текст'].includes(r.род)) {
      findings.push({ rule: 'род роли', got: `${role}: «${r.род}»`, need: 'заголовок или текст' })
      continue
    }
    const head = r.род === 'заголовок'
    const [lo, hi] = head ? HEAD_LEAD : TEXT_LEAD
    const lead = leadOf(r.межстрочье)
    if (Number.isNaN(lead)) {
      findings.push({ rule: 'межстрочье не число', got: `${role}: ${JSON.stringify(r.межстрочье)}`, need: 'доля (1.45) или строка на кегль пикселями ("36/28")' })
      continue
    }
    if (lead < lo || lead > hi) {
      findings.push({
        rule: `межстрочье ${head ? 'заголовка' : 'текста'}`,
        got: `${role}: ${r.межстрочье}`,
        need: `${lo}…${hi}`,
      })
    }
    if (!WEIGHTS.includes(r.вес)) {
      findings.push({ rule: 'вес роли', got: `${role}: ${r.вес}`, need: WEIGHTS.join(', ') })
    }
    const track = Number(String(r.разрядка).replace('em', '')) || 0
    if (Math.abs(track) > TRACK_MAX) {
      findings.push({ rule: 'разрядка', got: `${role}: ${r.разрядка}`, need: `не больше ${TRACK_MAX}em в любую сторону` })
    }
    /* Сжимают КРУПНОЕ: на большом кегле буквы и так стоят просторно.
       Разгоняют МЕЛКОЕ: подпись и надзаголовок читаются по буквам. */
    if (track < 0 && !head) {
      findings.push({ rule: 'разрядка сжимает текст', got: `${role}: ${r.разрядка}`, need: 'отрицательная — только у заголовка' })
    }
    if (track > 0 && head) {
      findings.push({ rule: 'разрядка разгоняет заголовок', got: `${role}: ${r.разрядка}`, need: 'положительная — только у мелкого текста' })
    }
  }
  return findings
}
