import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import m from '@/styles/menu.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import h from '@/components/Header.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { Card } from '@/lib/source/contract.ts'
import { source } from '@/lib/source/index.ts'
import { shelfCard } from '@/lib/view.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { ProductCard } from '@/components/ProductCard.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Turn } from '@/components/Turn.tsx'
import { Part, States, Worn, type Hand } from './parts.tsx'
import s from './design.module.css'
import x from './hand.module.css'

/* Наведение и нажатие — один источник правды, как цвет и типографика (И718,
   И720, И722; слово заказчика 04.10.2026: «все возможные варианты наведения
   и нажатия разместить в дизайн-системе как пример, а не текущие варианты
   сайта»; «110 эффектов чрезмерно, давай десяток основных современных»).
   Первая часть — как отвечает эта витрина: настоящие предметы сайта по виду
   (правило И685), у каждого — роли. Вторая — библиотека: десять основных
   современных способов наведения и два нажатия, образцами, без оценки; метка
   «на сайте» — у того, что носит эта витрина. Образцы библиотеки — только
   этой страницы (hand.module.css); выбора здесь нет. */

type Kind = { code: string; name: string; sample: ReactNode; hand: Hand }
/** Способ: id — `data-fx` образца, имя, что видно, на каком предмете
 *  показан, где стоит на сайте. */
type Fx = [id: string, name: string, line: string, form: 'word' | 'pill' | 'icon' | 'card', worn?: string]

const ROW_WORDS = ['Oil', 'Capsules', 'Cosmetics']

const KINDS = (card: ReactNode): Kind[] => [
  { code: 'word', name: 'Слово и знак без плашки', sample: <><a className={b.word} href="#hand">All products</a><a className={h.glyph} href="#hand" aria-label="Favourites"><Icon id="heart" /></a></>,
    hand: { what: 'Подвал, «Удалить», «Изменить», «Открыть корзину», знаки действия шапки (корзина, сердце, лупа).', rest: 'тихая краска --ink-dim', hover: 'полная --ink', press: 'полная и движение нажатия --press-move' } },
  /* Пункт меню (И745): то же слово и знак, но без движения нажатия — меню, а не кнопка. */
  { code: 'menu', name: 'Пункт меню', sample: <><a className={b.word} data-hand="menu" href="#hand">Capsules</a><a className={b.word} data-hand="menu" href="#hand">About us</a><button className={h.glyph} data-hand="menu" type="button">EN<Turn /></button></>,
    hand: { what: 'Полки шапки и шторки, «Ещё», стрелки подменю, верхняя строка, «EN ▾», день / ночь.', rest: 'тихая краска --ink-dim', hover: 'полная --ink', press: 'полная --ink, без движения нажатия' } },
  { code: 'press', name: 'Плашка: кнопка, фишка, сегмент, счётчик', sample: <><button className={b.btn} data-voice="loud" type="button">Add to cart</button><button className={b.btn} type="button">Quick order</button><a className={p.chip} href="#hand">Oil</a></>,
    hand: { what: 'Вуаль чернил поверх своей заливки — одна доля у всех.', rest: 'своя заливка', hover: 'вуаль --state-hover', press: 'вуаль --state-press и --press-move' } },
  { code: 'row', name: 'Строка списка в меню и окне', sample: <div className={`${p.menu} ${x.paper}`}><ul className={m.list}>{ROW_WORDS.map((w) => <li key={w}><a className={b.row} href="#hand">{w}</a></li>)}</ul></div>,
    hand: { what: 'Подменю, языки, порядок полки, полки в поиске.', rest: 'без подложки', hover: 'подложка строки --hover-row прямоугольником --r-ctrl', press: 'глубже --press-row' } },
  { code: 'card', name: 'Карточка и кадр', sample: card,
    hand: { what: 'Карточка товара, плитки, строка корзины в шторке.', rest: 'кромка дизайна карточки', hover: 'кромка руки --edge-hand, снимок подаётся --creep', press: 'переход' } },
  { code: 'go', name: 'Ссылка со стрелкой', sample: <a className={go.go} href="#hand">View all<Icon id="arrow-right" /></a>,
    hand: { what: '«Смотреть всё», «назад» крошек, шаг пустой полки.', rest: 'слово и стрелка', hover: 'стрелка сдвигается --nudge', press: 'полная краска' } },
  { code: 'prose', name: 'Ссылка в тексте', sample: <p className={`${p.prose} ${x.prose}`}>Delivery in 2–4 days, see the <a href="#hand">shipping terms</a>.</p>,
    hand: { what: 'Единственное место, где есть подчёркивание: ссылка внутри абзаца.', rest: 'подчёркнутая краска марки --pop-ink', hover: 'темнее --pop-ink-hover', press: 'темнее' } },
  { code: 'chosen', name: 'Выбранное', sample: <div className={p.seg}><a href="#hand" aria-current="true">10%</a><a href="#hand">20%</a><a href="#hand">30%</a></div>,
    hand: { what: 'Вариант товара, текущая страница листания.', rest: 'заливка выбранного --chosen и --on-chosen', hover: 'не меняется: выбор стоит', press: 'не меняется' } },
  { code: 'current', name: 'Текущее место', sample: <div className={`${p.menu} ${h.dropPanel} ${x.open}`}><ul className={m.list}><li><a className={b.row} href="#hand">Oil</a></li><li><a className={b.row} href="#hand" aria-current="true">Capsules</a></li></ul></div>,
    hand: { what: 'Раздел в шапке, полка в шторке и подменю, знак своей страницы.', rest: 'в шапке — полное слово и черта --pop (вид --nav-current); в раскрытии — галочка в конце строки', hover: 'как у строки', press: 'как у строки' } },
  { code: 'focus', name: 'Фокус с клавиатуры', sample: <button className={b.btn} type="button">Нажмите Tab</button>,
    hand: { what: 'Любой орган, до которого дошли клавишей Tab.', rest: 'без кольца', hover: 'без кольца', press: 'кольцо --ring толщиной --ring-w с отступом --ring-off' } },
  { code: 'off', name: 'Выключенное', sample: <button className={b.btn} type="button" disabled>Sold out</button>,
    hand: { what: 'Орган, который нельзя нажать; рядом — слово почему.', rest: 'прозрачность --state-off', hover: 'не отвечает', press: 'не отвечает' } },
]

/* Библиотека — десяток основных современных способов наведения и два нажатия
   (слово заказчика 04.10.2026: «110 эффектов чрезмерно, давай десяток
   основных современных»). Отбор — то, что держат дизайн-системы и торговые
   сайты сегодня: Material 3 (вуаль состояния, рябь), Apple HIG (подсветка,
   подъём), карточки магазинов (снимок подаётся, второй снимок); анимации
   Hover.css (качание, жужжание, выноски, въезжающие заливки) — не взяты:
   «дикие анимации не применяют, такие не бери» (заказчик). */
const WAYS: Fx[] = [
  ['tint', 'Оттенок', 'тихое слово становится полным', 'word', 'на сайте: слова и знаки'],
  ['veil', 'Вуаль', 'на заливку ложится вуаль чернил (Material 3)', 'pill', 'на сайте: кнопки, фишки'],
  ['plate', 'Подложка', 'под словом проступает плашка', 'word', 'на сайте: строки списков'],
  ['underline', 'Растущая черта', 'черта вырастает под словом слева направо', 'word'],
  ['edge', 'Кромка', 'проступает кромка', 'pill', 'на сайте: карточки'],
  ['nudge', 'Сдвиг стрелки', 'стрелка уезжает в сторону хода', 'icon', 'на сайте: ссылка со стрелкой'],
  ['lift', 'Подъём', 'предмет приподнимается, тень растёт (Apple)', 'card', 'на сайте: карточка «лист»'],
  ['zoom', 'Снимок подаётся', 'снимок чуть увеличивается в кадре', 'card', 'на сайте: карточки'],
  ['shadow', 'Тень', 'под карточкой проступает тень, без движения (Material 3)', 'card'],
  ['second', 'Второй снимок', 'вместо первого снимка товара — второй (Gymshark)', 'card'],
]
const PRESSES: Fx[] = [
  ['press', 'Вдавливание', 'чуть опускается и сжимается', 'pill', 'на сайте: все органы'],
  ['ripple', 'Рябь', 'от места нажатия расходится круг (Material 3)', 'pill'],
]

const sample = ([id, , , form]: Fx): ReactNode => {
  const fx = { className: x.fx, 'data-form': form, 'data-fx': id }
  if (form === 'icon') return <a {...fx} href="#hand">View all<Icon id="arrow-right" /></a>
  if (form === 'card') return (
    <a {...fx} href="#hand">
      <span className={x.pic} aria-hidden="true"><Icon id="droplet" /><Icon id="droplet-fill" /></span>
      <span>10% CBD Oil</span>
    </a>
  )
  return <a {...fx} href="#hand">{form === 'word' ? 'Capsules' : 'Quick order'}</a>
}

const Shelf = ({ ways }: { ways: Fx[] }) => (
  <ul className={`${p.grid} ${s.btnStyles}`}>
    {ways.map((w) => (
      <li key={w[0]} className={s.btnStyle}>
        <span className={s.famSample}>{sample(w)}</span>
        <span className={s.btnName}>{w[1]}</span>
        <span className={p.note}>{w[2]}</span>
        <code>{w[0]}</code>
        <Worn on={Boolean(w[4])} where={w[4]} />
      </li>
    ))}
  </ul>
)

export async function HandStates({ lang }: { lang: Lang }) {
  const r = await source().listing(lang, { facets: {}, sort: 'popular', page: null })
  const one: Card | undefined = r.ok ? r.value.items[0] : undefined
  const card = one ? <div className={x.card}><ProductCard card={shelfCard(lang, one)} cart={{ submit: cartSubmit, call: cartCall }} eager sample /></div> : null
  return (
    <>
      <Part title="Как отвечает эта витрина" lede="Ответ зависит от вида предмета, а не от места: одинаковое отвечает одинаково на всех страницах. Образцы — сами предметы сайта; наведите и нажмите.">
        <ul id="hand" className={`${p.grid} ${s.btnStyles}`} data-wide>
          {KINDS(card).filter((k) => k.code !== 'card' || card).map((k) => (
            <li key={k.code} className={s.btnStyle}>
              <span className={s.famSample}>{k.sample}</span>
              <span className={s.btnName}>{k.name}</span>
              <States {...k.hand} />
              <code>{k.code}</code>
            </li>
          ))}
        </ul>
      </Part>
      <Part title="Библиотека: наведение" lede="Десять основных современных способов — образцами, для этой и будущих витрин. Наведите. Метка «на сайте» — у того, что носит эта витрина.">
        <Shelf ways={WAYS} />
      </Part>
      <Part title="Библиотека: нажатие" lede="Что делает предмет в миг нажатия. Нажмите.">
        <Shelf ways={PRESSES} />
      </Part>
    </>
  )
}
