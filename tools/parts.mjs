/**
 * Части магазина: какой файл какую часть делает, где эта часть видна и
 * нужна ли ей проверка нажатием (И765).
 *
 * Заведено по слову заказчика 05.10.2026: «нужно, чтоб и при производстве,
 * делании любой части магазина типа меню, страницы и других проверки
 * проверяли, корректировали и делали результат правильный». До того после
 * правки сами шли только проверки по файлам (`hook-after-edit.mjs`):
 * отрисованная страница и нажатие ждали сдачи или ночи, и «Added · 5» в две
 * строки на телефоне дошло до заказчика, а не до проверки.
 *
 * Здесь — карта и память правок; гоняет её `tools/check-part.mjs`, правки
 * записывает хук правки, требует проверки — хук конца работы
 * (`hook-on-stop.mjs`). Пути — от корня магазина: в наборе
 * шаблон `templates/storefront/` снимается с пути, стили набора (`styles/`)
 * едут в магазин тем же путём.
 *
 * Виды страниц — по адресу, соглашением набора (`catalog`, `product`,
 * `cart` …): у магазина на другом дереве свой адрес дописывается в KINDS.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Вид страницы → какой адрес его показывает (адрес без языка). */
export const KINDS = {
  home: /^\/?$/,
  shelf: /^\/catalog\/[^/]+$/,
  product: /^\/product\/[^/]+$/,
  cart: /^\/cart$/,
  checkout: /^\/checkout\/[^/]+$/,
  blog: /^\/blog(\/[^/]+)?$/,
  info: /^\/info\/[^/]+$/,
  search: /^\/search$/,
  /* Кабинет (И771): вход гостя на `/account`, остальное — под ним. */
  account: /^\/account(\/[^/]+)?$/,
}

/** Части. Порядок — от частного к общему: файл берёт первую подошедшую.
 *  `press` — часть с кнопкой «в корзину» или счётчиком: её меряют и нажатием. */
export const PARTS = [
  { name: 'шапка, меню и подвал', files: /^components\/(Header|NavLinks|MenuFoot|SavedLink|AccountLink|CartLink|CartPane|PaneHead|Search|Footer|Lang|Theme|Help|Reach)/, kinds: ['home', 'shelf', 'product'] },
  { name: 'карточка товара и «в корзину»', files: /^(components\/(ProductCard|AddLabel|CartForm|Price|SaveToggle)|lib\/(in-cart|view)\.ts$)/, kinds: ['shelf', 'home'], press: true },
  { name: 'полка, фильтр и листание', files: /^(components\/(Catalog|Shelf|Rail|LiveFilter|Filter|Pager|Facet)|app\/\[lang\]\/catalog\/)/, kinds: ['shelf'], press: true },
  { name: 'страница товара', files: /^(components\/(ProductView|AddToCart|QuantityStepper|QuickOrder|StickyBuy|Gallery|Review|StockMark)|lib\/product-view\.ts$|app\/\[lang\]\/product\/)/, kinds: ['product'], press: true },
  { name: 'корзина', files: /^(components\/(Cart|OrderTotals|GoalMeter|Coupon)|lib\/cart-[\w-]+\.ts$|app\/\[lang\]\/cart\/)/, kinds: ['cart', 'shelf'], press: true },
  { name: 'оформление заказа', files: /^(components\/Checkout|app\/\[lang\]\/checkout\/)/, kinds: ['checkout'] },
  { name: 'кабинет покупателя', files: /^(components\/(Account\.module|AuthForm|AuthPage|Cabinet|OrderPage|AddressBook|AddressEdit|PasswordBox)|lib\/account-[\w-]+\.ts$|app\/\[lang\]\/account\/)/, kinds: ['account'] },
  { name: 'блог', files: /^(components\/(Post|Blog)|app\/\[lang\]\/blog\/)/, kinds: ['blog'] },
  { name: 'страницы документов', files: /^(components\/(Doc|Prose)|app\/\[lang\]\/info\/)/, kinds: ['info'] },
  { name: 'поиск', files: /^(components\/Search|app\/\[lang\]\/search\/)/, kinds: ['search'] },
  { name: 'главная', files: /^(components\/(Hero|Home|Category|Effect)|app\/\[lang\]\/page\.tsx$)/, kinds: ['home'] },
  /* Общее: модуль кнопок и примитивы стоят везде, где есть органы и
     раскладка, — главная, полка, товар, и нажатием. */
  { name: 'кнопки и раскладка всего сайта', files: /^styles\/(btn|primitives|form|pane)\.module\.css$/, kinds: ['home', 'shelf', 'product'], press: true },
  { name: 'вид всего сайта', files: /^(styles\/|app\/\[lang\]\/layout\.tsx$|app\/globals\.css$)/, kinds: ['home', 'shelf', 'product'] },
  { name: 'прочее на сайте', files: /^(components|app|lib)\//, kinds: ['home', 'shelf', 'product'] },
]

/** Путь правки → путь от корня магазина; не сайт — null. */
export function shopPath(rel) {
  const path = rel.split('\\').join('/').replace(/^templates\/storefront\//, '')
  if (!/\.(css|tsx|ts|jsx)$/.test(path) || /\.test\.|^tests?\/|^tools\/|^look-panel\//.test(path)) return null
  return /^(components|app|lib|styles)\//.test(path) ? path : null
}

/** Какие части тронуты: имя, виды страниц, нужно ли нажатие, файлы. */
export function partsOf(files) {
  const out = new Map()
  for (const file of files) {
    const path = shopPath(file)
    if (!path) continue
    const part = PARTS.find((p) => p.files.test(path))
    if (!part) continue
    const seen = out.get(part.name) ?? { ...part, touched: [] }
    seen.touched.push(path)
    out.set(part.name, seen)
  }
  return [...out.values()]
}

/* Память правок — своя у каждой сессии (в одном дереве работают несколько, и
   чужая правка не должна держать мою работу), во временной папке машины, а не
   в репозитории. `edits` — путь → когда правлен, `checkedAt` — когда прошла
   проверка части, `result` — чем кончилась. */
const STATE = join(tmpdir(), 'site-parts')
const stateFile = (session) => join(STATE, `${String(session).replace(/[^\w-]/g, '')}.json`)
export function stateOf(session) {
  try { return JSON.parse(readFileSync(stateFile(session), 'utf8')) } catch { return { edits: {}, checkedAt: 0, result: null } }
}
function save(session, state) {
  try { mkdirSync(STATE, { recursive: true }); writeFileSync(stateFile(session), JSON.stringify(state, null, 1)) } catch { /* память — подсказка, не замок */ }
}
export function noteEdit(session, rel) {
  if (!session || !shopPath(rel)) return
  const state = stateOf(session)
  state.edits[rel.split('\\').join('/')] = Date.now()
  save(session, state)
}
/** Правки после последней проверки части. */
export const pendingOf = (session) => {
  const state = stateOf(session)
  return Object.entries(state.edits).filter(([, at]) => at > state.checkedAt).map(([file]) => file)
}
export function noteChecked(session, result) {
  if (!session) return
  save(session, { ...stateOf(session), checkedAt: Date.now(), result })
}
