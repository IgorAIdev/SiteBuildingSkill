import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SITE, publicPath } from '../lib/sites.ts'

/* Заранее собранная страница сайта отдаёт хукам внутренний путь `/[site]/en/blog`
   (прокладка переписывает адрес), и переключатель языка строил от него `/demo/en/blog` —
   такой страницы нет (check:urls, большая проверка 23.10.2026: 9 адресов). Публичный путь —
   без сегмента сайта. */
test('the public path drops the internal site segment, and only it', () => {
  const site = DEFAULT_SITE.id
  assert.equal(publicPath(`/${site}/en/blog`), '/en/blog')
  assert.equal(publicPath(`/${site}/en`), '/en')
  assert.equal(publicPath('/en/blog'), '/en/blog')
  /* Один сегмент без продолжения — не сайт: публичный адрес начинается с языка. */
  assert.equal(publicPath(`/${site}`), `/${site}`)
  assert.equal(publicPath('/unknown/en'), '/unknown/en')
})
