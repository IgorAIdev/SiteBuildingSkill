/* Каталог панели вида — look-panel/ui/catalog.json (PANEL.md, шаг 1).

   Все варианты, из которых выбирают, живут у панели, а не в сайте
   (CLAUDE.md, «Панель настройки физически отделена от сайта»). Каталог
   собирается из полного каталога НАБОРА — палитры (styles/palette.json и
   образцы templates/palette.json), стили кнопок (styles/buttons.json),
   наборы ритма (styles/scale.json) — строителями набора, которые уже лежат
   в сайте (tools/): каждый вариант — готовые значения тех же свойств, что
   сайт объявляет у себя (lib/look-slots.json). Варианты самого сайта идут
   первыми — это умолчания каталога. Шрифты-кандидаты, отметка пункта меню
   и ручки карты товара — здесь же, данными.

   Пары, которые не носятся, считает правило сайта (lib/look-rule.ts) на
   каждой паре вариантов двух групп — панель гасит по ним, сайт судит тем
   же правилом. Список пар ложится и в PANEL.md.

   Строитель палитры панели считает движком набора: сборка кладёт его копию
   в ui/engine/ из skills/site-building/assets/studio/engine набора — ту же,
   что выпускает `npm run studio:sync`; краски наборов в каталоге посчитаны
   этой копией.

   Каталог собран — опубликованный вид сайта пересчитывается из своих имён
   этим каталогом (И352, `reresolvePublished`): каталог или движок вырос —
   значения выводятся заново из выбора заказчика, а не берутся умолчаниями
   стилей другой палитры.

     node look-panel/scripts/build-catalog.mjs --from ../SkillSiteBuilding
       --from   папка набора: откуда брать полный каталог (ставщик передаёт сам)
       --look   записать опубликованный вид образца = умолчание каталога
                (новая установка; без ключа вид пересчитывается из имён) */
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { axesOf, resolver, tokenMap } from '../../tools/buttons.mjs'
import { variables, inputCss, resolve as resolveScale, withKnobs } from '../../tools/scale.mjs'
import { TYPE } from '../../tools/thresholds.mjs'
import { valid, FLOORS, SHADOWS } from '../../lib/look-values.ts'
import { problems } from '../../lib/look-rule.ts'
import { pairsOf } from './pairs.mjs'
import { bandBlocks } from '../../scripts/band-blocks.mjs'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (dir, p) => JSON.parse(readFileSync(join(dir, p), 'utf8'))
/** Слить каталоги: первое имя побеждает — вариант сайта раньше варианта набора. */
const merge = (...lists) => {
  const out = {}
  for (const list of lists) for (const [k, v] of Object.entries(list)) if (!(k in out)) out[k] = v
  return out
}

/** Имена вариантов в панели — по-английски; ключ набора остаётся значением. */
const TITLES = {
  palette: {
    'Латунь на угле': 'Brass on charcoal', 'Аптека': 'Apothecary', 'Олива': 'Olive', 'Мек остров': 'Soft island',
    'Тёплый лист': 'Warm leaf', 'Ледяной шалфей': 'Icy sage', 'Аптечный синий': 'Pharmacy blue',
    'Ирис': 'Iris',
  },
  /* Ритм — лестницей от плотного к воздушному (слово заказчика 28.09.2026:
     «ритм — давай больше вариантов»; имена «Standard» и «Quiet» были
     непонятны): имя говорит место на лестнице. Просторный — тот же воздух,
     что у обычного, но крупнее текст. Опоры ступеней — бриф карты товара,
     «Замеры» (И509). */
  scale: { 'Плотный': 'Dense', 'Тесный': 'Compact', 'Нынешний': 'Standard', 'Просторный': 'Spacious', 'Воздушный': 'Airy', 'Тихий': 'Very airy', 'Галерея': 'Gallery' },
}

/** Движок набора: файлы и откуда (И247: одна математика для панели, сайта и проверок). */
/** Место ступени ритма на лестнице панели (`rung`); набор вне списка — в конце.
 *  Каталог держит умолчание первым, лестницей их ставит панель. */
const LADDER = Object.keys(TITLES.scale)
const rung = (id) => (LADDER.includes(id) ? LADDER.indexOf(id) : LADDER.length)
export const ENGINE = ['palette.mjs', 'thresholds.mjs', 'palette-profile.json']
export const ENGINE_FROM = 'skills/site-building/assets/studio/engine'
/** Положить копию движка набора в ui/engine/. */
export function copyEngine(kit, site) {
  mkdirSync(join(site, 'look-panel/ui/engine'), { recursive: true })
  for (const f of ENGINE) copyFileSync(join(kit, ENGINE_FROM, f), join(site, 'look-panel/ui/engine', f))
}

/** Холст — ширина коробки страницы (`--wrap`): опубликованная норма
 *  1140–1440, у Shopify 1000–1600; заказчик выбрал 1440 (24.09.2026). */
export const WIDTHS = [1440, 1280, 1600]
/** Наборы углов — из лестницы набора (M3 ∪ Carbon, SHAPE.radii), взятые из
 *  наборов ритма; вложенность «орган ≤ карточка ≤ лист» держит каждый. */
const CORNER_NAMES = { '0/0/0/0': 'Square', '4/4/12/16': 'Crisp', '8/8/24/28': 'Standard', '8/8/28/32': 'Round' }
/** Прямой угол — ступень 0 лестницы (SHAPE.radii); ни один набор ритма его не несёт. */
const SQUARE = { xs: 0, ctrl: 0, card: 0, sheet: 0 }
/** У каждого набора углов — близнец с кнопками полным кругом (`--r-btn` =
 *  `--r-pop`): «Crisp» и «Crisp · pill» и т. д. Угол кнопки — роль формы, и ставит
 *  её та же ручка Corners, что все углы (слово заказчика 04.10.2026: «не реагируют
 *  кнопки на настройку панели, не меняется форма» — пилюля жила осью Buttons →
 *  Shape, и Corners кнопок не трогал); как `radius="full"` у Radix Themes — одна
 *  ручка. Близнецы, а не одна «Pill»: пилюля носится с любыми углами карточек
 *  (Allbirds — пилюли при острых карточках), и любой прежний вид переезжает без
 *  потерь. Порядок — сначала четыре набора, за ними их близнецы. */
const withPill = (list) => [...list, ...list.map((o) => ({ ...o, id: `${o.id}-pill`, name: `${o.name} · pill`, line: `Buttons fully rounded · controls ${o.vars['--r-ctrl']} · cards ${o.vars['--r-card']} · sheets ${o.vars['--r-sheet']}`, vars: { ...o.vars, '--r-btn': 'var(--r-pop)' } }))]
/** Тени — роли по работе (И228). Soft — роли основы набора (его
 *  styles/look.css: у сайта этот файл выпущен из опубликованного вида, и
 *  «Soft» из него значил бы «как сейчас», И385); Flat — без тени, одной
 *  линией (всплывающее тень оставляет); Lifted — на ступень выше: покой
 *  берёт подъём, подъём — всплывающее. */
/* `was` у «Soft» — его значения до И385: вдавленная тень брала краску бумаги
   (`--sh-inset-paper`) прямо, а не ингредиент пола (`--sh-inset`). Вид,
   опубликованный на умолчании без имени группы, узнаётся по ним и
   пересчитывается (`reresolve`, ui/choice.mjs). Псевдоним со сроком: снять,
   когда опубликованные виды пересчитаны (план 4, global «look»). */
/* Всплывающее (`--sh-overlay`: меню, шторка, окно) — у каждого набора своё
   (заказчик 30.09.2026: «на сайте тени берутся не из панели — это
   системная ошибка»): «Без тени» — линия, как у карточки; супермягкая —
   короткая дымка; мягкая — роль основы. До того все три отдавали одно и
   то же большое облако, и «Без тени» его не снимал.
   «Выше» (Lifted) снят, «Супермягкая» заведена, «Мягкая» мягче — слово
   заказчика 30.09.2026: «тень выше — огромная, вообще не подходит; давай
   мягкий вариант и ещё мягче — минималистичную, да и мягкую сделай ещё
   мягче». Прежние значения «Мягкой» — в `was`: опубликованный вид с ними
   узнаётся и пересчитывается на новые. */
/* Тем же днём: «мягкую меняй на половину от супермягкой и переименуй их
   соответственно» — мягкая взяла значения супермягкой, супермягкая стала
   половиной её. `was` держит оба прежних значения мягкой. */
const SOFT_BEFORE = (t) => [
  /* та же мягкая до того, как всплывающее стало вариантом набора */
  { '--sh-raised': t['--sh-raised'], '--sh-lift': t['--sh-lift'], '--sh-overlay': '0 0 0 1px var(--sh-ring), 0 4px 8px var(--sh-near), 0 36px 80px -28px var(--sh-far-3)', '--sh-in': t['--sh-in'] },
  { '--sh-raised': '0 0 0 1px var(--sh-ring), 0 1px 2px var(--sh-near), 0 8px 20px -10px var(--sh-far-1)', '--sh-lift': '0 0 0 1px var(--sh-ring), 0 2px 4px var(--sh-near), 0 20px 44px -18px var(--sh-far-2)', '--sh-overlay': '0 0 0 1px var(--sh-ring), 0 4px 8px var(--sh-near), 0 36px 80px -28px var(--sh-far-3)', '--sh-in': t['--sh-in'] },
  { '--sh-raised': '0 0 0 1px var(--sh-ring), 0 1px 2px var(--sh-near), 0 4px 12px -8px var(--sh-far-1)', '--sh-lift': '0 0 0 1px var(--sh-ring), 0 1px 3px var(--sh-near), 0 12px 28px -16px var(--sh-far-1)', '--sh-overlay': '0 0 0 1px var(--sh-ring), 0 4px 8px var(--sh-near), 0 36px 80px -28px var(--sh-far-3)', '--sh-in': t['--sh-in'] },
]
const SHADOW_SETS = (t) => [
  { id: 'soft', name: 'Soft', rung: 2, line: 'The kit shadow roles: a quiet lift at rest, more under the hand', vars: { '--sh-raised': t['--sh-raised'], '--sh-lift': t['--sh-lift'], '--sh-sticky': t['--sh-sticky'], '--sh-overlay': t['--sh-overlay'], '--sh-modal': t['--sh-modal'], '--sh-in': t['--sh-in'] }, was: [{ '--sh-raised': t['--sh-raised'], '--sh-lift': t['--sh-lift'], '--sh-overlay': t['--sh-overlay'], '--sh-in': 'inset 0 1px 2px var(--sh-inset-paper)' }, ...SOFT_BEFORE(t)] },
  /* «Без тени» (И726; слово заказчика 04.10.2026: «для нашей текущей витрины отмени
     тени, пока делаем без них»): тени нет ни у чего. Карточку, плашку и подъём под
     рукой отделяют их собственные кромки (`--edge`, `--edge-hand`) — роль пуста;
     полосу у края — волосок `--rule` по верхнему краю; всплывающее — кромка `--edge-near`,
     заметнее карточкиной: под меню может лежать что угодно (IBM Carbon — слои
     краской, у меню одна кромка); окно и шторку отделяет затемнение — роль пуста;
     вдавленное — волосок внутрь. До 04.10.2026 «Без тени» клал всем одну линию
     `--rule`, и меню выглядело карточкой. */
  { id: 'flat', name: 'Flat', rung: 0, line: 'No shadow anywhere: cards keep their own edge, menus a firmer edge, windows the dimmed page', vars: { '--sh-raised': 'none', '--sh-lift': 'none', '--sh-sticky': '0 -1px 0 var(--rule)', '--sh-overlay': '0 0 0 1px var(--edge-near)', '--sh-modal': 'none', '--sh-in': 'inset 0 0 0 1px var(--rule)' } },
  /* Супермягкая — половина мягкой (слово заказчика 30.09.2026): ближний
     слой в пиксель размытия, дымка вдвое короче и уже. */
  { id: 'supersoft', name: 'Supersoft', rung: 1, line: 'Half of Soft: a one-pixel shade at the edge and a very short haze under the hand', vars: { '--sh-raised': '0 1px 1px var(--sh-ring)', '--sh-lift': '0 1px 1px var(--sh-ring), 0 4px 10px -7px var(--sh-far-1)', '--sh-sticky': '0 -1px 0 var(--sh-ring), 0 -2px 6px -3px var(--sh-near)', '--sh-overlay': '0 0 0 1px var(--sh-ring), 0 8px 20px -12px var(--sh-far-1)', '--sh-modal': '0 0 0 1px var(--sh-ring), 0 16px 36px -18px var(--sh-far-2)', '--sh-in': t['--sh-in'] } },
]
/** Роли, по которым панель мерит свою палитру, — какими ступенями палитры
 *  сайт их красит в каждой теме (цепочки ссылок tokens.css). */
const STEP_ROLES = { page: '--page', plate: '--plate', ink: '--ink', inkSoft: '--ink-soft', pop: '--pop', onPop: '--on-pop' }

/** Шрифты-кандидаты: семейства и толщины, которые загрузит публикация
 *  (scripts/fonts.mjs — со своего адреса сайта), и стек для `--face`.
 *  Кандидат берётся в список, только если умеет буквы рынка: публикация
 *  останавливает шрифт без них (scripts/font-coverage.mjs, И769). Lato снят
 *  05.10.2026: расширенная латиница у Google — тридцать польских знаков, без
 *  румынских ă ș ț, венгерских ő ű и чешских č. */
export const FACES = [
  { id: 'system', name: 'System', body: null, head: null },
  { id: 'manrope', name: 'Manrope', body: { family: 'Manrope', weights: [400, 500, 600, 700] }, head: null },
  { id: 'plex', name: 'IBM Plex Sans', body: { family: 'IBM Plex Sans', weights: [400, 500, 600, 700] }, head: null },
  { id: 'inter', name: 'Inter', body: { family: 'Inter', weights: [400, 500, 600, 700] }, head: null },
  { id: 'serif', name: 'Source Serif + Plex', body: { family: 'IBM Plex Sans', weights: [400, 500, 600, 700] }, head: { family: 'Source Serif 4', weights: [600, 700], stack: "Georgia, 'Times New Roman', serif" } },
  { id: 'dmsans', name: 'DM Sans', body: { family: 'DM Sans', weights: [400,500,600,700] }, head: null },
  { id: 'worksans', name: 'Work Sans', body: { family: 'Work Sans', weights: [400,500,600,700] }, head: null },
  { id: 'franklin', name: 'Libre Franklin', body: { family: 'Libre Franklin', weights: [400,500,600,700] }, head: null },
  { id: 'fira', name: 'Fira Sans', body: { family: 'Fira Sans', weights: [400,500,600,700] }, head: null },
  { id: 'figtree', name: 'Figtree', body: { family: 'Figtree', weights: [400,500,600,700] }, head: null },
  { id: 'opensans', name: 'Open Sans', body: { family: 'Open Sans', weights: [400,500,600,700] }, head: null },
  { id: 'montserrat', name: 'Montserrat', body: { family: 'Montserrat', weights: [400,500,600,700] }, head: null },
  { id: 'playfair', name: 'Playfair + Inter', body: { family: 'Inter', weights: [400,500,600,700] }, head: { family: 'Playfair Display', weights: [600, 700], stack: "Georgia, 'Times New Roman', serif" } },
  { id: 'lora', name: 'Lora + Manrope', body: { family: 'Manrope', weights: [400,500,600,700] }, head: { family: 'Lora', weights: [600, 700], stack: "Georgia, 'Times New Roman', serif" } },
  { id: 'fraunces', name: 'Fraunces + DM Sans', body: { family: 'DM Sans', weights: [400,500,600,700] }, head: { family: 'Fraunces', weights: [600, 700], stack: "Georgia, 'Times New Roman', serif" } },
  { id: 'cormorant', name: 'Cormorant + Work Sans', body: { family: 'Work Sans', weights: [400,500,600,700] }, head: { family: 'Cormorant Garamond', weights: [600, 700], stack: "Georgia, 'Times New Roman', serif" } },
]
/** Вид поля ввода (И390): одно поле на весь сайт — поиск в шапке, почта,
 *  касса (styles/form.module.css, `.box`). Кромка остаётся у каждого вида:
 *  без неё поле на листе не видно (WCAG 1.4.11) — у тона она чертой снизу.
 *  Угол — из Shape. Пилюля (элемент 44) сюда не идёт: полный круг — только у
 *  главного действия (CLAUDE.md, запрет 2, И228). */
export const FIELD_LOOKS = [
  { id: 'framed', name: 'Framed', line: 'A light fill inside a full edge', vars: { '--ctrl-field-fill': 'var(--field)', '--ctrl-field-edge': 'var(--tick-edge)', '--ctrl-field-side': '1' } },
  /* Кромка контура и черта тона — краской подписи: краска рамки
     (`--tick-edge`) замерена строителем к заливке поля, на поверхности
     тёмной темы она 2.75 : 1, на тоне — 2.5; подпись держит 5 : 1 на всех
     наборах. Тон — тихая плашка, а не вуаль: на вуали поверх пола страницы
     подсказка в поле 3.9 : 1 (замер 25.09.2026, все образцы). */
  { id: 'outline', name: 'Outline', line: 'The card surface inside a darker full edge (element 43)', vars: { '--ctrl-field-fill': 'var(--surface)', '--ctrl-field-edge': 'var(--ink-soft)', '--ctrl-field-side': '1' } },
  { id: 'tone', name: 'Tone', line: 'A tone fill with one line underneath, no box (element 41)', vars: { '--ctrl-field-fill': 'var(--plate-quiet)', '--ctrl-field-edge': 'var(--ink-soft)', '--ctrl-field-side': '0' } },
]
/** Место подписи поля (И394): над полем или на кромке (элемент 47) —
 *  внутри, пока поле пусто, на верхней кромке, когда в него пишут. Краски
 *  подписи — роли поля, их мерит правило поля. */
export const FIELD_LABELS = [
  { id: 'above', name: 'Above', line: 'The label above the field', vars: { '--ctrl-field-label': 'above' } },
  { id: 'edge', name: 'On the edge', line: 'Inside while empty, on the top edge once you type (element 47)', vars: { '--ctrl-field-label': 'edge' } },
]
/** Шапка cbdin.bg (И430): знак корзины — тележка или сумка; у знака — число
 *  или ещё и сумма товаров. */
export const HEAD_PARTS = {
  'cart-sign': [
    { id: 'cart', name: 'Cart', line: 'A shopping cart sign', vars: { '--cart-sign': 'cart' } },
    { id: 'bag', name: 'Bag', line: 'A bag sign (cbdin.bg)', vars: { '--cart-sign': 'bag' } },
  ],
  /* Знак магазина (слово заказчика 29.09.2026: «логотипы 1, 2, 3, 6 — выбор
     в панель, по умолчанию 6, в нём CBD заглавными»; стенд вариантов —
     https://claude.ai/artifact/4EVgv9Eu9Jh8YUZmL4V3Bz). */
  logo: [
    { id: 'pill', name: 'Word + country', line: 'CBDin bold, the country in a small brand tag (variant 6)', vars: { '--logo': 'pill' } },
    { id: 'word', name: 'Word', line: 'cbdin bold in lower case, the domain ending in the brand colour (variant 1)', vars: { '--logo': 'word' } },
    { id: 'split', name: 'CBD + in', line: 'CBD in capitals, “in” light in the brand colour, the country small above (variant 2)', vars: { '--logo': 'split' } },
    { id: 'leaf', name: 'Leaf dot', line: 'A hemp leaf for the dot over the i (variant 3)', vars: { '--logo': 'leaf' } },
  ],
  /* Регистр имён на плитках главной (эффекты; категории — кнопками героя, И673) (слово заказчика 01.10.2026:
     «текст плашек с заглавной буквы / все заглавные»): одна ручка на все
     одежды плашки. */
  'door-case': [
    { id: 'sentence', name: 'Capitalised', line: 'The shelf name as it is written: a capital first letter', vars: { '--door-case': 'none' } },
    { id: 'caps', name: 'ALL CAPS', line: 'Every letter of the shelf name is a capital', vars: { '--door-case': 'uppercase' } },
  ],
  /* Отметка текущего раздела в строке меню (слово заказчика 04.10.2026, И714):
     черта краской марки по низу шапки (Carbon UI Shell, Primer UnderlineNav)
     или только полное слово (Allbirds, Gymshark). Плашки под словом нет (И713). */
  'nav-current': [
    { id: 'line', name: 'Line', line: 'A brand-colour line along the bottom of the header under the current item', vars: { '--nav-current': 'line' } },
    { id: 'word', name: 'Word', line: 'The current item in full ink, the others quieter (Allbirds, Gymshark)', vars: { '--nav-current': 'word' } },
  ],
  'cart-meta': [
    { id: 'count', name: 'Count', line: 'The number of items on the sign', vars: { '--cart-meta': 'count' } },
    { id: 'sum', name: 'Sum', line: 'The number and the sum of the goods beside the sign (cbdin.bg)', vars: { '--cart-meta': 'sum' } },
  ],
}
/** Подложка секции главной (И591): четыре слова на каждый блок реестра, кроме
 *  первого экрана — блоки читаются из реестра сайта (scripts/band-blocks.mjs),
 *  новый блок получает строку в панели сам. Краски — роли палитры. */
export const TONES = [
  { id: 'none', name: 'Off', line: 'No band: the section stands on the page colour' },
  { id: 'quiet', name: 'Quiet', line: 'A quiet full-width band, a touch deeper than the page' },
  { id: 'brand', name: 'Brand', line: 'A light tint of the brand colour — to stand a section out' },
  { id: 'dark', name: 'Dark', line: 'The dark tone of the header and footer — the loudest section' },
]
/** Как секция зовётся в панели; блок без имени — по типу. */
const BAND_NAMES = { categories: 'Categories', featured: 'Featured', story: 'Our story', faq: 'Questions' }
const bandName = (b) => BAND_NAMES[b] ?? b.charAt(0).toUpperCase() + b.slice(1)
const bandOptions = (block) => TONES.map((o) => ({ ...o, vars: { [`--band-${block}`]: o.id } }))
/** Пара «поле и кнопка» (И421): порознь или встык одной коробкой —
 *  элемент 42; на витрине — купон корзины. */
export const PAIR_LOOKS = [
  { id: 'apart', name: 'Apart', line: 'The field and its button side by side with a gap', vars: { '--pair-look': 'apart' } },
  { id: 'joined', name: 'Joined', line: 'The field and its button as one box, corners only outside (element 42)', vars: { '--pair-look': 'joined' } },
]
/** Сообщение формы (И420): строкой или заметкой тона сигнала со знаком
 *  (элементы 29, 31); строка под полем остаётся строкой. */
export const SAY_LOOKS = [
  { id: 'line', name: 'Line', line: 'A line of text under the form, in the signal colour', vars: { '--say-look': 'line' } },
  { id: 'note', name: 'Note', line: 'A tinted note with a sign: green when done, red on an error (elements 29, 31)', vars: { '--say-look': 'note' } },
]
/** Краска ссылки «куда ведёт» под рукой (И397): своя (стрелка едет, краска
 *  та же) или марка для текста — элемент 11. */
export const GO_HOVER = [
  { id: 'plain', name: 'Plain', line: 'The arrow moves under the hand; the colour stays', vars: { '--go-hover': 'currentcolor' } },
  { id: 'brand', name: 'Brand', line: 'Under the hand the link takes the brand colour and the arrow moves (element 11)', vars: { '--go-hover': 'var(--pop-ink)' } },
]
/** Краска звезды оценки (И516): золото, принятое в торговле (строитель
 *  палитры, `--star-trade`), или янтарь палитры (`--warn-fill`). */
export const STAR = [
  { id: 'gold', name: 'Gold', line: 'The gold shops use for stars (Amazon, Google)', vars: { '--star': 'var(--star-trade)' } },
  { id: 'palette', name: 'Palette amber', line: 'The attention colour of your palette', vars: { '--star': 'var(--warn-fill)' } },
]
/** Краска отмеченной галочки и радио (И392): одна на весь сайт — фильтры
 *  полки, касса, формы (styles/base.css, `accent-color`). Сами органы
 *  браузерные; галку на заливке браузер красит под контраст. Марка — краской
 *  марки для текста: заливка марки на пяти образцах из семи тонет в полу
 *  (до 2.21 : 1), а квадрат опознаётся только заливкой (замер 25.09.2026). */
export const TICKS = [
  { id: 'brand', name: 'Brand', line: 'Ticked boxes and radios in the brand colour', vars: { '--ctrl-tick-fill': 'var(--pop-ink)' } },
  { id: 'ink', name: 'Ink', line: 'Ticked boxes and radios in ink (element 60)', vars: { '--ctrl-tick-fill': 'var(--ink)' } },
]
/** Карточки товара: id — CARDS в lib/cards.ts. Каждая — простая карточка
 *  полки (shop: «Полная полка на десктопе держит 4–5 простых карточек по
 *  260–325px»), вариант — одежда одной раскладки (craft: «Вид меняет
 *  поверхность, краску, поле; раскладку внутри он НЕ меняет»). */
const CARD_LINES = {
  framed: { name: 'Design 2', line: 'A light sheet, the picture to the edges on top, a quiet edge line; under the hand the line darkens' },
  inset: { name: 'Design 1', line: 'A light sheet, the picture inside the field, as on cbdin.bg; under the hand an edge line' },
  sheet: { name: 'Design 3', line: 'A light sheet, the picture inside the field; under the hand an edge line and a shadow' },
  edged: { name: 'Design 4', line: 'The picture to the edges, a quiet edge line; under the hand the line darkens and a shadow lifts' },
}
/** Полка (И400, «Admin → Card»): пропорция снимка — одна на полку и карту
 *  товара, снимки у товара одни; плотность — сколько карточек в ряд на
 *  полке каталога и поиска (shop: «4–5 простых карточек по 260–325px»),
 *  меньше на узком окне считает сетка; кнопка «в корзину» — во всю ширину
 *  или рядом с ценой (элемент 64 набора). Варианты — значения ручек, которые
 *  сайт объявляет у себя (scripts/look-slots.mjs, PRODUCT). Пропорция —
 *  дробью 'a / b': из неё же карта считает высоту галереи. */
export const SHELF = {
}
/** Карта товара (И278): варианты — значения ручек `--pdp-*`, которые сайт
 *  объявляет у себя (scripts/look-slots.mjs, PRODUCT). Доля ряда под
 *  галерею — вокруг нормы живых магазинов 45–57 % (образец заказчика ≈ 40 %);
 *  выше экрана галерею не вытянет ни одна: потолок по высоте окна у неё
 *  свой. Миниатюры — ряд под кадром, полоса сбоку (в две колонки) или точки.
 *  Пропорция снимка — одна с полкой (SHELF выше, И400). */
export const PRODUCT_PAGE = {
  'pdp-gallery': [40, 50, 60].map((pct) => ({ id: String(pct), name: `${pct} %`, line: `The gallery takes ${pct} % of the row; the buy column takes the rest`, vars: { '--pdp-gallery': `${pct}%` } })),
  'pdp-thumbs': [
    { id: 'below', name: 'Below', line: 'A row of four thumbnails under the picture', vars: { '--pdp-thumbs': 'below' } },
    { id: 'side', name: 'Side', line: 'A strip of thumbnails beside the picture, on wide screens', vars: { '--pdp-thumbs': 'side' } },
    { id: 'dots', name: 'Dots', line: 'Dots under the picture instead of thumbnails', vars: { '--pdp-thumbs': 'dots' } },
    { id: 'over', name: 'On the picture', line: 'No thumbnails: swipe the picture, dots lie on it', vars: { '--pdp-thumbs': 'over' } },
  ],
  'pdp-edge': [
    { id: 'inset', name: 'Within the margins', line: 'The picture keeps the page margins and rounded corners', vars: { '--pdp-edge': 'inset' } },
    { id: 'bleed', name: 'Full width', line: 'On phones the picture runs edge to edge; with dots on the picture the details slide over it', vars: { '--pdp-edge': 'bleed' } },
  ],
  /* Окно быстрого заказа (И470): мессенджеры плитками 2 × 2 (окно в один
     экран телефона, И461) или строками во всю ширину, как у cbdin.bg. */
  'quick-look': [
    { id: 'tiles', name: 'Tiles', line: 'Messengers as tiles, two in a row: the window fits a phone screen', vars: { '--quick-look': 'tiles' } },
    { id: 'rows', name: 'Rows', line: 'Messengers as full-width rows, «Order via …» (cbdin.bg)', vars: { '--quick-look': 'rows' } },
  ],
  /* Выбор варианта (И396): пилюли, встык (элемент 49), в подложке (50) или плашками размера (97, двумя видами). */
  'seg-look': [
    { id: 'chips', name: 'Chips', line: 'Separate chips; the chosen one in the brand colour', vars: { '--seg-look': 'chips' } },
    { id: 'joined', name: 'Joined', line: 'Segments side by side; the chosen one in a brand tint with a brand edge (element 49)', vars: { '--seg-look': 'joined' } },
    { id: 'tray', name: 'Tray', line: 'Segments on a tone tray; the chosen one lifted on the page colour (element 50)', vars: { '--seg-look': 'tray' } },
    { id: 'tiles', name: 'Tiles', line: 'Separate sheet-coloured tiles with a quiet edge; the chosen one in ink, a sold-out one struck through (element 97)', vars: { '--seg-look': 'tiles' } },
    { id: 'tint', name: 'Tint tiles', line: 'The same tiles; the chosen one in a brand tint with a brand edge, a sold-out one struck through (element 97)', vars: { '--seg-look': 'tint' } },
  ],
  /* Наличие товара (слово заказчика 02.10.2026): знак в круге, точка или
     только цветное слово — три вида одной строки «в наличии · мало · нет».
     Знак и точка — знаки листа, цвет — роли сигналов палитры. */
  'stock-look': [
    { id: 'sign', name: 'Sign', line: 'A tick, an alert or a cross in a circle before the word, in the signal colour', vars: { '--stock-look': 'sign' } },
    { id: 'dot', name: 'Dot', line: 'A full, half or empty dot before the word: the shape tells the state without colour', vars: { '--stock-look': 'dot' } },
    { id: 'word', name: 'Word', line: 'The word alone, in the signal colour', vars: { '--stock-look': 'word' } },
  ],
  /* Листание страниц каталога и поиска (слово заказчика 03.10.2026; образец 95: daisyUI, HyperUI, shadcn/ui, MIT): слова, стрелки с номерами, номера встык или «2 / 9». */
  /* Сердце «в избранное» на снимке карточки (слово заказчика 03.10.2026: «фон для иконки нужен? может как вариант убрать фон и увеличить сердечко до высоты плашки скидки»): на стекле палитры (умолчание) или без подложки, ростом с плашку скидки, с краем цвета листа. */
  'save-look': [
    { id: 'disc', name: 'On glass', line: 'A quiet glass disc under the heart: it reads over any picture, the palette measures the glass', vars: { '--save-look': 'disc' } },
    { id: 'bare', name: 'Bare', line: 'No disc: the heart is as tall as the discount tag, ink with a thin edge in the sheet colour so it reads over a light and a dark picture', vars: { '--save-look': 'bare' } },
  ],
  'pager-look': [
    { id: 'count', name: 'Numbers', line: 'Round page numbers without an edge, the current one filled; «Show more» and «Showing 24 of 96» in the same row (Material UI)', vars: { '--pager-look': 'count' } },
    { id: 'rings', name: 'Rings', line: 'Every page number in a hairline circle, the current one filled; «Show more» and the count in the same row (Mantine)', vars: { '--pager-look': 'rings' } },
    { id: 'compact', name: 'Compact', line: 'Round arrows around «2 / 4» instead of the numbers; «Show more» and the count in the same row', vars: { '--pager-look': 'compact' } },
  ],
  /* Фильтр полки (И739, слово заказчика 04.10.2026): на широком — одна кнопка и
     панель колонками (Allbirds) или строка раскрытий (Shopify Dawn, ASOS); на
     узком — шторка со всеми гранями (Dawn, Gymshark) или пилюли граней вбок
     (Zalando, notino). Колонка сбоку — другое устройство страницы, не вид:
     shop, references/catalog.md, «Фильтр полки: виды на выбор». */
  'filter-look': [
    { id: 'drawer', name: 'Drawer', line: 'One «Filters» button and a drawer from the side with every filter, like the cart: its head and its button stay, the filters scroll (Gymshark)', vars: { '--filter-look': 'drawer' } },
    { id: 'bar', name: 'Bar', line: 'A row of filter buttons over the shelf, each opens its own list; the count stands by the sort (Shopify Dawn, ASOS)', vars: { '--filter-look': 'bar' } },
  ],
  'filter-phone': [
    { id: 'drawer', name: 'Drawer', line: 'One «Filters» button and a drawer from the side with every filter; its button says how many products the choice gives (Dawn, Gymshark)', vars: { '--filter-phone': 'drawer' } },
    { id: 'pills', name: 'Pills', line: 'The same button, and under it the filters as pills in a row that scrolls sideways, each opens its own list (Zalando, notino)', vars: { '--filter-phone': 'pills' } },
  ],
}
/** Одежда плиток главной (ряд эффектов): id — HOMES в lib/homes.ts (Doors.tsx;
 *  образцы — вкладка «Плитки» дизайн-системы). Раскладок главной на выбор
 *  больше нет (И596). */
const HOME_LINES = {
  caption: { name: 'Caption', line: 'Like the blog cards: the picture, then the name and two lines about the effect under it, on the page' },
  button: { name: 'Button', line: 'The shelf name as a quiet site pill button on the picture, bottom left' },
  glass: { name: 'Glass', line: 'The same pill, see-through: a dark name on light glass; the palette builder sets the least opacity that keeps it legible over any picture' },
  frost: { name: 'Frost', line: 'A rectangle with the control corners, no fill, a quiet edge; the picture under it is blurred (frosted glass); the hand darkens the edge a little, the blur stays the same' },
  bar: { name: 'Bar', line: 'A see-through band with the name across the foot of the picture' },
  mount: { name: 'Mount', line: 'The picture inside a white tile, the name under it' },
  under: { name: 'Under', line: 'The picture, the name under it on the page (Aesop)' },
  outline: { name: 'Outline', line: 'The name in white on the picture, a quiet outline round the letters instead of a shadow' },
  minimal: { name: 'Minimal editorial', line: 'A product from the featured shelf leads the hero; quiet category links and effect names below their pictures' },
}
/** Шапки: id — HEADERS в lib/headers.ts. */
const HEADER_LINES = {
  classic: { name: 'Classic', line: 'Categories beside the logo' },
  search: { name: 'Search first', line: 'Promise bar, wide search, categories below' },
  boutique: { name: 'Boutique', line: 'Centred logo, the shelves in a row under it' },
  /* Сборки шапки cbdin.bg (И425): светлая полоса и тёмная рабочая строка. */
  tray: { name: 'Tray', line: 'cbdin.bg: the promise on a light sheet, the dark row lying across its edge' },
  nested: { name: 'Nested', line: 'cbdin.bg: one light sheet holds the promise and the dark row, a field all round' },
  step: { name: 'Step', line: 'cbdin.bg: a tone sheet, the dark row seated in it with its own shoulders' },
}

const faceVars = (f) => ({
  '--face': f.body ? `'${f.body.family}', var(--face-stack)` : 'var(--face-stack)',
  '--face-head': f.head ? `'${f.head.family}', ${f.head.stack}` : 'var(--face)',
})
const google = (f) => {
  const fams = [f.body, f.head].filter(Boolean)
  return fams.length ? `https://fonts.googleapis.com/css2?${fams.map((x) => `family=${x.family.replace(/ /g, '+')}:wght@${x.weights.join(';')}`).join('&')}&display=swap` : null
}

/** Ступень палитры, которой роль красит тему: по ссылкам `var()` и
 *  `light-dark()` до свойства палитры сайта. */
function stepOf(tokens, palette, name, theme, depth = 0) {
  if (palette.has(name)) return name
  const v = tokens[name]?.trim()
  if (!v || depth > 12) return null
  const ref = v.match(/^var\((--[\w-]+)\)$/)
  if (ref) return stepOf(tokens, palette, ref[1], theme, depth + 1)
  const ld = v.match(/^light-dark\(\s*var\((--[\w-]+)\)\s*,\s*var\((--[\w-]+)\)\s*\)$/)
  return ld ? stepOf(tokens, palette, theme === 'light' ? ld[1] : ld[2], theme, depth + 1) : null
}

/** Каталог: группы вариантов значениями, умолчания, пары. */
/* Нарисованные элементы набора — в панель (слово заказчика 28.09.2026:
   «у нас собрано множество элементов, но они в панели не показываются,
   выставляй их в панель»). Панель показывает каждую отрисовку живьём
   (`ui/elements/NN/element.html`, стили набора рядом) и пишет, где элемент
   уже стоит выбором панели: строка таблицы «Разделы и настройки» PANEL.md,
   в которой назван его номер. Сайт эту папку не читает — она снимается с
   панелью (И356: элемент без места на витрине остаётся каталогом). */
export const ELEMENTS = 'look-panel/ui/elements'
export function copyElements(kit, site) {
  const from = join(kit, 'elements')
  if (!existsSync(join(from, 'elements.json'))) return 0
  const to = join(site, ELEMENTS)
  mkdirSync(join(to, 'styles'), { recursive: true })
  for (const f of ['base.css', 'palettes.css', 'stage.js']) copyFileSync(join(from, f), join(to, f))
  const styles = new Set()
  const { элементы } = JSON.parse(readFileSync(join(from, 'elements.json'), 'utf8'))
  const panel = existsSync(join(site, 'look-panel/PANEL.md')) ? readFileSync(join(site, 'look-panel/PANEL.md'), 'utf8') : ''
  const where = {}
  for (const row of panel.split('\n').filter((l) => /^\| (System|Admin) \|/.test(l))) {
    const cells = row.split('|').map((c) => c.trim())
    const place = `${cells[2]} › ${/^Main button/.test(cells[3]) ? 'Main button' : cells[3]}`
    for (const m of row.matchAll(/элемент[ыа]?\s+((?:\d{2,3}(?:,\s*|\s+и\s+)?)+)/g)) for (const n of m[1].match(/\d{2,3}/g)) where[n] ??= place
  }
  /* Оси кнопки называют свои элементы в каталоге кнопки (`что`). */
  const axes = existsSync(join(kit, 'styles/buttons.json')) ? JSON.parse(readFileSync(join(kit, 'styles/buttons.json'), 'utf8')) : {}
  for (const [id, a] of Object.entries(axes)) {
    const place = `Buttons › ${id === 'loud' || id === 'shape' ? 'Main button' : a.name}`
    for (const o of Object.values(a.варианты ?? {})) for (const m of `${o.что ?? ''} ${o.line ?? ''}`.matchAll(/элемент[ыа]?\s+((?:\d{2,3}(?:,\s*|\s+и\s+)?)+)/g)) for (const n of m[1].match(/\d{2,3}/g)) where[n] ??= place
  }
  const list = []
  for (const e of элементы) {
    const page = join(from, e.папка, 'element.html')
    if (!existsSync(page)) continue
    const html = readFileSync(page, 'utf8')
    for (const m of html.matchAll(/href="\.\.\/\.\.\/styles\/([\w.-]+)"/g)) styles.add(m[1])
    mkdirSync(join(to, e.папка), { recursive: true })
    writeFileSync(join(to, e.папка, 'element.html'), html.replaceAll('../../styles/', '../styles/'))
    /* Снимки под стекло и прочие рядом лежащие картинки (элемент 66, shots/). */
    if (existsSync(join(from, e.папка, 'shots'))) cpSync(join(from, e.папка, 'shots'), join(to, e.папка, 'shots'), { recursive: true })
    const n = e.папка.split('-')[0]
    list.push({ n, dir: e.папка, name: e.имя, kind: e.род?.[0] ?? '', kinds: e.род ?? [], set: e['в наборе'] ?? '', where: where[n] ?? '' })
  }
  for (const f of styles) copyFileSync(join(kit, 'styles', f), join(to, 'styles', f))
  writeFileSync(join(to, 'list.json'), JSON.stringify(list, null, 1) + '\n')
  return list.length
}

export async function buildCatalog({ site, kit }) {
  copyEngine(kit, site)
  copyElements(kit, site)
  const { paletteVars, valuesOf } = await import(pathToFileURL(join(site, 'look-panel/ui/choice.mjs')).href)
  const { roles: paletteRoles } = await import(pathToFileURL(join(site, 'look-panel/ui/engine/palette.mjs')).href)
  const slotsFile = read(site, 'lib/look-slots.json')
  const { slots, facts } = slotsFile
  const tokens = tokenMap(readFileSync(join(site, 'styles/tokens.css'), 'utf8'))
  const palettes = merge(read(site, 'styles/palette.json'), read(kit, 'styles/palette.json'), read(kit, 'templates/palette.json'))
  /* Кнопка — оси каталога (И273): варианты сайта первыми, затем набора. */
  const buttonAxes = []
  for (const cat of [read(site, 'styles/buttons.json'), read(kit, 'styles/buttons.json')]) {
    for (const a of axesOf(cat).filter((x) => x.options.length)) {
      const into = buttonAxes.find((x) => x.id === a.id) ?? buttonAxes[buttonAxes.push({ ...a, options: [] }) - 1]
      for (const o of a.options) if (o.роли && !into.options.some((x) => x.id === o.id)) into.options.push(o)
    }
  }
  const kitScales = read(kit, 'styles/scale.json')
  const roleSource = Object.values(kitScales)[0]?.текст
  const scales = merge(read(site, 'styles/scale.json'), kitScales)
  const list = (file, name) => [...(readFileSync(join(site, file), 'utf8').match(new RegExp(`${name} = \\[([\\s\\S]*?)\\]`))?.[1] ?? '').matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
  const headers = list('lib/headers.ts', 'HEADERS')
  const cards = list('lib/cards.ts', 'CARDS')
  const homes = list('lib/homes.ts', 'HOMES')
  const ofGroup = (group, vars) => Object.fromEntries(Object.entries(vars).filter(([k]) => slots[k]?.group === group))
  /** Вариант сайта — первым: он умолчание каталога. */
  const siteFirst = (list) => {
    const own = list.find((o) => Object.entries(o.vars).every(([k, v]) => slots[k]?.value === v))
    return own ? [own, ...list.filter((o) => o !== own)] : list
  }

  const check = (group, id, vars) => {
    for (const [k, v] of Object.entries(vars)) {
      if (!slots[k]) throw new Error(`${group} «${id}»: ${k} — не свойство сайта (lib/look-slots.json)`)
      if (!valid(slots[k].type, v)) throw new Error(`${group} «${id}»: ${k}: ${v} — не ${slots[k].type}`)
    }
    return vars
  }
  const dots = (set) => Object.fromEntries(['light', 'dark'].map((theme) => {
    const role = resolver(paletteRoles(set[theme], theme), tokens, theme)
    return [theme, ['--page', '--pop', '--ink'].map((r) => role(r))]
  }))
  const groups = {
    palette: Object.entries(palettes).map(([id, set]) => ({ id, name: TITLES.palette[id] ?? id, seed: set, dots: dots(set), vars: check('palette', id, paletteVars(set)) })),
    face: FACES.map((f) => ({ id: f.id, name: f.name, stack: faceVars(f)[f.head ? '--face-head' : '--face'], google: google(f), fonts: [f.body, f.head].filter(Boolean).map(({ family, weights }) => ({ family, weights })), vars: check('face', f.id, faceVars(f)) })),
    scale: Object.entries(scales).map(([id, raw]) => {
      const set = { ...raw, текст: raw.текст ?? roleSource }
      const coarse = new Set([...inputCss(set, 'x').matchAll(/(--[\w-]+):/g)].map((m) => m[1]))
      const vars = ofGroup('scale', Object.fromEntries(Object.entries(variables(set)).filter(([k]) => !coarse.has(k))))
      const r = resolveScale(set)
      const span = ([a, b]) => (a === b ? `${a}` : `${a}–${b}`)
      const line = `Sections ${span(r.воздух.page.pair)} px apart · blocks ${span(r.воздух.block.pair)} px · cards ${span(r.зазор.grid)} px apart · card padding ${span(r.поле.card)} px (phone–laptop)`
      return { id, name: TITLES.scale[id] ?? id, line, rung: rung(id), vars: check('scale', id, vars) }
    }),
    /* Ручки типографики (И561): размер основного текста и размер заголовков
       на макете. Значения — тем же строителем на первом наборе с выбранной
       ручкой; ярусы (вторичный, мелкий, подзаголовок) выводятся из неё. */
    'text-size': siteFirst(Object.keys(TYPE.knobs.текст).map((id) => {
      const r = resolveScale(withKnobs(Object.values(scales)[0], { текст: id }))
      const [, base] = r.размер.base, [, sm] = r.размер.sm, [, xs] = r.размер.xs
      return { id, name: `${id} px`, line: `Text ${base} px · secondary ${sm} · small ${xs} on a laptop; ${r.размер.base[0]} on a phone`, vars: check('text-size', id, ofGroup('text-size', variables(withKnobs(Object.values(scales)[0], { текст: id })))) }
    })),
    'head-size': siteFirst(Object.keys(TYPE.knobs.заголовок).map((id) => {
      const r = resolveScale(withKnobs(Object.values(scales)[0], { заголовок: id }))
      return { id, name: `${id} px`, line: `Page name ${r.размер.h1[1]} px · sections and price ${r.размер.h2[1]} · subheadings ${r.размер.h3[1]} on a laptop; ${r.размер.h1[0]} · ${r.размер.h2[0]} on a phone`, vars: check('head-size', id, ofGroup('head-size', variables(withKnobs(Object.values(scales)[0], { заголовок: id })))) }
    })),
    width: siteFirst(WIDTHS.map((w) => ({ id: String(w), name: String(w), line: `Canvas ${w} px wide`, vars: check('width', String(w), { '--wrap': `${w}px` }) }))),
    corners: siteFirst(withPill(Object.values(Object.fromEntries([...Object.values(scales), { ...Object.values(scales)[0], радиус: SQUARE }].map((set) => {
      const key = ['xs', 'ctrl', 'card', 'sheet'].map((k) => set.радиус?.[k]).join('/')
      const name = CORNER_NAMES[key] ?? key
      return [key, { id: name.toLowerCase(), name, rung: set.радиус.card, line: `Controls and buttons ${set.радиус?.ctrl} px · cards ${set.радиус?.card} px · sheets ${set.радиус?.sheet} px`, vars: check('corners', key, ofGroup('corners', variables(set))) }]
    })))).map((o) => (o.id.endsWith('-pill') ? { ...o, vars: check('corners', o.id, o.vars) } : o))),
    shadow: siteFirst(SHADOW_SETS(tokenMap(readFileSync(join(kit, 'styles/look.css'), 'utf8'))).map((o) => ({ ...o, vars: check('shadow', o.id, o.vars) }))),
    ...Object.fromEntries(buttonAxes.map((a) => [`btn-${a.id}`, siteFirst(a.options.map((o) => ({ id: o.id, name: o.name, line: o.line ?? '', what: o.что ?? '', vars: check(`btn-${a.id}`, o.id, ofGroup('button', o.роли)) })))])),
    field: siteFirst(FIELD_LOOKS.map((o) => ({ ...o, vars: check('field', o.id, o.vars) }))),
    'field-label': siteFirst(FIELD_LABELS.map((o) => ({ ...o, vars: check('field-label', o.id, o.vars) }))),
    tick: siteFirst(TICKS.map((o) => ({ ...o, vars: check('tick', o.id, o.vars) }))),
    ...Object.fromEntries(Object.entries(HEAD_PARTS).map(([field, list]) => [field, siteFirst(list.map((o) => ({ ...o, vars: check(field, o.id, o.vars) })))])),
    ...Object.fromEntries(bandBlocks(site).map((b) => [`band-${b}`, siteFirst(bandOptions(b).map((o) => ({ ...o, vars: check(`band-${b}`, o.id, o.vars) })))])),
    'pair-look': siteFirst(PAIR_LOOKS.map((o) => ({ ...o, vars: check('pair-look', o.id, o.vars) }))),
    'say-look': siteFirst(SAY_LOOKS.map((o) => ({ ...o, vars: check('say-look', o.id, o.vars) }))),
    'go-hover': siteFirst(GO_HOVER.map((o) => ({ ...o, vars: check('go-hover', o.id, o.vars) }))),
    star: siteFirst(STAR.map((o) => ({ ...o, vars: check('star', o.id, o.vars) }))),
    ...Object.fromEntries(Object.entries({ ...SHELF, ...PRODUCT_PAGE }).map(([field, list]) => [field, siteFirst(list.map((o) => ({ ...o, vars: check(field, o.id, o.vars) })))])),
    header: headers.map((id) => ({ id, ...(HEADER_LINES[id] ?? { name: id, line: '' }) })),
    card: cards.map((id) => ({ id, ...(CARD_LINES[id] ?? { name: id, line: '' }) })),
    home: homes.map((id) => ({ id, ...(HOME_LINES[id] ?? { name: id, line: '' }) })),
  }
  const defaults = Object.fromEntries(Object.entries(groups).map(([g, list]) => [g, list[0].id]))

  /* Пары: правило сайта на значениях «умолчания сайта + вариант A + вариант B». */
  const base = Object.fromEntries(Object.entries(slots).map(([k, s]) => [k, s.value]))
  /* Русское имя и «что это» оси и варианта — для страницы дизайн-системы
     (вкладка «Кнопки», все стили плитками, И614); панель берёт `name`. */
  const axes = buttonAxes.map((a) => ({ field: `btn-${a.id}`, name: a.name, title: a.имя ?? a.name, what: a.что ?? '' }))
  const bands = bandBlocks(site).map((b) => ({ field: `band-${b}`, name: bandName(b) }))
  const pairs = pairsOf({ groups, fields: valuesOf({ axes, bands }), base, facts, problems })
  /* Ступени, которыми сайт красит страницу, — для замера своей палитры. */
  const own = new Set(Object.keys(slots).filter((k) => slots[k].group === 'palette'))
  const steps = Object.fromEntries(Object.entries(STEP_ROLES).map(([role, name]) => [role, Object.fromEntries(['light', 'dark'].map((t) => [t, stepOf(tokens, own, name, t)]))]))
  for (const [role, v] of Object.entries(steps)) for (const t of ['light', 'dark']) if (!v[t]) throw new Error(`роль ${STEP_ROLES[role]}: ступень палитры в теме ${t} не найдена (styles/tokens.css)`)
  /* Предпросмотр панели кладёт роли тени туда же, куда сайт, — на список
     полов (lib/look-values.ts, И385), а не на один корень. */
  const floors = { selector: FLOORS, names: [...SHADOWS] }
  return { about: 'Собран look-panel/scripts/build-catalog.mjs из каталога набора. Руками не правят.', defaults, groups, axes, bands, pairs, steps, floors }
}

/** Опубликованный вид и его копия до первого пересчёта — рядом. */
export const PUBLISHED = 'lib/source/sample/look.json'
export const BEFORE = 'lib/source/sample/look.before-refresh.json'

/** Опубликованный вид — заново из его имён нынешним каталогом и движком
 *  (И352; ui/choice.mjs, `reresolve`). Идёт со сборкой каталога — при
 *  установке, переустановке, возврате панели и `npm run look:catalog`, — а не
 *  на запросе страницы. Имена не трогаются; файл пишется, только если
 *  значения изменились; прежний — копией рядом при первой перемене (копию
 *  следующий пересчёт не затирает: в ней вид, каким его опубликовал
 *  заказчик). Черновик не трогается — он пересчитается первым же щелчком в
 *  панели. */
export async function reresolvePublished(site, catalog) {
  const file = join(site, PUBLISHED)
  if (!existsSync(file)) return null
  const text = readFileSync(file, 'utf8')
  const { reresolve } = await import(pathToFileURL(join(site, 'look-panel/ui/choice.mjs')).href)
  const r = reresolve(JSON.parse(text), catalog)
  if (r.same) return { ...r, wrote: false, backup: null }
  const first = !existsSync(join(site, BEFORE))
  if (first) writeFileSync(join(site, BEFORE), text)
  writeFileSync(file, JSON.stringify(r.look, null, 2) + '\n')
  return { ...r, wrote: true, backup: first ? BEFORE : null }
}

/** Отчёт пересчёта словами — строки для людей (ставщик их передаёт). */
export function reresolveReport(r) {
  if (!r) return []
  const list = (keys) => keys.join(', ')
  const lines = r.wrote
    ? [`Опубликованный вид пересчитан из имён (И352): значения получили ${r.added.length} свойств${r.added.length ? ` (${list(r.added)})` : ''}; изменились ${r.changed.length}${r.changed.length ? ` (${list(r.changed)})` : ''}; ушли ${r.dropped.length}${r.dropped.length ? ` (${list(r.dropped)})` : ''}. Имена не тронуты.${r.backup ? ` Прежний вид — ${r.backup}.` : ''}`]
    : ['Опубликованный вид сходится с каталогом: пересчёт из имён ничего не меняет.']
  for (const k of r.kept) lines.push(`⚠ вид: ${k.field}${k.id ? ` «${k.id}»` : ''} — ${k.why}; группа держит прежние значения — выбрать заново в панели`)
  return lines
}

/** Список пар для PANEL.md — между метками `pairs:start` и `pairs:end`. */
export function pairsMarkdown(catalog) {
  const name = (field, id) => catalog.groups[field].find((o) => o.id === id)?.name ?? id
  const lines = catalog.pairs.map((p) => `| ${p.x.field} · ${name(p.x.field, p.x.id)} | ${p.y.field} · ${name(p.y.field, p.y.id)} | ${p.why} |`)
  if (!lines.length) lines.push('| — | — | каждое сочетание каталога носится |')
  return ['| вариант | не носится с | почему |', '| --- | --- | --- |', ...lines].join('\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf('--from')
  const kit = at > 0 ? resolve(process.argv[at + 1]) : null
  if (!kit || !existsSync(join(kit, 'templates/palette.json'))) {
    console.error('✗ Нужна папка набора: --from <путь к SkillSiteBuilding> — полный каталог живёт там.')
    process.exit(1)
  }
  const catalog = await buildCatalog({ site: ROOT, kit })
  writeFileSync(join(ROOT, 'look-panel/ui/catalog.json'), JSON.stringify(catalog, null, 1) + '\n')
  const md = join(ROOT, 'look-panel/PANEL.md')
  if (existsSync(md)) {
    /* Концы строк — LF, как велит .gitattributes набора: файл, сохранённый
       редактором Windows с CRLF, иначе молча не находил меток, и список пар
       не обновлялся (selftest storefront-install, 05.10.2026). */
    const text = readFileSync(md, 'utf8').replace(/\r\n/g, '\n')
    writeFileSync(md, text.replace(/(<!-- pairs:start -->\n)[\s\S]*?(\n<!-- pairs:end -->)/, `$1${pairsMarkdown(catalog)}$2`))
  }
  const count = Object.fromEntries(Object.entries(catalog.groups).map(([g, l]) => [g, l.length]))
  console.log(`Каталог панели: ${Object.entries(count).map(([g, n]) => `${g} ${n}`).join(' · ')} · пар, которые не носятся: ${catalog.pairs.length}`)
  if (process.argv.includes('--look')) {
    const { compose } = await import('../ui/choice.mjs')
    const { look } = compose(catalog.defaults, catalog)
    writeFileSync(join(ROOT, PUBLISHED), JSON.stringify(look, null, 2) + '\n')
  } else {
    for (const line of reresolveReport(await reresolvePublished(ROOT, catalog))) console.log(line)
  }
}
