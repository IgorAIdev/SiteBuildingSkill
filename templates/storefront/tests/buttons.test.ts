import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/* Кнопки — одна форма и один ответ (слово заказчика 04.10.2026 со снимками героя и
   карточки: «явно не хватает основного цвета или при наведении на Add to cart… у нас
   нет одинообразия кнопок»; «в херо блоке все кнопки сделать одинаковыми, а Shop
   выделить, написав Shop all»). Модуль кнопки кладёт в сайт установщик из styles/. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const bare = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/* Угол всех кнопок — роль формы `--r-btn`, её ставит ручка Shape → Corners (у каждого
   набора близнец «· pill» — полный круг); оси «Форма кнопки» до угла дела нет
   (заказчик 04.10.2026: «не реагируют кнопки на настройку панели, не меняется форма»). */
test('every button takes its corner from Shape → Corners, not from the shape axis', () => {
  const css = bare(read('../styles/btn.module.css'))
  const base = css.match(/(?:^|\})\s*\.btn\{([^}]*)\}/)
  assert.ok(base, 'правило .btn есть')
  assert.match(base[1], /--btn-r:var\(--r-btn, var\(--r-ctrl\)\)/)
  assert.doesNotMatch(css, /--ctrl-btn-pill/)
})

test('the card buy button fills with the brand under the hand', () => {
  const src = read('../components/ProductCard.tsx')
  const adds = [...src.matchAll(/<(?:button|a)\b[^>]*\$\{s\.add\}[^>]*>/g)].map((m) => m[0])
  assert.ok(adds.length > 0)
  for (const tag of adds) assert.match(tag, /data-hand="pop"/)
})

test('the hero path row has no lead button; the catalog button says «Shop all»', () => {
  const hero = read('../components/blocks/Hero.tsx')
  assert.match(hero, /'nav\.shopAll'/)
  assert.doesNotMatch(hero, /<CategoryButton\b[^>]*\blead\b/)
  assert.doesNotMatch(read('../components/CategoryButton.tsx'), /data-lead/)
  assert.doesNotMatch(read('../styles/btn.module.css'), /\[data-lead\]/)
})

/* Ряд пути героя: «Shop all» — одна яркая (заливка основного цвета), кнопки полок тихие
   (слово заказчика 08.10.2026: «только Shop all с заливкой и яркой главной, остальные
   кнопки категорий тихие»). Тихая берёт роли тихой кнопки каталога, а не свои. */
test('the hero path row has one bright button — «Shop all»; the shelf buttons are quiet and read the quiet roles', () => {
  const hero = read('../components/blocks/Hero.tsx')
  assert.match(hero, /<CategoryButton name=\{t\(ctx\.lang, 'nav\.shopAll'\)\}/)
  assert.doesNotMatch(hero, /<CategoryButton name=\{t\(ctx\.lang, 'nav\.shopAll'\)\}[^>]*\bquiet\b/)
  assert.match(hero, /<CategoryButton quiet name=\{c\.name\}/)
  assert.match(read('../components/CategoryButton.tsx'), /data-cat=\{quiet \? 'quiet' : ''\}/)
  const css = bare(read('../styles/btn.module.css'))
  assert.match(css, /\.btn\[data-voice='loud'\]\[data-cat='quiet'\]\{\s*--press-bg:var\(--ctrl-btn-fill, transparent\);\s*--press-ink:var\(--ctrl-btn-ink, var\(--ink\)\);\s*--btn-edge:var\(--ctrl-btn-edge, transparent\)\s*\}/)
})

/* Одна тихая — на весь сайт: фишка граней в меню, тихая кнопка каталога и тихая кнопка категории
   читают одни роли — заливку, чернила и кромку оси «Тихая» панели (замер 08.10.2026: кромка
   #c2baab, заливка нет, надпись #231f18, 14/500 у фишки и у кнопки категории). */
test('the chip, the quiet button and the quiet category button read the same quiet roles', () => {
  const chip = bare(read('../styles/primitives.module.css')).match(/(?:^|\})\s*\.chip\{([^}]*)\}/)
  assert.ok(chip, 'правило .chip есть')
  assert.match(chip[1], /background:var\(--ctrl-btn-fill, var\(--ctrl\)\)/)
  assert.match(chip[1], /var\(--ctrl-btn-edge, var\(--rule\)\)/)
  assert.match(chip[1], /font-size:var\(--ctrl-fs-sm\);font-weight:var\(--label-weight\)/)
  const btn = bare(read('../styles/btn.module.css'))
  assert.match(btn, /--btn-edge:var\(--ctrl-btn-edge, transparent\);\s*--press-bg:var\(--ctrl-btn-fill, var\(--quiet\)\)/)
})

/* Форму кнопки решает панель, а не разметка (заказчик 04.10.2026: «кнопки перестали
   реагировать на панель… ты что, им радиус в коде прописал?»): признака `data-pill`
   у кнопок нет. Исключения — кнопка категории (И746): «должны быть только
   пилюлями вне зависимости от других настроек» и «основного цвета, серый тут не
   подходит»; и кнопки-знаки без слова — шапка ряда и `data-pager` (И747 с поправкой
   08.10.2026: «на отзывах квадратные кнопки»). Кнопка со словом угол берёт у панели. */
test('no button with a word forces its form past the panel, except the category pill in the main colour', () => {
  const css = bare(read('../styles/btn.module.css'))
  assert.doesNotMatch(css, /\.btn\[data-pill\]\{[^}]*--btn-r/)
  assert.doesNotMatch(css, /(^|\})\.btn\[data-pager\]\{[^}]*--btn-r/, 'круг знака — одним правилом вместе с шапкой ряда')
  assert.match(css, /\.btn\[data-voice='loud'\]\[data-cat\]\{--btn-r:var\(--r-pop\)\}/)
  assert.match(css, /\.btn\[data-cat\]\{[^}]*--ctrl-btn-fill-pop:var\(--pop\);--ctrl-btn-ink-pop:var\(--on-pop\)/)
  const dir = new URL('../components/', import.meta.url)
  const files = ['RailHead.tsx', 'Pagination.tsx', 'Filters.tsx', 'blocks/Doors.tsx']
  for (const f of files) assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /\bdata-pill\b(?!`)/, f)
})

/* Второе исключение — кнопки шапки ряда (И747; заказчик 04.10.2026: «эти кнопки
   квадратные — плохо… тут нужны пилюли, чтоб не такие массивные были»): листание
   ‹ › и «View all» — круг и пилюля при любом угле Corners. Поправка 08.10.2026
   («на отзывах квадратные кнопки»): кругом и любая кнопка-знак `data-pager` —
   номера и стрелки листания полки, «пуск» видео-отзыва. */
test('the rail head buttons and every sign button (data-pager) stay round past the panel', () => {
  const css = bare(read('../styles/btn.module.css'))
  assert.match(css, /\.btn\[data-rail-nav\],\.btn\[data-pager\]\{--btn-r:var\(--r-pop\)\}/)
  assert.match(read('../components/ReviewPlay.tsx'), /data-pager=""/)
  const head = read('../components/RailHead.tsx')
  assert.match(head, /<a className=\{`\$\{b\.btn\} \$\{s\.wide\}`\} data-rail-nav data-hand="pop" href=\{all\}>/)
  /* На узкой шапке выход — слово (И761): пилюля рядом с кругами листания не помещалась. */
  assert.match(head, /<a className=\{`\$\{go\.go\} \$\{s\.narrow\}`\} href=\{all\}>/)
  const pager = read('../components/RailPager.tsx')
  assert.equal([...pager.matchAll(/<button\b[^>]*\bdata-pager data-rail-nav\b/g)].length, 2)
  assert.doesNotMatch(read('../components/Pagination.tsx'), /\bdata-rail-nav\b/)
})

/* Окно поиска — две группы, поле и список; внутри списка шаг соседних целей (И786). Слово заказчика
   08.10.2026: «а нужны ли тут такие большие зазоры?», «ритм поправь». */
test('the search window keeps two groups: field, then one tight list whose caption and Clear share one text role', () => {
  const css = readFileSync(new URL('../components/SearchPane.module.css', import.meta.url), 'utf8')
  const tsx = readFileSync(new URL('../components/SearchPane.tsx', import.meta.url), 'utf8')
  assert.match(css, /\.body\{display:grid;justify-items:start;gap:var\(--air-line\);padding-block:0 var\(--pad-card\)\}/)
  assert.match(css, /\.list\{justify-self:stretch;display:grid;justify-items:start;gap:var\(--sp-1\)\}/)
  assert.match(css, /\.head,\.clear\{font-size:var\(--ctrl-fs-sm\);font-weight:var\(--label-weight\)\}/)
  assert.match(tsx, /<button className=\{`\$\{b\.word\} \$\{p\.tap\} \$\{s\.clear\}`\}/)
  assert.match(tsx, /<div className=\{s\.list\}>\s*<div className=\{s\.lead\}>/)
})

/* ── Роли по месту (бриф docs/design/кнопки.md, И790) ─────────────────────────────
   Слово заказчика 08.10.2026: «кнопки пагинации не совпадают по дизайну с другими
   кнопками по заливке, сделай единый дизайн кнопок, мы по дизайн-системе делаем».
   Каждое решение таблицы «место → роль» прибито тестом: место, ушедшее от своей
   роли, роняет его. */
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const sources = (dir: string, out: string[] = []): string[] => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) sources(p, out)
    else if (n.endsWith('.tsx')) out.push(p)
  }
  return out
}
const SITE_TSX = [...sources(join(ROOT, 'components')), ...sources(join(ROOT, 'app'))].map((f) => ({ f, src: readFileSync(f, 'utf8') }))

/* Две формы кнопки: пилюля со словом и круг со знаком. Опубликованный вид носит
   близнеца «· pill» своих углов — та же ручка Corners, углы полей, строк и карточек
   прежние (память round-forms-only, образец Allbirds). */
test('the published look wears the pill twin of its corners: buttons with a word are pills, organs keep their corner', () => {
  const look = JSON.parse(read('../lib/source/sample/look.json')) as { names: Record<string, string>; vars: Record<string, string> }
  assert.match(look.names.corners, /-pill$/)
  assert.equal(look.vars['--r-btn'], 'var(--r-pop)')
  assert.notEqual(look.vars['--r-ctrl'], 'var(--r-pop)')
  assert.notEqual(look.vars['--r-card'], 'var(--r-pop)')
})

/* Фишка, которую снимают крестиком, — пилюля везде: выбранные грани над полкой и
   применённый купон (до 08.10.2026 купон стоял углом органа среди пилюль). */
test('every chip with a cross is a pill', () => {
  let n = 0
  for (const { f, src } of SITE_TSX) {
    for (const m of src.matchAll(/<(a|button)\b([^>]*className=\{p\.chip\}[^>]*)>([\s\S]*?)<\/\1>/g)) {
      if (!m[3].includes('<Icon id="x"')) continue
      n++
      assert.match(m[2], /\bdata-pill\b/, `${f}: фишка с крестиком без data-pill`)
    }
  }
  assert.ok(n >= 2, 'фишки с крестиком найдены (грани, купон)')
})

/* Нажатие одно (И273) и у кнопок категорий: знак товара в кружке стоит, поэтому
   кнопка отвечает движением нажатия, как все. Кромка тихой кнопки категории под
   рукой — как у всех тихих (И588). */
test('category buttons press like every button, and the quiet one darkens its edge under the hand', () => {
  const css = bare(read('../styles/btn.module.css'))
  assert.match(css, /\.btn\[data-cat\]:has\(> \.signDot\)\{--ctrl-btn-still:0\}/)
  assert.match(css, /@media \(hover:hover\)\{\s*\.btn\[data-voice='loud'\]\[data-cat='quiet'\]:not\(:disabled, \[aria-disabled='true'\]\):hover\{--btn-edge:var\(--btn-edge-on\)\}\s*\}/)
  assert.match(css, /\.btn\[data-voice='loud'\]\[data-cat='quiet'\]:not\(:disabled, \[aria-disabled='true'\]\):active,\s*\.btn\[data-voice='loud'\]\[data-cat='quiet'\]\[data-press-feedback\]\{--btn-edge:var\(--btn-edge-on\)\}/)
})

/* Варианты товара одеты тихой осью, как счётчик и «Quick order» рядом: заливка и
   надпись — её, ответ на руку — её вуаль (не непрозрачная `--hover-ctrl`); кромка и
   угол — свои, органа (И258: у «Вуали» и «Черты» кромки нет). Фишка под рукой — той же
   вуалью (разбор 08.10.2026, И790). */
test('the variant segment and the chip wear the quiet roles and answer the hand like the quiet button', () => {
  const prim = bare(read('../styles/primitives.module.css'))
  const seg = prim.match(/\.seg :is\(button, a\)\{([^}]*)\}/)
  assert.ok(seg, 'правило сегмента есть')
  assert.match(seg[1], /--seg-fill:var\(--ctrl-btn-fill, var\(--plate-quiet\)\);\s*--seg-ink:var\(--ctrl-btn-ink, var\(--ink\)\);\s*--seg-edge:var\(--edge\)/)
  assert.match(seg[1], /background:var\(--seg-fill\)/)
  assert.match(seg[1], /color:var\(--seg-ink\)/)
  assert.match(seg[1], /box-shadow:inset 0 0 0 var\(--line-w\) var\(--seg-edge\)/)
  assert.match(seg[1], /border-radius:var\(--r-ctrl\)/)
  assert.match(prim, /\.seg :where\(button, a\[href\]\):not\(\[aria-pressed="true"\], \[aria-current="true"\]\):hover\{background:color-mix\(in oklab, var\(--seg-fill\), var\(--seg-ink\) var\(--state-hover\)\);--seg-edge:color-mix\(in oklab, var\(--edge\), var\(--edge-hand\) calc\(var\(--ctrl-btn-hand-edge, 0\) \* 100%\)\)\}/)
  assert.match(prim, /\.seg :where\(button, a\[href\]\):not\(\[aria-pressed="true"\], \[aria-current="true"\]\):active\{background:color-mix\(in oklab, var\(--seg-fill\), var\(--seg-ink\) var\(--state-press\)\)/)
  assert.match(prim, /:where\(a, button\)\.chip:hover\{background:color-mix\(in oklab, var\(--ctrl-btn-fill, var\(--ctrl\)\), var\(--ctrl-btn-ink, var\(--ink\)\) var\(--state-hover\)\)\}/)
  assert.match(prim, /:where\(a, button\)\.chip:active\{background:color-mix\(in oklab, var\(--ctrl-btn-fill, var\(--ctrl\)\), var\(--ctrl-btn-ink, var\(--ink\)\) var\(--state-press\)\);/)
  assert.doesNotMatch(prim, /\.seg [^{]*:(hover|active)\{background:var\(--(hover|press)-ctrl\)/, 'сегмент под рукой без непрозрачной плиты')
})

/* «Вперёд» — знак после слова; «назад» — стрелка назад перед словом и `data-to="back"`. */
test('a forward arrow follows the word; a back arrow comes first and says data-to="back"', () => {
  for (const { f, src } of SITE_TSX) {
    assert.doesNotMatch(src, /<Icon id="arrow-right" \/>\s*(\{|[A-Za-zА-Яа-я])/, `${f}: стрелка вперёд перед словом`)
    for (const m of src.matchAll(/<(a|button|span)\b([^>]*)>\s*<Icon id="arrow-left" \/>/g)) assert.match(m[2], /data-to="back"/, `${f}: стрелка назад без data-to="back"`)
  }
  assert.match(read('../app/[lang]/blog/[slug]/page.tsx'), /<a className=\{go\.go\} data-to="back" href=\{hrefFor\(lang, \{ blog: true \}\)\}><Icon id="arrow-left" \/>/)
  assert.equal([...read('../components/QuickOrder.tsx').matchAll(/\{view\.call\}<Icon id="arrow-right" \/>/g)].length, 2)
})

/* Последнее действие формы — крупная громкая (вход, касса, адрес, отказ от договора).
   Мерится каждая громкая отправка сайта, а не список: новая форма попадает сама.
   Исключение — пара с полем в одну строку (подписка: кнопка ростом поля). */
const FIELD_PAIR = new Set(['Newsletter.tsx'])
test('the last action of a form is the large loud button', () => {
  for (const name of ['AuthForm', 'AddressEdit', 'WithdrawForm', 'MethodForm', 'PointForm', 'AddressForm', 'PaymentForm']) {
    const tags = [...read(`../components/${name}.tsx`).matchAll(/<button\b[^>]*data-voice="loud"[^>]*>/g)].map((m) => m[0]).filter((t) => /type="submit"/.test(t))
    assert.ok(tags.length > 0, `${name}: отправка формы — громкая`)
  }
  let seen = 0
  for (const { f, src } of SITE_TSX) {
    if (FIELD_PAIR.has(f.split(/[\\/]/).pop() ?? '')) continue
    for (const [tag] of src.matchAll(/<button\b[^>]*data-voice="loud"[^>]*>/g)) {
      if (!/type="submit"/.test(tag)) continue
      seen++
      assert.match(tag, /data-size="lg"/, `${f}: ${tag}`)
    }
  }
  assert.ok(seen >= 7, 'громких отправок нашлось не меньше семи форм')
})

/* Кнопка-знак (знак без слова) — `data-pager`: ширину, поле и круг ставит модуль, место —
   только рост и рост знака (`--btn-icon`), не своё правило `svg` весом `.btn svg`. */
test('a sign-only button is a data-pager sign button; places set only height and sign size', () => {
  for (const { f, src } of SITE_TSX) {
    for (const [tag, open] of src.matchAll(/(<(?:a|button|span)\b[^>]*\bb\.btn\b[^>]*>)\s*(?:<Icon id=[^>]*\/>|<Turn \/>)\s*<\/(?:a|button|span)>/g)) {
      assert.match(open, /data-pager/, `${f}: ${tag.slice(0, 120)}`)
    }
  }
  const pane = bare(read('../styles/pane.module.css'))
  assert.match(pane, /\.bar \.close\{--btn-h:var\(--ctrl-target\);--btn-icon:var\(--icon-size\);flex:none\}/)
  assert.doesNotMatch(pane, /\.close svg/)
  const foot = bare(read('../components/Footer.module.css'))
  assert.match(foot, /\.social a\{--btn-h:var\(--ctrl-h\);--btn-icon:calc\(var\(--btn-h\) \* \.55\)\}/)
  assert.doesNotMatch(foot, /\.social svg/)
  const btn = bare(read('../styles/btn.module.css'))
  assert.match(btn, /\.btn svg\{\s*inline-size:var\(--btn-icon, calc\(var\(--btn-h\) \* \.42\)\);block-size:var\(--btn-icon, calc\(var\(--btn-h\) \* \.42\)\)/)
  assert.doesNotMatch(btn.match(/(?:^|\})\s*\.btn\{([^}]*)\}/)?.[1] ?? '', /--btn-icon/, 'у .btn ручки роста знака нет — место её не перебивает весом')
})

/* Место не одевает кнопку: кегль «Lab report», краска «Clear» поиска, поле и знак плиток
   мессенджеров — модуля (свои правила весили как `.btn`/`.word`, решал порядок кусков CSS). */
test('places do not restyle a button: Lab report, search Clear, messenger tiles', () => {
  assert.doesNotMatch(read('../components/ProductView.tsx'), /s\.lab\b/)
  assert.doesNotMatch(bare(read('../components/ProductView.module.css')), /(^|\})\.lab\{/)
  assert.doesNotMatch(bare(read('../components/SearchPane.module.css')).match(/(?:^|\})\s*\.clear\{([^}]*)\}/)?.[1] ?? '', /color:/)
  assert.equal([...read('../components/QuickOrder.tsx').matchAll(/\$\{s\.row\} \$\{rl\.mark\}`\} data-size="lg" data-stack=""/g)].length, 2)
  const quick = bare(read('../components/QuickOrder.module.css'))
  assert.match(quick, /(^|\})\s*\.row\{inline-size:100%;block-size:100%\}/)
  assert.doesNotMatch(quick, /\.row svg/)
  assert.match(bare(read('../styles/btn.module.css')), /\.btn\[data-stack\]\{flex-direction:column;gap:calc\(var\(--btn-h\) \* \.1\);padding:calc\(var\(--btn-h\) \* \.22\) calc\(var\(--btn-h\) \* \.2\);--btn-icon:1\.5em\}/)
})

/* Висящие кнопки (помощь, «наверх») одеты модулем кнопки: круг — кнопка-знак, плита
   и тень — висящая; место ставит только где и какого роста. */
test('the floating help and up buttons are dressed by the button module, not by their place', () => {
  const dock = bare(read('../components/HelpDock.module.css'))
  assert.doesNotMatch(dock, /border-radius|--press-bg|--press-ink|--btn-edge/)
  /* Тень — у висящего, а не у кнопки (И726, И114): роль всплывающего, одной строкой. */
  assert.deepEqual(dock.match(/box-shadow:[^;}]*/g), ['box-shadow:var(--sh-overlay)'])
  const tsx = read('../components/HelpDock.tsx')
  assert.match(tsx, /\$\{s\.top\}`\} type="button" data-pager="" data-float=""/)
  assert.match(tsx, /\$\{s\.knob\}`\} type="button" data-open="sign" data-pager="" data-float="deck"/)
  const css = bare(read('../styles/btn.module.css'))
  assert.match(css, /\.btn\[data-float\]\{--ctrl-btn-fill:var\(--surface\);--ctrl-btn-edge:var\(--rule\);--ctrl-btn-dash:0\}/)
  assert.doesNotMatch(css, /--sh-/, 'у кнопки тени нет (И114)')
  assert.match(css, /\.btn\[data-float='deck'\]\{[^}]*--ctrl-btn-fill:var\(--chrome-bg\);--ctrl-btn-ink:var\(--chrome-fg\);[^}]*--ctrl-btn-edge-hand:var\(--border-deck\)/)
  /* «Пуск» на снимке отзыва — тоже висящая: плиту ставит модуль, место — только где. */
  assert.match(read('../components/ReviewPlay.tsx'), /\$\{s\.play\}`\} data-pager="" data-float="" aria-hidden="true"/)
  assert.doesNotMatch(bare(read('../components/ReviewCard.module.css')).match(/\.play\{([^}]*)\}/)?.[1] ?? '', /--press-|--btn-|background/, 'одежду «пуска» решает модуль')
})

/* «Удалить» в строке — слово одним модулем, разрушительное — краской ошибки под рукой. */
test('remove in a row is a destructive word of the button module', () => {
  const lines = read('../components/CartLines.tsx')
  assert.doesNotMatch(lines, /go\.go/)
  assert.match(lines, /<button className=\{`\$\{b\.word\} \$\{p\.tap\} \$\{s\.drop\}`\} data-hand="bad"/)
  assert.match(read('../components/AddressBook.tsx'), /<button className=\{`\$\{b\.word\} \$\{p\.tap\}`\} data-hand="bad" type="submit" aria-label=\{card\.remove\.aria\}>/)
  const cart = bare(read('../components/Cart.module.css'))
  assert.doesNotMatch(cart, /--go-hover/)
  assert.doesNotMatch(cart.match(/\.drop\{([^}]*)\}/)?.[1] ?? '', /(^|;)color:/, 'краску слова решает модуль')
  const css = bare(read('../styles/btn.module.css'))
  assert.match(css, /@media \(hover:hover\)\{ \.word\[data-hand='bad'\]:not\(:disabled\):not\(\[aria-disabled='true'\]\):hover\{color:var\(--bad\)\} \}/)
  assert.match(css, /\.word\[data-hand='bad'\]:not\(:disabled\):not\(\[aria-disabled='true'\]\):active\{color:var\(--bad\)\}/)
})

/* Метка статьи — не орган: рукой отвечает только фишка-ссылка и фишка-кнопка. Карточка
   способа на кассе отвечает руке кромкой, как карточка полки. Число корзины — полукруг
   от своей высоты, не овал. */
test('a label chip does not answer the hand; a checkout option card does; the cart count is a pill', () => {
  const prim = bare(read('../styles/primitives.module.css'))
  assert.doesNotMatch(prim, /(^|[\s}])\.chip:(hover|active)/m)
  assert.match(prim, /:where\(a, button\)\.chip:hover\{background:/)
  assert.match(prim, /:where\(a, button\)\.chip:active\{background:[^}]*;transform:var\(--press-move\)\}/)
  assert.match(bare(read('../components/Checkout.module.css')), /@media \(hover:hover\)\{ \.option:not\(:has\(input:checked, input:disabled\)\):hover\{box-shadow:inset 0 0 0 var\(--line-w\) var\(--edge-hand\)\} \}/)
  const badge = bare(read('../components/Header.module.css')).match(/\.badge\{([^}]*)\}/)
  assert.ok(badge, 'число корзины есть')
  assert.match(badge[1], /block-size:1\.6em;[^}]*border-radius:calc\(var\(--ctrl-fs-xs\) \* \.8\);[^}]*font-size:var\(--ctrl-fs-xs\)/)
  assert.doesNotMatch(badge[1], /border-radius:50%/)
})
