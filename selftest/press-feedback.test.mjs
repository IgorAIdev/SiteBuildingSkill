import test from 'node:test'
import assert from 'node:assert/strict'
import { installPressFeedback } from '../templates/storefront/public/press-feedback.js'
test('quick click feedback survives pending, expires, and cancellation clears it', () => {
  const events=new Map(), timers=new Map(); let next=0;
  const old={document:globalThis.document,window:globalThis.window,Element:globalThis.Element,getComputedStyle:globalThis.getComputedStyle,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  class El { disabled=false; held=false; closest(){return this} matches(){return this.disabled} setAttribute(){this.held=true} removeAttribute(){this.held=false} }
  globalThis.Element=El;
  globalThis.document={addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
  globalThis.window={addEventListener(){},removeEventListener(){}};
  globalThis.getComputedStyle=()=>({getPropertyValue:()=> '120ms'});
  globalThis.setTimeout=(fn,ms)=>{assert.ok(ms>0&&ms<=120,'the hold is what is left of 120 ms, never more');timers.set(++next,fn);return next};
  globalThis.clearTimeout=id=>timers.delete(id);
  try {
    const dispose=installPressFeedback('press'); const el=new El(); const event={target:el,button:0};
    events.get('pointerdown')(event); assert.equal(el.held,true);
    events.get('pointerup')(event); events.get('click')(event);
    el.disabled=true; assert.equal(el.held,true); assert.equal(timers.size,1);
    [...timers.values()][0](); assert.equal(el.held,false);
    events.get('click')(event); assert.equal(el.held,false);
    el.disabled=false; events.get('pointerdown')(event); events.get('pointercancel')(); assert.equal(el.held,false);
    dispose(); assert.equal(events.size,0);
  } finally {Object.assign(globalThis,old)}
})

test('the press stays visible 120 ms from its start, not 120 ms after release (И782)', () => {
  const events=new Map(), waits=[], fns=[]; let clock=1000;
  const old={document:globalThis.document,window:globalThis.window,Element:globalThis.Element,getComputedStyle:globalThis.getComputedStyle,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout}; const perf=Object.getOwnPropertyDescriptor(globalThis,'performance');
  class El { closest(){return this} matches(){return false} setAttribute(){} removeAttribute(){} }
  globalThis.Element=El;
  globalThis.document={addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
  globalThis.window={addEventListener(){},removeEventListener(){}};
  globalThis.getComputedStyle=()=>({getPropertyValue:()=> '120ms'});
  globalThis.setTimeout=(fn,ms)=>{waits.push(ms);fns.push(fn);return waits.length};
  globalThis.clearTimeout=()=>{};
  Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
  try {
    const dispose=installPressFeedback('press'); const event={target:new El(),button:0};
    /* Касание в 76 мс: остаётся 44. Нажатие и отпускание вместе с click — одно ожидание, а не два по 120. */
    events.get('pointerdown')(event); clock+=76; events.get('pointerup')(event); clock+=8; events.get('click')(event);
    assert.deepEqual(waits.map(Math.round),[44,36]);
    /* Долгое нажатие (400 мс) после отпускания не держится вовсе. */
    waits.length=0; clock+=500; events.get('pointerdown')(event); clock+=400; events.get('pointerup')(event);
    assert.deepEqual(waits,[0]); fns.at(-1)();
    /* Нажатие с клавиатуры (click без pointerdown) видно полные 120. */
    waits.length=0; clock+=500; events.get('click')(event);
    assert.deepEqual(waits,[120]);
    dispose();
  } finally {Object.assign(globalThis,old); Object.defineProperty(globalThis,'performance',perf)}
})
