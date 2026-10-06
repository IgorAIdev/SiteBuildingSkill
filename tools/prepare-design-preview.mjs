import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'

// Static review exports remove hydration. Restore presentation behavior from
// the same source as React; never reimplement gestures in a preview script.
const dist = resolve(process.argv[2] || '')
if (!process.argv[2]) throw new Error('Usage: node tools/prepare-design-preview.mjs <export dist> [--check]')
const check = process.argv.includes('--check')
const core = new URL('../templates/storefront/public/pane-swipe.js', import.meta.url)
const boot = readFileSync(new URL('./preview-pane-controls.js', import.meta.url), 'utf8')
function save(path, text) {
  if (check) {
    if (readFileSync(path, 'utf8') !== text) throw new Error(`Preview is stale: ${path}`)
  } else writeFileSync(path, text)
}
save(join(dist, 'pane-swipe.js'), readFileSync(core, 'utf8'))
save(join(dist, 'pane-boot.js'), boot)
const token = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8').match(/--icon-size:[^;]+;/)[0]
const tag = '<script type="module" src="/pane-boot.js"></script>'
const blogSign = readFileSync(new URL('../templates/storefront/lib/shell.ts', import.meta.url), 'utf8').match(/const BLOG_SIGN = '([^']+)'/)[1]
const sprite = readFileSync(new URL('../styles/icons.svg', import.meta.url), 'utf8')
let pages = 0, sheets = 0
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) { walk(path); continue }
    if (entry.name.endsWith('.html')) {
      let html = readFileSync(path, 'utf8')
      if (!/<[^>]+\sdata-pane=/.test(html)) continue
      pages++
      // Plain navigation links do not imply an expandable submenu. Preserve
      // the separate Turn control used by actual disclosures (Oil).
      html = html.replace(/<span\b[^>]*class="[^"]*Header-module__[^" ]+__chev[^"]*"[^>]*>\s*<svg\b[^>]*>[\s\S]*?<\/svg>\s*<\/span>/g, '')
      html = html.replace(/<a\b[^>]*href="[^"]*\/blog\/?"[^>]*>[\s\S]*?<\/a>/g, (link) => link.replace(/(<use\b[^>]*href="[^"#]*#)[^"]+/, `$1${blogSign}`))
      if (!html.includes('</body>')) throw new Error(`No body end: ${path}`)
      save(path, html.includes(tag) ? html : html.replace('</body>', `${tag}</body>`))
    }
    if (entry.name.endsWith('.svg')) {
      const existing = readFileSync(path, 'utf8')
      if (existing.includes('<symbol') && existing.includes('id="shopping-cart"')) save(path, sprite)
    }
    if (!entry.name.endsWith('.css')) continue
    let css = readFileSync(path, 'utf8')
    if (!css.includes('--glyph-h:') && !css.includes('Header-module__')) continue
    sheets++
    css = css.replace(/--glyph-h:[^;}]+/g, '--glyph-h:var(--icon-size)')
    css = css.replace(/([^{}]+)\{([^{}]*)\}/g, (rule, selector, declarations) => {
      if (!/(?:Header-module__\S+__(?:sign|chev) svg|pane-module__\S+__close svg|menu-module__\S+__list[^{}]*svg)/.test(selector)) return rule
      return `${selector}{${declarations.replace(/(block-size|inline-size):[^;}]+/g, '$1:var(--icon-size)')}}`
    })
    if (!css.includes(token)) css = `:root{${token}}\n${css}`
    save(path, css)
  }
}
walk(dist)
if (!pages || !sheets) throw new Error('No exported storefront pages/styles found')
console.log(`${check ? 'Verified' : 'Prepared'} ${pages} pages and ${sheets} stylesheets; shared gestures and icon size`)
