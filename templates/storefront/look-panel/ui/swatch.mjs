/* Образец палитры — кусок магазина красками набора, ОДИН рисунок на
   развёрнутую панель (look.js, `big('palette')`) и на страницу
   дизайн-системы (design/PaletteStudio.tsx). Слово заказчика 29.09.2026: «на
   расширенной версии пусть показывает полноценно палитру… карточки плюс
   кнопку какую-то и панель, чтоб всесторонне можно было оценить палитру»
   (И575). Что в нём и зачем:
     шапка       тёмная полоса: знак, пункты, корзина с числом краской марки
     карточка    снимок со скидкой, звёзды, имя, подпись, наличие, цена с
                 прежней, главная и тихая кнопки — всё, что покупатель читает
     корзина     лист над страницей: строка, итог, поле кода, «оформить»
                 главной кнопкой, ссылка краской марки
     сигналы     наличие, «мало осталось», ошибка, сведение — плашками
     подвал      тёмная полоса и тихий текст на ней
   Краски — `tileOf` каталога (choice.mjs), обе темы парой light-dark: образец
   показывает ту тему, что включена. Стили — look.css (`lp-sw-*`). */

const ld = (t, k) => `light-dark(${t.light[k]}, ${t.dark[k]})`

function el(tag, cls, style, kids) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (style) n.setAttribute('style', style)
  for (const k of kids ?? []) n.append(k)
  return n
}

/** Образец набора по его краскам (`tileOf`). */
export function paletteSample(t) {
  const c = (k) => ld(t, k)
  const btn = (text, bg, ink) => el('span', 'lp-sw-btn', `background:${c(bg)};color:${c(ink)}`, [text])
  const pill = (text, ink, bg) => el('span', 'lp-sw-pill', `background:${c(bg)};color:${c(ink)}`, [text])
  const band = el('span', 'lp-sw-band', `background:${c('deck')};color:${c('onDeck')}`, [
    el('b', '', '', ['CBDin']),
    el('span', 'lp-sw-links', `color:${c('deckSoft')}`, ['Oils', 'Capsules', 'Cosmetics'].map((x) => el('span', '', '', [x]))),
    el('span', 'lp-sw-cart', '', ['Cart', el('i', '', `background:${c('pop')};color:${c('onPop')}`, ['2'])]),
  ])
  const card = el('span', 'lp-sw-card', `background:${c('plate')};color:${c('ink')};box-shadow:0 0 0 1px ${c('rule')}`, [
    el('span', 'lp-sw-pic', `background:${c('pic')}`, [el('b', '', `background:${c('sale')};color:${c('onSale')}`, ['−20%'])]),
    el('span', 'lp-sw-stars', `color:${c('star')}`, ['★★★★★', el('small', '', `color:${c('soft')}`, [' 4.8 (28)'])]),
    el('b', 'lp-sw-name', '', ['Full-spectrum CBD oil 10%']),
    el('small', '', `color:${c('soft')}`, ['10 ml · 1000 mg · €4.59 / ml']),
    el('small', '', `color:${c('ok')}`, ['In stock']),
    el('span', 'lp-sw-price', '', [el('b', '', '', ['€45.90']), el('s', '', `color:${c('soft')}`, ['€57.40'])]),
    el('span', 'lp-sw-row', '', [btn('Add to cart', 'pop', 'onPop'), btn('Details', 'quiet', 'ink')]),
  ])
  const sheet = el('span', 'lp-sw-sheet', `background:${c('plate')};color:${c('ink')};box-shadow:0 0 0 1px ${c('rule')}`, [
    el('b', 'lp-sw-head', '', ['Your cart']),
    el('span', 'lp-sw-line', `border-color:${c('rule')}`, [el('span', '', '', ['CBD oil 10% × 2']), el('b', '', '', ['€91.80'])]),
    el('span', 'lp-sw-line', `border-color:${c('rule')}`, [el('span', '', `color:${c('soft')}`, ['Delivery']), el('span', '', `color:${c('ok')}`, ['Free'])]),
    el('span', 'lp-sw-field', `background:${c('field')};border-color:${c('edge')};color:${c('soft')}`, ['Discount code']),
    btn('Checkout', 'pop', 'onPop'),
    el('span', 'lp-sw-link', `color:${c('popInk')}`, ['Continue shopping →']),
  ])
  const signals = el('span', 'lp-sw-signals', '', [
    pill('In stock', 'ok', 'okTint'), pill('Only 2 left', 'warn', 'warnTint'), pill('Payment failed', 'err', 'errTint'), pill('Free delivery', 'info', 'infoTint'),
  ])
  return el('span', 'lp-sw', `background:${c('page')};color:${c('ink')}`, [band, el('span', 'lp-sw-body', '', [card, sheet]), signals])
}
