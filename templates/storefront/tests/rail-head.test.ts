import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* «View all» шапки ряда (И759): на телефоне — словом со стрелкой, на широком —
   пилюлей у кругов листания; адрес один. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('on the narrow rail head View all is a word link, the pill stays wide', () => {
  const head = read('../components/RailHead.tsx')
  assert.match(head, /className=\{`\$\{go\.go\} \$\{s\.narrow\}`\} href=\{all\}/)
  const css = read('../components/RailHead.module.css')
  assert.match(css, /@container \(max-width:559px\)\{\s*\.acts > \.wide\{display:none\}\s*\.acts > \.narrow\{display:inline-flex\}/)
})
