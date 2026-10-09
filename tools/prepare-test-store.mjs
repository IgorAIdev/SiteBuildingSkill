import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { traitOf } from '../templates/storefront/lib/source/vendure/traits.ts'

const dist=resolve(process.argv[2]||'')
if(!process.argv[2])throw Error('Usage: node tools/prepare-test-store.mjs <dist>')
const site=dirname(dist), kit=fileURLToPath(new URL('..',import.meta.url))
const require=createRequire(join(site,'package.json'))
const {parseHTML}=require('linkedom'),{build}=require('esbuild')
const source=join(kit,'templates/storefront')
const metadata=JSON.parse(readFileSync(join(site,'catalog-source.json'),'utf8')).items
for(const variant of ['original','minimal']){
  const folder=join(dist,variant),catalog={},classes={}
  const styles=readdirSync(join(folder,'assets')).filter(f=>f.endsWith('.css'))
  for(const name of styles){
    const css=readFileSync(join(folder,'assets',name),'utf8')
    for(const m of css.matchAll(/\.([\w-]+-module__[\w-]+__([\w-]+))/g)){
      const module=m[1].split('-module__')[0]
      ;(classes[module]??={})[m[2]]=m[1]
    }
  }
  let sprite
  for(const lang of ['en','ro','hu']){
    catalog[lang]={}
    for(const slug of readdirSync(join(folder,lang,'product'))){
      const file=join(folder,lang,'product',slug,'index.html')
      const {document:d}=parseHTML(readFileSync(file,'utf8'))
      const form=Array.from(d.querySelectorAll('main form')).find(f=>f.querySelector('input[name="op"][value="add"]'))
      const id=form?.querySelector('input[name="variant"]')?.getAttribute('value')
      if(!id)continue
      const amount=d.querySelector('main [class*="Price-module"][class*="__now"]')?.textContent
      const price=Number(amount?.replace(/[^\d.,]/g,'').replace(',','.'))
      if(!Number.isFinite(price)||price<=0)throw Error(`Missing product price ${file}`)
      const img=d.querySelector('main img')
      catalog[lang][id]={name:d.querySelector('h1').textContent,price:Math.round(price*100),max:Number(form.querySelector('[name="quantity"]')?.getAttribute('max')||99),href:`/${variant}/${lang}/product/${slug}/`,image:{src:img.getAttribute('src'),width:Number(img.getAttribute('width')||800),height:Number(img.getAttribute('height')||800)}}
      sprite??=d.querySelector('use')?.getAttribute('href')?.split('#')[0]
    }
    if(!Object.keys(catalog[lang]).length)throw Error(`Empty catalogue ${variant}/${lang}`)
    const cards=new Map()
    const collect=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const file=join(dir,e.name);if(e.isDirectory()){collect(file);continue}if(e.name!=='index.html')continue;const {document:d}=parseHTML(readFileSync(file,'utf8'));for(const article of d.querySelectorAll('article[data-product-card]')){const id=article.querySelector('input[name="variant"]')?.getAttribute('value');if(id)cards.set(id,article.parentElement.outerHTML)}}}
    collect(join(folder,lang))
    const products=metadata.map(raw=>{const variant=raw.variants.find(v=>catalog[lang][v.id]&&cards.has(v.id));if(!variant)throw Error(`Missing exported card for product ${raw.id}`);return {id:raw.id,trait:traitOf(raw),facets:raw.facetValues,createdAt:raw.createdAt,price:catalog[lang][variant.id].price,html:cards.get(variant.id)}})
    writeFileSync(join(folder,`catalogue-${lang}.json`),JSON.stringify(products))
    const {document:d}=parseHTML(readFileSync(join(folder,lang,'cart/index.html'),'utf8'))
    d.querySelector('main').replaceChildren()
    d.querySelector('title').textContent='Test checkout — CBDin'
    for(const step of ['contact','delivery','payment','done']){
      const path=join(folder,lang,'checkout',step);mkdirSync(path,{recursive:true});writeFileSync(join(path,'index.html'),'<!doctype html>'+d.documentElement.outerHTML)
    }
  }
  writeFileSync(join(folder,'test-catalog.json'),JSON.stringify(catalog))
  function cssExports(file){
    const name=basename(file,'.module.css'),out={...classes[name]}
    if(!Object.keys(out).length)throw Error(`Missing exported CSS module ${name}`)
    const css=readFileSync(file,'utf8')
    for(const m of css.matchAll(/\.([\w-]+)\s*\{[^{}]*?composes:\s*([\w\s-]+)\s+from\s+['"]([^'"]+)['"]/g)){
      const imported=resolve(dirname(file),m[3])
      const other=cssExports(imported.startsWith(join(source,'styles'))?join(kit,'styles',basename(imported)):imported)
      out[m[1]]=[out[m[1]],...m[2].trim().split(/\s+/).map(key=>other[key])].filter(Boolean).join(' ')
    }
    return out
  }
  await build({entryPoints:[join(kit,'skills/site-building/assets/preview/test-store-ui.jsx')],bundle:true,format:'esm',platform:'browser',jsx:'automatic',minify:true,outfile:join(folder,'test-store.js'),define:{TEST_VARIANT:JSON.stringify(variant),TEST_CATALOG:JSON.stringify(catalog),'process.env.NODE_ENV':'"production"'},alias:{react:dirname(require.resolve('react/package.json')),'react-dom':dirname(require.resolve('react-dom/package.json'))},plugins:[{name:'existing-storefront',setup(b){
    b.onResolve({filter:/^next\/navigation$/},()=>({path:'preview-router',namespace:'preview-router'}))
    b.onResolve({filter:/^\.\/commerce\//},a=>({path:join(kit,'skills/site-building/assets',a.path.slice(2))}))
    b.onLoad({filter:/.*/,namespace:'preview-router'},()=>({contents:'export const useRouter=()=>({refresh(){}})',loader:'js'}))
    b.onResolve({filter:/^@storefront\//},a=>({path:join(source,a.path.slice(12))}))
    b.onResolve({filter:/^@styles\//},a=>({path:join(kit,'styles',a.path.slice(8))}))
    b.onResolve({filter:/^@\//},a=>({path:a.path.startsWith('@/styles/')?join(kit,a.path.slice(2)):join(source,a.path.slice(2))}))
    b.onLoad({filter:/\.module\.css$/},a=>({contents:'export default '+JSON.stringify(cssExports(a.path)),loader:'js'}))
    b.onLoad({filter:/[/\\]Icon\.tsx$/},a=>({contents:readFileSync(a.path,'utf8').replace('/icons.svg#',sprite+'#'),loader:'tsx'}))
  }}]})
  let count=0
  function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const file=join(dir,e.name);if(e.isDirectory()){walk(file);continue}if(!file.endsWith('.html'))continue
    let html=readFileSync(file,'utf8')
    const {document:d}=parseHTML(html)
    for(const input of d.querySelectorAll('input[name="variant"]'))if(input.getAttribute('value')&&!catalog[locationLang(file)][input.getAttribute('value')])throw Error(`Unknown add variant ${file}`)
    const tag=`<script type="module" src="/${variant}/test-store.js"></script>`
    if(!html.includes(tag))html=html.replace('</body>',tag+'</body>')
    for(const css of styles){const href=`/${variant}/assets/${css}`;if(!html.includes(href))html=html.replace('</head>',`<link rel="stylesheet" href="${href}"></head>`)}
    writeFileSync(file,html);count++
  }}
  const locationLang=file=>file.slice(folder.length+1).split(/[/\\]/)[0]
  for(const lang of ['en','ro','hu'])walk(join(folder,lang))
  console.log(`${variant}: ${count} pages, ${Object.keys(catalog.en).length} purchasable variants; shared React components`)
}
const preview=join(dist,'preview.js')
let js=readFileSync(preview,'utf8')
js=js.replace(/document\.addEventListener\('submit',[\s\S]*?\n\}\);\s*$/,'')
if(js.includes('alert('))throw Error('Blocking alert remains in preview')
writeFileSync(preview,js)
