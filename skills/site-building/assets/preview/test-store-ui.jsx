import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CartLines } from '@storefront/components/CartLines.tsx'
import { CartCoupon } from '@storefront/components/CartCoupon.tsx'
import { OrderTotals } from '@storefront/components/OrderTotals.tsx'
import { Field } from '@storefront/components/Field.tsx'
import { StateScreen } from '@storefront/components/StateScreen.tsx'
import h from '@storefront/components/Header.module.css'
import b from '@styles/btn.module.css'
import p from '@styles/primitives.module.css'
import f from '@styles/form.module.css'
import pn from '@styles/pane.module.css'
import { createTestStore } from './test-store.mjs'
import { installCatalogue } from './catalog-ui.mjs'

// The exporter supplies data and CSS-module mappings. The actual components
// above are bundled from the storefront; no second set of controls or tokens.
const lang=location.pathname.split('/')[2]||'en'
const base=`/${TEST_VARIANT}/${lang}`
installCatalogue({variant:TEST_VARIANT,lang,buttonClass:b.btn,noteClass:f.say})
const catalog=TEST_CATALOG[lang]
let storage
try{storage=localStorage}catch{storage={getItem:()=>null,setItem:()=>{}}}
const store=createTestStore(catalog,storage)
const money=n=>new Intl.NumberFormat(lang,{style:'currency',currency:'EUR'}).format(n/100)
const words={
  en:{cart:'Your cart',empty:'Your cart is empty',shop:'Continue shopping',checkout:'Checkout',remove:'Remove',qty:'Quantity',total:'Total',subtotal:'Subtotal',delivery:'Test delivery',free:'Free',next:'Continue',back:'Back',name:'Full name',email:'Email',address:'Address',city:'City',place:'Place test order',success:'Test order placed',test:'Test store — no payment or real orders.',saved:'Test form accepted. Nothing was sent.',added:'Added to cart',contact:'Contact and delivery',payment:'Test payment',payNote:'No card details or payment are required.',deliveryNote:'Demo delivery: €5, free from €100.',clear:'Clear cart'},
  ro:{cart:'Coșul tău',empty:'Coșul este gol',shop:'Continuă cumpărăturile',checkout:'Finalizare',remove:'Șterge',qty:'Cantitate',total:'Total',subtotal:'Subtotal',delivery:'Livrare de test',free:'Gratuit',next:'Continuă',back:'Înapoi',name:'Nume complet',email:'Email',address:'Adresă',city:'Oraș',place:'Plasează comanda de test',success:'Comanda de test a fost plasată',test:'Magazin de test — fără plăți sau comenzi reale.',saved:'Formular de test acceptat. Nu s-a trimis nimic.',added:'Adăugat în coș',contact:'Contact și livrare',payment:'Plată de test',payNote:'Nu sunt necesare date de card sau plată.',deliveryNote:'Livrare demo: 5 €, gratuită de la 100 €.',clear:'Golește coșul'},
  hu:{cart:'Kosár',empty:'A kosár üres',shop:'Vásárlás folytatása',checkout:'Pénztár',remove:'Törlés',qty:'Mennyiség',total:'Összesen',subtotal:'Részösszeg',delivery:'Teszt szállítás',free:'Ingyenes',next:'Tovább',back:'Vissza',name:'Teljes név',email:'Email',address:'Cím',city:'Város',place:'Tesztrendelés leadása',success:'Tesztrendelés leadva',test:'Tesztáruház — nincs fizetés vagy valódi rendelés.',saved:'Tesztűrlap elfogadva. Nem küldtünk adatokat.',added:'Kosárba helyezve',contact:'Kapcsolat és szállítás',payment:'Tesztfizetés',payNote:'Bankkártyaadat és fizetés nem szükséges.',deliveryNote:'Demo szállítás: 5 €, 100 € felett ingyenes.',clear:'Kosár ürítése'}
}[lang]||null
const t=words
const couponWords={
  en:{ask:'Have a promo code?',label:'Promo code',apply:'Apply',invalid:'Code not valid. Test code: TEST10 (10% off).',ok:'Test discount applied: 10%.',removed:'Promo code removed.',discount:'Test discount'},
  ro:{ask:'Ai un cod promoțional?',label:'Cod promoțional',apply:'Aplică',invalid:'Cod invalid. Cod de test: TEST10 (10%).',ok:'Reducere de test: 10%.',removed:'Cod eliminat.',discount:'Reducere de test'},
  hu:{ask:'Van kuponkódod?',label:'Kuponkód',apply:'Alkalmaz',invalid:'Érvénytelen kód. Tesztkód: TEST10 (10%).',ok:'10% tesztkedvezmény alkalmazva.',removed:'Kupon eltávolítva.',discount:'Tesztkedvezmény'}
}[lang]
function Coupon(){
  const c=couponWords
  const call=async data=>{
    const remove=String(data.get('op')).startsWith('uncoupon:')
    const ok=remove?(store.removeCoupon(),true):store.applyCoupon(data.get('code'))
    refresh()
    return {kind:ok?'ok':'error',message:ok?(remove?c.removed:c.ok):c.invalid,count:null,inCart:null}
  }
  return <CartCoupon lang={lang} view={{coupon:{...c,open:false,applied:store.coupon()?[{code:store.coupon(),op:'uncoupon:TEST10',label:`${t.remove}: TEST10`}]:[]},couponNotice:null,messages:{timeout:c.invalid,failed:c.invalid}}} submit={async()=>{}} call={call}/>
}
const roots=new Map()
function mount(el,node){if(!roots.has(el))roots.set(el,createRoot(el));roots.get(el).render(node)}
function totals(withDelivery=false){return {rows:[{label:t.subtotal,value:money(store.total())},...(store.discount()?[{label:couponWords.discount+' · TEST10',value:'−'+money(store.discount())}]:[]),...(withDelivery?[{label:t.delivery,value:money(store.shipping())}]:[])],total:{label:t.total,value:money(store.payable()+(withDelivery?store.shipping():0))},note:t.test}}
function lineViews(){return store.lines().map(l=>({id:l.id,name:l.name,href:l.href,facts:l.facts||'',image:l.image,unit:money(l.price),unitSay:money(l.price),total:money(l.price*l.quantity),remove:{op:`remove:${l.id}`,label:`${t.remove}: ${l.name}`,text:t.remove},stepper:{label:t.qty,value:l.quantity,less:{op:l.quantity>1?`set:${l.id}:${l.quantity-1}`:null,label:`− ${l.name}`},more:{op:l.quantity<l.max?`set:${l.id}:${l.quantity+1}`:null,label:`+ ${l.name}`}}}))}
function Basket({pane=false}){
  if(!store.count())return <StateScreen level={pane?2:1} kind="empty" title={t.empty} step={t.shop} href={`${base}/catalog/`} icon="shopping-cart" loud />
  return <div className={p.stack}>
    {!pane&&<h1>{t.cart}</h1>}
    <form data-test-managed onSubmit={e=>{e.preventDefault();const [op,id,n]=e.nativeEvent.submitter.value.split(':');if(op==='remove')store.remove(id);else store.set(id,Number(n));refresh()}}><CartLines lines={lineViews()}/></form>
    <OrderTotals totals={totals()}/>
    <div className={pn.acts}><a className={b.btn} href={`${base}/catalog/`}>{t.shop}</a><a className={b.btn} data-voice="loud" href={`${base}/checkout/contact/`}>{t.checkout}</a></div>
    <Coupon/>
  </div>
}
function Checkout(){
  const [step,setStep]=useState(0),[contact,setContact]=useState({}),[order,setOrder]=useState(null),[error,setError]=useState('')
  if(order)return <StateScreen level={1} kind="empty" title={t.success} step={t.shop} href={`${base}/catalog/`} icon="check" loud><p role="status">{order.code} · {money(order.total)}</p><p>{t.test}</p></StateScreen>
  if(!store.count())return <Basket/>
  const submit=e=>{e.preventDefault();if(step===0){setContact(Object.fromEntries(new FormData(e.currentTarget)));setStep(1)}else if(step===1)setStep(2);else{try{setOrder(store.place(contact));refresh()}catch(err){setError(err.message)}}}
  return <div className={p.stack}><h1>{t.checkout}</h1><p role="status">{step+1} / 3 · {[t.contact,t.delivery,t.payment][step]}</p>
    <form data-test-managed className={p.stack} key={step} onSubmit={submit}>
      {step===0?['name','email','address','city'].map(name=><Field key={name} field={{name,label:t[name],type:name==='email'?'email':'text',autoComplete:{name:'name',email:'email',address:'street-address',city:'address-level2'}[name],max:160,hint:null}} value={contact[name]||''} error={null}/>):step===1?<><h2>{t.delivery}</h2><p>{t.deliveryNote}</p><label className={f.tick}><input type="radio" name="delivery" value="demo" defaultChecked required/>{t.delivery}</label></>:<><h2>{t.payment}</h2><p>{t.payNote}</p><label className={f.tick}><input type="radio" name="payment" value="test" defaultChecked required/>{t.payment}</label><label className={f.tick}><input type="checkbox" required/>{t.test}</label></>}
      <OrderTotals totals={totals(true)}/>{error&&<p className={f.say} role="alert">{error}</p>}
      <div className={pn.acts}>{step>0&&<button className={b.btn} type="button" onClick={()=>setStep(step-1)}>{t.back}</button>}<button className={b.btn} data-voice="loud" type="submit">{step===2?t.place:t.next}</button></div>
    </form></div>
}
function refreshHeaders(){
  for(const a of document.querySelectorAll('header a[aria-haspopup="dialog"][href$="/cart"]')){
    a.setAttribute('aria-label',`${t.cart} (${store.count()})`)
    let count=a.querySelector('[data-test-count]')
    if(!count){count=document.createElement('span');count.dataset.testCount='';count.className=h.badge;a.append(count)}
    count.textContent=store.count()?String(store.count()):''
  }
}
function refresh(){
  refreshHeaders()
  for(const pane of document.querySelectorAll('[data-pane="end"][id^="cart-"]')){
    const body=pane.querySelector('[class*="__body"]');if(body){body.removeAttribute('aria-busy');mount(body,<Basket pane/>)}
  }
  if(/\/cart\/?$/.test(location.pathname))mount(document.querySelector('main'),<Basket/> )
  if(location.pathname.includes('/checkout/'))mount(document.querySelector('main'),<Checkout/>)
}
function announce(form,text){let status=form.querySelector('[role="status"]');if(!status){status=document.createElement('p');status.setAttribute('role','status');form.append(status)}status.className=f.say;status.textContent=text}
document.addEventListener('submit',e=>{
  const form=e.target
  if(!(form instanceof HTMLFormElement)||form.hasAttribute('data-test-managed')||e.defaultPrevented)return
  if(form.method.toLowerCase()!=='post')return
  e.preventDefault()
  const data=new FormData(form)
  if(data.get('op')==='add'){
    try{store.add(String(data.get('variant')),Number(data.get('quantity')||1));refresh();announce(form,t.added);document.querySelector('[data-pane="end"][id^="cart-"]')?.showPopover()}catch(err){announce(form,err.message)}
  }else{announce(form,t.saved);for(const field of form.querySelectorAll('input[type="password"]'))field.value=''}
})
// Hydration used to enable these same QuantityStepper buttons. Preserve its
// min/max contract in static product forms; cart steppers use the component.
function stepper(group){const input=group.querySelector('input[type="number"]');if(!input)return;const value=Number(input.value);for(const button of group.querySelectorAll('button'))button.disabled=button.hasAttribute('data-up')?value>=Number(input.max):value<=Number(input.min)}
for(const group of document.querySelectorAll('[role="group"]:has(input[type="number"])'))stepper(group)
document.addEventListener('input',e=>{const group=e.target.closest('[role="group"]');if(group)stepper(group)})
document.addEventListener('click',e=>{
  const button=e.target.closest('button');const group=button?.closest('[role="group"]');const input=group?.querySelector('input[type="number"]')
  if(input&&button.type==='button'){input.value=String(Math.max(Number(input.min),Math.min(Number(input.max),Number(input.value)+(button.hasAttribute('data-up')?1:-1))));stepper(group)}
  const link=e.target.closest('dialog a[target="_blank"]');if(link){e.preventDefault();announce(link.closest('dialog'),t.saved)}
})
document.querySelectorAll('.preview-note').forEach(note=>{const link=note.querySelector('a');note.replaceChildren(document.createTextNode(t.test+' '));if(link)note.append(link)})
refresh()
document.documentElement.dataset.testStore='ready'
