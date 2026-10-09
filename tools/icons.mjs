/*
 * Лист знаков: `skills/site-building/assets/icons/lucide/*.svg` → `styles/icons.svg`.
 *
 * Слой 11 основания (И249): один лист знаков на сайт, рисунок каждого знака —
 * в одном месте, вес штриха — одной строкой в `styles/base.css`. До листа
 * знак рисовался по месту: семь весов штриха на сорок одно объявление
 * (craft, references/icons.md).
 *
 *   node tools/icons.mjs           выпустить styles/icons.svg
 *   node tools/icons.mjs --check   только сверить: лист отстал — код 1
 *
 * Лист — общий слой (CLAUDE.md, «Переносимость»): простой SVG без движка.
 * Next.js кладёт его в `public/` и зовёт `<svg><use href="/icons.svg#cart"/></svg>`;
 * Liquid и PHP — так же. Знак без подписи рядом получает имя (`aria-label`
 * на кнопке), рисунок — `aria-hidden`.
 *
 * Внутри `<use>` селекторы страницы не достают до фигур, а `vector-effect`
 * не наследуется: правило `svg *{vector-effect:non-scaling-stroke}` из
 * base.css до знака из листа не доехало бы. Поэтому лист ставит его
 * атрибутом на каждую фигуру; толщину (`stroke-width`) знак наследует от
 * своего `<svg>` на странице — её держит base.css.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

/* Знаки лежат там, где лежит скилл: в наборе — `skills/`, в поставленном
   сайте — `.agents/skills/` и `.claude/skills/` (install.mjs кладёт обе
   копии). Искали только первое — и проверка листа падала на каждом сайте.
   Берётся первое существующее; шапка листа называет путь набора, чтобы лист
   сайта и лист набора не расходились ни байтом. */
const SOURCE = 'skills/site-building/assets/icons/lucide'
const PLACES = [SOURCE, `.agents/${SOURCE}`, `.claude/${SOURCE}`]
const found = PLACES.find((p) => existsSync(path.resolve(p)))
const TO = path.resolve('styles/icons.svg')
const BOXES = path.resolve('styles/icons.json')

if (!found) {
  console.error(`✗ Нет знаков набора ни в одном из мест: ${PLACES.join(', ')} — собирать лист не из чего.`)
  process.exit(1)
}
const FROM = path.resolve(found)

const SHAPES = /<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)\s*\/?>/g
const lucide = readdirSync(FROM).filter((n) => n.endsWith('.svg')).sort()
/* Чужие марки (`brands/` рядом с `lucide/`, Simple Icons, CC0): мессенджеры
   окна быстрого заказа (И442). Силуэт, а не штрих: марку узнают по форме
   пятна, перерисованная контуром она перестаёт быть собой; поэтому знак
   залит, без штриха и без `vector-effect`. Краску назначает место, как у
   всех знаков листа. Имя знака — в одном месте из трёх.

   Залитые знаки набора (`solid/`, силуэты Lucide, ISC) — там, где знак
   читается долей заливки, а не контуром: звёзды оценки (И512). Устроены
   как марки — пятно без штриха.

   Знаки платёжных систем (`pay/`, И549) — тоже пятна, но окно у каждого
   своё, обрезанное по главному рисунку (pay/LICENSE): одна высота на месте
   ставит главные рисунки вровень. Окно знака — из его файла; окна не
   квадрата лист выпускает рядом справкой (`styles/icons.json`) — её берёт
   компонент знака, чтобы ширина шла от рисунка, а не числом на месте. */
const FILLED = ['brands', 'solid', 'pay'].map((d) => path.join(path.dirname(FROM), d))
const home = new Map()
for (const dir of FILLED) {
  for (const n of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith('.svg')).sort() : []) {
    if (lucide.includes(n) || home.has(n)) {
      console.error(`✗ Имя знака ${n} — в двух папках знаков: у знака одно место.`)
      process.exit(1)
    }
    home.set(n, dir)
  }
}
const brands = [...home.keys()]
const boxes = {}
const names = [...lucide, ...brands]
const brand = (file) => {
  const id = file.replace(/\.svg$/, '')
  const svg = readFileSync(path.join(home.get(file), file), 'utf8').replace(/\r\n/g, '\n')
  const box = svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24'
  /* Справке — только пропорция окна (`0 0 w h`): обрезку по рисунку делает
     сам знак своим окном в листе. Полное окно и на `<svg>` на месте
     сдвигало рисунок дважды — знаки оплаты вылезали из пилюль вверх и влево
     на своё смещение (слово заказчика 29.09.2026, снимок подвала; И560). */
  if (box !== '0 0 24 24') boxes[id] = `0 0 ${box.split(/[\s,]+/).slice(2).join(' ')}`
  const shapes = [...svg.matchAll(SHAPES)].map((m) => `<${m[1]}${m[2]}/>`)
  if (!shapes.length) throw new Error(`${file}: в знаке нет фигур`)
  /* Марка Simple Icons занимает окно целиком (0…24); перо Lucide ведёт линию
     по живой зоне 20 из 24 (поле по 2; Material Design, System icons), а
     штрих выступает за неё на свою толщину: рисунок пера вместе со штрихом —
     около 21.4 (20 + штрих 1.4 в долях окна; замер меню трубки, 03.10.2026).
     В одном ряду силуэт выходил на 12 % крупнее пера и вдвое тяжелее его
     по числу закрашенных пикселей (И679). Силуэт сжимается к центру до
     размера пера: `matrix(.89 0 0 .89 1.32 1.32)` (24 × .89 = 21.4). Окно
     знака оплаты (`pay/`) обрезано по рисунку и не квадрат — оно не
     трогается. */
  const live = path.basename(home.get(file)) === 'brands' && box === '0 0 24 24'
  const body = live ? `<g transform="matrix(.89 0 0 .89 1.32 1.32)">${shapes.join('')}</g>` : shapes.join('')
  return `  <symbol id="${id}" viewBox="${box}"${box === '0 0 24 24' ? '' : ' overflow="visible"'} fill="currentColor" stroke="none">${body}</symbol>`
}
const symbols = names.map((file) => {
  if (brands.includes(file)) return brand(file)
  const id = file.replace(/\.svg$/, '')
  const svg = readFileSync(path.join(FROM, file), 'utf8').replace(/\r\n/g, '\n')
  const body = svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const shapes = [...body.matchAll(SHAPES)].map((m) => `<${m[1]}${m[2]} vector-effect="non-scaling-stroke"/>`)
  if (!shapes.length) throw new Error(`${file}: в знаке нет фигур`)
  /* Заливка знака линией — роль `--sign-fill`, по умолчанию «нет»: без неё
     браузер залил бы каждую фигуру чёрным. Атрибутом `fill="none"` она
     стояла жёстко и стиль сайта её не пробивал — сердце в избранном не
     заливалось (слово заказчика 01.10.2026, И625). */
  return `  <symbol id="${id}" viewBox="0 0 24 24" style="fill:var(--sign-fill, none)" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${shapes.join('')}</symbol>`
})

/* Вид знака (`#<имя>-view`): тот же рисунок, поставленный в ряд, и окно на
   него — лист отдаётся картинкой одного знака по адресу `/icons.svg#<имя>-view`.
   Так знак берёт стиль, которому нужна картинка, а не разметка: маска
   кружка главной кнопки (styles/btn.module.css) вырезает стрелку из листа, а
   не рисует свою. Страничный `<use href="#имя">` видов не касается. */
const views = names.map((file, i) => {
  const id = file.replace(/\.svg$/, '')
  return `  <use href="#${id}" x="${i * 24}" y="0" width="24" height="24" stroke-width="1.75"/><view id="${id}-view" viewBox="${i * 24} 0 24 24"/>`
})

/* Краска и концы штриха — на КАЖДОМ знаке: `<use>` наследует от места
   вызова, а не от корня листа, и атрибуты корня до знака не доходят. */
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Собран tools/icons.mjs из skills/site-building/assets/icons/lucide (Lucide, ISC) icons/brands (Simple Icons, CC0) и icons/solid (Lucide, ISC); см. LICENSE там же.
       Руками не правят: первый же выпуск сотрёт правку. Знаков: ${names.length}. -->
${symbols.join('\n')}
${views.join('\n')}
</svg>
`

/* Справка об окнах: знаки не квадратом — имя и `viewBox` (И549). */
const boxesText = JSON.stringify(boxes, null, 2) + '\n'

/* Маски знаков (`styles/sign-masks.css`, И630). Вырез по фрагменту листа
   (`url(/icons.svg#имя-view)`) Safari (WebKit) не рисует: стрелка кружка и
   пилюли превращалась в мелкий мусор, а у части Chrome вырез показывал чужой
   знак. Знак, который режет маска, берётся не фрагментом листа, а своей
   картинкой — data-URI из ТОГО ЖЕ файла знака (рисунок один, лист и маска
   выходят из него вместе). Роль `--sign-mask-<имя>`; список — те знаки, что
   где-то вырезают: стрелка кружка и пилюли, значки сообщений формы, галочка
   выбранной строки меню (И730). */
const MASKS = ['arrow-right', 'check-circle', 'alert-triangle', 'check']
const maskCss = () => {
  const rows = MASKS.map((id) => {
    const svg = readFileSync(path.join(FROM, `${id}.svg`), 'utf8').replace(/\r\n/g, '\n')
    const body = svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    const shapes = [...body.matchAll(SHAPES)].map((m) => `<${m[1]}${m[2].replace(/"/g, "'")} vector-effect='non-scaling-stroke'/>`).join('')
    const img = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#000' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'>${shapes}</svg>`
    const uri = img.replace(/%/g, '%25').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23').replace(/\s+/g, ' ')
    return `  --sign-mask-${id}: url("data:image/svg+xml,${uri}");`
  })
  return `/* Собран tools/icons.mjs из знаков набора. Руками не правят. Маски знаков: картинка из
   того же файла знака, что и лист (И630) — не фрагмент листа, который Safari не рисует. */
:root {
${rows.join('\n')}
}
`
}
const MASK_TO = path.resolve('styles/sign-masks.css')

if (process.argv.includes('--check')) {
  const was = existsSync(TO) ? readFileSync(TO, 'utf8').replace(/\r\n/g, '\n') : ''
  const wasBoxes = existsSync(BOXES) ? readFileSync(BOXES, 'utf8').replace(/\r\n/g, '\n') : ''
  const wasMask = existsSync(MASK_TO) ? readFileSync(MASK_TO, 'utf8').replace(/\r\n/g, '\n') : ''
  if (was === sheet && wasBoxes === boxesText && wasMask === maskCss()) {
    console.log(`Лист знаков выпущен и не отстал: ${names.length} знаков`)
    process.exit(0)
  }
  console.error('✗ styles/icons.svg отстал от знаков набора. Выпустить заново: node tools/icons.mjs')
  process.exit(1)
}

writeFileSync(TO, sheet)
writeFileSync(BOXES, boxesText)
writeFileSync(MASK_TO, maskCss())
console.log(`Выпущено: styles/icons.svg · ${names.length} знаков: ${names.map((n) => n.replace('.svg', '')).join(', ')}`)
