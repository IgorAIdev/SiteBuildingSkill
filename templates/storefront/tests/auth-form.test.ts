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
})

/* Вход через Google и Facebook (И787). Заказчик 08.10.2026: «регистрация / вход в
   кабинет сделай же нормально как принято — гугл вход, FB вход». Формы заказчика
   (элементы 56, 57) ставили кнопки поставщиков под главной кнопкой после «или» —
   пять из пяти; при переносе в дизайн-систему они выпали. */
test('sign-in and sign-up: the form, then «or» and the provider buttons, then the ways — the row is a sibling form, not nested', () => {
  const page = read('../components/AuthPage.tsx')
  const form = page.indexOf('<AuthForm'), row = page.indexOf('<SocialSignIn'), ways = page.indexOf('s.ways')
  assert.ok(form > 0 && row > form && ways > row, 'порядок: форма → «или» и кнопки → пути')
  assert.match(page, /view\.social && social \? <SocialSignIn/, 'ряда нет, когда источник никого не назвал')
  const social = read('../components/SocialSignIn.tsx')
  assert.ok(social.indexOf('s.or') < social.indexOf('<form'), '«или» над кнопками')
  assert.equal(social.split('<form').length - 1, 1, 'одна форма на все кнопки')
  assert.match(social, /name="provider" value=\{x\.provider\}/, 'поставщик — значение нажатой кнопки')
  assert.match(social, /className=\{b\.btn\}[^>]*data-size="lg"[^>]*data-wide[^>]*data-provider=\{x\.provider\}/, 'кнопка основы ростом главной во всю колонку, одеждой поставщика')
  assert.doesNotMatch(social, /data-voice/, 'громкая на экране одна — «Sign in»')
  assert.match(social, /<Icon id=\{PROVIDER_SIGN\[x\.provider\]\} \/>/, 'знак — из карты знаков поставщиков, не нарисован на месте')
  assert.ok(social.indexOf('</button>') < social.indexOf('type="hidden"'), 'скрытые поля после кнопок: шаг стопки не встаёт над первой кнопкой')
  assert.match(read('../components/AuthForm.tsx'), /useActionState\(action, view\.alert \?.*message: view\.alert/, 'отказ поставщика — в слоте ошибки формы с первого показа')
  for (const path of ['../app/[lang]/account/page.tsx', '../app/[lang]/account/register/page.tsx']) {
    const src = read(path)
    assert.match(src, /commerce\(\)\.socialProviders\(\)/, `${path}: кнопки — только у названных источником`)
    assert.match(src, /social=\{socialSignIn\.bind\(null, lang\)\}/, `${path}: те же кнопки на входе и на создании`)
    assert.match(src, /socialAlert\(lang, first\(query\.auth\), first\(query\.via\)\)/, `${path}: отказ — в слоте ошибки формы`)
  }
})

/* Свойство из CSS-правила — без привязки к записи строки: переформатирование
   правила тест не красит, смена свойства — красит. */
const rule = (css: string, selector: string) => {
  const at = css.indexOf(`${selector}{`)
  return at < 0 ? '' : css.slice(at + selector.length + 1, css.indexOf('}', at)).replace(/\s+/g, '')
}

test('provider marks are the providers’ own two-colour files; the button keeps the provider’s dress whatever the panel says', () => {
  const marks = read('../components/marks.ts')
  assert.match(marks, /PROVIDER_SIGN: Record<Provider, string> = \{ google: 'google-color', facebook: 'facebook-color' \}/)
  assert.match(marks, /facebook: 'facebook',/, 'силуэт соцсети подвала остаётся своим')
  const sheet = read('../styles/icons.svg')
  const g = sheet.match(/<symbol id="google-color"[\s\S]*?<\/symbol>/)?.[0] ?? ''
  for (const paint of ['#EA4335', '#4285F4', '#FBBC05', '#34A853']) assert.ok(g.includes(`fill="${paint}"`), `«G» своими красками: ${paint}`)
  const f = sheet.match(/<symbol id="facebook-color"[\s\S]*?<\/symbol>/)?.[0] ?? ''
  assert.ok(f.includes('fill="#0866FF"') && f.includes('fill="#FFFFFF"'), '«f» — белая в синем круге Facebook, днём и ночью одна')
  const account = read('../components/Account.module.css')
  assert.doesNotMatch(account, /data-mark|--mark-facebook/, 'краску знака место не пишет — она в самом знаке')
  const dress = rule(read('../styles/btn.module.css'), '.btn[data-provider]')
  assert.match(dress, /--ctrl-btn-dash:0/, 'ось «Тихая: черта» не вынимает «G» из рамки')
  assert.match(dress, /--ctrl-btn-hand-fill:0/, 'ось «Ответ на руку: заливка маркой» не красит рамку поставщика')
  assert.match(dress, /--ctrl-btn-edge:var\(--edge\)/, 'рамка кромкой тихой')
  assert.match(dress, /--ctrl-btn-fill:transparent/, 'пол свой: днём светлая тема Google, ночью тёмная')
})

test('«or» stands between hairlines; the row and the buttons are the stack primitive with their own steps', () => {
  const css = read('../components/Account.module.css')
  assert.match(rule(css, '.or::before,.or::after'), /border-block-start:var\(--line-w\)solidvar\(--rule\)/, 'волоски — ролью линии')
  assert.match(rule(css, '.providers'), /--stack:var\(--air-row\)/, 'от «или» до кнопок — шаг строки группы')
  assert.match(rule(css, '.providers > *'), /--stack:var\(--gap-targets\)/, 'между кнопками — соседние цели')
  const social = read('../components/SocialSignIn.tsx')
  assert.match(social, /<div className=\{p\.stack\}>/)
  assert.match(social, /<form className=\{`\$\{p\.stack\} \$\{s\.providers\}`\}/)
  assert.doesNotMatch(css, /\.social\{|\.providers\{display:flex/, 'стопку не пишут заново — её берут (правило 7)')
})

test('sign-in pages do not stand in a foreign frame (clickjacking of the password form and provider buttons)', () => {
  const conf = read('../next.config.ts')
  assert.match(conf, /source: '\/:lang\/account\/:path\*'/)
  assert.match(conf, /frame-ancestors 'self'/)
  assert.match(conf, /X-Frame-Options', value: 'SAMEORIGIN'/)
})
