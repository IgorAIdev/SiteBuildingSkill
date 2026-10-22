import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

/* Товар у статьи (shop, SKILL.md; blocks.md, «Товар у статьи»): одна карточка едет с
   колонкой и сменяется по разделам. Купили: слово заказчика 22.10.2026 («блог для
   продаж; слева карточки товара, чтоб двигались с движением чтения») и два дефекта
   своей первой версии — смена через IntersectionObserver пропускала заголовки при
   скачке, через кадр анимации не шла в фоновой странице. */
const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
const tsx = read('../components/ReadAlong.tsx')
const css = read('../components/ReadAlong.module.css').replace(/\/\*[\s\S]*?\*\//g, '')
const kit = new URL('../app/[site]/[lang]/blog/[slug]/page.tsx', import.meta.url)
const page = readFileSync(existsSync(kit) ? kit : new URL('../app/[lang]/blog/[slug]/page.tsx', import.meta.url), 'utf8')

test('the card is picked on scroll by the last heading above 40 % of the window', () => {
  assert.match(tsx, /addEventListener\('scroll', pick, \{ passive: true \}\)/, 'смена — в обработчике прокрутки')
  assert.doesNotMatch(tsx.replace(/\/\*[\s\S]*?\*\//g, ''), /IntersectionObserver|requestAnimationFrame/, 'без пересечений и кадра анимации')
  assert.match(tsx, /window\.innerHeight \* 0\.4/)
})

test('one card shows; the hidden ones cannot be reached; motion yields to reduced motion', () => {
  assert.ok(css.includes('.slot{grid-area:1 / 1;visibility:hidden;opacity:0}'), 'карточки одна на другой, скрытые — visibility')
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*transition:opacity/, 'проявление — только без «уменьшить движение»')
})

test('the article sends the product cards to the column, drawn by ProductCard', () => {
  assert.match(page, /side=\{shelf && cards\.length \? <ReadAlong[\s\S]*?\{cards\.slice\(0, 4\)\.map\(\(c\) => <ProductCard /)
})
