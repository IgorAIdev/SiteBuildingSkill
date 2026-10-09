import { filterCatalogue } from './catalog-filter.mjs'

export function installCatalogue({variant,lang,buttonClass,noteClass}) {
  const form=document.querySelector('main form:has(input[name^="facet."])'),grid=document.querySelector('[data-catalog-grid]')
  if(!form||!grid)return
  const words={en:{show:n=>`Show ${n} products`,count:n=>`${n} products`,clear:'Clear filters',empty:'No products match these filters.',error:'The filter could not load. Please reload the page.'},ro:{show:n=>`Arată ${n} produse`,count:n=>`${n} produse`,clear:'Resetează filtrele',empty:'Niciun produs nu corespunde filtrelor.',error:'Filtrul nu s-a încărcat. Reîncarcă pagina.'},hu:{show:n=>`${n} termék megjelenítése`,count:n=>`${n} termék`,clear:'Szűrők törlése',empty:'Nincs a szűrőknek megfelelő termék.',error:'A szűrő nem töltődött be. Töltsd újra az oldalt.'}}[lang]
  const boxes=[...form.querySelectorAll('input[name^="facet."]')],apply=[...form.querySelectorAll('button[type="submit"]')]
  const count=document.querySelector('main [class*="__count"][role="status"]')
  const message=document.createElement('p');message.className=noteClass;message.setAttribute('role','status');message.hidden=true;grid.after(message)
  const clear=document.createElement('button');clear.type='button';clear.className=buttonClass;clear.textContent=words.clear;apply.at(-1).before(clear)
  let items=[],all=[],ready
  const picked=params=>{const out={};for(const [k,v]of params)if(k.startsWith('facet.'))(out[k.slice(6)]??=[]).push(v);return out}
  const draft=()=>picked(new FormData(form))
  function sync(){const p=new URLSearchParams(location.search);for(const b of boxes)b.checked=p.getAll(b.name).includes(b.value)}
  function recount(){const selection=draft(),n=filterCatalogue(items,selection).length
    for(const b of apply){b.textContent=words.show(n);b.disabled=n===0}
    for(const box of boxes){const code=box.name.slice(6),n=filterCatalogue(items,{...selection,[code]:[box.value]}).length;box.disabled=n===0&&!box.checked;const label=box.closest('label')?.querySelector('span span');if(label)label.textContent=`(${n})`}
    clear.hidden=!Object.values(selection).some(a=>a.length)&&![...new URLSearchParams(location.search).keys()].some(k=>k.startsWith('facet.'))
  }
  function render(){sync();let rows=filterCatalogue(items,picked(new URLSearchParams(location.search)));const sort=new URLSearchParams(location.search).get('sort')
    if(sort==='price-asc'||sort==='price-desc')rows.sort((a,b)=>(a.price-b.price)*(sort==='price-asc'?1:-1))
    if(sort==='newest')rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
    grid.removeAttribute('data-fold');grid.innerHTML=rows.map(p=>p.html).join('');for(const li of grid.querySelectorAll('[data-past]'))li.removeAttribute('data-past');if(count)count.textContent=words.count(rows.length)
    message.hidden=rows.length>0;message.textContent=words.empty
    for(const nav of document.querySelectorAll('main [class*="Pagination-module"],main [data-more-products]'))nav.hidden=true
    recount();document.documentElement.dataset.catalogueFilter='ready'
  }
  function navigate(params){history.pushState(null,'',location.pathname+(params.size?'?'+params:''));render();if(form.matches(':popover-open'))form.hidePopover()}
  form.addEventListener('submit',async e=>{e.preventDefault();await ready;const params=new URLSearchParams(location.search);for(const key of [...params.keys()])if(key.startsWith('facet.')||key==='page')params.delete(key);for(const [k,v]of new FormData(form))if(k.startsWith('facet.'))params.append(k,v);navigate(params)})
  form.addEventListener('change',async()=>{await ready;recount()})
  clear.onclick=async()=>{await ready;const params=new URLSearchParams(location.search);for(const key of [...params.keys()])if(key.startsWith('facet.')||key==='page')params.delete(key);navigate(params)}
  window.addEventListener('popstate',()=>ready.then(render))
  document.addEventListener('click',e=>{const link=e.target.closest('main a[href]');if(!link)return;const url=new URL(link.href);if(url.pathname.replace(/\/$/,'')!==location.pathname.replace(/\/$/,'')||!url.searchParams.has('sort'))return;e.preventDefault();ready.then(()=>{const params=new URLSearchParams(location.search);params.set('sort',url.searchParams.get('sort'));navigate(params);link.closest('[popover]')?.hidePopover()})})
  ready=fetch(`/${variant}/catalogue-${lang}.json`).then(r=>{if(!r.ok)throw Error('Catalogue snapshot unavailable');return r.json()}).then(data=>{
    all=data;const parts=location.pathname.split('/').filter(Boolean),kind=parts[2],slug=parts[3]
    items=all.filter(p=>!slug||p.facets.some(f=>f.facet.code===(kind==='effect'?'effect':'category')&&f.code===slug));render()
  }).catch(error=>{message.hidden=false;message.textContent=words.error;for(const b of apply)b.disabled=true;throw error})
}
