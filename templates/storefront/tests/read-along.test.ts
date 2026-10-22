import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { alongCount, ALONG_LONG_MINUTES, WORDS_PER_MINUTE } from '../lib/post-view.ts'

/* Товар у статьи (shop, SKILL.md; blocks.md, «Товар у статьи»): одна карточка едет с
   колонкой и сменяется по разделам. Купили: слово заказчика 22.10.2026 («блог для
   продаж; слева карточки товара, чтоб двигались с движением чтения») и два дефекта
   своей первой версии — смена через IntersectionObserver пропускала заголовки при
   скачке, через кадр анимации не шла в фоновой странице. Тем же днём: одна полная
   карточка главной вместо троек строк, смена на месте проявлением вместо уезда вверх,
   под карточкой — только точки и имя раздела, товаров два или три по длине статьи. */
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

test('one card shows; the hidden ones cannot be reached; the change fades in place', () => {
  assert.match(css, /\.slot\{grid-area:1 \/ 1;visibility:hidden;opacity:0\}/, 'карточки одна на другой, скрытые — visibility')
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*\.slot\{transition:opacity var\(--open-t\)/, 'смена проявлением — только без «уменьшить движение»')
  assert.doesNotMatch(css, /translate/, 'карточка не едет навстречу тексту')
})

test('the article sends the home product card, two or three by the length of the article', () => {
  assert.match(page, /<ReadAlong heads=\{doc\.toc\?\.items \?\? \[\]\}[\s\S]*?\{cards\.slice\(0, alongCount\(post\)\)\.map\(\(c\) => <ProductCard key=\{c\.id\} card=\{c\} cart=\{CART\} \/>/)
})

test('under the card: plain dots of the site pointer and the section name; products go in order', () => {
  assert.match(tsx, /<Dots [\s\S]*? plain \/>/, 'точки — указатель сайта без ползунка')
  assert.match(tsx, /Math\.floor\(\(section \* cards\.length\) \/ Math\.max\(1, heads\.length\)\)/, 'части статьи по порядку, не по кругу')
})

const post = (words: number) => ({ tldr: null, faq: [], sections: [{ heading: '', body: Array.from({ length: words }, () => 'word').join(' ') }] }) as never

test('a short article takes two products along the reading, a long one three', () => {
  assert.equal(alongCount(post(WORDS_PER_MINUTE * (ALONG_LONG_MINUTES - 1))), 2)
  assert.equal(alongCount(post(WORDS_PER_MINUTE * ALONG_LONG_MINUTES)), 3)
})
