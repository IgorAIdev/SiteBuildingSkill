import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'

/* Меню — одно устройство (И730): строки каждого раскрытия сайта — список меню
   набора (styles/menu.module.css), выбранное — галочкой. До 04.10.2026 у каждого
   меню были свои строки, и они расходились: пять ростов и кеглей, четыре вида
   выбранного. Проверка не даёт нарисовать раскрытие второй раз. */
const dir = new URL('../components/', import.meta.url)
const files = readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => [f, readFileSync(new URL(f, dir), 'utf8')] as const)

test('every popover list of links takes the menu list of the kit', () => {
  const bad: string[] = []
  for (const [f, src] of files) {
    for (const m of src.matchAll(/<ul\b[^>]*\bpopover=[^>]*>/g)) if (!/\bm\.list\b/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 90)}`)
  }
  assert.deepEqual(bad, [])
})

test('the old menu rows (`options` of Filters) are gone', () => {
  const css = readFileSync(new URL('Filters.module.css', dir), 'utf8')
  assert.doesNotMatch(css, /^\.options\b/m)
  for (const [f, src] of files) assert.doesNotMatch(src, /fs\.options/, f)
})

test('menu rows answer the hand as rows', () => {
  const bad: string[] = []
  for (const [f, src] of files) {
    for (const m of src.matchAll(/<ul\b[^>]*\bm\.list\b[^>]*>([\s\S]*?)<\/ul>/g)) {
      if (/<a\b(?![^>]*\bb\.row\b)[^>]*>/.test(m[1])) bad.push(f)
    }
  }
  assert.deepEqual(bad, [])
})

test('a menu shows the chosen row with a mark, not a plate', () => {
  /* Модуль меню кладёт в сайт установщик из styles/ набора. */
  const css = readFileSync(new URL('../styles/menu.module.css', import.meta.url), 'utf8')
  assert.match(css, /\[aria-current\][^{]*::after\{[^}]*--sign-mask-check/)
  assert.doesNotMatch(css, /\[aria-current[^\]]*\][^{]*\{[^}]*background:var\(--quiet-tint\)/)
})

/* Список меню сам бывает раскрытием (`ul popover`): своя раскладка у него сильнее
   браузерного «закрытое не видно», и закрытые меню вставали в угол страницы (И733). */
test('the menu list declares no display of its own', () => {
  const css = readFileSync(new URL('../styles/menu.module.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const list = css.match(/(?:^|\})\s*\.list\{([^}]*)\}/)
  assert.ok(list, 'правило .list есть')
  assert.doesNotMatch(list[1], /display\s*:/)
})

/* «Открыто» у кнопки раскрытия — в доме вида предмета, не в модуле места (И733). */
test('no component module writes the open state of a trigger', () => {
  const bad = readdirSync(dir).filter((f) => f.endsWith('.module.css'))
    .filter((f) => /:popover-open\)[^{]*\{[^}]*--press-bg/.test(readFileSync(new URL(f, dir), 'utf8')))
  assert.deepEqual(bad, [])
})

/* Кнопка, у которой «открыто» говорит знак, краски не меняет: заливка створки
   делала тёмную кнопку помощи серой полупрозрачной (слово заказчика 04.10.2026;
   И733, п. 2). Смену знака ведёт модуль кнопки, а не место. */
test('a button that shows open by its sign keeps its paint', () => {
  const btn = readFileSync(new URL('../styles/btn.module.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.match(btn, /\.btn:not\(\[data-voice='bare'\], \[data-open='sign'\]\):has\(\+ :popover-open\)\{--press-bg:var\(--quiet-on\)\}/)
  const dock = readFileSync(new URL('HelpDock.tsx', dir), 'utf8')
  assert.match(dock, /s\.knob\}`\} type="button" data-open="sign"/)
  assert.doesNotMatch(readFileSync(new URL('HelpDock.module.css', dir), 'utf8'), /:popover-open/)
})

/* Строки под подписью группы — с отступом от неё (слово заказчика 04.10.2026: «то,
   что под заголовком, должно быть чуть смещено вправо»; И730, п. 3): сдвигается
   слово строки, подложка остаётся во всю бумагу. */
test('rows under a group label are inset from it', () => {
  const menu = readFileSync(new URL('../styles/menu.module.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.match(menu, /\.group ~ :is\(\.list, \.fold\)\{--menu-inset:var\(--sp-\d+\)\}/)
  assert.match(menu, /padding-inline:calc\(var\(--pad-inner\) \+ var\(--menu-inset, 0px\)\) var\(--pad-inner\)/)
})

/* Подложка строки под рукой — одной формы на все меню (слово заказчика 04.10.2026:
   «в одном меню под рукой пилюля, в другом прямоугольник… делай прямоугольник»).
   Форма — у вида «строка», прямоугольник углом контрола; меню угла строке не пишет. */
test('the row plate has one shape, owned by the row view', () => {
  const btn = readFileSync(new URL('../styles/btn.module.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.match(btn, /(?:^|\})\s*\.row\{[^}]*border-radius:var\(--r-ctrl\)/)
  const menu = readFileSync(new URL('../styles/menu.module.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(menu, /border(?:-[a-z]+)*-radius\s*:/)
})
