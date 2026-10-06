/**
 * Один вид во всех браузерах — отрисованная проверка (И630).
 *
 * Заведена по дефекту 01.10.2026. Кнопки категорий вырезали знак в кружке
 * маской по знаку из общего листа. Во встроенном Chromium набора, в
 * headless-прогоне и в просмотре сессии всё было верно; у заказчика в его
 * Chrome вместо знаков косметики и животных стояла стрелка. Ни одна проверка
 * этого не видела: `check:craft` и `sweep` ходят одним браузером, и «верно у
 * меня» читалось как «верно».
 *
 * Эта проверка открывает те же страницы всеми браузерами, какие есть на
 * машине (`machineEngines` в `browser.mjs`: Chrome и Edge — по их путям, встроенный
 * Chromium, Firefox — свой у Playwright или системный, WebKit), и сравнивает кадры
 * клеткой за клеткой. Клетка, где другой браузер нарисовал заметно иное, —
 * находка: она называет страницу, браузер, плотность пикселей, место и
 * элемент под ним. Тонкие различия сглаживания шрифта порог не берёт.
 *
 *   SITE=http://localhost:3020 node tools/check-engines.mjs [путь …]
 *
 * Пути — аргументами или `ENGINE_PAGES=путь,путь`; без них — `/`. Один
 * браузер на машине — это «не проверено» (код 2), а не «всё хорошо»:
 * проверка, которой не с чем сравнить, молчать не вправе.
 */

import { loadPlaywright, loadSharp, machineEngines } from './browser.mjs'

const SITE = (process.env.SITE ?? process.env.CHECK_SITE ?? 'http://localhost:3000').replace(/\/$/, '')
const PAGES = (process.argv.slice(2).length ? process.argv.slice(2) : (process.env.ENGINE_PAGES ?? '/').split(',')).map((p) => p.trim()).filter(Boolean)
const DPRS = (process.env.ENGINE_DPR ?? '1,1.5').split(',').map(Number)
/** Клетка в пикселях страницы и порог средней разницы каналов в ней. */
const CELL = 24
const LIMIT = Number(process.env.ENGINE_LIMIT ?? 14)
/** Не-Chromium (WebKit, Firefox) рисуют буквы своим растеризатором: порог выше, чтобы
 *  сглаживание шрифта не считалось находкой, а пропавший или чужой знак — считался. */
const LIMIT_OTHER = Number(process.env.ENGINE_LIMIT_OTHER ?? 48)
/** Сколько клеток-находок на кадр печатать. */
const SHOW = 8

const pw = await loadPlaywright()
const sharp = await loadSharp()

/** Браузеры машины (`machineEngines`, И774): первый — эталон. Эталон — настоящий Chrome, а не встроенный
 *  headless-Chromium: рамки с самоподгонкой высоты («Элементы») у него растут иначе
 *  и по ним расходились все остальные браузеры сразу; настоящие Chrome, Edge и WebKit
 *  сходятся между собой. Встроенный — в списке, но не эталон. */
const { engines, notSet } = await machineEngines(pw, 'chromium (набора)')

async function shoot(engine, path, dpr) {
  const browser = await engine.type.launch(engine.opts)
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr })).newPage()
    await page.goto(SITE + path, { waitUntil: 'load', timeout: 60000 })
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    /* Слайды и переходы стоят: замер сравнивает вид, а не фазу движения. */
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;hyphens:manual!important}iframe{visibility:hidden!important;block-size:200px!important}html{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important}code,kbd,pre,samp,[class*=hex]{font-family:"Courier New",monospace!important}' })
    /* Рамки с образцами («Элементы») — отдельные документы со своей подгонкой высоты
       по содержимому: у каждого браузера она кончается в свой миг. Их вид проверяется по
       их собственным адресам; здесь рамка — пустое место одной высоты. */
    /* Моноширинный шрифт у каждого браузера свой (Chrome — Consolas, встроенный
       Chromium — другой): подпись-код в плитках выходила выше на 20px. Это шрифт
       системы, а не вёрстка набора. */
    /* Автоперенос слов — словарь браузера, а не вид: у встроенного Chromium
       его нет, у Chrome есть, и подвал ложился иначе на «di-agnose». */
    /* Прилипшее и плавающее (панель вида, чат помощи, шапка) в снимке во всю
       страницу ложится на разные места у разных браузеров — это не вид
       страницы, и сравнению оно мешает. */
    await page.evaluate(() => {
      for (const e of document.querySelectorAll('body *')) {
        const p = getComputedStyle(e).position
        if (p === 'fixed' || p === 'sticky') e.style.visibility = 'hidden'
      }
    })
    /* Прокрутка мгновенная: у сайта `html{scroll-behavior:smooth}`, и шаг в 120 мс
       не доезжал — снимки отзывов и статей ниже 3700 px у одного браузера
       подгружались, у другого нет (601 клетка «рисуются иначе», 05.10.2026).
       Ленивые рамки и снимки (`loading=lazy`) грузятся у каждого браузера по
       своему порогу прокрутки: пока страницу не пролистали, одна рамка уже
       выросла по содержимому, другая стоит в высоте по умолчанию. Проход до
       низа и обратно уравнивает это — сравнивается страница, а не порог. */
    await page.evaluate(async () => {
      const step = Math.max(400, Math.floor(innerHeight * 0.8))
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)) }
      scrollTo({ top: 0, behavior: 'instant' })
    })
    /* Страница стоит, когда её высота не меняется 1.2 секунды подряд: рамки
       «Элементов» подгоняют высоту по содержимому, снимки подгружаются — кадр,
       снятый на полпути, у каждого браузера свой, и проверка мигала. */
    await page.evaluate(async () => {
      let last = -1, still = 0
      for (let i = 0; i < 50 && still < 4; i++) {
        await new Promise((r) => setTimeout(r, 300))
        const h = document.documentElement.scrollHeight
        still = h === last ? still + 1 : 0
        last = h
      }
    })
    const png = await page.screenshot({ fullPage: true })
    const version = browser.version()
    const probe = (x, y) => page.evaluate(([px, py]) => {
      const e = document.elementFromPoint(px, py)
      if (!e) return ''
      const c = [...e.classList].map((k) => k.replace(/^.*__/, '').replace(/__.*$/, '')).slice(0, 2).join('.')
      return `${e.tagName.toLowerCase()}${c ? '.' + c : ''}${e.textContent && e.children.length === 0 ? ` «${e.textContent.trim().slice(0, 24)}»` : ''}`
    }, [x, y])
    return { png, version, probe, page }
  } catch (error) {
    await browser.close()
    throw error
  }
}

/* К сдаче (`check:all -- --final` ставит `ENGINES_REQUIRE=all`) нужны все
   пять: Chrome, Edge, встроенный Chromium, Firefox и WebKit (слово заказчика
   01.10.2026: «во всех браузерах проверять при финальной проверке»). Недостающий
   — «не проверено», а не «хорошо»: код 2. */
if (process.env.ENGINES_REQUIRE === 'all') {
  const need = ['chrome', 'edge', 'firefox', 'webkit'].filter((n) => !engines.some((e) => e.name === n))
  if (need.length) {
    console.error(`
✗ К сдаче нужны все браузеры, нет: ${need.join(', ')} — проверка НЕ ПРОВЕДЕНА.`)
    console.error('    Firefox и WebKit: `npx playwright install firefox webkit`; Chrome и Edge — в системе.')
    process.exit(2)
  }
}

if (engines.length < 2) {
  console.error(`\n✗ Браузер один (${engines[0].name}) — сравнивать не с чем, проверка НЕ ПРОВЕДЕНА.`)
  console.error('    Поставить второй: Chrome или Edge в системе, либо `npx playwright install firefox webkit`.')
  process.exit(2)
}

/* Первый снимок любой страницы снимается на холодном сервере (сервер разработки
   собирает страницу, кэши пусты) и выходит иным: эталон, снятый первым, расходился
   со всеми остальными. Каждая страница обходится один раз вхолостую. */
for (const path of PAGES) { try { await fetch(SITE + path) } catch { /* сервера нет — снимок скажет сам */ } }

let bad = 0
console.log(`Браузеры: ${engines.map((e) => `${e.name}${e.note ? ` (${e.note})` : ''}`).join(' · ')}${notSet.length ? `   (не поставлены: ${notSet.join(', ')} — по ним не проверено)` : ''}`)
for (const path of PAGES) {
  for (const dpr of DPRS) {
    const frames = []
    for (const engine of engines) {
      try {
        const f = await shoot(engine, path, dpr)
        frames.push({ engine, ...f })
      } catch (error) {
        console.error(`✗ ${engine.name}: ${path} @${dpr}× не открылась — ${String(error.message).split('\n')[0]}`)
        bad += 1
      }
    }
    if (frames.length < 2) continue
    const ref = frames[0]
    const refImg = await sharp(ref.png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    for (const f of frames.slice(1)) {
      const img = await sharp(f.png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      const [w, h] = [Math.min(refImg.info.width, img.info.width), Math.min(refImg.info.height, img.info.height)]
      const scale = dpr
      const cells = []
      const step = Math.round(CELL * scale)
      for (let y0 = 0; y0 + step <= h; y0 += step) {
        for (let x0 = 0; x0 + step <= w; x0 += step) {
          let sum = 0
          for (let y = y0; y < y0 + step; y += 2) {
            for (let x = x0; x < x0 + step; x += 2) {
              const a = (y * refImg.info.width + x) * 3
              const b = (y * img.info.width + x) * 3
              sum += Math.abs(refImg.data[a] - img.data[b]) + Math.abs(refImg.data[a + 1] - img.data[b + 1]) + Math.abs(refImg.data[a + 2] - img.data[b + 2])
            }
          }
          const mean = sum / 3 / ((step / 2) * (step / 2))
          if (mean > (f.engine.type === pw.chromium ? LIMIT : LIMIT_OTHER)) cells.push({ x: x0 / scale, y: y0 / scale, mean })
        }
      }
      const tall = Math.abs(refImg.info.height - img.info.height) / scale
      const head = `${path} @${dpr}× · ${f.engine.name} ${f.version} против ${ref.engine.name} ${ref.version}`
      if (!cells.length && tall < 8) {
        console.log(`✓ ${head}`)
        continue
      }
      bad += 1
      console.log(`✗ ${head}: ${cells.length} клеток ${CELL}px рисуются иначе${tall >= 8 ? `; страница ${tall}px ${img.info.height > refImg.info.height ? 'выше' : 'ниже'}` : ''}`)
      for (const c of cells.sort((a, b) => b.mean - a.mean).slice(0, SHOW)) {
        console.log(`    x=${c.x} y=${c.y}  разница ${Math.round(c.mean)}  ${await ref.probe(c.x + CELL / 2, c.y + CELL / 2 - 0)}`)
      }
    }
    for (const f of frames) await f.page.context().browser()?.close().catch(() => {})
  }
}
console.log(bad ? `\n✗ Браузеры рисуют по-разному: ${bad}. Один вид во всех — правило И630.` : '\n✓ Все браузеры машины рисуют одно и то же.')
process.exit(bad ? 1 : 0)
