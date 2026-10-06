import test from 'node:test'
import assert from 'node:assert/strict'
import { createTestStore } from '../skills/site-building/assets/preview/test-store.mjs'
const products={a:{price:3000,max:99},b:{price:4500,max:2}}
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)}}
test('persisted basket: add, quantity, total, reload and remove',()=>{
  const storage=memory(),s=createTestStore(products,storage)
  s.add('a',2);s.add('a',1);s.add('b',1)
  assert.equal(s.total(),13500);assert.equal(s.count(),4)
  assert.equal(createTestStore(products,storage).total(),13500)
  s.set('a',1);assert.equal(s.total(),7500)
  s.remove('a');assert.equal(s.total(),4500)
})
test('invalid variants and quantities cannot corrupt totals',()=>{
  const s=createTestStore(products,memory())
  for(const [id,n] of [['missing',1],['a',-1],['a',1.5],['a',Infinity],['b',3]])assert.throws(()=>s.add(id,n))
  assert.equal(s.total(),0)
})
test('corrupt storage recovers and checkout validates before clearing',()=>{
  const storage=memory();storage.setItem('test-store-cart-v1','not JSON')
  const s=createTestStore(products,storage)
  assert.throws(()=>s.place({name:'',email:'',address:'',city:''}))
  s.add('a',2)
  assert.throws(()=>s.place({name:'Test',email:'bad',address:'Street',city:'Town'}))
  assert.equal(s.count(),2)
  const order=s.place({name:'Test Buyer',email:'test@example.com',address:'Test Street',city:'Bucharest'})
  assert.match(order.code,/^TEST-/);assert.equal(order.total,6500);assert.equal(s.count(),0)
  assert.equal(JSON.stringify(order).includes('test@example.com'),false)
})
