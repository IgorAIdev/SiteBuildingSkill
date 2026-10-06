// Browser-only test adapter. Values are minor currency units from the exported
// catalogue. No network writes, payment data, passwords or contact persistence.
export function createTestStore(catalog, storage) {
  const key='test-store-cart-v1'
  let lines={}
  function valid(id,n) {
    if(!Object.hasOwn(catalog,id)||!Number.isInteger(n)||n<1||n>(catalog[id].max??99))throw Error('Invalid item or quantity')
  }
  try {
    const saved=JSON.parse(storage.getItem(key)||'{}')
    for(const [id,n] of Object.entries(saved)) {try{valid(id,n);lines[id]=n}catch{}}
  }catch{}
  const save=()=>{try{storage.setItem(key,JSON.stringify(lines))}catch{}}
  const api={
    lines:()=>Object.entries(lines).map(([id,quantity])=>({id,quantity,...catalog[id]})),
    add(id,n=1){valid(id,n);const next=(lines[id]||0)+n;valid(id,next);lines[id]=next;save()},
    set(id,n){valid(id,n);lines[id]=n;save()},
    remove(id){delete lines[id];save()},
    clear(){lines={};save()},
    count:()=>Object.values(lines).reduce((a,b)=>a+b,0),
    total:()=>Object.entries(lines).reduce((sum,[id,n])=>sum+catalog[id].price*n,0),
    shipping:()=>api.total()>=10000?0:500,
    place(contact){
      if(!api.count())throw Error('Your cart is empty')
      if(!contact?.name?.trim()||!/^\S+@\S+\.\S+$/.test(contact.email||'')||!contact.address?.trim()||!contact.city?.trim())throw Error('Complete your contact and delivery details')
      const order={code:'TEST-'+Date.now().toString(36).toUpperCase(),lines:api.lines(),subtotal:api.total(),shipping:api.shipping(),total:api.total()+api.shipping(),test:true}
      try{storage.setItem('test-store-order-v1',JSON.stringify(order))}catch{}
      api.clear();return order
    }
  }
  return api
}
