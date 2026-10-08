import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import pn from '@/styles/pane.module.css'
import s from './design.module.css'
import h from '@/components/Header.module.css'
import type { Lang } from '@/lib/locale.ts'
import { t } from '@/lib/i18n/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { source } from '@/lib/source/index.ts'
import { shelfCard } from '@/lib/view.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { PayMarks } from '@/components/PayMarks.tsx'
import { SIGN } from '@/components/marks.ts'
import { Icon } from '@/components/Icon.tsx'
import { PaneHead } from '@/components/PaneHead.tsx'
import { Price } from '@/components/Price.tsx'
import { Rating } from '@/components/Rating.tsx'
import { Shelf } from '@/components/Shelf.tsx'
import { Breadcrumbs } from '@/components/Breadcrumbs.tsx'
import { StateScreen } from '@/components/StateScreen.tsx'
import { KeyFacts } from '@/components/KeyFacts.tsx'
import { Pledges } from '@/components/Pledges.tsx'
import { MESSENGERS } from '@/lib/contacts.ts'
import { ThemeToggle } from '@/components/ThemeToggle.tsx'
import { Probe } from './Probe.tsx'
import { PaletteStudio } from './PaletteStudio.tsx'
import { Buttons, ButtonList } from './Buttons.tsx'
import { Elements, SignElements } from './Elements.tsx'
import { FieldsMeters } from './FieldsMeters.tsx'
import { Socials } from './Socials.tsx'
import { Tiles } from './Tiles.tsx'
import { HeroBlock } from './HeroBlock.tsx'
import { HomeSections } from './HomeSections.tsx'
import { HomeTalk } from './HomeTalk.tsx'
import { Sources } from './Sources.tsx'
import { Cards } from './Cards.tsx'
import { Stock } from './Stock.tsx'
import { HandStates } from './HandStates.tsx'
import { Shadows } from './Shadows.tsx'
import { Menus } from './Menus.tsx'
import { SiteFrame } from './SiteFrame.tsx'
import { CatalogPages } from './CatalogPages.tsx'
import { ProductParts } from './ProductParts.tsx'
import { CheckoutParts } from './CheckoutParts.tsx'
import { AccountParts } from './AccountParts.tsx'
import { Pointers } from './Pointers.tsx'
import { Part, Row, cssVar } from './parts.tsx'
import { iconSheet, paletteFamilies, scaleSteps } from './sheet.ts'
import { SIGN_GROUPS } from './signGroups.ts'

/* Страница набора — дизайн-система витрины глазами (слово заказчика
   29.09.2026: «в cbdin есть дизайн система и тут всё видно… рассортировано
   в горизонтальном меню, чтоб не было всё в куче»; бриф
   docs/design/дизайн-система.md). Вкладка — адрес (`?t=`), а не состояние:
   ссылку на «Цвет» можно прислать.

   Живёт в панели вида (look-panel/PANEL.md): в шаблоне есть всегда, в
   магазине снимается вместе с панелью одной командой и в новый сайт не
   едет. Ничего своего не рисует: образцы — настоящие компоненты и роли
   сайта, ступени — из выпуска строителей (`sheet.ts`), числа — замер
   отрисованного (`Probe.tsx`). Слова страницы — заказчику, по-русски,
   поэтому у неё `lang="ru"` при любом языке витрины. */

/* Страница показывает дизайн-систему; выбор вида — в панели Look.
   Исключение — палитра: её выбирают и здесь, со строителем своей палитры
   (слово заказчика 29.09.2026; И572). Вкладка с выбором помечена в меню и
   стоит первой, выбор на ней — первым (И571). */
export const TABS = [
  ['system', 'Система', true],
  ['home', 'Главная', false],
  ['shop', 'Магазин', false],
  ['controls', 'Контролы', false],
  ['blocks', 'Блоки', false],
  ['elements', 'Элементы', false],
] as const
/* Подменю вкладки: первая запись — вкладка при пустом `?s=`. */
export const SUBS: Partial<Record<Tab, readonly (readonly [string, string])[]>> = {
  /* Система — как одноимённый раздел панели Look (слово заказчика
     01.10.2026): краска, шрифт и текст, ритм, знаки, кнопки. Всё, что общее
     для всего сайта; выбор здесь — только палитра. «Поля и индикаторы» — то, что
     не кнопка и не иконка: поле ввода и полоса хода (слово заказчика
     03.10.2026, И668). «Ноутбук и телефон» — те же органы под мышью и под
     пальцем рядом (слово заказчика 05.10.2026, И768). */
  system: [['color', 'Цвет'], ['type', 'Типографика'], ['spacing', 'Ритм'], ['shadows', 'Тени'], ['hand', 'Наведение и нажатие'], ['signs', 'Иконки'], ['list', 'Buttons'], ['buttons', 'Кнопки дополнительное'], ['finger', 'Ноутбук и телефон'], ['fields', 'Поля и индикаторы']],
  /* Всё, что относится к главной, — подстраницы Home (слово заказчика
     01.10.2026). */
  home: [['hero', 'Hero Block'], ['tiles', 'Плитки'], ['talk', 'Отзывы и блог'], ['sections', 'Разделение секций']],
  /* Блоки — всё, что стоит на страницах сайта, по разделам сайта: каждый
     компонент сайта показан здесь настоящим (И605, check:system). */
  /* Всё, что относится к магазину, — подстраницы «Магазина», правее
     «Главной» (слово заказчика 01.10.2026: «правее главной добавляй меню
     Магазин \ Карточка товара»): карточка товара (была своей вкладкой
     «Карточки»), каталог, страница товара, корзина и заказ. */
  /* «Кабинет» — вход, кабинет, заказ и адреса покупателя (И771). */
  shop: [['cards', 'Карточка товара'], ['catalog', 'Каталог и страницы'], ['product', 'Страница товара'], ['checkout', 'Корзина и заказ'], ['account', 'Кабинет']],
  /* Блоки — общее для всех страниц: каждый компонент сайта показан в
     дизайн-системе настоящим (И605, check:system). */
  blocks: [['common', 'Общие'], ['frame', 'Шапка и подвал']],
  /* Контролы — окна и меню: одно устройство на все окна и одно на все раскрытия
     (И730; слово заказчика 04.10.2026: «делай страницу образцом меню»). */
  controls: [['panes', 'Окно и шторка'], ['menus', 'Меню']],
}
export const subOf = (tab: Tab, x: string | undefined) => SUBS[tab]?.find(([k]) => k === x)?.[0] ?? SUBS[tab]?.[0][0]
export type Tab = (typeof TABS)[number][0]
export const tabOf = (x: string | undefined): Tab => TABS.find(([k]) => k === x)?.[0] ?? TABS[0][0]


/* ── Основа ─────────────────────────────────────────────────────────── */

const TEXT: [string, string][] = [
  ['--hero', 'Крупный текст первого экрана'],
  ['--pagehead', 'Имя страницы — одно на страницу'],
  ['--prodhead', 'Имя товара'],
  ['--h2', 'Заголовок раздела'],
  ['--h3', 'Подзаголовок, вопрос, карточка'],
  ['--panehead', 'Заголовок шторки'],
  ['--price', 'Цена'],
  ['--intro', 'Вводный абзац первого экрана'],
  ['--lede', 'Строка под заголовком'],
  ['--byline', 'Марка над именем на странице товара'],
  ['--cardname', 'Имя товара в карточке — ростом текста'],
  ['--cardprice', 'Цена в карточке — ростом и толщиной имени'],
  ['--maker', 'Марка на карточке товара'],
  ['--menu', 'Пункт меню'],
  ['--label', 'Надпись кнопки, фишки, вкладки — толщиной меню'],
  ['--body', 'Основной текст'],
  ['--blurb', 'Описание в карточке, вторичный текст'],
  ['--note', 'Сноска, подпись'],
  ['--eyebrow', 'Надзаголовок'],
]

/** Кто носит какой угол — словами; имя роли — из выпуска строителя шкал. */
const RADIUS: Record<string, string> = {
  '--r-xs': 'Метка, счётчик, плашка скидки', '--r-ctrl': 'Кнопка, поле, фишка', '--r-card': 'Карточка товара',
  '--r-sheet': 'Лист страницы, шторка', '--r-pop': 'Главное действие — единственный полный круг',
}

function Type() {
  return (
    <>
      <Part title="Шрифт" lede="Одна гарнитура на весь сайт — выбирается в панели вида (System → Type), второго способа задать её нет.">
        <ul className={s.rows}>
          <Row name="--face" note="Текст и заголовки" what="face">
            <p data-sample className={s.face}>CBD oil goes under the tongue — 0123456789</p>
            <p className={s.face}>The quick brown fox — CBD 10% · 1000 mg</p>
          </Row>
        </ul>
      </Part>
      <Part title="Текст" lede="Роли текста: каждая — размер, насыщенность, межстрочье и трекинг одним решением. Толщин две: то, что называет и нажимается (заголовки, имя и цена товара, меню, кнопки), — 500; то, что читают, — 400; логотип — знак марки, 700. Размер текста страницы течёт с шириной окна; надпись внутри кнопки — нет. Число справа — замер: кегль · насыщенность · межстрочье.">
        <ul className={s.rows}>
          {TEXT.map(([r, note]) => (
            <Row key={r} name={`${r}-*`} note={note} what="size">
              <p data-sample className={s.type} style={{ ...cssVar('--ts', `var(${r}-size)`), ...cssVar('--tw', `var(${r}-weight)`), ...cssVar('--tl', `var(${r}-lead)`), ...cssVar('--tt', `var(${r}-track)`) }}>CBD oil for a calm night’s sleep</p>
            </Row>
          ))}
        </ul>
      </Part>
    </>
  )
}

function Spacing() {
  const tone = (n: string) => cssVar('--x', `var(${n})`)
  return (
    <>
      <Part title="Ритм" lede="Ступени расстояния — числа, из которых берут всё остальное. Течёт вместе с шириной окна. Устройство самой кнопки из этой лестницы не берётся: оно считается от её высоты.">
        <ul className={s.rows}>
          {scaleSteps('sp-').map((x) => <Row key={x.name} name={x.name} note={x.note} what="inline"><span data-sample className={s.bar} style={tone(x.name)} /></Row>)}
        </ul>
      </Part>
      <Part title="Поле, воздух и зазор" lede="Роли поверх ступеней. Поле — от края предмета до содержимого, принадлежит предмету. Воздух — между предметами, принадлежит странице. Зазор — между соседями в ряду.">
        <ul className={s.rows}>
          {[...scaleSteps('pad-'), ...scaleSteps('air-'), ...scaleSteps('gap-'), ...scaleSteps('gut')].map((x) => <Row key={x.name} name={x.name} note={x.note} what="inline"><span data-sample className={s.bar} style={tone(x.name)} /></Row>)}
        </ul>
      </Part>
      <Part title="Высота кнопок и полей" lede="Высота кнопки, поля и фишки. Под пальцем ступень выше — цель не меньше 44.">
        <ul className={s.rows}>
          {scaleSteps('ctrl-h').concat(scaleSteps('ctrl-target')).map((x) => <Row key={x.name} name={x.name} note={x.note} what="block"><span data-sample className={s.tall} style={tone(x.name)} /></Row>)}
        </ul>
      </Part>
      <Part title="Углы и тени" lede="Роли углов и теней: у каждой свои вещи, и применяются они сами. Выбирается набор целиком — в панели Look (System → Shape); он держит вложенность «кнопка ≤ карточка ≤ лист». Число справа — замер на этой странице.">
        <ul className={`${p.grid} ${s.tiles}`}>
          {scaleSteps('r-').map((x) => <li key={x.name} className={s.tile} data-row><span data-sample className={s.corner} style={tone(x.name)} /><span>{RADIUS[x.name] ?? x.note}</span><code>{x.name}</code><Probe what="radius" /></li>)}
        </ul>
        <ul className={`${p.grid} ${s.tiles}`}>
          {/* Шесть ролей тени (И726); все наборы рядом и где тени нет — вкладка «Тени». */}
          {[['--sh-raised', 'Поверхность в покое'], ['--sh-lift', 'Шаг под рукой'], ['--sh-sticky', 'Полоса у края'], ['--sh-overlay', 'Висит над страницей: меню'], ['--sh-modal', 'Окно с затемнением'], ['--sh-in', 'Вдавлено']].map(([n, note]) => (
            <li key={n} className={s.tile}><span className={s.shadow} style={tone(n)} /><span>{note}</span><code>{n}</code></li>
          ))}
        </ul>
      </Part>
      <Part title="Движение" lede="Сколько длится ответ на руку и как далеко едет стрелка. Сами кнопки и как они отвечают руке — на странице «Кнопки». Кто попросил у системы «меньше движения», получает сайт без него — остаются цвет и тень.">
        <ul className={s.rows}>
          {[['--hover-t', 'Наведение: смена краски и прозрачности — плавно'], ['--press-t', 'Нажатие'], ['--open-t', 'Открытие шторки и меню']].map(([n, note]) => (
            <Row key={n} name={n} note={note} what="time"><span data-sample className={s.clock} style={tone(n)} /></Row>
          ))}
          <Row name="--nudge" note="Сдвиг стрелки под рукой — у ссылок, листалок и плашек категорий" what="inline"><span data-sample className={s.bar} style={tone('--nudge')} /></Row>
        </ul>
      </Part>
    </>
  )
}

/* ── Цвет ───────────────────────────────────────────────────────────── */

const ROLES: [string, [string, string][]][] = [
  ['Поверхности', [['--page', 'Страница'], ['--plate', 'Лист, карточка'], ['--plate-2', 'Кадр внутри листа'], ['--plate-3', 'Орган на листе'], ['--field', 'Поле ввода'], ['--quiet', 'Тихая плашка'], ['--plate-glass', 'Стекло на снимке: просвечивает'], ['--plate-glass-hand', 'Оно под рукой: непрозрачно'], ['--page-deck', 'Палуба: шапка, подвал'], ['--menu-bg', 'Меню']]],
  ['Краски текста', [['--ink', 'Текст'], ['--ink-soft', 'Подпись, вторичный текст'], ['--on-plate', 'Текст на листе'], ['--on-plate-2', 'Подпись на листе']]],
  ['Марка и выбор', [['--pop', 'Главная кнопка'], ['--pop-hover', 'Она под рукой'], ['--pop-press', 'Она нажата'], ['--pop-ink', 'Текст краской марки'], ['--pop-tint', 'Плашка марки'], ['--select', 'Выбранное'], ['--ring', 'Кольцо фокуса']]],
  ['Черты', [['--rule', 'Черта, разделитель'], ['--line', 'Линия'], ['--border', 'Кромка органа']]],
  ['Сигналы', [['--sale', 'Скидка'], ['--sale-tint', 'Плашка скидки'], ['--bad', 'Ошибка'], ['--bad-tint', 'Плашка ошибки'], ['--ok', 'Готово, в наличии'], ['--ok-tint', 'Плашка успеха'], ['--warn', 'Внимание'], ['--warn-tint', 'Плашка внимания'], ['--info', 'Сведение'], ['--info-tint', 'Плашка сведения']]],
]

const FAMILY: Record<string, string> = { n: 'Нейтраль', a: 'Марка', e: 'Ошибка', sale: 'Скидка', warn: 'Внимание', ok: 'Успех', info: 'Сведение' }

const Floor = ({ name, note, ground }: { name: string; note: string; ground?: 'deck' | 'plate' }) => (
  <div className={s.floor} data-ground={ground === 'deck' ? 'deck' : undefined} data-plate={ground === 'plate' ? '' : undefined}>
    <p className={s.floorName}>{name}</p>
    <p className={p.note}>{note}</p>
    <hr className={s.rule} />
    <div className={p.cluster}>
      <button className={b.btn} data-voice="loud" type="button">В корзину</button>
      <button className={b.btn} type="button">Подробнее</button>
      <span className={p.chip} data-chip="lab">−20%</span>
    </div>
    <a className={go.go}>Все товары<Icon id="arrow-right" /></a>
  </div>
)

function Color({ lang }: { lang: Lang }) {
  return (
    <>
      <Part title="Палитра" lede="Набор красок на куске магазина — или своя палитра из цвета марки.">
        <PaletteStudio />
      </Part>
      <Part title="Тема" lede="Показана тема, которая сейчас включена: краски сайта отвечают только на тему всей страницы, две темы рядом браузер не рисует. Переключите — числа поменяются.">
        <ThemeToggle label={t(lang, 'theme.toggle')} className={`${b.btn} ${s.theme}`} sun={h.sun} moon={h.moon} />
      </Part>
      <Part title="Фоны" lede="Три фона, на которых стоят вещи сайта: фон страницы, белый лист (карточка, корзина, шторка) и тёмная полоса (шапка, подвал). Отдельно их не выбирают — их даёт палитра. Здесь видно, что одни и те же кнопки и ссылки читаются на каждом.">
        <div className={`${p.grid} ${s.floors}`}>
          <Floor name="Фон страницы" note="На нём стоит всё по умолчанию" />
          <Floor name="Лист" note="Карточка, корзина, шторка" ground="plate" />
          <Floor name="Тёмная полоса" note="Шапка и подвал" ground="deck" />
        </div>
      </Part>
      <Part title="Роли" lede="То, чем красят вещи: имя по работе, а не по цвету. Перекраска марки меняет краски, имена остаются.">
        {ROLES.map(([group, roles]) => (
          <div key={group} className={s.group}>
            <h3>{group}</h3>
            <ul className={`${p.grid} ${s.tiles}`}>
              {roles.map(([n, note]) => (
                <li key={n} className={s.tile} data-row><span data-sample className={s.swatch} style={cssVar('--x', `var(${n})`)} /><span>{note}</span><code>{n}</code><Probe what="paint" /></li>
              ))}
            </ul>
          </div>
        ))}
      </Part>
      <Part title="Семьи" lede="Из трёх красок строитель палитры считает семь семей по ступеням; роли берут отсюда. Ступень 9 — чистая краска, 11 — текст этой краской, 2 — её плашка.">
        {paletteFamilies().map(({ family, steps }) => (
          <div key={family} className={s.group}>
            <h3>{FAMILY[family] ?? family}</h3>
            <ul className={`${p.grid} ${s.steps}`}>
              {steps.map((n) => <li key={n} data-row><span data-sample className={s.chipColor} style={cssVar('--x', `var(${n})`)} /><code>{n.replace(`--${family}-`, '')}</code><Probe what="paint" /></li>)}
            </ul>
          </div>
        ))}
      </Part>
    </>
  )
}

/* ── Знаки ──────────────────────────────────────────────────────────── */

/* Знак, который сайт красит своей краской, а не краской слова, стоит на
   странице в каждом своём виде: за плиткой одной краской в той же сетке —
   плитка в краске, подписанная ролью палитры (слово заказчика 01.10.2026:
   отдельный раздел не нужен, три знака в одной плитке — каша; «для других
   иконок требуется цветная версия? проверь»). Список — по стилям сайта:
   мессенджеры — краской марки (меню связи, окно помощи; ReachList.module.css),
   звезда оценки — `--star` (Rating.module.css), сердце в избранном залито
   `--pop` ролью заливки знака `--sign-fill` (styles/glyph.module.css,
   И625). `fill` — знак линией, который в этом виде залит. */
const LOGOS: [string, string[]][] = [['viber', ['viber']], ['whatsapp', ['whatsapp']], ['telegram', ['telegram']], ['instagram', ['instagram', 'instagram-line']],
  ['facebook', ['facebook', 'facebook-square', 'facebook-line']], ['messenger', ['messenger']], ['youtube', ['youtube', 'youtube-line']], ['gmail', ['gmail']]]
const TINTS: Record<string, { role: string; fill?: true }[]> = {
  ...Object.fromEntries(MESSENGERS.map((m) => [SIGN[m.key], [{ role: `--mark-${m.key}` }]])),
  /* Логотип в цвете своей компании — у каждого, чья краска есть в палитре
     (MARKS, tools/palette.mjs; И628), а не только у знаков меню связи. */
  ...Object.fromEntries(LOGOS.flatMap(([role, ids]) => ids.map((id) => [id, [{ role: `--mark-${role}` }]]))),
  'star-fill': [{ role: '--star' }],
  heart: [{ role: '--pop', fill: true }],
}
/** Подпись окрашенной плитки — чьей краской знак стоит на сайте (И625). */
const TINT_NAME: Record<string, string> = {
  ...Object.fromEntries(MESSENGERS.map((m) => [`--mark-${m.key}`, `краской ${m.label}`])),
  '--mark-facebook': 'краской Facebook', '--mark-messenger': 'краской Messenger', '--mark-youtube': 'краской YouTube', '--mark-gmail': 'краской Gmail',
  '--star': 'звёзды отзывов', '--pop': 'в избранном, на сайте',
}
/* Логотип в нескольких рисунках (YouTube и YouTube линией) красится одной
   ролью: подпись «краской YouTube» у обоих была бы одна и та же, плитки не
   отличить — к ней добавляется имя рисунка (слово заказчика 01.10.2026). */
const MANY_DRAWINGS = new Set(LOGOS.filter(([, ids]) => ids.length > 1).flatMap(([, ids]) => ids))
const tinted = (id: string, sign: ReactNode, name: string) => (TINTS[id] ?? []).map(({ role, fill }) => {
  const tint = TINT_NAME[role] ?? 'в краске сайта'
  return (
    <li key={`${id}${role}`} className={s.icon}><span className={`${s.iconPair} ${s.tinted}`} data-fill={fill ? '' : undefined} style={cssVar('--x', `var(${role})`)}>{sign}</span><span className={s.iconName}>{name && MANY_DRAWINGS.has(id) ? `${name}: ${tint}` : tint}</span><code>{role}</code></li>
  )
})

function Signs({ lang }: { lang: Lang }) {
  const all = iconSheet()
  /* Подразделы по смыслу (signGroups.ts, И625): каждый знак — в два роста,
     знак кнопки и знак в строке; длинный знак (Visa) держит свою пропорцию
     сам — Icon ставит окно неквадратному знаку. Рядом — русская подпись и
     имя в листе. Знак листа вне подразделов — «Прочее». */
  const placed = new Set(SIGN_GROUPS.flatMap((g) => g.signs.map(([id]) => id)))
  const groups = [...SIGN_GROUPS.map((g) => ({ ...g, signs: g.signs.filter(([id]) => all.includes(id)) })),
    { title: 'Прочее', lede: 'Иконки листа, которым ещё не назначен подраздел.', signs: all.filter((id) => !placed.has(id)).map((id) => [id, ''] as [string, string]) }]
    .filter((g) => g.signs.length)
  const signOf = (id: string) => <><Icon id={id} /><Icon id={id} className={s.small} /></>
  return (
    <>
      <p className={p.note}>Один лист на весь сайт: иконка рисуется в одном месте, и поломка чинится в одном месте. Каждая иконка — в двух ростах: иконка кнопки и иконка в строке; длинная иконка держит свою пропорцию. Иконка, которую сайт где-то красит своей краской, стоит и в ней — следующей плиткой, подписанной ролью палитры.</p>
      {groups.map((g) => (
        <Part key={g.title} title={g.title} lede={g.lede}>
          <ul className={`${p.grid} ${s.icons}`}>
            {g.signs.flatMap(([id, name]) => [
              <li key={id} className={s.icon}><span className={s.iconPair}>{signOf(id)}</span>{name ? <span className={s.iconName}>{name}</span> : null}<code>{id}</code></li>,
              ...tinted(id, signOf(id), name),
            ])}
          </ul>
        </Part>
      ))}
      <Stock lang={lang} />
      <Part title="Знаки оплаты" lede="Так знаки оплаты стоят в подвале: одной высотой, без пилюль — знак оплаты не нажимают, плашка обещала бы действие.">
        <PayMarks label="Способы оплаты" />
      </Part>
      <SignElements />
    </>
  )
}

/* ── Контролы ───────────────────────────────────────────────────────── */

function Controls({ lang }: { lang: Lang }) {
  return (
    <>
      <Part title="Окно и шторка" lede="Одно устройство на все окна поверх страницы: шапка — одна на все окна, тёмной полосой; ниже один белый лист без подложек и карточек; она стоит, прокручивается тело; внизу — пара «тихая слева, громкая справа», одна у меню, фильтров и корзины; Escape, фокус и затемнение — от браузера. Посреди экрана — окно, от края — шторка (меню, фильтры, корзина). Нажмите — откроется настоящее.">
        <div className={p.cluster}>
          {(['dialog', 'start', 'end'] as const).map((k) => (
            <button key={k} className={b.btn} type="button" popoverTarget={`design-pane-${k}`}>{k === 'dialog' ? 'Окно посреди' : k === 'start' ? 'Шторка слева' : 'Шторка справа'}</button>
          ))}
        </div>
        {(['dialog', 'start', 'end'] as const).map((k) => (
          <div key={k} id={`design-pane-${k}`} popover="auto" className={pn.pane} data-pane={k} aria-label="Образец окна">
            <PaneHead title="Заголовок окна" close="Закрыть" target={`design-pane-${k}`} />
            <div className={pn.body}>
              <p>Шапка стоит на месте, пока прокручивается тело: где бы человек ни был в длинном списке, он видит, что это за окно и как его закрыть.</p>
              {Array.from({ length: 30 }, (_, i) => <p key={i} className={p.note}>Строка {i + 1} — тело окна прокручивается, страница под ним нет.</p>)}
            </div>
            <div className={`${pn.foot} ${pn.acts}`}>
              <button className={b.btn} type="button" popoverTarget={`design-pane-${k}`} popoverTargetAction="hide">Отмена</button>
              <button className={b.btn} data-voice="loud" type="button" popoverTarget={`design-pane-${k}`} popoverTargetAction="hide">Готово</button>
            </div>
          </div>
        ))}
      </Part>
    </>
  )
}

/* ── Блоки ──────────────────────────────────────────────────────────── */

async function Blocks({ lang }: { lang: Lang }) {
  const r = await source().listing(lang, { facets: {}, sort: 'popular', page: null })
  const cards = r.ok ? r.value.items.slice(0, 6).map((c) => shelfCard(lang, c)) : []
  const sale = cards.find((c) => c.was) ?? cards[0]
  return (
    <>
      <Part title="Цепочка" lede="Где покупатель стоит — строкой над именем страницы.">
        <Breadcrumbs trail={[{ name: t(lang, 'crumb.home'), href: hrefFor(lang, { home: true }) }, { name: t(lang, 'catalog.title'), href: hrefFor(lang, { catalog: true }) }, { name: sale?.name ?? '—' }]} label={t(lang, 'crumb.label')} />
      </Part>
      <Part title="Цена и оценка" lede="Цена сейчас, рядом прежняя — мельче и зачёркнутая. Нет отзывов — строки оценки нет вовсе.">
        <div className={p.stack}>
          {sale ? <Price now={sale.price} was={sale.was} size="lead" /> : null}
          {sale ? <Price now={sale.price} was={sale.was} /> : null}
          <Rating rating={{ value: '4.5', count: '28', stars: ['full', 'full', 'full', 'full', 'half'], label: '4.5 из 5, 28 отзывов' }} />
        </div>
      </Part>
      <Part title="Полка" lede="Шапка полки, стрелки листания и выход ко всей полке — одной строкой; карточки — настоящие товары магазина.">
        <Shelf title={t(lang, 'catalog.title')} id="design-shelf" all={hrefFor(lang, { catalog: true })} cards={cards} cart={{ submit: cartSubmit, call: cartCall }} />
      </Part>
      <Socials />
      <Part title="Пустой экран" lede="Экран, когда показывать нечего: что случилось и один шаг дальше.">
        <StateScreen level={2} kind="empty" title={t(lang, 'saved.empty')} step={t(lang, 'saved.emptyStep')} href={hrefFor(lang, { catalog: true })} icon="heart" />
      </Part>
      <Part title="Экраны состояний" lede="Почему пусто и куда дальше: четыре причины — четыре экрана. Пусто, ничего не найдено, источник не ответил, страницы нет. Шаг — одна ссылка; когда экран и есть вся страница, шаг — громкая кнопка.">
        <div className={`${p.grid} ${s.floors}`}>
          <StateScreen level={2} kind="none" title="По запросу ничего нет" step="Все товары" />
          <StateScreen level={2} kind="unavailable" title="Магазин не отвечает" step="Попробовать снова" loud />
          <StateScreen level={2} kind="not-found" title="Страницы нет" step="На главную" />
        </div>
      </Part>
      <Part title="Обещания у кнопки" lede="Строки под кнопкой заказа — «а если…», которое держит руку над кнопкой: оплата при получении, доставка «от», срок возврата. Тихим кеглем сноски, кнопке не мешают.">
        <Pledges pledges={{ label: 'Условия', items: [{ icon: 'package', text: 'Оплата при получении' }, { icon: 'truck', text: 'Доставка от 15 lei' }, { icon: 'check-shield', text: 'Возврат 14 дней' }] }} />
      </Part>
      <Part title="Ключевые цифры" lede="Что покупатель CBD сверяет перед покупкой: сколько всего, в единице приёма, в капле, цена миллиграмма. Число крупно, подпись тихо.">
        <KeyFacts facts={{ label: 'Параметры', rows: [{ value: '1000 mg', label: 'CBD in total', note: null }, { value: '33 mg', label: 'CBD per ml', note: null }, { value: '1,5 mg', label: 'CBD per drop', note: 'ок. 20 капель в мл' }] }} />
      </Part>
    </>
  )
}

export async function DesignPage({ lang, tab, sub }: { lang: Lang; tab: Tab; sub?: string }) {
  const here = hrefFor(lang, { home: true })
  const subs = SUBS[tab]
  const subNow = subOf(tab, sub)
  return (
    <main id="main" lang="ru" className={`${p.wrap} ${p.section} ${s.page}`} data-air="head">
      <div className={p.pagehead}>
        <h1 id="top">Дизайн-система</h1>
        <p className={p.note}>Вкладки с пометкой «выбор» настраивают вид — щелчок сразу меняет весь сайт. Остальные показывают, как он устроен.</p>
      </div>
      <nav className={s.tabs} aria-label="Разделы дизайн-системы">
        {TABS.map(([k, name, choose]) => <a key={k} href={`${here}/design${k === TABS[0][0] ? '' : `?t=${k}`}`} aria-current={k === tab ? 'page' : undefined}>{name}{choose ? <span className={s.tabMark}>выбор</span> : null}</a>)}
      </nav>
      {subs ? <nav className={s.subtabs} aria-label="Подразделы">{subs.map(([k, name]) => <a key={k} href={`${here}/design?t=${tab}&s=${k}`} aria-current={k === subNow ? 'page' : undefined}>{name}</a>)}</nav> : null}
      {tab === 'home' ? (subNow === 'hero' ? <HeroBlock lang={lang} /> : subNow === 'tiles' ? <Tiles lang={lang} /> : subNow === 'talk' ? <HomeTalk lang={lang} /> : <HomeSections lang={lang} />) : tab === 'system' ? (subNow === 'type' ? <Type /> : subNow === 'spacing' ? <Spacing /> : subNow === 'shadows' ? <Shadows /> : subNow === 'hand' ? <HandStates lang={lang} /> : subNow === 'signs' ? <Signs lang={lang} /> : subNow === 'list' ? <ButtonList lang={lang} /> : subNow === 'buttons' ? <Buttons /> : subNow === 'finger' ? <Pointers lang={lang} /> : subNow === 'fields' ? <FieldsMeters lang={lang} /> : <Color lang={lang} />) : tab === 'controls' ? (subNow === 'menus' ? <Menus lang={lang} /> : <Controls lang={lang} />) : tab === 'elements' ? <Elements /> : tab === 'shop' ? (subNow === 'catalog' ? <CatalogPages lang={lang} /> : subNow === 'product' ? <ProductParts lang={lang} /> : subNow === 'checkout' ? <CheckoutParts lang={lang} /> : subNow === 'account' ? <AccountParts lang={lang} /> : <Cards lang={lang} />) : subNow === 'frame' ? <SiteFrame lang={lang} /> : <Blocks lang={lang} />}
      <Sources />
    </main>
  )
}
