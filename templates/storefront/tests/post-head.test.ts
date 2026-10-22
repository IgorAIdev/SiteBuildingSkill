import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Шапка статьи: над именем — ничего, подпись — одна группа (craft, SKILL.md, «Над
   именем страницы — ничего, кроме крошек»; layout.md, «Шапка страницы: имя первым,
   подпись одной группой»). Купил дефект: рубрика над h1 вплотную к заглавным, её
   черта на буквах, 40 от крошек и 0 до имени; автор и даты — двумя блоками через
   воздух строки (заказчик 22.10.2026: «что за пиздец в блоге»). */
const src = readFileSync(new URL('../components/PostParts.tsx', import.meta.url), 'utf8')
const head = src.slice(src.indexOf('export function PostHead'), src.indexOf('export function PostIntro'))
const body = head.slice(head.indexOf('return ('))

test('the article head starts with its name: nothing stands above the h1', () => {
  const first = body.match(/<(\w+)[\s>]/g)?.filter((t) => t !== '<>' )[0]
  assert.equal(first, '<h1>', 'первым в шапке статьи — имя (h1); рубрика — в строке данных')
})

test('author and dates are one byline note, the topic a link inside it', () => {
  assert.equal((body.match(/p\.note/g) ?? []).length, 1, 'подпись — одна сноска, а не две строки через воздух')
  const byline = body.slice(body.indexOf('p.note'))
  assert.match(byline, /topic\.href/, 'рубрика — ссылкой в подписи')
})
