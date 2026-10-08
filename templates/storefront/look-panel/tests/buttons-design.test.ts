import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Дизайн-система показывает каждую роль настоящей кнопкой сайта (память
   design-system-shows-all, И790): плитки «Роли кнопок» первыми на вкладке, классы
   модуля и компоненты сайта, надписи — словарём языка, без своих красок. Тест панели —
   уходит вместе с ней (`npm run test:panel`), в тестах сайта следа панели нет (И352). */
const tab = readFileSync(new URL('../design/Buttons.tsx', import.meta.url), 'utf8')

test('the design system shows every button role with the real site button, first on the Buttons tab', () => {
  const list = tab.slice(tab.indexOf('export async function ButtonList'))
  const at = list.indexOf('title="Роли кнопок"')
  assert.ok(at > 0 && at < list.indexOf('<ShapeSets'), 'роли — первыми')
  const roles = tab.slice(tab.indexOf('function roleList'), tab.indexOf('export async function ButtonList'))
  for (const sample of [
    /data-voice="loud" type="button">\{t\(lang, 'cart\.add'\)\}/, /data-voice="loud" data-size="lg"/,
    /<button className=\{b\.btn\} type="button">\{t\(lang, 'cart\.open'\)\}/, /data-hand="pop"/, /data-voice="bare"/,
    /className=\{b\.word\} href/, /className=\{`\$\{b\.word\} \$\{p\.tap\}`\} data-hand="bad"/,
    /className=\{go\.go\} href/, /className=\{go\.go\} data-to="back"/, /<Pagination pages=\{PAGES\} \/>/,
    /className=\{p\.chip\} data-pill=""/, /<CategoryButton name=\{shopAll\}/, /<CategoryButton quiet/, / disabled>/,
  ]) assert.match(roles, sample)
  assert.doesNotMatch(roles, /style=\{/, 'плитки ролей без своих красок')
  assert.doesNotMatch(roles, /type="button">[A-Z][a-z]/, 'надписи — словарём языка, не английским текстом в плитке')
  assert.match(list, /<HelpDock bare /)
})

/* Плитка «на сайте» — только то, что сайт носит: низ корзины — пара тихой и громкой
   (И772), слова «Открыть корзину» под оформлением больше нет. */
test('the design system does not mark a button the site no longer wears', () => {
  assert.doesNotMatch(tab, /Открыть корзину/)
})
