/**
 * Счётчики и строка покупки — отрисованная проверка поведения (И652).
 *
 * Заведена по дефекту 02.10.2026. Виды счётчика («тихий» — снят 05.10.2026,
 * «контур», «число в рамке») ушли заказчику сломанными: у «тихого» не было фона, «−» и «+» не
 * подсвечивались под рукой, а все образцы стояли на числе 1 — «−» там
 * выключен, и заказчик принимал это за поломку. Ни одна проверка не нажимала
 * на счётчик: `check:craft` и `sweep` меряют раскладку, а не ответ руке.
 *
 * Эта проверка открывает страницу дизайн-системы (вкладка «Система» →
 * «Buttons», образцы счётчика) и карту товара и НАЖИМАЕТ: наводит на «−» и «+»,
 * зажимает, отпускает, шагает с клавиатуры, упирается в границы — настоящей
 * мышью и клавиатурой, а не чтением правил. На каждый вид счётчика:
 *
 *   · покой — заливка, кромка и поле такие, как обещает вид (жёлоб одет, как тихая
 *     кнопка каталога, И772: вуалью или контуром — как выбрано в панели, но не
 *     голым; контур: рамка вокруг, заливки нет; число в рамке: рамка у числа, у
 *     счётчика ни рамки, ни заливки);
 *   · наведение на «−» и «+» меняет вид (заливка, тень или краска знака);
 *   · нажатие меняет вид ещё раз (заливка, тень или сдвиг);
 *   · щелчок меняет число на единицу; «−» на нижней границе и «+» на верхней
 *     выключены и под рукой НЕ оживают;
 *   · клавиатура: Tab доходит до «−», числа, «+»; у сфокусированного есть
 *     видимое кольцо; Enter на «+» шагает;
 *   · число читается (4.5 : 1), знак виден (3 : 1);
 *   · обе темы, все браузеры машины.
 * На карте товара — то же для счётчика сайта и порядок строки покупки:
 * счётчик, «В корзину», «Быстрый заказ» — одной линией и одной высоты (сердце
 * с 04.10.2026 стоит на снимке товара, как на карточке полки, — не в строке).
 * На полке телефона (320…412, три языка) — надпись «в корзину» нажатием:
 * одной строкой до нажатия и после, число видно, после перезагрузки число
 * берётся из корзины (И469, И763).
 *
 * Окна телефона — пальцем (И781, 08.10.2026: «нижняя часть с кнопками скролится»,
 * «меню не закрывается свайпом»). Chromium на 360 × 670 с настоящим касанием
 * (через CDP — оно идёт тем же путём, что палец, и слушает `touch-action`): корзина
 * наполняется нажатием на полке; открытая — её низ стоит целиком (не прокручивается,
 * обе кнопки внутри окна), тело длиннее окна; корзина и меню закрываются свайпом
 * изнутри и с затемнённой полосы рядом с шторкой; вертикаль на полосе окно не
 * закрывает. WebKit и Firefox касание из проверки не получают — там «не проверено».
 *
 * Где мерить, сайт говорит сам (05.10.2026: адреса стояли от витрины-образца,
 * и на другом магазине проверка мерила бы 404): язык — от главной, полка —
 * первая страница из ссылок шапки с кнопками «в корзину» на узкой карточке,
 * товар — с её карточки, та же полка на других языках — из языковых ссылок
 * страницы (`hreflang`). Переменными — только чтобы указать другое.
 *
 *   SITE=http://localhost:3020 node tools/check-counters.mjs
 *   COUNTER_LANG=ro  COUNTER_SHELF=catalog/oil  COUNTER_PRODUCT=<имя товара в адресе>
 *   COUNTER_SHELF_LANGS=ro,en  COUNTER_ENGINES=chromium,firefox,webkit (по умолчанию все, что есть)
 *
 * Код 1 — есть находки; 2 — нет браузера или мерить нечего (не проверено).
 */

import { loadPlaywright, machineEngines } from './browser.mjs'

const SITE = (process.env.SITE ?? process.env.CHECK_SITE ?? 'http://localhost:3000').replace(/\/$/, '')
const WANT = (process.env.COUNTER_ENGINES ?? '').split(',').map((x) => x.trim()).filter(Boolean)

const pw = await loadPlaywright()
/* Браузеры машины — тот же список, что у `check:engines` (`machineEngines`, И774). */
const { engines } = await machineEngines(pw)
const use = engines.filter((e) => !WANT.length || WANT.includes(e.name))
if (!use.length) { console.error('✗ Нет браузера — проверка счётчиков НЕ ПРОВЕДЕНА.'); process.exit(2) }

/** Виды счётчика: имя для людей, признак в разметке, что обещает покой. */
const LOOKS = [
  { id: 'trough', name: 'Жёлоб', sel: '[role=group][data-hit]:not([data-look])', rest: 'quiet-button' },
  { id: 'outline', name: 'Контур', sel: '[role=group][data-hit][data-look="outline"]', rest: 'frame' },
  { id: 'field', name: 'Число в рамке', sel: '[role=group][data-hit][data-look="field"]', rest: 'numberframe' },
]

/** Всё, что меряется в странице: цвет под знаком, кольцо, признаки вида. */
const PAGE_KIT = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => {
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(1,2,3,0.5)'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1)
    const d = cx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2], d[3] / 255]
  }
  const under = (el) => {
    let acc = [255, 255, 255]; const stack = []
    for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); stack.push(c); if (c[3] >= 0.99) break }
    for (const c of stack.reverse()) acc = acc.map((v, i) => Math.round(c[i] * c[3] + v * (1 - c[3])))
    return acc
  }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const look = (el) => {
    const cs = getComputedStyle(el)
    return { bg: under(el), shadow: cs.boxShadow, transform: cs.transform, color: rgba(cs.color).slice(0, 3), opacity: cs.opacity, outline: cs.outlineStyle + ' ' + cs.outlineWidth, own: rgba(cs.backgroundColor) }
  }
  return { rgba, under, ratio, look }
})()`

const dist = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
const changed = (a, b) => dist(a.bg, b.bg) >= 4 || a.shadow !== b.shadow || a.transform !== b.transform || dist(a.color, b.color) >= 12

/* Число в поле — как его вписывает человек: щелчок, выделить всё, набрать (И774,
   поправка 06.10.2026). `fill` у системного Firefox (WebDriver BiDi) у поля числа
   ДОПИСЫВАЕТ к прежнему («1» + «99» → «199») и ставит значение мимо события, которое
   слушает счётчик: проверка видела «"+" на границе не выключен» и «"−" без фокуса» там,
   где человек получает верный счётчик. */
async function typeNumber(input, v) {
  await input.click()
  await input.press('ControlOrMeta+a')
  await input.pressSequentially(String(v))
}

async function measure(page, handle) {
  return handle.evaluate((el, kit) => { const K = (0, eval)(kit); return K.look(el) }, PAGE_KIT)
}

async function checkGroup(page, group, spec, tag, found, sample = true) {
  const say = (what) => found.push(`${tag}: ${what}`)
  const [minus, input, plus] = [group.locator('button').first(), group.locator('input, b').first(), group.locator('button').last()]
  const value = async () => Number(await input.evaluate((e) => (e.tagName === 'INPUT' ? e.value : e.textContent)))
  const isInput = await input.evaluate((e) => e.tagName === 'INPUT')
  await group.scrollIntoViewIfNeeded()

  /* Покой: что обещает вид. */
  await page.mouse.move(0, 0)
  const rest = await group.evaluate((el, kit) => {
    const K = (0, eval)(kit); const cs = getComputedStyle(el); const num = el.querySelector('input'); const ncs = num ? getComputedStyle(num) : null
    return { own: K.rgba(cs.backgroundColor), shadow: cs.boxShadow, border: parseFloat(cs.borderTopWidth) || 0, numBorder: ncs ? parseFloat(ncs.borderTopWidth) || 0 : 0, height: el.getBoundingClientRect().height }
  }, PAGE_KIT)
  const filled = rest.own[3] > 0.05
  const edgeShadow = rest.shadow !== 'none' && !/0px 0px 0px 0px/.test(rest.shadow)
  /* Жёлоб одет ролями тихой кнопки каталога (И772): вуаль (заливка) или контур (кромка) —
     какую выбрал заказчик в панели; голый, без того и другого, — сломан. */
  if (spec.rest === 'quiet-button' && !(filled || edgeShadow || rest.border > 0)) say('«жёлоб» в покое ни с заливкой, ни с кромкой: тихая кнопка каталога его не одела')
  if (spec.rest === 'frame' && !(rest.border > 0 && !filled)) say('«контур» в покое без рамки вокруг или с заливкой')
  if (spec.rest === 'numberframe' && !(rest.numBorder > 0 && rest.border === 0 && !filled)) say('«число в рамке»: рамки у числа нет, или есть у счётчика, или есть заливка')
  if (rest.height < 40 || rest.height > 64) say(`рост счётчика ${Math.round(rest.height)} px вне 40–64`)

  /* Число читается, знак виден. */
  const ink = await input.evaluate((e, kit) => { const K = (0, eval)(kit); const bg = K.under(e); return K.ratio(K.rgba(getComputedStyle(e).color).slice(0, 3), bg) }, PAGE_KIT)
  if (ink < 4.5) say(`число читается на ${ink.toFixed(2)} : 1 (нужно 4.5)`)

  /* Начальное число — не граница: «−» живой. */
  if (sample && (await minus.isDisabled())) say('«−» выключен на начальном числе: образец выглядит сломанным')
  if (await plus.isDisabled()) say('«+» выключен на начальном числе')

  /* Наведение и нажатие на «−» и «+». */
  for (const [label, btn] of [['«+»', plus], ['«−»', minus]]) {
    if (await btn.isDisabled()) continue
    await page.mouse.move(0, 0)
    const still = await measure(page, btn)
    const sign = await btn.locator('svg').first().evaluate((el, kit) => { const K = (0, eval)(kit); return K.ratio(K.rgba(getComputedStyle(el).color).slice(0, 3), K.under(el)) }, PAGE_KIT)
    if (sign < 3) say(`знак ${label} виден на ${sign.toFixed(2)} : 1 (нужно 3)`)
    await btn.hover()
    const over = await measure(page, btn)
    if (!changed(still, over)) say(`наведение на ${label} ничего не меняет — кнопка не подсвечивается`)
    const before = await value()
    await page.mouse.down()
    const held = await measure(page, btn)
    if (!changed(over, held)) say(`нажатие на ${label} ничего не меняет — нет ответа «вглубь»`)
    await page.mouse.up()
    const after = await value()
    if (after !== before + (btn === plus ? 1 : -1)) say(`щелчок по ${label}: было ${before}, стало ${after}`)
  }

  /* Границы: у границы кнопка выключена и под рукой не оживает. */
  if (isInput) {
    const top = await input.getAttribute('max'), low = await input.getAttribute('min')
    for (const [label, btn, v] of [['«+» на верхней границе', plus, top ?? '9'], ['«−» на нижней границе', minus, low ?? '1']]) {
      await typeNumber(input, v)
      if (!(await btn.isDisabled())) { say(`${label} не выключен`); continue }
      await page.mouse.move(0, 0)
      const dormant = await measure(page, btn)
      await btn.hover({ force: true })
      const hovered = await measure(page, btn)
      if (changed(dormant, hovered)) say(`${label} выключен, но под рукой оживает`)
      if (Number(dormant.opacity) >= 0.95) say(`${label} выключен, но выглядит живым (прозрачность ${dormant.opacity})`)
    }
    await typeNumber(input, '2')
  }

  /* Клавиатура: Tab доходит до «−», числа, «+»; кольцо видно; Enter на «+» шагает. */
  await page.mouse.move(0, 0)
  const calm = await measure(page, minus)
  await minus.focus()
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
  const ring = await minus.evaluate((el, kit) => { const K = (0, eval)(kit); return { fv: el.matches(':focus-visible'), ...K.look(el) } }, PAGE_KIT)
  if (!ring.fv) say('«−» не получает фокус с клавиатуры')
  else if (/^none/.test(ring.outline) && !changed(calm, ring)) say('у «−» с фокусом нет видимого кольца')
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab')
  const onPlus = await plus.evaluate((el) => el === document.activeElement)
  if (!onPlus) say('Tab из «−» не доходит до «+» за два шага («−», число, «+»)')
  else {
    const was = await value(); await page.keyboard.press('Enter')
    if ((await value()) !== was + 1) say(`Enter на «+»: было ${was}, стало ${await value()}`)
  }
}

/* Полка телефона: надпись «в корзину» (И469, И763). Заведено по дефекту
   05.10.2026: на окне ~375 «Added · 5» со знаком встала в две строки, а до
   нажатия кнопка не показывала, что 4 штуки уже лежат в корзине. Ни одна
   проверка не нажимала «Add» на узкой карточке: `check:craft` видит страницу
   до нажатия, а число в надписи — только после.
   Свежая корзина на каждый язык: надпись одной строкой на всех ширинах
   телефона до нажатия; нажатие — «· 1» одной строкой; перезагрузка — «· 1»
   без нажатия (число — из корзины, а не из исхода формы); 11 штук с карты
   товара — на полке «12», двузначное число видно на 320. */
const PHONES = [320, 360, 375, 390, 412]
const SHELF_LANGS = (process.env.COUNTER_SHELF_LANGS ?? '').split(',').map((x) => x.trim()).filter(Boolean)
/** Среда замера без живого обновления сервера разработки (HMR): правка
 *  соседней сессии перезагружала страницу посреди нажатия (И765). */
const noHmr = async (ctx) => { await ctx.routeWebSocket?.(/\/_next\/(webpack|turbopack)-hmr/, (ws) => ws.close()); return ctx }
/** Что не померено и почему — печатается, а не молчится. */
const unchecked = []

/** Где мерить — у самого сайта (см. шапку файла). */
async function discover(engine) {
  const browser = await engine.type.launch(engine.opts)
  const page = await (await noHmr(await browser.newContext({ viewport: { width: 375, height: 800 } }))).newPage()
  const at = { shelves: [], product: null, design: null }
  try {
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle', timeout: 150000 })
    const first = new URL(page.url()).pathname.split('/')[1] ?? ''
    const htmlLang = ((await page.getAttribute('html', 'lang')) ?? '').toLowerCase()
    const lang = process.env.COUNTER_LANG ?? (first && htmlLang.startsWith(first.toLowerCase()) ? first : '')
    const under = (path) => `${SITE}${lang ? `/${lang}` : ''}/${path}`
    at.design = under('design?t=system&s=list')
    const shelfHere = () => page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-product-card]')].filter((c) => c.querySelector('form button[type=submit]') && c.getBoundingClientRect().width)
      return cards.length ? { narrow: cards[0].getBoundingClientRect().width < innerWidth * 0.6 } : null
    })
    let shelf = process.env.COUNTER_SHELF ? under(process.env.COUNTER_SHELF) : null
    if (!shelf) {
      const links = await page.evaluate(() => [...new Set([...document.querySelectorAll('header a[href], nav a[href]')].map((a) => a.href.split('#')[0]).filter((h) => h.startsWith(location.origin)))])
      const home = page.url()
      let wide = null
      for (const url of [home, ...links.filter((h) => h !== home)].slice(0, 16)) {
        if (url !== page.url()) await page.goto(url, { waitUntil: 'networkidle', timeout: 150000 })
        const here = await shelfHere()
        if (here?.narrow) { shelf = url; break }
        if (here && !wide) wide = url
      }
      shelf ??= wide
    }
    if (!shelf) { unchecked.push('полка телефона: на сайте не нашлось карточки с кнопкой «в корзину» — надпись после нажатия не померена'); return at }
    if (page.url() !== shelf) await page.goto(shelf, { waitUntil: 'networkidle', timeout: 150000 })
    const alternates = await page.evaluate(() => [...document.querySelectorAll('link[rel=alternate][hreflang]')].filter((l) => l.hreflang !== 'x-default').map((l) => [l.hreflang, l.href]))
    /* Ссылки языков записаны полным адресом сайта (`SITE_URL` сборки), а не
       адресом сервера, который меряется: сборка на 8099 звала на сервер
       разработки 3020, и проверка мерила его — 12 «полка не открылась» за
       60 секунд у всех браузеров (большая проверка 06.10.2026, И775). Мерится
       тот же путь на сервере `SITE`. */
    const onSite = (href) => { const u = new URL(href); return new URL(u.pathname + u.search, SITE).href }
    const wanted = alternates.filter(([h]) => !SHELF_LANGS.length || SHELF_LANGS.some((w) => h.toLowerCase().startsWith(w.toLowerCase())))
      .map(([h, href]) => [h, onSite(href)])
    at.shelves = wanted.length ? wanted : [[lang || htmlLang || 'сайт', shelf]]
    const card = await page.locator('[data-product-card]:has(form button[type=submit]) a[href]').first().getAttribute('href')
    at.product = process.env.COUNTER_PRODUCT ? under(`product/${process.env.COUNTER_PRODUCT}`) : card ? new URL(card, SITE).href : null
  } catch (e) { unchecked.push(`где мерить, не выяснено: ${e.message.split('\n')[0]}`) }
  finally { await browser.close() }
  return at
}

/** Надпись кнопки, как её видит глаз: показанный текст, сколько в нём строк,
 *  вылезла ли надпись за поле кнопки. */
const readLabel = (btn) => btn.evaluate((el) => {
  /* Строки — по буквам, не по знаку: знак стоит по центру строки, и его
     верх ниже верха букв — это не вторая строка. */
  const cs = getComputedStyle(el), box = el.getBoundingClientRect()
  const tops = []
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const r = document.createRange(); r.selectNodeContents(n)
    for (const b of r.getClientRects()) if (b.width >= 1 && b.height >= 1) tops.push(b.top)
  }
  const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2
  tops.sort((a, b) => a - b)
  const lines = tops.length ? 1 + tops.filter((t, i) => i && t - tops[i - 1] > lh / 2).length : 0
  const inner = [...el.children].map((c) => c.getBoundingClientRect())
  const left = box.left + parseFloat(cs.paddingInlineStart) - 1, right = box.right - parseFloat(cs.paddingInlineEnd) + 1
  return {
    text: el.innerText.replace(/\s+/g, ' ').trim(),
    lines,
    tall: box.height > parseFloat(cs.minBlockSize) + 1,
    out: inner.some((c) => c.width && (c.left < left || c.right > right)),
  }
})

async function checkShelf(browser, engine, found, shelves) {
  for (const [lang, shelf] of shelves) {
    const ctx = await noHmr(await browser.newContext({ viewport: { width: 375, height: 800 } }))
    const page = await ctx.newPage()
    await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s)) })
    const tag = (what) => `[${engine.name} · ${lang}] полка телефона: ${what}`
    const say = (what) => found.push(tag(what))
    const card = page.locator('[data-product-card]:has(form button[type=submit])').first()
    const btn = card.locator('form button[type=submit]')
    const sweep = async (when, digits) => {
      for (const w of PHONES) {
        await page.setViewportSize({ width: w, height: 800 })
        await page.waitForTimeout(120)
        const l = await readLabel(btn)
        if (l.lines > 1 || l.tall) say(`${when}, окно ${w}: надпись «${l.text}» в две строки`)
        else if (l.out) say(`${when}, окно ${w}: надпись «${l.text}» вылезла за поле кнопки`)
        if (digits && !l.text.includes(digits)) say(`${when}, окно ${w}: числа ${digits} в надписи нет («${l.text}»)`)
      }
    }
    const shows = async (digits, ms) => {
      try { await page.waitForFunction(([el, d]) => el.innerText.includes(d), [await btn.elementHandle(), digits], { timeout: ms }); return true } catch { return false }
    }
    try {
      await page.goto(shelf, { waitUntil: 'networkidle', timeout: 150000 })
      await btn.waitFor({ timeout: 60000 })
      await sweep('до нажатия', null)
      await page.setViewportSize({ width: 375, height: 800 })
      await btn.click()
      if (!(await shows('1', 15000))) say(`после нажатия «Add» числа 1 в надписи нет («${(await readLabel(btn)).text}»)`)
      await sweep('после нажатия', '1')
      await page.reload({ waitUntil: 'networkidle', timeout: 150000 })
      await btn.waitFor({ timeout: 60000 })
      if (!(await shows('1', 15000))) say(`после перезагрузки кнопка не говорит, что товар уже в корзине («${(await readLabel(btn)).text}»)`)
      /* Двузначное число — 11 штук с карты товара. */
      const href = await card.locator('a[href]').first().getAttribute('href')
      await page.goto(new URL(href, SITE).href, { waitUntil: 'networkidle', timeout: 150000 })
      /* Первая `main` — страница; образец страницы товара в панели вида —
         вторая, скрытая. Уходить с карты — когда её кнопка сказала «12»:
         запись, оборванная переходом, на медленном сервере не доезжала. */
      const buy = page.locator('main').first().locator('form:has(input[name=quantity]):has(button[type=submit][data-voice=loud])').first()
      await buy.locator('input[name=quantity]').waitFor({ timeout: 60000 })
      await typeNumber(buy.locator('input[name=quantity]'), '11')
      await buy.locator('button[type=submit][data-voice=loud]').click()
      try { await page.waitForFunction((el) => el.innerText.includes('12'), await buy.locator('button[type=submit][data-voice=loud]').elementHandle(), { timeout: 20000 }) } catch { say('карта товара: после 11 штук кнопка не сказала «12»') }
      await page.goto(shelf, { waitUntil: 'networkidle', timeout: 150000 })
      await btn.waitFor({ timeout: 60000 })
      if (!(await shows('12', 15000))) say(`после 11 штук с карты товара на полке нет «12» («${(await readLabel(btn)).text}»)`)
      else await sweep('12 в корзине', '12')
    } catch (e) { say(`не открылась: ${e.message.split('\n')[0]}`) }
    await ctx.close()
  }
}

/** Окна телефона пальцем (И781): низ корзины целиком, свайп закрывает меню и корзину — изнутри
 *  и с затемнённой полосы. Только Chromium: касание — через CDP. */
async function checkWindows(browser, engine, found, shelf) {
  const say = (what) => found.push(`[${engine.name}] окна телефона: ${what}`)
  const ctx = await noHmr(await browser.newContext({ viewport: { width: 360, height: 670 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }))
  const page = await ctx.newPage()
  await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s)) })
  const cdp = await ctx.newCDPSession(page)
  /* Палец: путь с настоящими метками времени — скорость та, что задана, а не та, что дала связь с браузером. */
  const drag = async (x0, y0, x1, y1, ms = 300, steps = 14) => {
    const t0 = Date.now() / 1000
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }], timestamp: t0 })
    for (let i = 1; i <= steps; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps, id: 1 }], timestamp: t0 + ms * i / steps / 1000 })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t0 + ms / 1000 })
  }
  const isOpen = (sel) => page.evaluate((s) => !!document.querySelector(s)?.matches(':popover-open'), sel)
  /* Крестик — у конца строки шапки в любом окне (И784): справа от него в строке нет ничего, кроме поля самой
     строки. Окно сверху без `space-between` держало заголовок и крестик рядом слева («крестик закрытия у всех
     форм в одном месте — справа вверху», заказчик 08.10.2026). */
  const closeAtEnd = async (name, sel) => {
    const r = await page.evaluate((s) => {
      const btn = document.querySelector(s)?.querySelector('[data-ground="deck"] button[popovertargetaction="hide"]')
      if (!btn) return null
      const row = btn.parentElement; const end = row.getBoundingClientRect().right - parseFloat(getComputedStyle(row).paddingRight)
      return Math.round((end - btn.getBoundingClientRect().right) * 10) / 10
    }, sel)
    if (r === null) say(`${name}: крестика в шапке окна не нашлось`)
    else if (r > 1.5) say(`${name}: крестик закрытия не у конца строки шапки — справа от него ${r} px свободного места`)
  }
  const gone = async (sel) => { try { await page.waitForFunction((s) => !document.querySelector(s)?.matches(':popover-open'), sel, { timeout: 2500 }); return true } catch { return false } }
  try {
    await page.goto(shelf, { waitUntil: 'networkidle', timeout: 150000 })
    /* Корзина — нажатием, как у человека: по три раза на первых четырёх карточках полки. */
    const cards = page.locator('[data-product-card]:has(form button[type=submit])')
    const n = Math.min(await cards.count(), 4)
    for (let r = 0; r < 3; r++) for (let i = 0; i < n; i++) {
      const btn = cards.nth(i).locator('form button[type=submit]')
      await btn.scrollIntoViewIfNeeded().catch(() => {})
      await btn.click({ timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(250)
    }
    await page.evaluate(() => scrollTo(0, 0))
    const windows = [
      { name: 'корзина', sel: '[data-pane="end"]', open: () => page.locator('header a[href*="/cart"]:visible').first().click({ timeout: 8000 }) },
      { name: 'меню', sel: '[data-pane="start"]', open: () => page.locator('button[popovertarget$="site-menu"]:visible').first().click({ timeout: 8000 }) },
    ]
    for (const w of windows) {
      const reopen = async () => {
        if (await isOpen(w.sel)) return true
        await w.open().catch(() => {})
        try { await page.waitForFunction((s) => document.querySelector(s)?.matches(':popover-open'), w.sel, { timeout: 5000 }) } catch { return false }
        await page.waitForTimeout(500)
        return true
      }
      if (!(await reopen())) { say(`${w.name}: не открылась нажатием`); continue }
      const box = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right } }, w.sel)
      await closeAtEnd(w.name, w.sel)
      /* Низ окна стоит целиком: не прокручивается, каждое действие внутри окна. */
      const foot = await page.evaluate((s) => {
        const pane = document.querySelector(s); const f = [...pane.children].find((c) => /foot/i.test(String(c.className)))
        if (!f) return null
        const pr = pane.getBoundingClientRect()
        const body = [...pane.children].find((c) => /body/i.test(String(c.className)))
        return { scroll: f.scrollHeight - f.clientHeight, out: [...f.querySelectorAll('a, button')].filter((a) => { const r = a.getBoundingClientRect(); return r.width && (r.bottom > pr.bottom + 0.5 || r.top < pr.top) }).map((a) => a.textContent.trim().slice(0, 24) || a.getAttribute('aria-label')), long: body ? body.scrollHeight > body.clientHeight + 40 : false }
      }, w.sel)
      if (foot) {
        if (foot.scroll > 1) say(`${w.name}: низ окна прокручивается (на ${foot.scroll} px) — кнопки видны только после прокрутки`)
        if (foot.out.length) say(`${w.name}: ${foot.out.map((t) => `«${t}»`).join(', ')} — за краем окна`)
        if (!foot.long) unchecked.push(`${w.name}: в корзине мало строк — тело короче окна, низ мерился без нажима`)
      } else if (w.sel.includes('"end"')) unchecked.push('корзина: у открытой окна нет низа (пустая?) — низ не померен')
      /* Свайп изнутри и с затемнённой полосы. */
      const side = w.sel.includes('"start"') ? 'start' : 'end'
      const dir = side === 'start' ? -1 : 1
      const innerX = side === 'start' ? box.right - 50 : box.x + 50
      await drag(innerX, 400, innerX + dir * 190, 400)
      if (!(await gone(w.sel))) say(`${w.name}: свайп по самой шторке не закрыл её`)
      if (!(await reopen())) { say(`${w.name}: не открылась снова`); continue }
      const stripW = side === 'start' ? 360 - box.right : box.x
      if (stripW < 24) { unchecked.push(`${w.name}: затемнённой полосы у шторки нет (${Math.round(stripW)} px) — свайп с полосы не мерился`); continue }
      const stripX = side === 'start' ? box.right + stripW / 2 : box.x / 2
      await drag(stripX, 400, stripX + dir * 120, 400)
      if (!(await gone(w.sel))) say(`${w.name}: свайп с затемнённой полосы рядом со шторкой не закрыл её`)
      if (!(await reopen())) { say(`${w.name}: не открылась снова`); continue }
      await drag(stripX, 450, stripX, 250)
      if (!(await isOpen(w.sel))) say(`${w.name}: вертикальный жест на полосе закрыл шторку — он должен прокручивать страницу`)
      await page.keyboard.press('Escape'); await page.waitForTimeout(300)
    }
    /* Окно поиска сверху — третье окно шапки; крестик у него там же, где у шторок. */
    await page.locator('button[popovertarget^="search-"]:visible').first().click({ timeout: 8000 }).catch(() => {})
    try { await page.waitForFunction(() => document.querySelector('[data-pane="top"]')?.matches(':popover-open'), null, { timeout: 5000 }); await page.waitForTimeout(400); await closeAtEnd('поиск', '[data-pane="top"]') } catch { say('поиск: не открылся нажатием') }
    await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  } catch (e) { say(`не измерено: ${e.message.split('\n')[0]}`) }
  await ctx.close()
}

const at = await discover(use[0])
const found = []
for (const engine of use) {
  const browser = await engine.type.launch(engine.opts)
  try {
    for (const scheme of ['light', 'dark']) {
      const ctx = await noHmr(await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme }))
      const page = await ctx.newPage()
      await page.addInitScript(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s)) })
      const tag = (what) => `[${engine.name} · ${scheme}] ${what}`
      /* Образцы счётчика — на странице дизайн-системы; её нет у магазина без
         панели вида и у сборки без LOOK_PICKER=on — тогда образцы не
         померены, и это печатается, а карта товара и полка меряются всё равно. */
      let samples = false
      try {
        if (!at.design) throw new Error('адрес сайта не выяснен')
        const res = await page.goto(at.design, { waitUntil: 'networkidle', timeout: 150000 })
        if (res?.status() === 404) { if (scheme === 'light' && engine === use[0]) unchecked.push('образцы счётчика: страницы дизайн-системы нет (магазин без панели или сайт без LOOK_PICKER=on)') }
        else if (!res || !res.ok()) throw new Error(`страница ответила ${res?.status()}`)
        else { await page.locator('[role=group][data-hit] button:not([disabled])').first().waitFor({ timeout: 60000 }); samples = true }
      } catch (e) { found.push(tag(`страница образцов не открылась: ${e.message.split('\n')[0]}`)) }
      if (samples) {
        for (const look of LOOKS) {
          const group = page.locator(look.sel).first()
          if (!(await group.count())) { found.push(tag(`счётчик «${look.name}» на странице не найден`)); continue }
          await checkGroup(page, group, look, tag(`счётчик «${look.name}»`), found)
        }
        /* Лишнее на странице: вида, которого заказчик убрал. */
        if (await page.locator('[role=group][data-hit][data-look="cells"]').count()) found.push(tag('счётчик «Ячейки» вернулся на страницу — его убрали по слову заказчика'))
      }

      /* Карта товара: счётчик сайта и строка покупки. */
      try {
        if (!at.product) throw new Error('товара с кнопкой «в корзину» на сайте не нашлось')
        await page.goto(at.product, { waitUntil: 'networkidle', timeout: 150000 })
        const g = page.locator('[role=group][data-hit]').first()
        await g.locator('button:not([disabled])').first().waitFor({ timeout: 60000 })
        const site = (await g.getAttribute('data-look')) ?? 'trough'
        const spec = LOOKS.find((l) => l.id === site) ?? LOOKS[0]
        await checkGroup(page, g, spec, tag(`карта товара, счётчик сайта («${spec.name}»)`), found, false)
        /* Строка меряется на успокоившейся странице: шрифт пришёл, два кадра
           отрисованы, и перекос подтверждён вторым замером. Первый прогон
           05.10.2026 увидел строку «не в одну линию» один раз из трёх — а
           находка, которая гуляет между прогонами, — дефект проверки. */
        const measureRow = () => page.evaluate(async () => {
          await document.fonts.ready
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
          const form = document.querySelector('[role=group][data-hit]').parentElement
          return [...form.children].filter((c) => c.getBoundingClientRect().width && !c.matches('p')).map((c) => { const r = c.getBoundingClientRect(); return { what: c.tagName, top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) } })
        })
        await page.mouse.move(0, 0)
        let row = await measureRow()
        if (new Set(row.map((r) => r.top)).size > 1) { await page.waitForTimeout(500); row = await measureRow() }
        const tops = new Set(row.map((r) => r.top)), heights = new Set(row.map((r) => r.h))
        if (row.length < 3) found.push(tag(`строка покупки: ${row.length} частей вместо трёх (счётчик, «В корзину», «Быстрый заказ»)`))
        if (tops.size > 1) found.push(tag(`строка покупки не в одну линию: ${row.map((r) => `${r.what} ${r.w}×${r.h} на ${r.top}`).join(', ')}`))
        if (heights.size > 1) found.push(tag(`строка покупки: части разной высоты (${[...heights].join(', ')} px)`))
        if (await page.locator('main form [data-save]').count()) found.push(tag('сердце вернулось в строку покупки — оно стоит на снимке товара'))
        const proof = await page.evaluate(() => { const m = document.querySelector('main [data-level]'); return m ? { first: m.parentElement.firstElementChild === m, inPrice: !!m.closest('[class*=Price]') } : null })
        if (!proof) found.push(tag('наличие на карте товара не найдено'))
        else if (!proof.first || proof.inPrice) found.push(tag('наличие стоит не первым в строке отзывов и артикула'))
      } catch (e) { found.push(tag(`карта товара не открылась: ${e.message.split('\n')[0]}`)) }
      await ctx.close()
    }
    await checkShelf(browser, engine, found, at.shelves)
    if (engine.type.name?.() === 'chromium' && at.shelves[0]) await checkWindows(browser, engine, found, at.shelves[0][1])
    else if (!unchecked.some((u) => u.startsWith('окна телефона пальцем'))) unchecked.push('окна телефона пальцем: только Chromium (касание идёт через CDP) — в этом браузере не мерились')
  } finally { await browser.close() }
}

console.log(`Счётчики и строка покупки: ${use.map((e) => e.name).join(', ')} × светлая и тёмная темы`)
console.log(`   полка: ${at.shelves.map(([l, u]) => `${l} ${u.replace(SITE, '')}`).join(' · ') || '—'}; товар: ${at.product?.replace(SITE, '') ?? '—'}`)
for (const u of unchecked) console.log(`   · не проверено — ${u}`)
if (found.length) {
  console.log(`\n✗ Находок: ${found.length}`)
  for (const f of found) console.log(`  · ${f}`)
  process.exit(1)
}
if (!at.shelves.length) process.exit(2)
console.log('✓ Все виды счётчика отвечают руке, держат границы и читаются; строка покупки — одной линией; надпись «в корзину» на полке телефона — одной строкой и с числом из корзины; окна телефона: низ корзины стоит целиком, меню и корзина закрываются свайпом изнутри и с затемнённой полосы.')
