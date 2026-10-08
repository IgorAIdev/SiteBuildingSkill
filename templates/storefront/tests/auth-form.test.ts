import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Стандартная форма входа (И780). Заказчик 08.10.2026: «sign in нужна стандартная
   форма… перенеси их в дизайн-систему и поставь форму входа». Вход стоял мерой
   текста (637 на окне 1253) у левого края с кнопкой своей ширины, а у всех трёх
   образцов брифа (Gymshark 320, Allbirds 379, Dawn 446) колонка по центру и кнопка
   во всю колонку. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('the sign-in column stands in the middle, as wide as the samples, narrower than the 560 seam', () => {
  const css = read('../components/Account.module.css')
  const auth = css.match(/^\.auth\{([^}]*)\}/m)?.[1] ?? ''
  assert.match(auth, /max-inline-size:var\(--measure-form\)/, 'колонка — ширины формы, а не мерой текста')
  assert.match(auth, /margin-inline:auto/, 'колонка по центру страницы')
  assert.match(auth, /container-type:inline-size/, 'колонка — коробка: кнопка формы меряет её, а не окно')
  const rem = Number(read('../styles/tokens.css').match(/--measure-form:([\d.]+)rem/)?.[1])
  assert.ok(rem * 16 >= 320 && rem * 16 <= 446, `ширина формы ${rem * 16}px — в коридоре образцов 320…446`)
  assert.ok(rem * 16 < 560, 'уже шва 560: кнопка формы во всю колонку на любом экране (Checkout.module.css, `.form`)')
  assert.match(read('../components/Checkout.module.css'), /@container \(max-width:559px\)\{\s*\.form > button\{align-self:stretch\}/)
})

test('title, line and the ways under the form are centred; the address book keeps its own column', () => {
  const css = read('../components/Account.module.css')
  assert.match(css, /^\.head\{text-align:center\}/m)
  assert.match(read('../components/AuthPage.tsx'), /className=\{`\$\{p\.pagehead\} \$\{s\.head\}`\}/)
  assert.match(css, /^\.ways\{[^}]*align-items:center[^}]*text-align:center/m)
  assert.match(css, /^\.way\{[^}]*justify-content:center/m)
  assert.doesNotMatch(read('../components/AddressBook.tsx'), /s\.auth\b/, 'адреса — не форма входа: своя колонка')
})

test('the form stands on the page or on a card — a look value, the site keeps one', () => {
  const css = read('../components/Account.module.css')
  const card = css.match(/@container style\(--auth-look: card\)\{\s*\.auth\{([^}]*)\}/)?.[1] ?? ''
  assert.match(card, /background:var\(--surface\)/, 'на листе — краска листа')
  assert.match(card, /box-shadow:inset 0 0 0 var\(--line-w\) var\(--rule\)$/, 'край — волосок, а не тень (И336)')
  assert.doesNotMatch(css.match(/^\.auth\{([^}]*)\}/m)?.[1] ?? '', /box-shadow|background/, 'на полу страницы — ни листа, ни края')
  assert.match(read('../look-panel/design/AccountParts.tsx'), /cssVar\('--auth-look', look\)/, 'дизайн-система показывает оба вида настоящей страницей входа')
})
