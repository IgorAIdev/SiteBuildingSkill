import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Раскрытия пунктов шторки меню — один путь рисования (слово заказчика 23.10.2026: «а чего
   подменю эффекты вылезли левее, а подменю oil правильно сделано, где единообразие, уже сто
   раз говорил»). У эффектов была своя ветка — список без обёртки группы, и голый ноль поля
   строк ломал сумму их поля: строки стояли на двенадцать левее строк масел. Отрисованный
   двойник — check:craft `foldIndent`, ноль без единицы — check:css `zeroLength`. */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const nav = read('../components/NavLinks.tsx')
const head = read('../components/Header.module.css').replace(/\/\*[\s\S]*?\*\//g, '')
const fold = nav.slice(nav.indexOf('function Fold('), nav.indexOf('export function NavLinks('))

test('every fold of the phone menu is drawn by one path: effects are a facet group without a label', () => {
  assert.match(fold, /const groups: FoldGroup\[\] = link\.facets\.length \? link\.facets : \[\{ name: null, links: link\.kids \}\]/)
  assert.equal(fold.match(/className=\{m\.list\}/g)?.length, 2, 'список групп и строка «View all» — других списков в раскрытии нет')
  assert.doesNotMatch(fold, /link\.kids\.map/, 'своей ветки у эффектов нет')
})

test('the fold rows inset zero carries its unit, so the row padding sum stays valid', () => {
  assert.match(head, /\.paramsPanel:not\(\[hidden\]\)\{[^}]*--menu-inset:0px\s*\}/)
})
