import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isKey, t } from '../lib/i18n/index.ts'
import { LOCALES } from '../lib/locale.ts'

/* Подвал телефона (И760): документы — короткими общепринятыми именами, четыре
   столбца — двумя рядами по два, шаг строк ровный при переносе. Заказчик
   05.10.2026: «чехарда с межстрочными интервалами», «сокращай названия до коротких
   общепринятых», «в две строки и два блока». */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const footer = read('../components/Footer.tsx')
const css = read('../components/Footer.module.css')
const slugs = (name: string) => footer.split(`const ${name} = [`)[1].split(']')[0].split(',').map((x) => x.trim().replace(/'/g, '')).map((x) => (x === 'TERMS_DOC' ? 'termeni' : x))

test('every footer document has a short name in every language, shorter than its title', () => {
  for (const slug of [...slugs('HELP'), ...slugs('ABOUT'), ...slugs('LEGAL')]) {
    const key = `footer.doc.${slug}`
    assert.ok(isKey(key), key)
    for (const lang of LOCALES) assert.ok(t(lang, key as never).length <= 22, `${lang} ${key}: ${t(lang, key as never)}`)
  }
  assert.match(footer, /\{name\(d\)\}/)
  assert.match(footer, /t\(lang, 'footer\.withdraw'\)/)
})

/* Первый столбец — по самой длинной своей строке, не шире 60 %: адрес почты в одну строку, а не
   «contact / @exemplu.ro» в равной ячейке (заказчик 08.10.2026: «email не помещается»). */
test('on the phone the four columns stand two by two, the first as wide as its longest line', () => {
  assert.match(css, /@container \(max-width:559px\)\{\s*\.cols\{display:grid;grid-template-columns:fit-content\(60%\) minmax\(0, 1fr\)\}\s*\}/)
  assert.doesNotMatch(css, /\.col:first-child\{grid-column:1 \/ -1\}/)
})

/* Знаки оплаты — без пилюль (И783): знак не нажимают, плашка обещала бы действие. Один компонент на
   подвал и дизайн-систему; воздух ряда — между ярусами основания, а не вплотную (восемь пикселей
   между ссылками, знаками и строкой прав: «с воздухом плохо», заказчик 08.10.2026). */
test('payment marks stand bare, from one component, with air between the tiers of the base', () => {
  assert.match(footer, /<PayMarks label=\{t\(lang, 'footer\.pay'\)\} \/>/)
  assert.doesNotMatch(footer, /data-chip="pay"|PAYMENTS/)
  const marks = read('../components/PayMarks.module.css')
  assert.doesNotMatch(marks.replace(/\/\*[\s\S]*?\*\//g, ''), /background|box-shadow|border-radius/)
  assert.match(marks, /\.mark svg\{[^}]*block-size:calc\(var\(--ctrl-fs-sm\) \* 1\.7\)/)
  assert.match(css, /\.base\{[^}]*gap:var\(--air-row\)/)
  assert.match(read('../look-panel/design/DesignPage.tsx'), /<PayMarks label=/)
  assert.doesNotMatch(read('../styles/primitives.module.css'), /data-chip='pay'/)
})

test('a footer link keeps its air when its name wraps', () => {
  /* Поле — вверх до пикселя: дробное межстрочье клало строку в 43.98 при цели 44. */
  assert.match(css, /\.list a\{[^}]*padding-block:round\(up, calc\(\(var\(--ctrl-h-sm\) - 1lh\) \/ 2\), 1px\)/)
  assert.doesNotMatch(css, /\.list a\{[^}]*min-block-size/)
})
