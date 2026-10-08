import test from 'node:test'
import assert from 'node:assert/strict'
import { filterCatalogue } from '../skills/site-building/assets/preview/catalog-filter.mjs'
const row=(id,percent,mg,type,effect)=>({id,trait:{percent,mg,type},facets:[{facet:{code:'effect'},code:effect}]})
const items=[row('a','10',1000,'full','relax'),row('b','10',3000,'full','sleep'),row('c','5',500,'isolate','relax')]
test('export filter shares virtual ranges and combines real facets with AND/OR',()=>{
  assert.deepEqual(filterCatalogue(items,{concentration:['10']}).map(p=>p.id),['a','b'])
  assert.deepEqual(filterCatalogue(items,{concentration:['5','10'],effect:['relax']}).map(p=>p.id),['a','c'])
  assert.deepEqual(filterCatalogue(items,{content:['2000-4000'],type:['full']}).map(p=>p.id),['b'])
  assert.equal(filterCatalogue(items,{type:['missing']}).length,0)
  assert.equal(filterCatalogue(items,{}).length,3)
})
