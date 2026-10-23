/**
 * Слова заказчика → проверки. Срабатывает на каждый его ввод.
 *
 * Заведено по его словам: «я ж эти проверки не запомню. Они должны
 * срабатывать от моего произвольного написания; пиши, какие проверки
 * запустились».
 *
 * Хук `UserPromptSubmit` читает то, что заказчик написал, разбирает фразу по
 * реестру (`tools/checks.mjs`) и кладёт мне в контекст одну подсказку: под
 * этими словами запускается вот это. Разница с таблицей внутри скилла —
 * та же, что между правилом и памятью: таблица работает, если я её в этой
 * сессии прочитал, а хук работает всегда.
 *
 * Молчит, если слова не про проверку: подсказка на каждую реплику — шум, а
 * шум перестают читать.
 *
 * Слова про вид витрины («дизайн», «некрасиво», «ритм», «отступы»,
 * «переделай», «как у всех») сверх того получают строку о ПОРЯДКЕ: какие
 * дизайнерские скиллы звать и в какой очереди. Заведено 24.09.2026 словом
 * заказчика (И271): скиллы лежали рядом, а композицию не требовало ничего —
 * и их не звал никто. Строка идёт первой: скиллы зовутся до правки, проверки
 * — после.
 *
 * Проверить руками:
 *   echo '{"prompt":"шрифты поехали на телефоне"}' | node tools/hook-on-prompt.mjs
 *   echo '{"prompt":"некрасиво, переделай"}' | node tools/hook-on-prompt.mjs
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { match, nameOf, designWord, designHint } from './checks.mjs'
import { redact } from './secrets.mjs'

let raw = ''
try { raw = readFileSync(0, 'utf8') } catch { /* stdin пуст — нечего разбирать */ }

let prompt = ''
let session = ''
try {
  const data = JSON.parse(raw || '{}')
  prompt = data.prompt ?? data.user_prompt ?? data.message ?? ''
  session = data.session_id ?? ''
} catch {
  /* не JSON — значит хук позвали текстом; работаем с тем, что дали */
  prompt = raw
}

/* Слова заказчика — дословно в файл, по сессии (разбор autopilot,
   docs/skills.md). Разговор сжимается, и первыми уходят его первые слова:
   через три пересказа просьба сужается, а сверить её не с чем. Файл — эталон
   слепой приёмки (скилл stages, references/audit.md, проход 4). Ключ из
   сообщения в файл не попадает — вырезается узорами check:code, а мне идёт
   строка, что его надо заменить. Папку закрывает от git свой .gitignore — и в
   магазине, где корневой о ней не знает. Пишется только с номером сессии:
   ручной прогон `echo … | node tools/hook-on-prompt.mjs` следов не оставляет. */
try {
  const { text, found } = redact(prompt)
  if (session && text.trim()) {
    const dir = join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude', 'briefs')
    mkdirSync(dir, { recursive: true })
    if (!existsSync(join(dir, '.gitignore'))) writeFileSync(join(dir, '.gitignore'), '*\n')
    const id = String(session).slice(0, 8)
    const now = new Date().toLocaleString('sv-SE').slice(0, 16)
    const file = join(dir, readdirSync(dir).find((f) => f.endsWith(`-${id}.md`)) ?? `${now.slice(0, 10)}-${id}.md`)
    if (!existsSync(file)) writeFileSync(file, `# Слова заказчика — сессия ${id}\n\nДословно, по порядку; ключи вырезаны. Пишет tools/hook-on-prompt.mjs, читает слепая приёмка (stages, references/audit.md, проход 4). В git не идёт.\n`)
    appendFileSync(file, `\n## ${now}\n\n${text.trim()}\n`)
  }
  if (found.length) console.log(`В сообщении заказчика — ${found.join(', ')}: в запись не попало. Значение не повторять; сказать ему простыми словами, что этот ключ лучше заменить — он уже побывал в переписке.`)
} catch { /* запись не стоит ошибки на вводе */ }

/* Хук стоит на ПУТИ ЗАКАЗЧИКА: он срабатывает раньше, чем его слова дойдут
   до меня. Поэтому любая его ошибка — это ошибка на вводе, а подсказка
   такой цены не стоит. Молчаливый выход надёжнее полезного сообщения. */
/* Какой скилл открыть первым (контрольный прогон 10.10.2026: подсказка
   называла только проверки, и сессия искала скилл по списку описаний).
   Одна строка, первым делом; порядок дизайна — ниже, своей строкой. */
const ROUTES = [
  [/исследован|ключев|интент|семантик|faq|аудитори|seo-текст|сео-текст|тексты для поиск/i,
    'seo-content (skills/site-building/assets/seo-content/SKILL.md); новый рынок — его references/research.md'],
  [/нов(ая|ую|ой) витрин|нов(ый|ого) магазин|нов(ый|ого) рын|нов(ый|ого) сайт/i,
    'site-building (skills/site-building/SKILL.md) → «Выбрать режим»: новая витрина на шаблоне — с П0, на английском; рынок — к завершению'],
  [/категори|полк|товар|корзин|оформлен|касс|фильтр|отзыв|доставк/i, 'shop — что и где на витрине; вид — порядок дизайна из CLAUDE.md'],
]
let route = null
try { route = ROUTES.find(([re]) => re.test(prompt))?.[1] ?? null } catch { route = null }

let r, look
try { r = match(prompt); look = designWord(prompt) } catch { process.exit(0) }
if (!r.checks.length && !look && !route) process.exit(0)
if (route) console.log(`Скилл первым: ${route}.`)
if (!r.checks.length && !look) process.exit(0)

if (look) {
  for (const line of designHint(look)) console.log(line)
  if (!r.checks.length) process.exit(0)
  console.log('')
}

if (r.kind === 'final') {
  console.log('Слова заказчика — про сдачу. Гонится вся цепочка этапа сдачи:')
  console.log('  npm run check:all -- --final')
} else if (r.kind === 'all') {
  console.log('Слова заказчика — просьба проверить целиком. Гонится вся цепочка этапа:')
  console.log('  npm run check:all')
} else {
  /* «Похоже на просьбу проверить» — неверно ровно в половине случаев:
     «добавь кнопку в шапку» это правка, а не просьба. Но проверка та же
     самая, только ПОСЛЕ правки. Поэтому подсказка говорит про предмет, а
     не про намерение. */
  console.log('Слова заказчика — про это. Проверяется так (если это правка — после неё):')
  for (const cmd of r.checks) console.log(`  npm run ${cmd}   — ${nameOf(cmd)}`)
  console.log(`  (разбор: ${r.why.join('; ')})`)
}
console.log('')
console.log('Подсказка, не приказ. В наборе отрисованные проверки (check:craft, sweep) — из .storefront/ после сборки. Запустил — в ответе ЧТО проверено, словами.')
