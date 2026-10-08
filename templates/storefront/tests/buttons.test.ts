import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

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
   у кнопок нет, круг листания берёт угол той же оси. Исключение одно — кнопка
   категории (И746): «должны быть только пилюлями вне зависимости от других настроек»
   и «основного цвета, серый тут не подходит». */
test('no button forces its form past the panel, except the category pill in the main colour', () => {
  const css = bare(read('../styles/btn.module.css'))
  assert.doesNotMatch(css, /\.btn\[data-(?:pill|pager)\]\{[^}]*--btn-r/)
  assert.match(css, /\.btn\[data-voice='loud'\]\[data-cat\]\{--btn-r:var\(--r-pop\)\}/)
  assert.match(css, /\.btn\[data-cat\]\{[^}]*--ctrl-btn-fill-pop:var\(--pop\);--ctrl-btn-ink-pop:var\(--on-pop\)/)
  const dir = new URL('../components/', import.meta.url)
  const files = ['RailHead.tsx', 'Pagination.tsx', 'Filters.tsx', 'blocks/Doors.tsx']
  for (const f of files) assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /\bdata-pill\b(?!`)/, f)
})

/* Второе исключение — кнопки шапки ряда (И747; заказчик 04.10.2026: «эти кнопки
   квадратные — плохо… тут нужны пилюли, чтоб не такие массивные были»): листание
   ‹ › и «View all» — круг и пилюля при любом угле Corners; круги номеров листания
   полки угол берут из Corners, как все. */
test('the rail head buttons stay round past the panel; page numbers do not', () => {
  const css = bare(read('../styles/btn.module.css'))
  assert.match(css, /\.btn\[data-rail-nav\]\{--btn-r:var\(--r-pop\)\}/)
  const head = read('../components/RailHead.tsx')
  assert.match(head, /<a className=\{`\$\{b\.btn\} \$\{s\.wide\}`\} data-rail-nav data-hand="pop" href=\{all\}>/)
  /* На узкой шапке выход — слово (И761): пилюля рядом с кругами листания не помещалась. */
  assert.match(head, /<a className=\{`\$\{go\.go\} \$\{s\.narrow\}`\} href=\{all\}>/)
  const pager = read('../components/RailPager.tsx')
  assert.equal([...pager.matchAll(/<button\b[^>]*\bdata-pager data-rail-nav\b/g)].length, 2)
  assert.doesNotMatch(read('../components/Pagination.tsx'), /\bdata-rail-nav\b/)
})
