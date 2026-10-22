import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/* Крошки — на каждой странице глубже первого уровня и одним компонентом (shop,
   SKILL.md, «Каталог и полка»; blocks.md, «Где стоят крошки»). Купил дефект:
   заказчик 22.10.2026 — «в каких-то случаях крошки показывают, в каких-то нет»:
   у рубрики блога были, у полки «CBD oil» и страницы эффекта — нет (разбор
   28.09.2026, п. 6, так и не закрыт), а «Home» и разметку каждая из шести
   страниц собирала сама. */
/* Дерево набора — app/[site]/[lang]; у магазина одного сайта — app/[lang]. */
const kit = fileURLToPath(new URL('../app/[site]/[lang]/', import.meta.url))
const root = existsSync(kit) ? kit : fileURLToPath(new URL('../app/[lang]/', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const pages = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n)
  return statSync(p).isDirectory() ? pages(p) : n === 'page.tsx' ? [relative(root, p).split(sep).join('/')] : []
})

/* Глубже первого уровня — крошки страницы (`PageCrumbs`); товар собирает цепочку
   из своей полки в представлении и рисует тем же `Breadcrumbs` (ProductView). */
const WITH = ['catalog/[cat]/page.tsx', 'effect/[effect]/page.tsx', 'blog/topic/[topic]/page.tsx', 'blog/[slug]/page.tsx', 'info/[doc]/page.tsx', 'withdraw/page.tsx']
/* Главная, первый уровень, поиск, корзина, кабинет, избранное, конец заказа —
   без крошек: «Home / Blog» повторяет меню, у выдачи нет места в дереве,
   оформление закрыто от навигации. */
const WITHOUT = ['page.tsx', 'catalog/page.tsx', 'blog/page.tsx', 'search/page.tsx', 'cart/page.tsx', 'saved/page.tsx', 'checkout/done/page.tsx']

test('every page below the first level shows the crumbs, through PageCrumbs', () => {
  for (const f of WITH) assert.match(read(f), /<PageCrumbs lang=\{lang\}/, `${f}: крошки страницы — PageCrumbs`)
  assert.match(read('product/[id]/page.tsx'), /breadcrumbLd\(view\.crumbs/, 'товар: разметка из цепочки представления')
})

test('the home page, first-level pages, search, cart and account show no crumbs', () => {
  const quiet = [...WITHOUT, ...pages(root).filter((f) => f.startsWith('account/'))]
  for (const f of quiet) assert.doesNotMatch(read(f), /Breadcrumbs|PageCrumbs/, `${f}: крошек здесь нет`)
})

test('a page does not assemble the chain or its BreadcrumbList itself', () => {
  for (const f of pages(root).filter((x) => x !== 'product/[id]/page.tsx')) {
    const src = read(f)
    assert.doesNotMatch(src, /breadcrumbLd\(|trailTo\(|'crumb\.home'/, `${f}: цепочку собирает PageCrumbs (components/Breadcrumbs.tsx)`)
  }
})

test('every page is sorted into one of the two lists', () => {
  /* Страницы группы маршрутов в скобках (дизайн-система) — не магазин: их снимает
     панель вида вместе с собой, и имя панели в тесте оставалось бы её следом
     (проверка снятия панели, большая проверка 23.10.2026). */
  const known = new Set([...WITH, ...WITHOUT, 'product/[id]/page.tsx'])
  const loose = pages(root).filter((f) => !known.has(f) && !f.startsWith('account/') && !/^\([^)]+\)\//.test(f))
  assert.deepEqual(loose, [], 'новая страница: решить, нужны ли ей крошки, и вписать её в WITH или WITHOUT')
})
