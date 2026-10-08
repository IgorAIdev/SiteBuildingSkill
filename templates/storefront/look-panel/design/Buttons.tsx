import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import { Icon } from '@/components/Icon.tsx'
import { Turn } from '@/components/Turn.tsx'
import { QuantityStepper } from '@/components/QuantityStepper.tsx'
import { SITE_LOOK, type Look } from '@/lib/counter-look.ts'
import { VariantPicker } from '@/components/VariantPicker.tsx'
import { SaveToggle, type SaveSign } from '@/components/SaveToggle.tsx'
import { Pagination } from '@/components/Pagination.tsx'
import { CategoryButton } from '@/components/CategoryButton.tsx'
import { HelpDock } from '@/components/HelpDock.tsx'
import { reachRows, supportHref, SUPPORT } from '@/lib/contacts.ts'
import { shot } from '@/lib/shot.ts'
import type { OptionGroupLinks } from '@/lib/variant.ts'
import { Part, Worn, cssVar } from './parts.tsx'
import { lookNow } from '@/lib/look.ts'
import { source } from '@/lib/source/index.ts'
import type { Lang } from '@/lib/locale.ts'
import { buttonCatalog, type ButtonAxis } from './sheet.ts'
import { SliderIcon } from './Sliders.tsx'
import { ElementTiles } from './Elements.tsx'
import { t } from '@/lib/i18n/index.ts'
import { showLabel, type PagesView } from '@/lib/catalog-view.ts'
import s from './design.module.css'
import product from './product.module.css'

/* Две вкладки кнопок (слово заказчика 01.10.2026, И617, И619):
   Buttons — перечень всех кнопок плитками, как знаки: кнопки сайта каждая
   своим видом и присланные кнопки из «Элементов»; «Кнопки дополнительное» —
   стили кнопки из каталога панели Look (заливка главной — Fill и Gradient,
   тихая, форма кнопки баннера, ответ на руку), метка «на сайте» — тот, что
   стоит сейчас. Плитка — настоящая кнопка и имя, без описаний и кодов. */

/* Стиль каталога — кнопка со значениями своего стиля на ней самой, а не
   выбор панели. Надпись — по голосу оси: главная и её форма — громкая
   «В корзину», тихая и ответ на руку — «Подробнее». */
const LOUD = new Set(['loud'])
/** Что выбирает ось — одной строкой, словами заказчика. */
const LEDE: Record<string, string> = {
  loud: 'Главная кнопка — одно действие, ради которого открыт экран: «В корзину» на странице товара, «К оформлению», «Оплатить», кнопка баннера. Она одна на экране и залита краской марки, остальные кнопки — тихие, чтобы глаз сразу нашёл главную. Заливка — сплошная краской марки (Fill) или та же краска с переходом: слева светлее, справа — ровно как Fill (Gradient). Обе краски — из палитры. Какая стоит на сайте — помечено; сменить можно в панели Look.',
  quiet: 'Чем залиты остальные кнопки — «Подробнее», «Сбросить»: контур, вуаль или тон марки. Краски — из палитры; сменить можно в панели Look.',
  hand: 'Что кнопка делает под мышью и пальцем. Наведите и нажмите. Сменить можно в панели Look.',
}
const roles = (r: Record<string, string>) => Object.assign({}, ...Object.entries(r).map(([k, v]) => cssVar(k, v)))
const Styles = ({ axis, worn, title, lede }: { axis: ButtonAxis; worn: string | undefined; title?: string; lede?: string }) => (
  <Part title={title ?? axis.name} lede={lede ?? LEDE[axis.id] ?? axis.what}>
    <ul className={`${p.grid} ${s.btnStyles}`}>
      {axis.options.map((o) => (
        <li key={o.id} className={s.btnStyle}>
          <span className={s.famSample}>
            {LOUD.has(axis.id)
              ? <button className={b.btn} data-voice="loud" type="button" style={roles(o.roles)}>В корзину</button>
              : <button className={b.btn} type="button" style={roles(o.roles)}>Подробнее</button>}
          </span>
          <span className={s.btnName}>{o.name}</span>
          <Worn on={o.id === worn} />
        </li>
      ))}
    </ul>
  </Part>
)

/** Виды счётчика: имя и атрибут (`data-look`, styles/primitives.module.css). Первый — как на сайте. */
/** Выбор варианта на странице товара — настоящий `VariantPicker`: крепость и объём; одно сочетание недоступно. */
const OPTIONS: OptionGroupLinks[] = [
  { code: 'strength', name: 'Крепость', options: [['5', '5 %'], ['10', '10 %'], ['15', '15 %'], ['20', '20 %']].map(([code, name]) => ({ code, name, href: '#', current: code === '10' })) },
  { code: 'volume', name: 'Объём', options: [['10', '10 мл', true], ['30', '30 мл', false], ['50', '50 мл', null]].map(([code, name, on]) => ({ code: code as string, name: name as string, href: on === null ? null : '#', current: on === true })) },
]
/** Листание под полкой — «Показать ещё» и номера страниц (`--pager-look`, панель Look → Card, И721; ASOS, Gymshark, Material UI, Mantine). Первый — как на сайте. */
const PAGER_LOOKS: [string, string][] = [['rings', 'Листание: номера'], ['compact', 'Листание: компактно «1 / 4»']]
/** Первая страница полки из четырёх, как на сайте: 24 товара из 96 показано. */
const PAGES: PagesView = {
  label: 'Страницы', prev: null, next: '#top', prevLabel: 'Назад', nextLabel: 'Дальше',
  items: [1, 2, 3, 4].map((n) => ({ n, href: n === 1 ? null : '#top', gap: false })),
  more: '#top', moreLabel: 'Показать ещё', shown: 'Показано 24 из 96', now: 1, total: 4,
}
/** Та же полка на двух страницах: два круга «1» и «2» без уголков у любого вида (И723). */
const PAGES_FEW: PagesView = {
  ...PAGES, items: [1, 2].map((n) => ({ n, href: n === 1 ? null : '#top', gap: false })),
  shown: 'Показано 24 из 48', total: 2,
}

/** Виды сердца на снимке — карточки полки и главного кадра товара (`--save-look`, панель Look → Card → Heart): на стекле палитры и без подложки, ростом с плашку скидки. Первый — как на сайте. Квадратная кнопка в строке заказа снята 04.10.2026 (заказчик: «избранное перенеси на изображение»). */
const HEART_LOOKS: [string, string][] = [['disc', 'Сердце на снимке: на стекле'], ['bare', 'Сердце на снимке: без подложки']]

/** Виды выбора варианта (`--seg-look`, панель Look → Product page): пилюли, встык, в подложке и плашки размера двумя видами (элемент 97). */
const SEGMENTS: [string, string][] = [['chips', 'Выбор: пилюли'], ['joined', 'Выбор: встык'], ['tray', 'Выбор: в подложке'], ['tiles', 'Плашки размера: чернилами'], ['tint', 'Плашки размера: тоном марки']]
/** Избранное: знак из листа знаков (`SaveToggle`, `sign`). */
const SAVES: [SaveSign, string][] = [['heart', 'Сердце'], ['heart-line', 'Сердце остроконечное'], ['bookmark', 'Закладка'], ['star', 'Звезда']]
/** Счётчик: жёлоб — вид сайта, одетый как тихая кнопка каталога (контур или вуаль — как в панели), остальные скачаны (HyperUI; MIT), не нарисованы. */
const COUNTERS: [Look, string][] = [
  ['trough', 'Жёлоб · как тихая кнопка'], ['outline', 'Контур · HyperUI'], ['field', 'Число в рамке · HyperUI'],
]

/** Кнопки листания по стилям каталога — как плитки «Кнопок»: настоящая круглая
 *  кнопка (`data-pager`), краски стиля на ней самой, статичная; стрелка или
 *  уголок — две строки одного набора. Пара «назад · вперёд» в одной плитке,
 *  имя — стиля каталога. Порядок — слово заказчика 01.10.2026: Outline, Veil,
 *  Fill, Gradient; «Brand fill» (заливка маркой под рукой) снят из каталога
 *  кнопок вообще («не применяем в кнопках») и вернулся одним видом — у кнопок
 *  листания полки (`data-hand="pop"`, И704), первой плиткой. «Dash» — черта перед словом, у знака без слова слова нет;
 *  «Brand tint» из каталога снят («цвет неудачен, не предлагать»). Анимированные
 *  кнопки листания с окантовкой и заливкой сняты по слову заказчика; стрелки
 *  без кружка (11, 12) — анимированные знаки, их место — вкладка «Знаки». */
/* Наборы — слово заказчика 02.10.2026: «уголки и 48 — отдельный набор, и набор
   с анимацией отдельный». Стрелка стоит крупной (48), уголок — малой (40) и
   крупной; анимированный набор — те же кнопки, у которых знак смещается в
   сторону хода на `--nudge` под рукой (`data-nudge`, btn.module.css).
   «View all» — пилюля-кнопка справа от стрелок, в той же плитке, того же стиля и
   роста — у каждого набора (слово заказчика 02.10.2026: «в комплект к этим
   стрелкам», «так же и для остальных»). Форма — круг и пилюля при любом угле
   панели, как в шапке ряда на сайте (`data-rail-nav`, И747). */
const PAGER_SIGNS: [string, string, string, 'lg' | undefined, boolean][] = [
  ['Стрелки', 'arrow-left', 'arrow-right', 'lg', false],
  ['Уголок', 'chevron-left', 'chevron-right', undefined, false],
  ['Уголок 48', 'chevron-left', 'chevron-right', 'lg', false],
  ['Стрелки с анимацией', 'arrow-left', 'arrow-right', 'lg', true],
  ['Уголок с анимацией', 'chevron-left', 'chevron-right', undefined, true],
]
type PagerStyle = { key: string; name: string; voice: 'loud' | undefined; hand?: 'pop'; roles: Record<string, string> }
function pagerStyles(): PagerStyle[] {
  const cat = buttonCatalog()
  const pick = (axis: string, id: string) => cat.find((a) => a.id === axis)?.options.find((o) => o.id === id)
  const outline = pick('quiet', 'outline'), veil = pick('quiet', 'veil')
  const fill = pick('loud', 'fill'), gradient = pick('loud', 'gradient')
  /* Outline с заливкой маркой под рукой — вид кнопок листания полки и «View all» на
     сайте (`data-hand="pop"`, И704; слово заказчика 04.10.2026). */
  const styles: (PagerStyle | undefined)[] = [
    /* Кромку руки ставит сам признак (марка): своя кромка руки стиля в `style` её перебила бы. */
    outline && { key: 'outline-pop', name: `${outline.name} · brand under the hand`, voice: undefined, hand: 'pop' as const, roles: Object.fromEntries(Object.entries(outline.roles).filter(([k]) => k !== '--ctrl-btn-edge-hand')) },
    outline && { key: 'outline', name: outline.name, voice: undefined, roles: outline.roles },
    veil && { key: 'veil', name: veil.name, voice: undefined, roles: veil.roles },
    fill && { key: 'fill', name: fill.name, voice: 'loud' as const, roles: fill.roles },
    gradient && { key: 'gradient', name: gradient.name, voice: 'loud' as const, roles: gradient.roles },
  ]
  return styles.filter((x): x is PagerStyle => Boolean(x))
}
const PagerStyles = ({ all }: { all: string }) => {
  const list = pagerStyles()
  return (
    <>
      {PAGER_SIGNS.map(([title, left, right, size, nudge]) => (
        <div key={title} className={s.group}>
          <h3>{title}</h3>
          <ul className={`${p.grid} ${s.btnStyles}`} data-wide="">
            {list.map((x) => (
              <li key={x.key} className={s.btnStyle}>
                <span className={s.famSample}>
                  <button className={b.btn} data-voice={x.voice} data-hand={x.hand} data-pager data-rail-nav data-nudge={nudge ? '' : undefined} data-to="back" data-size={size} type="button" aria-label="Назад" style={roles(x.roles)}><Icon id={left} /></button>
                  <button className={b.btn} data-voice={x.voice} data-hand={x.hand} data-pager data-rail-nav data-nudge={nudge ? '' : undefined} data-size={size} type="button" aria-label="Вперёд" style={roles(x.roles)}><Icon id={right} /></button>
                  <button className={b.btn} data-voice={x.voice} data-hand={x.hand} data-rail-nav data-nudge={nudge ? '' : undefined} data-size={size} type="button" style={roles(x.roles)}>{all}<Icon id="arrow-right" /></button>
                </span>
                <span className={s.btnName}>{x.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  )
}

/** Вкладка Buttons — все кнопки, какие есть: кнопки сайта, каждая своим
 *  видом, и присланные кнопки из «Элементов» (слово заказчика 01.10.2026,
 *  И619). Плитки — как у знаков. */
/* Формы кнопки — разные кнопки, а не настройка: стоят в Buttons первыми,
   просто «Кнопки», без деления на кнопки баннера (слово заказчика
   01.10.2026: «это просто кнопки, мы их не делим на кнопки баннера», И620, И622). */
const SHAPE = 'shape'
/* Кнопки категорий — имя категории и её знак из данных образца (`sign`:
   пипетка, капсула, косметика, животные; у Vendure знака полки пока нет, И422) — в двух ростах в одной плитке, чтобы
   по знаку на глаз было видно, в каком из них знаки категорий читаются
   (слово заказчика 01.10.2026). Знак в кружке — настоящий знак листа (`b.signDot`), .42 высоты кнопки;
   под рукой он стоит, не листается (слово заказчика 01.10.2026). */
/* Заливки формы — набор «Fill · Gradient · Veil · Outline», как у кнопок
   листания (слово заказчика 02.10.2026: «аутлайн, вейл, фил, градиент для
   кнопок, а для каких-то заливка не нужна — как принято у профессионалов»).
   Краски — не новые: Fill и Gradient — ось «Заливка главной», Veil — тихая
   плашка (`--plate-quiet`, сплошная: вуаль тихой оси просвечивает, а у формы со
   стрелкой под заливкой лежит краска надписи; на снимке просвечивала бы и она), на роли громкой формы (форма читает `--ctrl-btn-*-pop`),
   Outline — доля `--ctrl-btn-hollow` самой формы (у формы со стрелкой на конце
   стрелка тогда рисуется, `--ctrl-btn-draw`). Порядок везде как у кнопок листания: Outline, Veil, Fill, Gradient. Что кому идёт:
   · обычная, пилюля, пилюля со стрелкой, кружок со стрелкой — все четыре: форма
     простая, заливка — единственное, что её различает;
   · хвост шевронов — только Fill: его тоновые шевроны и есть акцент, контур и вуаль
     их теряют, а градиент второй раз красит то же самое;
   · кнопки категорий стоят на снимке — контура нет: прозрачная кнопка на снимке
     теряет надпись; Veil, Fill, Gradient;
   · кнопки эффектов — тихий выбор рядом друг с другом, а не главные действия:
     Outline, Veil, Fill; градиента нет (семь градиентных кнопок в ряд — шум). */
type Fill = 'fill' | 'gradient' | 'veil' | 'outline'
const FILL_NAME: Record<Fill, string> = { fill: 'Fill', gradient: 'Gradient', veil: 'Veil', outline: 'Outline' }
const FOUR: Fill[] = ['outline', 'veil', 'fill', 'gradient']
/* Пилюля — не форма кнопки, а ступень углов: Shape → Corners, близнец «· pill» у
   каждого набора (`--r-btn` полным кругом, слово заказчика 04.10.2026: «не реагируют
   кнопки на настройку панели»). Ряд «Обычная» стоит углом контрола, ряд «Пилюля» — той же кнопкой
   полным кругом; стрелка у конца — в пилюле, как её рисовали. */
const SHAPE_SETS: { title: string; shapes: string[]; fills: Fill[]; pill?: boolean }[] = [
  { title: 'Обычная — угол из Shape → Corners', shapes: ['standard'], fills: FOUR },
  { title: 'Пилюля — Shape → Corners, вариант «· pill»', shapes: ['standard'], fills: FOUR, pill: true },
  { title: 'Со стрелкой', shapes: ['arrow'], fills: FOUR, pill: true },
  { title: 'Кружок со стрелкой', shapes: ['circle'], fills: FOUR },
  { title: 'Хвост шевронов', shapes: ['trail', 'trail-joined'], fills: ['fill'] },
]
/* Корзины набора — четыре знака листа; у обычной и пилюли каждая заливка несёт
   свою корзину и слово «Add» (слово заказчика 02.10.2026: «поставь в кнопки
   разные корзины») — выбирать глазами, какая корзина какой кнопке идёт. */
const CART: Record<Fill, [string, string]> = { outline: ['shopping-cart', 'Cart'], veil: ['shopping-bag', 'Bag'], fill: ['shopping-basket', 'Basket'], gradient: ['shopping-handbag', 'Handbag'] }
const WITH_CART = new Set(['standard'])
type Option = ButtonAxis['options'][number]
const optionOf = (cat: ButtonAxis[], axis: string, id: string): Option | undefined => cat.find((a) => a.id === axis)?.options.find((o) => o.id === id)
/** Роли формы в одной из четырёх заливок: заливка, потом форма, потом «без заливки». */
function shapeRoles(cat: ButtonAxis[], shape: Option | undefined, fill: Fill): Record<string, string> {
  const own = shape?.roles ?? {}
  if (fill === 'veil') {
    const q = optionOf(cat, 'quiet', 'veil')?.roles ?? {}
    return { '--ctrl-btn-fill-pop': 'var(--plate-quiet)', '--ctrl-btn-ink-pop': q['--ctrl-btn-ink'], '--ctrl-btn-edge-pop': q['--ctrl-btn-edge'], '--ctrl-btn-tint-pop': 'transparent', '--ctrl-btn-frost-pop': '0', '--ctrl-btn-rim-pop': 'transparent', ...own }
  }
  const loud = optionOf(cat, 'loud', fill === 'gradient' ? 'gradient' : 'fill')?.roles ?? {}
  if (fill === 'outline') return { ...loud, ...own, '--ctrl-btn-hollow': '1', ...(own['--ctrl-btn-glyph'] === '1' ? { '--ctrl-btn-draw': '1' } : {}) }
  return { ...loud, ...own }
}
/** Заливка, в которой форма стоит на сайте сейчас (по выбору панели). */
const onSite = (names: Record<string, string>, shapeId: string, fill: Fill, pill = false) => {
  const worn = names['btn-shape'] ?? 'standard'
  const outline = worn === 'outline' || worn.endsWith('-outline')
  const base = worn === 'outline' ? 'standard' : worn.replace(/-outline$/, '')
  return shapeId === base && pill === (names.corners ?? '').endsWith('-pill') && (fill === 'outline' ? outline : !outline && fill === (names['btn-loud'] ?? 'fill'))
}

/** Формы кнопки — каждая в тех заливках, которым она идёт. */
function ShapeSets({ cat, names }: { cat: ButtonAxis[]; names: Record<string, string> }) {
  const shapes = cat.find((a) => a.id === SHAPE)
  return (
    <Part title="Кнопки" lede="Каждая форма — в тех заливках, которым она идёт: Outline — без заливки, тонкая кромка, Veil — вуаль чернил на полу, Fill — сплошная краска марки, Gradient — та же с переходом. У хвоста шевронов только Fill: его шевроны сами акцент. Наведите и нажмите. Какая стоит на сайте — помечено; сменить можно в панели Look.">
      {SHAPE_SETS.map(({ title, shapes: ids, fills, pill }) => (
        <div key={title} className={s.group}>
          <h3>{title}</h3>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            {ids.flatMap((id) => {
              const shape = shapes?.options.find((o) => o.id === id)
              return fills.map((fill) => (
                <li key={`${id}-${fill}`} className={s.btnStyle}>
                  <span className={s.famSample}>
                    <button className={b.btn} data-voice="loud" data-shape type="button" style={roles({ ...shapeRoles(cat, shape, fill), '--r-btn': pill ? 'var(--r-pop)' : 'var(--r-ctrl)' })}>
                      {WITH_CART.has(id) ? <><Icon id={CART[fill][0]} />Add</> : 'Смотреть товары'}
                    </button>
                  </span>
                  <span className={s.btnName}>{ids.length > 1 ? shape?.name : WITH_CART.has(id) ? `${FILL_NAME[fill]} · ${CART[fill][1]}` : FILL_NAME[fill]}</span>
                  <Worn on={onSite(names, id, fill, pill)} />
                </li>
              ))
            })}
          </ul>
        </div>
      ))}
    </Part>
  )
}

/** Вуаль под кружком со знаком — плашка на три ступени глубже тихой (`--plate-sign`, И675): белый кружок на тихой плашке читался 1.14 : 1, глазом — почти не виден. */
const underSign = (shape: Record<string, string>) => ('--ctrl-btn-fill-pop' in shape && shape['--ctrl-btn-fill-pop'] === 'var(--plate-quiet)' ? { ...shape, '--ctrl-btn-fill-pop': 'var(--plate-sign)' } : shape)

/** Плитка кнопки со знаком в кружке — кнопка сайта (CategoryButton), в красках образца: стандартная и крупная, столбиком. */
function CircleTile({ name, sign, shape, note, quiet }: { name: string; sign: string; shape?: Record<string, string>; note: string; quiet?: boolean }) {
  return (
    <li className={s.btnStyle}>
      <span className={`${s.famSample} ${s.famStack}`}>
        {([undefined, 'lg'] as const).map((size) => <CategoryButton key={size ?? 'md'} name={name} sign={sign} size={size} quiet={quiet} style={shape ? roles(underSign(shape)) : undefined} />)}
      </span>
      <span className={s.btnName}>{note}</span>
    </li>
  )
}

/* Эффекты — для чего берут (слово заказчика 01.10.2026): сон, расслабление,
   концентрация, бодрость; нейтрально, без лечебных обещаний. Где заказчик
   взял несколько знаков, плиток несколько. Эффект — не полка движка, имя и знак
   живут в данных магазина; здесь образец. */
const EFFECTS: [string, string, string][] = [
  ['Sleep', 'moon-star', 'Сон'], ['Relax', 'wind', 'Расслабление · дыхание'], ['Relax', 'waves', 'Расслабление · волны'],
  ['Focus', 'brain', 'Концентрация · мозг'], ['Focus', 'target', 'Концентрация · мишень'], ['Focus', 'lightbulb', 'Концентрация · лампочка'],
  ['Energy', 'zap', 'Бодрость'],
]
const CATEGORY_FILLS: Fill[] = ['veil', 'fill', 'gradient']
const EFFECT_FILLS: Fill[] = ['outline', 'veil', 'fill']
/* Пара — слово-действие и сердце «в избранное» встык (styles/btn.module.css,
   `.pair`; образец HyperUI «Button Groups → Main and Secondary», MIT; присланный
   образец 72). Слово заказчика 02.10.2026: «Add to cart» и избранное в одной
   кнопке; пробуем два вида — только слово и сердце, и корзина со словом и
   сердцем (две иконки в одной кнопке — глазами решать, не много ли). Краски —
   четыре заливки набора: у Outline и Veil тихий голос, у Fill и Gradient —
   главный; краски стиля — на обёртке пары. */
function PairTile({ cat, fill, cart }: { cat: ButtonAxis[]; fill: Fill; cart?: boolean }) {
  const loud = fill === 'fill' || fill === 'gradient'
  const own = (fill === 'outline' || fill === 'veil') ? optionOf(cat, 'quiet', fill) : optionOf(cat, 'loud', fill)
  return (
    <li className={s.btnStyle}>
      <span className={s.famSample}>
        <span className={b.pair} role="group" data-join={fill === 'outline' ? 'edge' : undefined} style={roles(own?.roles ?? {})}>
          <button className={b.btn} data-voice={loud ? 'loud' : undefined} type="button">{cart ? <Icon id="shopping-cart" /> : null}Add to cart</button>
          <SaveToggle id={`design-pair-${cart ? 'cart' : 'word'}-${fill}`} add="В избранное" remove="Убрать из избранного" part={loud ? 'loud' : 'quiet'} />
        </span>
      </span>
      <span className={s.btnName}>{FILL_NAME[fill]}</span>
    </li>
  )
}

/* Роли кнопок — первым на вкладке (бриф `docs/design/кнопки.md`, И790; слово заказчика
   08.10.2026: «сделай единый дизайн кнопок, мы по дизайн-системе делаем»). Каждая роль
   таблицы «место → роль» — настоящей кнопкой сайта: классы её модуля и компоненты
   сайта, без своих красок и угла на плитке — как стоит в магазине (опубликованный вид).
   Две формы — пилюля со словом и круг со знаком; что важнее, говорит одна заливка. */
type Role = { key: string; name: string; sample: ReactNode; stack?: boolean }
const RoleTile = ({ name, sample, stack }: Omit<Role, 'key'>) => (
  <li className={s.btnStyle}>
    <span className={stack ? `${s.famSample} ${s.famStack}` : s.famSample}>{sample}</span>
    <span className={s.btnName}>{name}</span>
  </li>
)
function roleList(lang: Lang, shelf: { name: string; sign: string } | undefined): Role[] {
  const shopAll = t(lang, 'nav.shopAll')
  return [
    { key: 'loud', name: 'Громкая — одна на область; крупная — последнее действие формы', stack: true, sample: <>
      <button className={b.btn} data-voice="loud" type="button">{t(lang, 'cart.add')}</button>
      <button className={b.btn} data-voice="loud" data-size="lg" type="button">{t(lang, 'cart.checkout')}</button>
    </> },
    { key: 'quiet', name: 'Тихая', sample: <button className={b.btn} type="button">{t(lang, 'cart.open')}</button> },
    { key: 'quiet-pop', name: 'Тихая · марка под рукой: листание полки и покупка с карточки', sample: <button className={b.btn} data-hand="pop" type="button">{t(lang, 'shelf.all')}<Icon id="arrow-right" /></button> },
    { key: 'pair', name: 'Пара: тихая и громкая', sample: <>
      <button className={b.btn} type="button">{t(lang, 'search.clear')}</button>
      <button className={b.btn} data-voice="loud" type="button">{showLabel(lang, 24)}</button>
    </> },
    { key: 'off', name: 'Выключенная', sample: <>
      <button className={b.btn} data-voice="loud" type="button" disabled>{t(lang, 'cart.add')}</button>
      <button className={b.btn} type="button" disabled>{t(lang, 'cart.open')}</button>
    </> },
    { key: 'bare', name: 'Без плиты', sample: <button className={b.btn} data-voice="bare" type="button"><Icon id="sliders-horizontal" />{t(lang, 'catalog.open')}</button> },
    { key: 'word', name: 'Слово', sample: <a className={b.word} href="#top">{t(lang, 'checkout.change')}</a> },
    { key: 'bad', name: 'Слово · удалить', sample: <button className={`${b.word} ${p.tap}`} data-hand="bad" type="button">{t(lang, 'cart.remove')}</button> },
    { key: 'go', name: 'Куда ведёт: вперёд и назад', stack: true, sample: <>
      <a className={go.go} href="#top">{t(lang, 'blog.read')}<Icon id="arrow-right" /></a>
      <a className={go.go} data-to="back" href="#top"><Icon id="arrow-left" />{t(lang, 'blog.back')}</a>
    </> },
    /* Кнопка-знак — настоящее листание полки (`Pagination`): стрелки, номер, текущий. */
    { key: 'sign', name: 'Кнопка-знак: стрелка, номер, текущий', sample: <div className={s.pagerSample}><Pagination pages={PAGES} /></div> },
    { key: 'chip', name: 'Фишка с крестиком', sample: <a className={p.chip} data-pill="" href="#top">10 %<Icon id="x" /></a> },
    { key: 'cat', name: 'Кнопка категории: «Shop all» и тихая', stack: true, sample: <>
      <CategoryButton name={shopAll} sign="shop-awning" />
      {shelf ? <CategoryButton quiet name={shelf.name} sign={shelf.sign} /> : null}
    </> },
  ]
}

export async function ButtonList({ lang }: { lang: Lang }) {
  const { names } = await lookNow()
  const cat = buttonCatalog()
  const circle = cat.find((a) => a.id === SHAPE)?.options.find((o) => o.id === 'circle')
  const shelves = await source().collections(lang)
  const picture = (shelves.ok ? shelves.value : []).find((c) => c.image)?.image
  /* «В магазин» стоит в ряду категорий первой — выход ко всему товару, как «Все товары» в меню шапки; слово — из словаря языка, знак — навес из листа. */
  const categories = [
    { key: 'shop', name: t(lang, 'nav.shop'), sign: 'shop-awning' },
    ...(shelves.ok ? shelves.value : []).flatMap((c) => {
      const sign = c.sign
      return sign ? [{ key: c.slug, name: c.name.charAt(0).toUpperCase() + c.name.slice(1), sign }] : []
    }),
  ]
  return (
    <>
      <Part title="Роли кнопок" lede="Каждая роль — настоящей кнопкой сайта, как она стоит в магазине. У кнопки две формы: пилюля, если на ней слово, и круг, если на ней только знак; что важнее, говорит заливка — громкая одна на область. Наведите и нажмите.">
        <ul className={`${p.grid} ${s.btnStyles}`}>
          {roleList(lang, categories[1]).map(({ key, ...r }) => <RoleTile key={key} {...r} />)}
          <li className={s.btnStyle}>
            <span className={s.famSample}>
              <div className={s.dockSample}>
                <HelpDock bare rows={reachRows({ phone: t(lang, 'reach.phone'), email: t(lang, 'reach.email') })} who={{ name: SUPPORT.name, href: supportHref() }} words={{ open: t(lang, 'reach.menu'), online: t(lang, 'reach.online'), top: t(lang, 'reach.top') }} />
              </div>
            </span>
            <span className={s.btnName}>Висящая кнопка-знак: связь и «Наверх»</span>
          </li>
        </ul>
      </Part>
      <ShapeSets cat={cat} names={names} />
      <Part title="Кнопки категорий" lede="Категория — это товар, поэтому в кружке иконка товара вместо стрелки; кружок под ней — цвета пола, знак — чернилами. Кнопка — «Кружок со стрелкой»; у каждой категории два роста: стандартная и крупная. Первой стоит «В магазин» — выход ко всему товару. На сайте залита маркой одна «Shop all», полки — тихие, как все тихие кнопки; заливки на выбор — Veil, Fill, Gradient.">
        {CATEGORY_FILLS.map((fill) => (
          <div key={fill} className={s.group}>
            <h3>{FILL_NAME[fill]}</h3>
            <ul className={`${p.grid} ${s.btnStyles}`}>
              {categories.map(({ key, name, sign }) => <CircleTile key={key} name={name} sign={sign} shape={shapeRoles(cat, circle, fill)} note={key === 'shop' ? 'В магазин' : 'Стандартная и крупная'} />)}
            </ul>
          </div>
        ))}
        {/* Тихая — настоящая кнопка сайта, без своих красок: стоит в ряду героя и в пустой корзине рядом с одной яркой (И746, поправка 08.10.2026). */}
        <div className={s.group}>
          <h3>Тихая — рядом с яркой «Shop all»</h3>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            {categories.filter(({ key }) => key !== 'shop').map(({ key, name, sign }) => <CircleTile key={key} name={name} sign={sign} quiet note="Как все тихие кнопки сайта · ряд героя и пустая корзина" />)}
          </ul>
        </div>
      </Part>
      <Part title="Кнопки эффектов" lede="Для чего берут: сон, расслабление, концентрация, бодрость — нейтрально, без лечебных обещаний. Та же кнопка «Кружок со стрелкой» с иконкой эффекта. Это тихий выбор рядом друг с другом, а не главные действия: Outline, Veil, Fill; градиента нет — семь градиентных кнопок в ряд только шумят.">
        {EFFECT_FILLS.map((fill) => (
          <div key={fill} className={s.group}>
            <h3>{FILL_NAME[fill]}</h3>
            <ul className={`${p.grid} ${s.btnStyles}`}>
              {EFFECTS.map(([name, sign, note]) => <CircleTile key={sign} name={name} sign={sign} shape={shapeRoles(cat, circle, fill)} note={note} />)}
            </ul>
          </div>
        ))}
      </Part>
      <Part title="Кнопки и стрелки листания" lede="Круглые кнопки листания стилями каталога — стрелки и уголок, статичные. Наведите и нажмите.">
        <PagerStyles all={t(lang, 'shelf.all')} />
      </Part>
      <Part title="Слайдер" lede="Иконка слайдера — указатель сайта: точки и ползунок. Нажмите точку — ползунок перетечёт к ней.">
        <ul className={`${p.grid} ${s.btnStyles}`}>
          <li className={s.btnStyle}>
            <span className={s.famSample}><SliderIcon /></span>
            <span className={s.btnName}>Иконка слайдера: точки</span>
          </li>
        </ul>
      </Part>
      <Part title="Кнопки еще" lede="Счётчик количества — «−», число и «+» — один на сайте: на странице товара и в строке корзины — жёлоб, одетый как тихая кнопка; ниже его виды, которые носят в магазинах; рядом — выбор крепости и объёма со страницы товара и сердце «в избранное». Угол у всех — как у остальных органов, из панели Look, Shape. Раскрывашка — кнопка со стрелкой, которая поворачивается, когда список открыт. Под полкой каталога и поиска — «Показать ещё» и номера страниц: кнопка дописывает следующие товары под показанными, номера переводят на страницу; всё круглое и пилюлей, как остальные кнопки. Какой вид стоит на сайте — помечено; сменить можно в панели Look → Card → Show more and pages. Наведите и нажмите.">
        {/* Один тип кнопок — одна строка, без подзаголовков (слово заказчика 02.10.2026): порядок строк заказчик расставит сам. */}
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`} data-row="">
            {PAGER_LOOKS.map(([look, name]) => (
              <li key={look} className={s.btnStyle}>
                <span className={s.famSample}><div className={s.pagerSample} style={cssVar('--pager-look', look)}><Pagination pages={PAGES} /></div></span>
                <span className={s.btnName}>{name}</span>
                <Worn on={look === (names['pager-look'] ?? 'rings')} />
              </li>
            ))}
            <li className={s.btnStyle}>
              <span className={s.famSample}><div className={s.pagerSample} style={cssVar('--pager-look', names['pager-look'] ?? 'rings')}><Pagination pages={PAGES_FEW} /></div></span>
              <span className={s.btnName}>Листание: две страницы — два круга</span>
            </li>
          </ul>
        </div>
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            {COUNTERS.map(([look, name]) => (
              <li key={name} className={s.btnStyle}>
                <span className={s.famSample}><QuantityStepper look={look} field={{ label: 'Количество', name: undefined, min: 1, max: 9, initial: 2, less: 'Меньше', more: 'Больше' }} /></span>
                <span className={s.btnName}>{name}</span>
                <Worn on={look === SITE_LOOK} where="на странице товара и в корзине" />
              </li>
            ))}
          </ul>
        </div>
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            {SEGMENTS.map(([look, name]) => (
              <li key={look} className={s.btnStyle}>
                <span className={s.famSample}><div className={product.choice} style={cssVar('--seg-look', look)}><VariantPicker groups={OPTIONS} error={null} /></div></span>
                <span className={s.btnName}>{name}</span>
                <Worn on={look === (names['seg-look'] ?? 'chips')} />
              </li>
            ))}
          </ul>
        </div>
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            {SAVES.map(([sign, name]) => (
              <li key={name} className={s.btnStyle}>
                <span className={s.famSample}><SaveToggle id={`design-${name}`} sign={sign} add="В избранное" remove="Убрать из избранного" /></span>
                <span className={s.btnName}>{name}</span>
              </li>
            ))}
            {HEART_LOOKS.map(([look, name]) => (
              <li key={look} className={s.btnStyle}>
                <span className={s.famSample}>
                  <div className={`${p.frame} ${s.heartShot}`} style={cssVar('--save-look', look)}>
                    {picture ? <img {...shot(picture, 'shelf', true)} alt="" decoding="async" /> : null}
                    <span className={p.cut}>−17 %</span>
                    <SaveToggle id={`design-heart-shot-${look}`} add="В избранное" remove="Убрать из избранного" over="picture" />
                  </div>
                </span>
                <span className={s.btnName}>{name}</span>
                <Worn on={look === (names['save-look'] ?? 'disc')} />
              </li>
            ))}
          </ul>
        </div>
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            <li className={s.btnStyle}>
              <span className={s.famSample}><button className={b.btn} data-voice="bare" type="button" aria-expanded="false">Эффект<Turn /></button></span>
              <span className={s.btnName}>Раскрывает список</span>
            </li>
          </ul>
        </div>
        {/* Слово без подложки (И740, И671): у кнопки нет плиты и кромки — только
            слово и знак, тихое → полное под рукой; так стоят «Фильтры» и порядок
            над полкой (Allbirds, Gymshark) и ссылки подвала; низ корзины —
            пара тихой и громкой (И772). Образцы — настоящие классы сайта. */}
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            <li className={s.btnStyle}>
              <span className={s.famSample}><button className={b.btn} data-voice="bare" type="button"><Icon id="sliders-horizontal" />Фильтры · 85 товаров</button></span>
              <span className={s.btnName}>Слово: фильтр над полкой</span>
              <Worn on />
            </li>
            <li className={s.btnStyle}>
              <span className={s.famSample}><button className={b.btn} data-voice="bare" type="button"><Icon id="list-filter" />Сначала дешёвые</button></span>
              <span className={s.btnName}>Слово: порядок полки</span>
              <Worn on />
            </li>
          </ul>
        </div>
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            {FOUR.map((fill) => <PairTile key={fill} cat={cat} fill={fill} />)}
          </ul>
        </div>
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`}>
            {FOUR.map((fill) => <PairTile key={fill} cat={cat} fill={fill} cart />)}
          </ul>
        </div>
      </Part>
      <Part title="Образцы, ещё не в наборе" lede="Кнопки из присланных образцов, которые пока не стали вариантом набора: наведите и нажмите.">
        <ul className={`${p.grid} ${s.btnStyles}`}>
          <ElementTiles only="button" />
        </ul>
      </Part>
    </>
  )
}

/** Вкладка «Кнопки дополнительное» — стили кнопки из каталога панели Look. */
export async function Buttons() {
  const { names } = await lookNow()
  const axes = buttonCatalog().filter((a) => a.id !== SHAPE)
  return (
    <>
      {axes.map((axis) => <Styles key={axis.id} axis={axis} worn={names[`btn-${axis.id}`] ?? axis.options[0]?.id} />)}
    </>
  )
}
