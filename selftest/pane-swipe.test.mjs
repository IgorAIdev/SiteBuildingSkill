import test from 'node:test'
import assert from 'node:assert/strict'
import { installPaneSwipe } from '../templates/storefront/public/pane-swipe.js'

function fixture(kind = 'start', rtl = false) {
  const events = new Map(), props = new Map()
  class Element {
    constructor() { this.dataset = {}; this.style = { removeProperty: k => props.delete(k), setProperty: (k, v) => props.set(k, v) }; this.open = true; this.offsetWidth = 300; this.offsetHeight = 600; this.scrollTop = 0; this.scrollHeight = 600; this.clientHeight = 600 }
    closest(selector) { return selector === 'input, textarea, select' ? null : this }
    matches(selector) { return selector === '[data-pane]' || this.open }
    hidePopover() { this.open = false }
    addEventListener() {}
    removeEventListener() {}
  }
  globalThis.Element = globalThis.HTMLElement = Element
  globalThis.HTMLDialogElement = class extends Element { close() { this.open = false } }
  globalThis.getComputedStyle = () => ({ direction: rtl ? 'rtl' : 'ltr', getPropertyValue: () => '1', transitionDuration: '0' })
  globalThis.requestAnimationFrame = fn => fn()
  globalThis.document = { addEventListener: (k, f) => events.set(k, f), removeEventListener: k => events.delete(k) }
  const el = new Element(); el.dataset.pane = kind
  const dispose = installPaneSwipe()
  const fire = (type, x, y, time = 1000) => events.get(type)?.({ target: el, touches: [{clientX:x,clientY:y}], timeStamp: time, preventDefault() {} })
  return {el, events, dispose, fire, props}
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
