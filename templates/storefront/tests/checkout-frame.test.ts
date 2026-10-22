import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Касса — две половины, как у Shopify Checkout (замер allbirds.com 22.10.2026): слева шаги,
   имя шага и поля, справа сводка на полосе от шапки до низа окна и до его края; пара стоит по
   середине страницы шириной `--col-pair`, и шапка кассы — той же ширины: знак над началом
   формы. Прежде шаги и имя шага стояли над рядом, и серый короб сводки начинался под
   заголовком (заказчик 22.10.2026: «чекаут тоже не сделан»). */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const frame = read('../components/CheckoutFrame.tsx')
const payment = read('../components/PaymentForm.tsx')
const css = strip(read('../components/Checkout.module.css'))
const header = strip(read('../components/Header.module.css'))
const tokens = strip(read('../styles/tokens.css'))

test('the step lead stands in the left half, so the summary band starts at the header', () => {
  assert.match(frame, /export function StepLead/)
  assert.match(frame, /<div className=\{`\$\{p\.stack\} \$\{s\.step\} \$\{s\.measure\}`\}><StepLead steps=\{steps\} \/>\{children\}<\/div>/)
  /* Шаг оплаты — сам ряд: голову кладёт его форма. */
  assert.match(payment, /\{lead\}/)
  assert.doesNotMatch(css, /\.lead\{[^}]*padding-block-end/)
})

test('the pair is centred at the corridor width, and the checkout header shares it', () => {
  assert.match(tokens, /--col-pair-gap:calc\(var\(--air-block\) \+ var\(--pad-sheet\)\)/)
  assert.match(tokens, /--col-pair:calc\(var\(--measure\) \+ var\(--col-pair-gap\) \+ var\(--col-side\)\)/)
  assert.match(css, /\.frame\{[^}]*--side-gap:var\(--col-pair-gap\)[^}]*max-inline-size:var\(--col-pair\)\s*\}/)
  /* По середине — только коридор кассы: «спасибо» — страница магазина, её ряд стоит под своим заголовком. */
  assert.match(css, /\.corridor \.frame\{inline-size:100%;margin-inline:auto\}/)
  assert.match(header, /\.head\[data-variant='checkout'\] \.bar\{inline-size:min\(var\(--page-box\), calc\(var\(--col-pair\) \+ var\(--page-line\) \* 2\)\)\}/)
})

test('the band reaches the header, the window edges, and splits the gap in half', () => {
  assert.match(css, /\.band\{border-image:linear-gradient\(var\(--band\) 0 0\) fill 0 \/ \/ var\(--section-air, var\(--air-group\)\) 100vmax 100vmax calc\(var\(--side-gap\) \/ 2\)\}/)
  /* Телефон: раскрывашка сводки — на той же полосе, от шапки и во всю ширину окна (Shopify на 390). */
  assert.match(css, /\.peek\{[^}]*margin-block:calc\(var\(--section-air, var\(--air-group\)\) \* -1\) var\(--air-group\);[^}]*border-image:linear-gradient\(var\(--band\) 0 0\) fill 0 \/ \/ 0 100vmax/)
})
