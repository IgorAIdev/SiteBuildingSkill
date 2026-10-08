import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Дизайн-система показывает настоящие компоненты сайта (память design-system-shows-all).
   Тесты панели — уходят вместе с ней (`npm run test:panel`): в тестах сайта следа панели
   нет, магазин без панели снимается одной командой (И352, `check:look`). Перенесены сюда
   из тестов входа, корзины и подвала 08.10.2026. */
const read = (p: string) => readFileSync(new URL(`../design/${p}`, import.meta.url), 'utf8')

test('the design system shows sign-in (both looks) and sign-up with the provider row, whatever the source', () => {
  const ds = read('AccountParts.tsx')
  assert.match(ds, /cssVar\('--auth-look', look\)/, 'оба вида настоящей страницей входа')
  assert.match(ds, /<AuthPage view=\{signInView\(lang, null, ALL\)\} action=\{still\} social=\{stillSocial\}/)
  assert.match(ds, /<AuthPage view=\{signUpView\(lang, null, ALL\)\} action=\{still\} social=\{stillSocial\}/)
  assert.match(ds, /const ALL = \[\.\.\.PROVIDERS\]/)
})

test('the design system shows the empty cart, the empty favourites and the payment marks with the site components', () => {
  assert.match(read('CheckoutParts.tsx'), /<EmptyPaths /)
  const page = read('DesignPage.tsx')
  assert.match(page, /<EmptyPaths level=\{2\} title=\{t\(lang, 'saved\.empty'\)\}/)
  assert.match(page, /<PayMarks label=/)
})
