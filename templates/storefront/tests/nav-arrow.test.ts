import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/* Стрелка — только у того, что раскрывается (И779). Заказчик 08.10.2026: «правило
   „стрелка только у раскрывающихся“ — нужно такое правило». Ссылки шторки меню
   носили декоративный уголок справа, и пункт, который просто ведёт на полку,
   выглядел как пункт с подменю (снято правкой #101). Знак раскрытия (`Turn`) стоит
   внутри того, что раскрывает: `<summary>` или кнопки окна и подменю; ссылка его не
   носит. */
const DIR = fileURLToPath(new URL('../components/', import.meta.url))
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : []))

/** Самый внутренний из `<summary>`, `<button>`, `<a>`, открытый в месте `at`. */
function holder(src: string, at: number): string | null {
  const stack: string[] = []
  for (const m of src.slice(0, at).matchAll(/<(\/?)(summary|button|a)(?=[\s>])/g)) {
    if (m[1]) { const i = stack.lastIndexOf(m[2]); if (i >= 0) stack.splice(i) } else stack.push(m[2])
  }
  /* Самозакрытый `<a … />` в разметке витрины не встречается; открытый без пары — ошибка сборки. */
  return stack.at(-1) ?? null
}

test('the disclosure arrow sits only on what opens: summary or a button, never a link', () => {
  const wrong: string[] = []
  for (const path of files(DIR)) {
    if (path.endsWith('Turn.tsx')) continue
    const src = readFileSync(path, 'utf8')
    for (const m of src.matchAll(/<Turn\b/g)) {
      const who = holder(src, m.index)
      if (who !== 'summary' && who !== 'button') wrong.push(`${path.slice(DIR.length)}: знак раскрытия внутри ${who ?? 'ничего'}`)
    }
  }
  assert.deepEqual(wrong, [])
})

test('menu, header, footer and search links carry no decorative chevron', () => {
  const wrong: string[] = []
  for (const name of ['NavLinks.tsx', 'Header.tsx', 'MenuFoot.tsx', 'Footer.tsx', 'SearchPane.tsx']) {
    const src = readFileSync(join(DIR, name), 'utf8')
    for (const m of src.matchAll(/<Icon id="chevron-[a-z]+"/g)) {
      if (holder(src, m.index) === 'a') wrong.push(`${name}: уголок у ссылки`)
    }
  }
  assert.deepEqual(wrong, [])
})

test('in the menu a link opens nothing: the arrow belongs to the expand buttons only', () => {
  const src = readFileSync(join(DIR, 'NavLinks.tsx'), 'utf8')
  const link = src.slice(src.indexOf('<a className={b.word} data-hand="menu" href={l.href}'))
  const body = link.slice(0, link.indexOf('</a>'))
  assert.doesNotMatch(body, /<Turn|<Icon id="(chevron|arrow)-/, 'ссылка пункта меню без стрелки')
  assert.match(src, /\{l\.menu \? \([\s\S]*?<button[\s\S]*?<Turn \/>/, 'стрелка — у кнопки граней полки с подменю')
  assert.match(src, /\{drops \? \([\s\S]*?<button[\s\S]*?data-drop-arrow[\s\S]*?<Turn \/>/, 'стрелка — у кнопки выпадающего списка')
})
