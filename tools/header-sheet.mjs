/**
 * Лист шапок — все сборки шапки витрины на ЕЁ ЖЕ данных, ноутбук и телефон.
 *
 * Заведён по слову заказчика 14.10.2026 (четвёртая витрина, cbdshop.hr):
 * «дизайн делаем вначале… с шапки… какие варианты у нас в запасе? и давай ещё
 * что-то придумаем, показывай тут… и с этого нужно начинать, правь скилл».
 * До этого порядок вида новой витрины был: цвет → шрифт → знак → главная, а
 * шапку, самую видную поверхность на каждой странице, исполнитель выбирал
 * молча — вариантом умолчания. Шесть сборок лежали в запасе и никому не были
 * показаны; о том, что можно придумать седьмую, заказчик узнал, спросив сам.
 *
 * Что делает. Берёт список сборок из `lib/headers.ts` (HEADERS), по очереди
 * ставит каждую черновиком вида (`lib/source/sample/look.draft.json` + чёрновой
 * режим Next — тот самый, что у панели вида), открывает главную на ноутбуке
 * (1280) и на телефоне (390), снимает шапку и складывает пару в один лист:
 *
 *   out/headers/<сборка>.png     слева ноутбук, справа телефон, имя сверху
 *
 * Листы — для чата: заказчик просит «показывай тут», и картинка в чате
 * (`SendUserFile`) доходит до него без ссылки и без запуска чего-либо
 * (CLAUDE.md, «Работа показывается отрисованной»; снимки в чат — по его
 * слову, а слово здесь дано).
 *
 *   npm run build && LOOK_PICKER=on npm start      (сайт на SITE, по умолчанию :3020)
 *   npm run header:sheet                           все сборки
 *   npm run header:sheet -- --only classic,capsule  часть
 *   npm run header:sheet -- --out листы             куда класть
 *
 * Чего нет. Сайт без панели вида (`npm run look:remove` снял её вместе с
 * черновым режимом) шапок переключать не умеет — инструмент говорит это
 * словами и выходит кодом 2: «не проверено», а не «нарушение». Черновик
 * убирается в конце всегда, и опубликованный вид не трогается.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Сборки шапки из текста `lib/headers.ts`: строки вида `'classic', // …`. */
export function headersOf(text) {
  const block = text.match(/HEADERS\s*=\s*\[([\s\S]*?)\]\s*as const/)?.[1] ?? ''
  return [...block.matchAll(/'([a-z][a-z0-9-]*)'/g)].map((m) => m[1])
}

/** Вид с выбранной сборкой — как его пишет панель: и поле, и имя в `names`. */
export const withHeader = (look, id) => ({ ...look, header: id, names: { ...(look.names ?? {}), header: id } })

/** Страница листа: две картинки рядом и подпись; без внешних адресов. */
export function sheetHtml({ title, desktop, phone }) {
  const frame = 'display:block;border:1px solid #cdd5dc;border-radius:8px'
  return `<body style="margin:0;background:#EEF1F4;font:600 15px system-ui,sans-serif;color:#16212B">
<div style="padding:18px 20px;display:flex;gap:28px;align-items:flex-start;width:1440px;box-sizing:border-box">
<div><div style="margin-bottom:8px">${title} · ноутбук</div><img style="${frame};width:900px" src="data:image/png;base64,${desktop}"></div>
<div><div style="margin-bottom:8px">телефон</div><img style="${frame};width:390px" src="data:image/png;base64,${phone}"></div>
</div></body>`
}

const ARG = (name) => { const i = process.argv.indexOf(`--${name}`); return i === -1 ? null : process.argv[i + 1] ?? null }

async function main() {
  const { loadPlaywright } = await import('./browser.mjs')
  const root = resolve(ARG('root') ?? '.')
  const site = (process.env.SITE ?? 'http://localhost:3020').replace(/\/$/, '')
  const outDir = resolve(ARG('out') ?? 'out/headers')
  const only = (ARG('only') ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  const headersFile = join(root, 'lib/headers.ts')
  const lookFile = join(root, 'lib/source/sample/look.json')
  const draftFile = join(root, 'lib/source/sample/look.draft.json')
  if (!existsSync(headersFile) || !existsSync(lookFile)) {
    console.error('✗ Нет lib/headers.ts или lib/source/sample/look.json — запускать в папке витрины (--root).')
    process.exit(2)
  }
  const all = headersOf(readFileSync(headersFile, 'utf8'))
  const ids = only.length ? all.filter((h) => only.includes(h)) : all
  if (!ids.length) { console.error(`✗ Сборок нет: ${only.join(', ') || 'список HEADERS пуст'}`); process.exit(2) }
  const look = JSON.parse(readFileSync(lookFile, 'utf8'))
  const catalog = existsSync(join(root, 'look-panel/ui/catalog.json')) ? JSON.parse(readFileSync(join(root, 'look-panel/ui/catalog.json'), 'utf8')) : null
  const nameOf = (id) => catalog?.groups?.header?.find((o) => o.id === id)?.name ?? id

  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {})
  mkdirSync(outDir, { recursive: true })
  const written = []
  try {
    for (const id of ids) {
      writeFileSync(draftFile, JSON.stringify(withHeader(look, id), null, 2))
      const shots = {}
      for (const [w, h] of [[1280, 700], [390, 700]]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' })
        const on = await ctx.request.post(`${site}/look-panel/preview`, { headers: { origin: site } })
        if (!on.ok()) {
          console.error(`✗ ${site}/look-panel/preview ответил ${on.status()}: сайт запущен без панели вида — шапки не переключить.`)
          console.error('    Запустить: npm run build && LOOK_PICKER=on npm start (панель вида не снята).')
          process.exitCode = 2
          return
        }
        const page = await ctx.newPage()
        await page.goto(`${site}/en`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)
        const info = await page.evaluate(() => { const hd = document.querySelector('header'); return { variant: hd?.getAttribute('data-variant') ?? null, bottom: Math.round((hd?.getBoundingClientRect().bottom ?? 0) + scrollY) } })
        if (info.variant !== id) {
          console.error(`✗ Сборка «${id}» нарисована как «${info.variant}» — черновик не подхвачен (сайт собран до появления сборки?).`)
          process.exitCode = 2
          return
        }
        shots[w] = (await page.screenshot({ clip: { x: 0, y: 0, width: w, height: Math.min(info.bottom + 56, 460) } })).toString('base64')
        await ctx.close()
      }
      const sheet = await browser.newPage({ viewport: { width: 1440, height: 400 } })
      await sheet.setContent(sheetHtml({ title: nameOf(id), desktop: shots[1280], phone: shots[390] }))
      await sheet.waitForTimeout(150)
      const file = join(outDir, `${id}.png`)
      await sheet.screenshot({ path: file, fullPage: true })
      await sheet.close()
      written.push(file)
      console.log(`✓ ${id} → ${file}`)
    }
  } finally {
    rmSync(draftFile, { force: true })
    await browser.close()
  }
  console.log(`\nЛистов: ${written.length}. Показать заказчику картинками, ноутбук и телефон; сборку, которой нет в запасе, придумать и добавить к ним.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
