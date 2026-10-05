/*
 * Имена и ярусы — слой 1 основания: как называется всё, что объявляет набор,
 * и кто на кого имеет право ссылаться.
 *
 * Три яруса, ссылки в одну сторону (Figma «primitive tokens are for
 * reference only»; Material 3 reference → system → component; Style
 * Dictionary button.color.primary → {color.primary} → {color.base.green};
 * Curtis Generic / Semantic / Component):
 *
 *   сырьё  — ступени, которые выпускает строитель: --n-12, --a-9, --sp-4,
 *            --fs-base. Смысла не несут («серый-500», «шаг-4»). Их читают
 *            только роли. Узел, читающий ступень напрямую, — семья stepDirect.
 *   роль   — должность значения: --ink, --pop, --pad-card, --air-page,
 *            --body-size, --r-card, --sh-2, --layer-header. Имя по НАЗНАЧЕНИЮ,
 *            не по виду («Name every token for what it does rather than what
 *            it is» — Figma; Curtis, purposeful vs aesthetic). Читает сырьё
 *            или другую роль (цепочки алиасов разрешены — DTCG §7.2.2).
 *   узел   — ручка примитива: --stack, --grid-gap, --pin-top, --tray-h.
 *            Объявляется на самом примитиве и переопределяется тем, кто его
 *            ставит; по умолчанию берёт РОЛЬ. На корне (:root) ей не место:
 *            ручка `--stack` в tokens.css оказалась шрифтовым стеком, и
 *            отступ примитива stack молча стал нулём (И224).
 *
 * Форма имени: --<понятие>[-<уточнение>]* — понятие из списка ниже,
 * уточнения из списка MODIFIERS или число. Порядок частей — от общего к
 * частному (Curtis: «Namespaces are prepended first; modifiers tend to be
 * appended last»; Style Dictionary CTI). Имя не по форме — семья nameGrammar.
 *
 * Это реестр семей, а не строгая грамматика вида
 * --color-action-background-primary-hover: переименование всего словаря —
 * отдельное решение заказчика, с псевдонимами со сроком (docs/open.md).
 */

export const TIERS = { value: 'сырьё', role: 'роль', node: 'узел' }

const FAMS = (n) => `(${n.join('|')})`
/** Семьи цвета — те же, что выпускает строитель палитры (STATUS + n, a). */
export const COLOUR_FAMILIES = ['n', 'a', 'e', 'sale', 'warn', 'ok', 'info']

/** Понятия ролей — по назначению. Слово по виду (sage, cyan, amber, live) сюда
 *  не попадает никогда: перекраска марки переименовала бы всё. */
export const CONCEPTS = {
  colour: ['ink', 'plate', 'page', 'surface', 'pop', 'select', 'ctrl', 'field', 'rule', 'border', 'line', 'ring',
    'scrim', 'quiet', 'thumb', 'tile', 'tick', 'menu', 'accent', 'hover', 'press', 'chrome', 'on',
    'bad', 'ok', 'warn', 'sale', 'info',
    /* звезда оценки (`--star`, И515) */
    'star',
    /* полоса секции (`--band`, вид `--band-<блок>`, И591) */
    'band',
    /* чужие марки: знак мессенджера краской своей марки (`--mark-viber`, И471) */
    'mark',
    /* заливка знака линией из листа — по умолчанию «нет», сайт заливает,
       где нужно (`--sign-fill`, И625) */
    'sign',
    /* заливка выбранного — сегмент варианта, текущая страница (`--chosen`, И706) */
    'chosen'],
  rhythm: ['pad', 'air', 'gap'],
  text: ['hero', 'pagehead', 'prodhead', 'panehead', 'parthead', 'logo', 'price', 'byline', 'maker', 'cardname', 'cardprice', 'cardbtn', 'label', 'blurb', 'h2', 'h3', 'intro', 'lede', 'body', 'note', 'eyebrow', 'measure', 'face', 'fs', 'page'],
  shape: ['r'],
  depth: ['sh', 'frost'],
  motion: ['ease', 'rise', 'nudge', 'creep', 'open'],
  state: ['state'],
  layer: ['layer'],
  control: ['ctrl', 'chan', 'chip', 'tab', 'dock', 'edge',
    /* ручка окна за пальцем (`--grab-size`, `--grab-w`, И494) */
    'grab'],
  layout: ['wrap', 'gut', 'head', 'anchor', 'float', 'chrome', 'tile'],
}
export const MODIFIERS = new Set([
  'soft', 'quiet', 'hover', 'press', 'solid', 'fill', 'tint', 'line', 'ink', 'on', 'bg', 'fg', 'active', 'dim',
  'deck', 'paper', 'ring', 'near', 'far', 'pill', 'sheet', 'card', 'inner', 'xs', 'sm', 'base', 'h2', 'h3', 'h1',
  'size', 'lead', 'weight', 'track', 'strip', 'full', 'floor', 'peek', 'first', 'measure', 'max', 'slope', 'gap', 'pad', 'air', 'h', 'w', 'min', 'fs', 'b',
  't', 'edge', 'head', 'inset', 'gut', 'stuck', 'look', 'fold', 'btn', 'top', 'mark', 'stack', 'targets', 'row',
  'grid', 'band', 'block', 'group', 'tight', 'lede', 'note', 'cell', 'in', 'off', 'act', 'fit', 'side', 'above', 'at', 'bias',
  'uri', 'lift', 'select', 'search', 'plate', 'bleed', 'hand', 'cap', 'slope', 'md', 'lg', 'target',
  'ctrl', 'pop', 'raised', 'overlay', 'strong', 'exit', 'case', 'r', 'sh', 'intro', 'pos',
  /* форма главной кнопки (И276): вырез, остриё, выемка, эхо-шеврон */
  'clip', 'tip', 'notch', 'echo', 'trail', 'stop',
  /* выравнивание колонок `sidebar` (`--side-align`): ручку примитив читал
     давно, а объявить её было нечем — первым объявил документ, чтобы строки
     заголовка и текста стояли на одной линии шрифта (разбор 24.09.2026, D3) */
  'align',
  /* коробка цели вокруг знака (`--glyph-box`, И677) */
  'box',
  /* точка кадра, которую снимок держит в обрезке (`--frame-focus`: ручка
     примитива `frame`, `object-position`; герой главной, И710) */
  'focus',
  /* нахлёст: на сколько лист покупки наезжает на снимок во всю ширину
     (`--gallery-lap`, карта товара, бриф docs/design/карта-товара.md) */
  'lap',
  /* место подписи поля (`--ctrl-field-label`: над полем или на его кромке,
     элемент 47 набора, И394) */
  'label',
  /* стрелка у конца главной кнопки без кружка (`--ctrl-btn-glyph`) и вырез
     знака в заливке, общий кружку и стрелке (`--btn-cut`; элемент 03, И423) */
  'glyph', 'cut',
  /* второй конец градиента главной кнопки (`--pop-grad`, И424) */
  'grad',
  /* стекло главной кнопки: краска долей, блик кромки, размытие под ней
     (`--pop-glass`, `--pop-rim`, `--frost-*`, `--ctrl-btn-frost-pop`; И427) */
  'glass', 'rim', 'frost', 'blur', 'sat',
  /* движение нажатия — одно на всё, что нажимают (`--press-move`, И477);
     его части — провал и сжатие (`--press-drop`, `--press-shrink`), кнопка,
     которая стоит (`--ctrl-btn-still`), и сдвиг знака под рукой (`--btn-go`;
     И622) */
  'move', 'drop', 'shrink', 'still', 'go',
  /* ответ знака формы кнопки на руку (И623): рука на кнопке (`--btn-hand`),
     кружок и его краска (`--btn-dot`, `-now`, `-r`), круг маски
     (`--btn-clip`), место стрелки и входящей (`--btn-at`, `--btn-arrow`,
     `-in`), окно стрелки (`--btn-reveal`), смена и рост
     (`--ctrl-btn-swap`), без заливки (`--ctrl-btn-hollow`), стрелка рисуется,
     а не вырезается (`--ctrl-btn-draw`; И630) */
  'hand', 'dot', 'now', 'r', 'clip', 'at', 'arrow', 'in', 'reveal', 'swap', 'hollow', 'draw',
  /* маски знаков: картинка знака из его файла для выреза (`--sign-mask-<знак>`,
     tools/icons.mjs, И630) — стрелка кружка, значки сообщений формы */
  'mask', 'right', 'check', 'circle', 'alert', 'triangle',
  /* черта тихой (`--ctrl-btn-dash`; И626) */
  'dash',
  /* шаги смеси тихой под рукой: вуаль, марка, надпись (`--btn-veil-*`,
     `--btn-flip-*`, `--btn-fill-flip`, `--btn-ink-flip`; И626) */
  'veil', 'flip',
  /* чужие марки (И471) */
  'viber', 'telegram', 'whatsapp', 'instagram',
  /* краски логотипов соцсетей и почты (`--mark-facebook`…, MARKS; И628) */
  'facebook', 'messenger', 'youtube', 'gmail',
  /* краска, принятая в торговле, а не ступень нашей палитры: звезда оценки
     (`--star-trade`, И516) */
  'trade',
])
/** Ручки примитивов — узлы. Объявляются на примитиве, не на корне. */
export const HOOKS = ['stack', 'cluster', 'switch', 'rail', 'section', 'sheet', 'lede', 'hero', 'grid', 'cols', 'cell',
  'pin', 'tray', 'leaf', 'chip', 'qty', 'chan', 'side', 'prose', 'pinned', 'sidebar', 'frame', 'btn', 'seg', 'gallery', 'pane', 'turn',
  /* размер точки указателя слайдов (`--dot`, styles/slides.module.css, И502) */
  'dot',
  /* тихий знак (`--glyph-h`, `--glyph-box`, styles/glyph.module.css, И677): рост знака без подложки и коробка цели вокруг него */
  'glyph']

const VALUE = [
  { rx: new RegExp(`^--${FAMS(COLOUR_FAMILIES)}-\\d{1,2}$`), family: 'ступень цвета', by: 'tools/palette.mjs' },
  { rx: new RegExp(`^--on-${FAMS(COLOUR_FAMILIES)}-\\d{1,2}$`), family: 'знак на ступени', by: 'tools/palette.mjs' },
  { rx: /^--(?:on-)?a-press$/, family: 'ступень нажатия и знак на ней', by: 'tools/palette.mjs' },
  { rx: /^--sp-\d{1,2}$/, family: 'ступень ритма', by: 'tools/scale.mjs' },
  { rx: /^--fs-(xs|sm|base|h[1-3]|2?xl|2?xs)$/, family: 'ступень размера', by: 'tools/scale.mjs' },
]
const ROLE = [
  { rx: /^--(pad|air|gap)-[a-z]+$/, family: 'поле / воздух / зазор', by: 'tools/scale.mjs' },
  { rx: /^--ctrl-fs-[a-z0-9]+$/, family: 'надпись органа', by: 'tools/scale.mjs' },
  { rx: /^--(hero|pagehead|prodhead|panehead|price|byline|maker|cardname|cardprice|cardbtn|label|blurb|h2|h3|intro|lede|body|note|eyebrow)-(size|lead|weight|track|measure)$/, family: 'роль текста', by: 'tools/scale.mjs' },
  { rx: /^--(r-[a-z]+|round)$/, family: 'скругление', by: 'styles/tokens.css' },
  { rx: /^--sh-[a-z0-9-]+$/, family: 'тень', by: 'styles/look.css (роли), styles/tokens.css (ингредиенты)' },
  { rx: /^--(ease|hover-t|rise|nudge|creep)$/, family: 'движение и ответ на руку', by: 'styles/tokens.css' },
  { rx: /^--layer-[a-z]+$/, family: 'слой', by: 'styles/tokens.css' },
  { rx: /^--(ctrl-(h(-sm|-lg)?|target|face(-md)?|fs)|chan-(h|mark|gap)|tab-h|dock|edge-[bx])$/, family: 'размер и геометрия органа', by: 'tools/scale.mjs, styles/tokens.css' },
  { rx: /^--(measure(-[a-z]+)?|face(-[a-z]+)?|hero-(max|slope|size)|pagehead-(base|slope))$/, family: 'текст: кривая, мера, гарнитура', by: 'styles/tokens.css, гарнитура — styles/look.css' },
  /* Коробка страницы (И382): `--page-edge` — край у окна не уже выреза,
     `--page-box` — ширина коробки; читают `.wrap` и всё, что стоит поверх
     страницы шириной коробки. */
  { rx: /^--(wrap|gut(-base)?|page-(line|gut|edge|box)|head-(pad|inset|strip|full)|anchor-top|float|chrome-stuck|tile-look)$/, family: 'раскладка', by: 'styles/tokens.css' },
  /* Карта товара — ручки вида галереи (И278): доля ряда, место миниатюр,
     край снимка. Роли, а не узлы: их ставит вид сайта на корне (панель
     «Look»), читает узел `gallery` карты. Список закрытый — по имени. */
  { rx: /^--pdp-(gallery|thumbs|edge)$/, family: 'карта товара: вид галереи', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  /* Товар на полке и карте (И400): пропорция снимка — одна на полку и
     карту, снимки у товара одни; плотность — сколько карточек в ряд на
     полке каталога; место кнопки «в корзину» на карточке. Роли вида («Admin → Card»), читают узлы карточки,
     галереи и полки. */
  { rx: /^--icon-(stem|stroke)$/, family: 'вес пера знака: доля кегля, равная штриху буквы, и перо от кегля места (И543)', by: 'styles/tokens.css' },
  { rx: /^--quick-look$/, family: 'окно быстрого заказа: мессенджеры плитками или строками (И470)', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--(cart-sign|cart-meta|logo|nav-current)$/, family: 'шапка: знак корзины, сумма у корзины, знак магазина, отметка текущего раздела', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--pair-look$/, family: 'вид пары «поле и кнопка»', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--say-look$/, family: 'вид сообщения формы', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--door-case$/, family: 'регистр имени на плашке категории главной', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--go-hover$/, family: 'краска ссылки «куда ведёт» под рукой', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--seg-look$/, family: 'вид сегментов выбора', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--stock-look$/, family: 'вид строки наличия: знак, точка или слово', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--filter-look$/, family: 'вид фильтра полки на широком: кнопка и шторка, как корзина, или строка раскрытий (И739)', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--filter-phone$/, family: 'вид фильтра полки на узком: кнопка и шторка или пилюли граней вбок (И739)', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--pager-look$/, family: 'вид листания под полкой: «Показать ещё» со счётом и полоской, номера в кругах или «2 / 4» (И721)', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--save-look$/, family: 'вид сердца «в избранное» на снимке: на стекле или без подложки', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  { rx: /^--(shot-frame|shelf-cols)$/, family: 'товар: кадр снимка, плотность полки, кнопка карточки, подпись порядка полки', by: 'templates/storefront/scripts/look-slots.mjs (styles/look.css)' },
  /* Пропорция кадра по тому, что на снимке (И736): ряд карточек, сцена,
     люди. Роли, а не ручки примитива: `--frame-*` — ручки `frame` на узле. */
  { rx: /^--(card|scene|people|cover)-frame$/, family: 'пропорция кадра по тому, что на снимке (И736; обложка статьи — И749)', by: 'styles/tokens.css' },
]
const ALL_CONCEPTS = [...new Set(Object.values(CONCEPTS).flat())]
const concept = new RegExp(`^--${FAMS(ALL_CONCEPTS)}(-[a-z0-9]+)*$`)
const hook = new RegExp(`^--${FAMS(HOOKS)}(-[a-z0-9]+)*$`)
/** Хвост имени после понятия: уточнения из списка, второе понятие цвета
 *  (`--on-pop`, `--hover-ctrl`) или число. */
const tailOk = (name) => name.split('-').slice(3).every((s) => MODIFIERS.has(s) || CONCEPTS.colour.includes(s) || /^\d+$/.test(s))
const groupOf = (word) => Object.keys(CONCEPTS).find((g) => CONCEPTS[g].includes(word))

/** Разбор имени: ярус и семья, или null — имя не по форме. */
export const parse = (name) => {
  /* подложка секции: роль `--band` и вид `--band-<блок>` — блоки берутся из реестра сайта, список тут не пишется (И591) */
  if (/^--band(-[a-z0-9]+)?$/.test(name)) return { tier: 'role', family: 'роль: подложка секции', by: 'styles/tokens.css, вид сайта' }
  for (const f of VALUE) if (f.rx.test(name)) return { tier: 'value', ...f }
  for (const f of ROLE) if (f.rx.test(name)) return { tier: 'role', ...f }
  if (hook.test(name) && tailOk(name)) return { tier: 'node', family: 'ручка примитива', by: 'styles/primitives.module.css' }
  if (concept.test(name) && tailOk(name)) return { tier: 'role', family: `роль: ${groupOf(name.split('-')[2])}`, by: 'styles/tokens.css' }
  return null
}

/** Роли, которые обязаны существовать, даже пока их никто в наборе не
 *  читает: узел придёт с магазином, а роль — из списка по элементам
 *  (palette/references/roles.md; слои — реестр FLOATING в kit.config). */
export const REQUIRED = {
  '--bad': 'текст сигнала «ошибка» (roles.md, «Текст и знаки»)',
  '--bad-fill': 'плашка сигнала (roles.md, «Заливки»)', '--on-bad': 'знак на плашке', '--bad-tint': 'тихая полоса сигнала', '--bad-line': 'граница ошибки (roles.md, «Линии»)',
  '--ok': 'текст сигнала «успех»', '--ok-fill': 'плашка «в наличии»', '--on-ok': 'знак на плашке', '--ok-tint': 'тихая полоса',
  '--quiet-tint': 'тихая марка органа — тихая кнопка в варианте «Brand tint» каталога кнопок (styles/buttons.json; И462, И472)', '--on-quiet-tint': 'знак на тихой марке органа — тот же вариант кнопки (И462)',
  '--logo-size': 'знак марки в строке меню шапки — 1.2 текста, голосом подзаголовков: самое крупное слово строки, но в коридоре образцов (cbdin.bg — 1.4 меню, rituals — 1.0, allbirds — знак 24 в высоту; templates/storefront, Header.module.css; И609)', '--logo-lead': 'знак марки в шапке — межстрочье (И609)', '--logo-weight': 'знак марки в шапке — толщина (И609)', '--logo-track': 'знак марки в шапке — разрядка (И609)',
  '--parthead-size': 'подзаголовок части одного описания — 1.2 текста, жирный (templates/storefront, ProductDetails.module.css; И583)', '--parthead-lead': 'подзаголовок части — межстрочье (И582)', '--parthead-weight': 'подзаголовок части — толщина (И582)', '--parthead-track': 'подзаголовок части — разрядка (И582)',
  '--menu-lead': 'роль меню шапки — межстрочье (templates/storefront, Header.module.css; И580)', '--menu-weight': 'роль меню шапки — толщина полки (Header.module.css; И580)', '--menu-track': 'роль меню шапки — разрядка (Header.module.css; И580)',
  /* Имена, которые читает только шаблон витрины (templates/storefront):
     в пустой проект он не ставится, но имя — не про запас (И626). */
  '--menu-size': 'роль меню шапки — кегль, ступенью ниже тела, не мельче 1rem; регулировки в панели нет (templates/storefront, Header.module.css; И580, И633)',
  '--head-full': 'вся шапка на нуле прокрутки: прилипшая строка, верхняя полоса и линия — от неё герой считает первый экран (templates/storefront, blocks.module.css; И655)',
  '--shot-frame': 'пропорция снимка товара, постоянная 1 / 1 (Gallery, ProductCard, ProductView; decisions.md 01.10.2026)',
  '--sh-far-3': 'дальний слой тени всплывающего — набор теней витрины (templates/storefront/styles/look.css; И593)',
  /* Краски логотипов (MARKS, tools/palette.mjs; И628): цвет компании для её
     знака — читает страница «Знаки» шаблона и место, где логотип стоит в цвете. */
  '--mark-messenger': 'краска логотипа Messenger (look-panel/design, «Знаки»; И628)',
  '--mark-youtube': 'краска логотипа YouTube (look-panel/design, «Знаки»; И628)',
  '--mark-gmail': 'краска логотипа Gmail (look-panel/design, «Знаки»; И628)',
  '--pane-sheet': 'окно посреди экрана стало нижней шторкой — его читает жест окна за пальцем (templates/storefront, components/PaneSwipe.tsx; И494)',
  '--mark-viber': 'чужая марка: знак Viber краской своей марки — окно быстрого заказа (templates/storefront, QuickOrder.module.css; И471)', '--mark-telegram': 'чужая марка: знак Telegram (И471)', '--mark-whatsapp': 'чужая марка: знак WhatsApp (И471)', '--mark-instagram': 'чужая марка: знак Instagram (И471)',
  '--info': 'текст сведения: обещания у кнопки заказа, ТГК, производитель (roles.md; templates/storefront, Cart.module.css; И472)', '--info-tint': 'тихая полоса сведения (roles.md; templates/storefront, Cart.module.css; И472)',
  '--warn': 'текст сигнала «внимание»', '--warn-fill': 'плашка «осталось 2»', '--on-warn': 'знак на плашке', '--warn-tint': 'тихая полоса',
  '--star': 'звезда оценки — выбор вида: краска торговли `--star-trade` или янтарь палитры `--warn-fill` (И515, И516)',
  '--star-trade': 'краска звезды, принятая в торговле (#FFA41C, Amazon) — строитель палитры, одна на обе темы (И516)',
  '--sale': 'текст скидки', '--sale-fill': 'плашка «−20 %»', '--on-sale': 'знак на плашке', '--sale-tint': 'тихая полоса скидки',
  '--pop-press': 'кнопка покупки под пальцем (roles.md, «Заливки»)',
  '--pop-ink-hover': 'марочный текст под курсором (roles.md, «Текст и знаки») — читал его `.more`, снятый как вторая копия органа «ко всему» (И383)',
  '--r-pop': 'полный круг главного действия — кнопка покупки, придёт с магазином (shape.md; Spectrum)',
  '--ease-exit': 'кривая ухода всплывающего (ease-in) — шторка и меню придут с магазином (states.md; Atlassian)',
  '--band': 'полоса секции: фон целой секции страницы, включается видом по секциям — блоки главной (roles.md, «Поверхности»; И591)',
  '--plate-2': 'утопленное: кадр снимка, подвал карточки, жёлоб лотка (roles.md, «Поверхности»)',
  '--rule': 'разделитель — волосок между строками (roles.md, «Линии»)', '--field': 'поле ввода: почта, промокод, поиск (roles.md, «Поверхности»)', '--scrim': 'затемнение под окном и шторкой (roles.md, «Подъём и постоянные»)',
  '--scrim-deck': 'вуаль под текстом на снимке — герой витрины, текст поверх кадра (templates/storefront, blocks.module.css)',
  '--creep': 'наплыв снимка под рукой — карточка товара на полке (templates/storefront, ProductCard.module.css; controls.md, «рама стоит, движется снимок»)',
  '--on-ink': 'надпись на плашке чернил — пол своего пола (отметка текущего пункта «Ink pill», вид витрины; И426)',
  '--air-line': 'воздух между строками одной мысли: имя товара → описание — карта товара (templates/storefront, ProductView.module.css; И509)',
  '--air-set': 'воздух между группами опций выбора — карта товара, придёт с магазином (templates/storefront, ProductView.module.css; И448)',
  '--quiet-pop': 'тихая плашка на заливке кнопки — счётчик «в корзине: 2» на кнопке покупки; первый читатель — магазин (cbdin, BuyBtn; И452)',
  '--on-quiet-pop': 'надпись на тихой плашке заливки — число счётчика на кнопке покупки (И452)',
  '--prodhead-size': 'имя товара — заголовок первого уровня ростом ступени h3, карта товара (templates/storefront, ProductView.module.css; И503)',
  '--byline-size': 'строка марки над именем товара и «назад» на телефоне — на ступень выше описания и ниже имени (И511, соотношение ROLE_ORDER)',
  '--price-size': 'цена на карте товара — ступень h2, на ступень ниже имени (И513, ROLE_ORDER)',
  '--price-lead': 'межстрочье цены на карте (И513)', '--price-weight': 'вес цены на карте (И513)', '--price-track': 'разрядка цены на карте (И513)',
  '--blurb-size': 'короткое описание под именем товара — ступень вторичного текста, на ступень ниже марки (И511)',
  '--blurb-lead': 'межстрочье описания под именем (И511)', '--blurb-weight': 'вес описания под именем (И511)', '--blurb-track': 'разрядка описания под именем (И511)', '--blurb-measure': 'мера строки описания под именем (И511)',
  '--byline-lead': 'межстрочье строки марки (И509)', '--byline-weight': 'вес строки марки (И509)', '--byline-track': 'разрядка строки марки (И509)',
  '--maker-size': 'марка на карточке полки — ступенью ниже имени на полке, не мельче строки фактов (templates/storefront, ProductCard.module.css; заказчик 30.09.2026, ROLE_ORDER)',
  '--cardname-size': 'имя товара в карточке — ростом текста страницы и не мельче меню (templates/storefront, ProductCard.module.css; заказчик 03.10.2026, ROLE_ORDER, И674)',
  '--cardname-lead': 'межстрочье имени в карточке', '--cardname-weight': 'вес имени в карточке — один с ценой карточки (WEIGHT_ORDER)', '--cardname-track': 'разрядка имени в карточке',
  '--cardprice-size': 'цена в карточке товара — ростом имени в карточке (templates/storefront, Price.module.css `data-size=card`; заказчик 03.10.2026)',
  '--cardbtn-size': 'надпись кнопки карточки («Add to cart») — 16, полом 1rem, как меню (заказчик 05.10.2026: «надпись кнопки на карточке 16 px… через роли»; templates/storefront, ProductCard.module.css, И752)',
  '--cardbtn-lead': 'межстрочье надписи кнопки карточки', '--cardbtn-weight': 'вес надписи кнопки карточки — голосом надписей органов (WEIGHT_ORDER)', '--cardbtn-track': 'разрядка надписи кнопки карточки',
  '--cardprice-lead': 'межстрочье цены в карточке', '--cardprice-weight': 'вес цены в карточке — один с именем (WEIGHT_ORDER)', '--cardprice-track': 'разрядка цены в карточке',
  '--maker-lead': 'межстрочье марки на полке', '--maker-weight': 'вес марки на полке — на шаг легче имени и цены (WEIGHT_ORDER)', '--maker-track': 'разрядка марки на полке',
  '--prodhead-lead': 'межстрочье имени товара (И503)', '--prodhead-weight': 'вес имени товара (И503)', '--prodhead-track': 'разрядка имени товара (И503)',
  '--label-size': 'надпись органа ступенью вторичного текста — фишка, вкладка, сегмент (И674)', '--label-lead': 'межстрочье надписи органа', '--label-weight': 'вес надписи органа — кнопки, ссылки-кнопки, фишки, вкладки; один с пунктом меню (WEIGHT_ORDER, И674)', '--label-track': 'разрядка надписи органа', '--label-measure': 'мера надписи органа — нет',
  '--panehead-size': 'заголовок окна (шторка, окно) — второй уровень ступенью h3: окно в 400, а не раздел страницы (styles/pane.module.css; И551)',
  '--panehead-lead': 'межстрочье заголовка окна (И551)', '--panehead-weight': 'вес заголовка окна (И551)', '--panehead-track': 'разрядка заголовка окна (И551)',
  '--layer-helper': 'слой кружка помощника (FLOATING)', '--layer-toast': 'слой всплывающего сообщения (FLOATING)',
}

/** Ступени ритма, которые узел вправе читать сам: оптика не выше пола. */
export const optics = (sets, floor) => {
  const first = Object.values(sets ?? {})[0]
  if (!first) return new Set()
  const out = new Set()
  for (const [n, v] of Object.entries(first.ритм ?? {})) {
    const lo = Array.isArray(v) ? v[0] : Number(v) * (first.тело?.[0] ?? 16)
    if (lo <= floor) out.add(`--sp-${n}`)
  }
  return out
}

/** Все объявления `--имя:` в CSS без комментариев: имя → значение (первое). */
export const declarations = (css) => {
  const out = new Map()
  for (const m of css.matchAll(/(?:^|[;{])\s*(--[a-z][a-z0-9-]*)\s*:\s*([^;}]+)/g)) {
    if (!out.has(m[1])) out.set(m[1], { value: m[2].trim(), index: m.index })
  }
  return out
}
/** Имена, которые читает значение: var(--x …). */
export const reads = (value) => [...value.matchAll(/var\(\s*(--[a-z][a-z0-9-]*)/g)].map((m) => m[1])
