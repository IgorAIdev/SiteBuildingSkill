import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* «View all» шапки ряда — слово со стрелкой под 45° без кромки на любой ширине,
   под рукой — оттенок, как пункт меню (заказчик 20.10.2026; пилюля И747 и пара
   «пилюля — слово» И759 сняты). */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('rail head View all is one bare word link with a 45° arrow and the menu hand', () => {
  const head = read('../components/RailHead.tsx')
  assert.match(head, /className=\{`\$\{b\.word\} \$\{p\.tap\} \$\{s\.all\}`\} data-hand="menu" href=\{all\}/)
  assert.match(head, /<Icon id="arrow-up-right" \/>/)
  assert.doesNotMatch(head, /data-rail-nav|go\.module/)
})
