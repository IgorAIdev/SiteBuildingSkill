import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { isKey, t } from '../lib/i18n/index.ts'
import { LOCALES } from '../lib/locale.ts'
import { ANPC_SAL_BADGE, ANPC_SAL_URL, ANPC_URL } from '../lib/company.ts'

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
  assert.match(footer, /t\(lang, 'withdraw\.button'\)/)
})

/* Первый столбец — по самой длинной своей строке, не шире 60 %: адрес почты в одну строку, а не
   «contact / @exemplu.ro» в равной ячейке (заказчик 08.10.2026: «email не помещается»). */
test('on the phone the four columns stand two by two, the first as wide as its longest line', () => {
  assert.match(css, /@container \(max-width:559px\)\{\s*\.cols\{display:grid;grid-template-columns:fit-content\(60%\) minmax\(0, 1fr\)\}\s*\}/)
  assert.doesNotMatch(css, /\.col:first-child\{grid-column:1 \/ -1\}/)
})

/* У кассы подвала нет (слово заказчика 08.10.2026: сначала «чекаут убирай, эти данные фирмы не
   нужны тут», затем «убирай этот текст внизу, нахуй он тут не нужен»). Условия — ссылкой у кнопки
   заказа (PaymentForm), остальное — в подвале магазина. */
test('the checkout page has no footer; the order step still links the terms', () => {
  assert.doesNotMatch(footer, /variant|'legal'/)
  assert.match(read('../components/Shell.tsx'), /chrome === 'checkout' \? null : <Footer /)
  assert.doesNotMatch(css, /\.legal\{|\.legalRow/)
  assert.match(read('../components/PaymentForm.tsx'), /view\.terms\.link\.href/)
  assert.match(footer, /\{COMPANY\.name\}<\/span> · CUI \{COMPANY\.cui\}/)
})

/* Знаки оплаты — без пилюль (И783): знак не нажимают, плашка обещала бы действие. Один компонент на
   подвал и дизайн-систему; воздух ряда — между ярусами основания, а не вплотную (восемь пикселей
   между ссылками, знаками и строкой прав: «с воздухом плохо», заказчик 08.10.2026). */
test('payment marks stand bare, from one component, with air between the tiers of the base', () => {
  assert.match(footer, /<PayMarks label=\{t\(lang, 'footer\.pay'\)\} \/>/)
  assert.doesNotMatch(footer, /data-chip="pay"|PAYMENTS/)
  const marks = read('../components/PayMarks.module.css')
  assert.doesNotMatch(marks.replace(/\/\*[\s\S]*?\*\//g, ''), /background|box-shadow|border-radius/)
  assert.match(marks, /\.mark svg\{[^}]*block-size:calc\(var\(--ctrl-fs-sm\) \* 1\.15\)/)
  assert.match(css, /\.base\{[^}]*gap:var\(--air-row\)/)
  assert.match(read('../look-panel/design/DesignPage.tsx'), /<PayMarks label=/)
  assert.doesNotMatch(read('../styles/primitives.module.css'), /data-chip='pay'/)
})

test('a footer link keeps its air when its name wraps', () => {
  /* Поле — вверх до пикселя: дробное межстрочье клало строку в 43.98 при цели 44. */
  assert.match(css, /\.list a\{[^}]*padding-block:round\(up, calc\(\(var\(--ctrl-h-sm\) - 1lh\) \/ 2\), 1px\)/)
  assert.doesNotMatch(css, /\.list a\{[^}]*min-block-size/)
})

/* Ряд закона подвала (И791): «ANPC» — на anpc.ro (приказ ANPC 72/2010 в ред. 505/2026),
   SAL — официальной пиктограммой 250 × 50 (приказ 270/2026), пока файла нет — текстовой
   ссылкой; платформы ЕС (ODR/SOL) нет — закрыта 20.07.2025. Функция отказа подписана той
   же надписью, что кнопка на странице возврата (ст. 11a Директивы 2011/83): одна надпись
   на функцию. «Setări cookie» — только у магазина с необязательными cookie. */
test('the legal row links ANPC and SAL, has no EU ODR, and the withdrawal function keeps one label', () => {
  assert.equal(ANPC_URL, 'https://anpc.ro/')
  assert.equal(ANPC_SAL_URL, 'https://reclamatiisal.anpc.ro/')
  assert.match(footer, /<a className=\{b\.word\} href=\{ANPC_URL\} rel="noopener">\{t\(lang, 'footer\.anpcHome'\)\}<\/a>/, 'ссылка ANPC в ряду закона')
  assert.deepEqual([ANPC_SAL_BADGE.width, ANPC_SAL_BADGE.height], [250, 50], 'пиктограмма SAL — 250 × 50 по приказу')
  assert.match(footer, /ANPC_SAL_BADGE\.src \? <a className=\{s\.sal\} href=\{ANPC_SAL_URL\}[^>]*><img src=\{ANPC_SAL_BADGE\.src\} width=\{ANPC_SAL_BADGE\.width\} height=\{ANPC_SAL_BADGE\.height\} alt=\{t\(lang, 'footer\.salAlt'\)\}/, 'знак SAL картинкой без изменений')
  assert.match(footer, /ANPC_SAL_BADGE\.src \? null : <li><a className=\{b\.word\} href=\{ANPC_SAL_URL\}/, 'без файла — текстовая ссылка на SAL')
  if (ANPC_SAL_BADGE.src) assert.ok(existsSync(new URL(`../public${ANPC_SAL_BADGE.src}`, import.meta.url)), 'файл пиктограммы SAL назван, а не положен')
  for (const file of ['../components/Footer.tsx', '../lib/company.ts', '../lib/docs.json']) assert.doesNotMatch(read(file), /ec\.europa\.eu\/consumers\/odr/, `${file}: ссылка на закрытую платформу ODR`)
  assert.equal(isKey('footer.withdraw'), false, 'вторая надпись функции отказа')
  for (const lang of LOCALES) assert.ok(t(lang, 'withdraw.button').length > 0)
  assert.match(footer, /hasOptional\(\) \? <li><ConsentOpen label=\{t\(lang, 'consent\.open'\)\} voice="word" \/><\/li> : null/, '«Setări cookie» — словом, только когда есть что спрашивать')
  assert.match(footer, /<footer className=\{s\.foot\} data-ground="deck" data-print="skip">/, 'подвал не печатается')
})
