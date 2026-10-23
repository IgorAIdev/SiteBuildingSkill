/**
 * Ключи и секреты не попадают в git (И799) — семья `secretInGit` проверки кода.
 *
 * Заведено по пробелу, а не по утечке: «ключи в репозиторий не идут» стояло в
 * CLAUDE.md словами, и сторожа у слов не было. Узнать, что ключ уехал, можно
 * было только по письму GitHub о найденном секрете — когда он уже в истории,
 * и чинится не правкой, а заменой ключа у поставщика.
 *
 * Узоры — из gitleaks (`config/gitleaks.toml`: private-key, aws-access-token,
 * github-pat, stripe-access-token, slack-*, gcp-api-key, anthropic-api-key,
 * npm-access-token, gitlab-pat) и secretlint (`secretlint-rule-basicauth`:
 * логин и пароль в адресе); без зависимости: оба — бинарник или пакет ради
 * десятка выражений. Переменная с секретным именем (`*_SECRET`, `*_PASSWORD`,
 * `*_TOKEN`, `*_API_KEY`) — как `generic-api-key` у gitleaks, но по имени, а
 * не по энтропии: ссылка (`$VAR`, `${…}`) и короткое слово (`cbdin` — открытый
 * токен канала Vendure) не секрет.
 *
 * Где ищется — отслеживаемые и новые незакрытые файлы (`git ls-files
 * --cached --others --exclude-standard`); вне git — обход папки без
 * `node_modules`, `.git`, `.next`. Не ищется в снятых чужих страницах
 * (`raw/sources/`): у web.dev в исходнике страницы — его открытый ключ Google,
 * не наш (allowlist по пути, как `[allowlist] paths` у gitleaks).
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/** Секретное имя переменной окружения. */
const SECRET_NAME = /(?:SECRET|PASSWORD|PASSWD|TOKEN|API_?KEY|PRIVATE_?KEY|ACCESS_?KEY|CREDENTIALS?)/

/** Узоры с подписью: что найдено. */
const PATTERNS = [
  ['закрытый ключ', /-----BEGIN[ A-Z0-9_-]{0,100}PRIVATE KEY(?: BLOCK)?-----/g],
  ['ключ AWS', /\b(?:AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16}\b/g],
  ['токен GitHub', /\b(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/g],
  ['ключ Stripe', /\b[sr]k_(?:live|test|prod)_[A-Za-z0-9]{10,99}\b/g],
  ['токен Slack', /\bxox[baprs]-[A-Za-z0-9-]{10,}/g],
  ['ключ Google', /\bAIza[\w-]{35}\b/g],
  ['ключ Anthropic', /\bsk-ant-[a-z]+\d*-[\w-]{80,}/g],
  ['токен npm', /\bnpm_[A-Za-z0-9]{36}\b/g],
  ['токен GitLab', /\bglpat-[\w-]{20,}/g],
  ['заголовок Bearer с токеном', /\bBearer[ \t]+[A-Za-z0-9._~+/-]{20,}=*/g],
  ['заголовок Basic с логином и паролем', /\bBasic[ \t]+[A-Za-z0-9+/]{16,}={0,2}(?![A-Za-z0-9+/=])/g],
  ['логин и пароль в адресе', /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"`<>()]+:[^\s:/@'"`<>()$]{3,}@[^\s'"`<>]+/g],
]

/** `ИМЯ=значение` в строке: окружение, Dockerfile, compose, скрипт оболочки;
 *  в коде — `const ИМЯ = '…'` (без кавычек там выражение, а не значение). */
const ASSIGN = /^[ \t]*(?:export[ \t]+|ENV[ \t]+|ARG[ \t]+|(?:const|let|var)[ \t]+)?([A-Z][A-Z0-9_]*)[ \t]*=[ \t]*(["'`]?)([^\s"'`#]*)/gm
const CODE = /\.(?:[cm]?js|jsx|tsx?)$/

/** Чужой текст — ввод заказчика — без ключей: найденное заменено меткой,
 *  названо списком, а значение не печатается нигде. Узоры те же, что у
 *  проверки: «что считается ключом» живёт в одном месте. */
export function redact(text) {
  const found = []
  const note = (what) => { if (!found.includes(what)) found.push(what) }
  let out = text
  for (const [what, re] of PATTERNS) out = out.replace(re, () => { note(what); return `[вырезано: ${what}]` })
  out = out.replace(ASSIGN, (all, name, quote, value) => {
    if (!SECRET_NAME.test(name) || value.length < 8 || REFERENCE.test(value)) return all
    note(name)
    return `${all.slice(0, all.length - value.length)}[вырезано]`
  })
  return { text: out, found }
}

/** Образец окружения: лежит в git ради имён, значения секретов — пустые. */
const ENV_SAMPLE = /(?:^|\/)\.env\.(?:example|sample|template|dist)$/
/** Само окружение — в git не лежит вовсе. */
const ENV_FILE = /(?:^|\/)\.env(?:\.[\w-]+)?$/
/** Снятые чужие страницы: их ключи — их. */
const FOREIGN = /(?:^|\/)raw\/sources\//
const BINARY = /\.(?:png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|pdf|zip|gz|tgz|br|mp3|mp4|webm|mov|wasm)$/i
/** Значение, которое указывает на секрет, а не держит его. */
const REFERENCE = /^(?:\$|<|\{|%|process\.env|env\()/

/** Файлы проекта: отслеживаемые git и новые незакрытые — их унесёт следующий
 *  `git add`; вне git — обход. */
function listFiles(root) {
  try {
    return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\0').filter(Boolean)
  } catch {
    const out = []
    const walk = (dir, rel) => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === '.git' || name === '.next') continue
        const path = join(dir, name)
        const r = rel ? `${rel}/${name}` : name
        if (statSync(path).isDirectory()) walk(path, r)
        else out.push(r)
      }
    }
    walk(root, '')
    return out
  }
}

const lineOf = (text, i) => text.slice(0, i).split('\n').length

/** Находки по файлам: строка `путь:строка  что`. Значение не печатается —
 *  отчёт проверки сам не должен стать утечкой. */
export function secretsIn(root) {
  const found = []
  for (const rel of listFiles(root)) {
    if (FOREIGN.test(rel) || BINARY.test(rel)) continue
    const sample = ENV_SAMPLE.test(rel)
    if (ENV_FILE.test(rel) && !sample) { found.push(`${rel}  файл окружения лежит в git — убрать (git rm --cached) и заменить ключи`); continue }
    let text
    try { text = readFileSync(join(root, rel), 'utf8') } catch { continue }
    if (text.includes('\0')) continue
    for (const [what, re] of PATTERNS) {
      for (const m of text.matchAll(re)) found.push(`${rel}:${lineOf(text, m.index)}  ${what}`)
    }
    for (const m of text.matchAll(ASSIGN)) {
      const [, name, quote, value] = m
      if (!SECRET_NAME.test(name) || !value || REFERENCE.test(value)) continue
      if (CODE.test(rel) && !quote) continue
      /* В образце окружения секрет пуст всегда; в прочих файлах короткое
         слово — имя канала или заглушка, а не ключ. */
      if (sample || value.length >= 8) found.push(`${rel}:${lineOf(text, m.index)}  ${name}= со значением${sample ? ' в образце окружения — должно быть пусто' : ''}`)
    }
  }
  for (const name of ['.env', '.env.local']) {
    if (!ignored(root, name)) found.push(`.gitignore  ${name} не закрыт — первый же git add унесёт ключи`)
  }
  return found
}

/** Закрыт ли файл в `.gitignore`. Спрашивается git (он знает все правила и
 *  вложенные файлы); вне git — строки корневого `.gitignore`; нет и его —
 *  проверять нечего: в git ничего не уходит. */
function ignored(root, name) {
  try {
    execFileSync('git', ['check-ignore', '--no-index', '-q', name], { cwd: root, stdio: 'ignore' })
    return true
  } catch (e) {
    if (e.status === 1) return false
  }
  const file = join(root, '.gitignore')
  if (!existsSync(file)) return true
  return readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim().replace(/^\//, ''))
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('!'))
    .some((l) => new RegExp('^' + l.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$').test(name))
}
