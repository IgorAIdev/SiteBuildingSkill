import test from 'node:test'
import assert from 'node:assert/strict'
import { installPaneSwipe } from '../templates/storefront/public/pane-swipe.js'

function fixture(kind = 'start', rtl = false) {
  const events = new Map(), props = new Map()
  class Element {
    constructor() { this.dataset = {}; this.style = { removeProperty: k => props.delete(k), setProperty: (k, v) => props.set(k, v) }; this.open = true; this.offsetWidth = 300; this.offsetHeight = 600; this.scrollTop = 0; this.scrollHeight = 600; this.clientHeight = 600 }
    closest(selector) { return ['input, textarea, select', '[data-pane-grip]'].includes(selector) ? null : this }
    matches(selector) { return selector === '[data-pane]' || this.open }
    hidePopover() { this.open = false }
    addEventListener() {}
    removeEventListener() {}
  }
  globalThis.Element = globalThis.HTMLElement = Element
  globalThis.HTMLDialogElement = class extends Element { close() { this.open = false } }
  globalThis.getComputedStyle = () => ({ direction: rtl ? 'rtl' : 'ltr', getPropertyValue: () => '1', transitionDuration: '0' })
  globalThis.requestAnimationFrame = fn => fn()
  const el = new Element(); el.dataset.pane = kind
  globalThis.document = { addEventListener: (k, f) => events.set(k, f), removeEventListener: k => events.delete(k), querySelectorAll: sel => (sel.includes('data-pane="start"') && ['start', 'end'].includes(el.dataset.pane) ? [el] : []) }
  const dispose = installPaneSwipe()
  const fire = (type, x, y, time = 1000, target = el, cancelable = true) => events.get(type)?.({ target, cancelable, touches: [{clientX:x,clientY:y}], timeStamp: time, preventDefault() {} })
  /* Страница рядом со шторкой: элемент вне любого окна. */
  const page = new Element(); page.closest = () => null
  return {el, events, dispose, fire, props, page}
}

for (const [kind, rtl, x, y] of [['start',false,-150,0],['end',false,150,0],['start',true,150,0],['dialog',false,0,250],['top',false,0,-250]]) {
  test(`${kind}, rtl=${rtl}: drag follows finger then closes`, () => {
    const f = fixture(kind, rtl)
    f.fire('touchstart',0,0,0); f.fire('touchmove',x,y)
    assert.notEqual(f.el.style.translate, undefined)
    f.fire('touchend',x,y,2000); assert.equal(f.el.open,false); f.dispose()
  })
}
test('short drag returns; vertical scrolling does not dismiss a side sheet', () => {
  for (const [x,y] of [[-15,0],[0,150]]) {
    const f=fixture(); f.fire('touchstart',0,0,0); f.fire('touchmove',x,y); f.fire('touchend',x,y,2000)
    assert.equal(f.el.open,true); f.dispose()
  }
})
test('cancelled gesture never dismisses, even beyond the threshold', () => {
  const f=fixture(); f.fire('touchstart',0,0,0); f.fire('touchmove',-180,0); f.fire('touchcancel',-180,0)
  assert.equal(f.el.open,true); assert.equal(f.props.has('--pull'),false); f.dispose(); assert.equal(f.events.size,0)
})
test('bottom sheet preserves a scrolled body', () => {
  const f=fixture('dialog'); f.el.scrollTop=100
  f.fire('touchstart',0,0,0); f.fire('touchmove',0,300); f.fire('touchend',0,300,2000)
  assert.equal(f.el.open,true); f.dispose()
})

test('top sheet keeps result scrolling but its handle always permits dismissal', () => {
  for (const handle of [false, true]) {
    const f=fixture('top'); f.el.scrollHeight=1200;
    const closest=f.el.closest.bind(f.el);
    f.el.closest=selector => selector === '[data-pane-grip]' ? (handle ? f.el : null) : closest(selector);
    f.fire('touchstart',0,400,0); f.fire('touchmove',0,100); f.fire('touchend',0,100,2000);
    assert.equal(f.el.open,!handle); f.dispose();
  }
})

test('a drag that starts on the dimmed page beside a side sheet pulls the sheet and closes it', () => {
  for (const [kind, x] of [['start', -150], ['end', 150]]) {
    const f = fixture(kind)
    f.fire('touchstart', 0, 0, 0, f.page); f.fire('touchmove', x, 0, 1000, f.page)
    assert.notEqual(f.el.style.translate, undefined)
    f.fire('touchend', x, 0, 2000, f.page); assert.equal(f.el.open, false); f.dispose()
  }
})
test('the dimmed page gives a side sheet only its own axis; other windows do not take the page', () => {
  const f = fixture(); f.fire('touchstart', 0, 0, 0, f.page); f.fire('touchmove', 0, 150, 1000, f.page); f.fire('touchend', 0, 150, 2000, f.page)
  assert.equal(f.el.open, true); f.dispose()
  for (const kind of ['dialog', 'top']) {
    const g = fixture(kind); g.fire('touchstart', 0, 0, 0, g.page); g.fire('touchmove', 0, kind === 'top' ? -250 : 250, 1000, g.page); g.fire('touchend', 0, 250, 2000, g.page)
    assert.equal(g.el.open, true, kind); g.dispose()
  }
})
test('a page drag the browser already took (scrolling a rail) does not move the sheet', () => {
  const f = fixture(); f.fire('touchstart', 0, 0, 0, f.page); f.fire('touchmove', -150, 0, 1000, f.page, false)
  assert.equal(f.props.has('--pull'), false); f.fire('touchend', -150, 0, 2000, f.page); assert.equal(f.el.open, true); f.dispose()
})
