import { chosen, VIRTUAL } from '../../../../templates/storefront/lib/source/vendure/traits.ts'

// The same virtual-facet engine as Vendure; OR within a facet, AND between facets.
export function filterCatalogue(items, picked) {
  const real=items.filter(p=>Object.entries(picked).every(([code,values])=>VIRTUAL.includes(code)||!values.length||values.some(value=>p.facets.some(f=>f.facet.code===code&&f.code===value))))
  const ids=new Set(chosen(real.map(p=>p.id),new Map(real.map(p=>[p.id,p.trait])),picked))
  return real.filter(p=>ids.has(p.id))
}
