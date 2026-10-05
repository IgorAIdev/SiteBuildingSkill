import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sampleContent } from '../lib/source/sample/content.ts'
import { PRODUCTS } from '../lib/products.ts'

test('home page blocks exist in every language, in one order, and point at real products', async () => {
  for (const lang of ['ro', 'en', 'hu'] as const) {
    const r = await sampleContent.page(lang, 'home')
    assert.ok(r.ok, lang)
    assert.deepEqual(r.value.blocks.map((b) => b.type), ['hero', 'effects', 'featured', 'featured', 'featured', 'reviews', 'story', 'posts', 'faq'])
    for (const b of r.value.blocks) if (b.type === 'featured') for (const id of b.ids) assert.ok(PRODUCTS.some((p) => p.id === id), id)
    /* Герой лежит поверх широкого снимка — снимок у него свой, а не первая
       карточка полки (флакон во весь экран под заголовком). */
    const hero = r.value.blocks.find((b) => b.type === 'hero')
    assert.ok(hero?.type === 'hero' && hero.image.width > hero.image.height, `${lang}: снимок героя широкий`)
    /* Кнопками героя — все полки магазина (И735, пересмотр И673): на широком ряд
       переносится вторым рядом, на телефоне едет вбок одной полосой (`data-rail="wrap"`) —
       первый экран не съедает (И595). */
    assert.ok(hero?.type === 'hero' && hero.shelves === 'all', `${lang}: у героя все полки магазина`)
  }
})

/* Сколько вопросов в блоке — норма страницы (И719; скилл shop,
   references/blocks.md, «Сколько вопросов»): на главной 6–8 и все видны,
   под статьёй — от трёх; одним списком больше десяти не бывает — дальше
   темами. Четыре вопроса на главной стояли при семи у cibdol.com. */
test('FAQ blocks hold as many questions as their page needs', async () => {
  for (const lang of ['ro', 'en', 'hu'] as const) {
    const home = await sampleContent.page(lang, 'home')
    assert.ok(home.ok, lang)
    for (const b of home.value.blocks) if (b.type === 'faq') assert.ok(b.items.length >= 6 && b.items.length <= 8, `${lang}: на главной ${b.items.length} вопросов, норма 6–8`)
    const posts = await sampleContent.posts(lang)
    assert.ok(posts.ok, lang)
    for (const p of posts.value) assert.ok(p.faq.length === 0 || (p.faq.length >= 3 && p.faq.length <= 10), `${lang}/${p.slug}: под статьёй ${p.faq.length} вопросов, норма 3–10 или ни одного`)
  }
})

/* Протокол на главной ведёт к САМОМУ документу, а не к якорю на той же
   странице: обещание «протокол на каждую партию» проверяется открытием. */
test('the required pages exist in every language', async () => {
  for (const lang of ['ro', 'en', 'hu'] as const) {
    const r = await sampleContent.docs(lang)
    assert.ok(r.ok)
    /* Документы румынского магазина (И748): условия, данные, cookie, возврат, гарантия,
       доступность, анализы — и страницы магазина. */
    assert.deepEqual(r.value.map((d) => d.slug).sort(), ['accesibilitate', 'analize-de-laborator', 'confidentialitate', 'contact', 'cookie-uri', 'despre-noi', 'garantie', 'livrare-si-plata', 'retur', 'termeni'])
    for (const d of r.value) assert.ok(d.title && d.summary && d.sections.length >= 2, `${lang}/${d.slug}`)
  }
  assert.deepEqual(await sampleContent.doc('ro', 'nu-exista'), { ok: false, reason: 'not-found' })
})
