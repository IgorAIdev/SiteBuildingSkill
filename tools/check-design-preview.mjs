// Automated browser gate for the two-design pilot export. Install the existing
// component-preview test dependencies first; this never runs in the storefront.
import { createServer } from 'node:http'
import { readFileSync, statSync, realpathSync, existsSync } from 'node:fs'
import { resolve, sep, extname } from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

if (!process.argv[2]) throw new Error('Usage: npm run check:preview -- <export dist>')
const root=realpathSync(resolve(process.argv[2]))
execFileSync(process.execPath,[new URL('./prepare-design-preview.mjs',import.meta.url).pathname.replace(/^\/(?=[A-Z]:)/,''),root,'--check'],{stdio:'inherit'})
const require=createRequire(new URL('../selftest/component-preview/package.json',import.meta.url))
const {chromium}=require('playwright')
const server=createServer((req,res)=>{
  try {
    const pathname=new URL(req.url,'http://localhost').pathname
    if(pathname==='/__qa.html'||pathname==='/__store-qa.html') {
      const harness=pathname==='/__qa.html'?'preview-gestures.html':'test-store-browser.html'
      res.setHeader('Content-Type','text/html');res.end(readFileSync(new URL('../selftest/'+harness,import.meta.url)));return
    }
    let file=realpathSync(resolve(root,'.'+decodeURIComponent(pathname)))
    if(file!==root&&!file.startsWith(root+sep))throw Error('Outside export')
    if(statSync(file).isDirectory())file=resolve(file,'index.html')
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'})[extname(file)]||'application/octet-stream')
    res.end(readFileSync(file))
  }catch{res.writeHead(404);res.end('Not found')}
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
let browser
try {
  browser=await chromium.launch({headless:true})
  const page=await browser.newPage()
  await page.goto(`http://127.0.0.1:${server.address().port}/__qa.html`)
  await page.getByRole('button',{name:'Run exported-page checks'}).click()
  await page.waitForFunction(()=>document.querySelector('#result').textContent!=='Not run',{},{timeout:180000})
  const result=JSON.parse(await page.locator('#result').innerText())
  console.log(JSON.stringify(result,null,2))
  if(!result.checks||result.failures.length)throw Error('Export interaction checks failed')
  if(existsSync(resolve(root,'original/test-store.js'))){
    await page.goto(`http://127.0.0.1:${server.address().port}/__store-qa.html`)
    await page.getByRole('button',{name:'Run test purchase checks'}).click()
    await page.waitForFunction(()=>document.querySelector('#result').textContent!=='Not run',{},{timeout:30000})
    const purchase=JSON.parse(await page.locator('#result').innerText())
    console.log(JSON.stringify(purchase,null,2))
    if(purchase.checks!==12||purchase.failures.length)throw Error('Test purchase checks failed')
  }
}finally{await browser?.close();await new Promise(r=>server.close(r))}
