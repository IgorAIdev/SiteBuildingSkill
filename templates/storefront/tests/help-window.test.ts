import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Окно мессенджеров (И757): растёт от кнопки помощи ростом своих строк и может
   накрыть «наверх» — так на коротком окне браузера список не прокручивается. */
const dock = readFileSync(new URL('../components/HelpDock.module.css', import.meta.url), 'utf8')

test('the help window hangs from the help button, not from the whole stack', () => {
  assert.match(dock, /\.dock \.knob\{anchor-name:--help\}/)
  assert.doesNotMatch(dock, /\.dock\{[^}]*anchor-name/)
  assert.match(dock, /--float-at:calc\(var\(--dock\) \+ max\(var\(--bottom-bar, 0px\), var\(--edge-b\)\) \+ var\(--gut\) \+ var\(--dock-h\) \+ var\(--gap-targets\)\)/)
})

test('the up button is one step smaller than the help button', () => {
  assert.match(dock, /\.dock \.top\{\s*--btn-h:var\(--ctrl-h\);/)
  assert.match(dock, /\.dock \.knob\{--btn-h:var\(--dock-h\)/)
  /* Под пальцем плавающие кнопки не растут: связь 48, «наверх» 44. */
  assert.match(dock, /@media \(pointer:coarse\)\{ \.dock\{--dock-h:var\(--ctrl-h\)\} \}/)
  assert.match(dock, /@media \(pointer:coarse\)\{ \.dock \.top\{--btn-h:var\(--ctrl-h-sm\)\} \}/)
})
