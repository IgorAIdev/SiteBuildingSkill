import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

test('export gate rejects stripped gestures and divergent icon sizes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'preview-gate-'))
  const run = (...args) => spawnSync(process.execPath, ['tools/prepare-design-preview.mjs', dir, ...args], { encoding: 'utf8' })
  try {
    writeFileSync(join(dir,'index.html'), '<body><nav data-pane="start" popover><a href="/original/en/blog"><svg><use href="/icons.svg#list"></use></svg>Blog</a></nav></body>')
    writeFileSync(join(dir,'icons.svg'), '<svg><symbol id="shopping-cart"></symbol></svg>')
    writeFileSync(join(dir,'app.css'), '.glyph-module__hash__glyph{--glyph-h:1.43em}.Header-module__hash__sign svg{inline-size:1.25em;block-size:1.25em}')
    assert.notEqual(run('--check').status,0, 'unprepared export must fail')
    assert.equal(run().status,0)
    assert.equal(run('--check').status,0)
    assert.match(readFileSync(join(dir,'index.html'),'utf8'), /icons.svg#newspaper/)
    assert.match(readFileSync(join(dir,'icons.svg'),'utf8'), /id="book-open"/)
    const icons=readFileSync(join(dir,'icons.svg'),'utf8')
    writeFileSync(join(dir,'icons.svg'),icons.replace('id="newspaper"','id="missing"'))
    assert.notEqual(run('--check').status,0,'missing navigation symbol must fail')
    assert.equal(run().status,0)
    const css=readFileSync(join(dir,'app.css'),'utf8')
    writeFileSync(join(dir,'app.css'),css.replace('block-size:var(--icon-size)','block-size:99px'))
    assert.notEqual(run('--check').status,0,'local icon-size override must fail')
    assert.equal(run().status,0)
    writeFileSync(join(dir,'pane-boot.js'),'// gestures stripped from export')
    assert.notEqual(run('--check').status,0,'missing gesture initialization must fail')
    assert.equal(run().status,0)
    const page=readFileSync(join(dir,'index.html'),'utf8')
    writeFileSync(join(dir,'index.html'),page.replace(/<script.*?<\/script>/,''))
    assert.notEqual(run('--check').status,0,'missing page consumer must fail')
  } finally {
    rmSync(dir, { recursive:true, force:true })
  }
})
