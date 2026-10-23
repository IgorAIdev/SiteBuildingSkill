import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { redact } from '../tools/secrets.mjs'

const HOOK = fileURLToPath(new URL('../tools/hook-on-prompt.mjs', import.meta.url))
const TOKEN = 'ghp_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'

test('brief: a pasted key is cut out and named, plain words stay as they are', () => {
  const said = `кнопка «В корзину» мелкая\nвот ключ ${TOKEN}\nVENDURE_API_TOKEN=s3cretvalue42`
  const { text, found } = redact(said)
  assert.ok(text.startsWith('кнопка «В корзину» мелкая\n'))
  assert.ok(!text.includes(TOKEN) && !text.includes('s3cretvalue42'))
  assert.deepEqual(found, ['токен GitHub', 'VENDURE_API_TOKEN'])
  assert.deepEqual(redact('шапка уехала на телефоне'), { text: 'шапка уехала на телефоне', found: [] })
})

const say = (root, prompt, session = '4f2a9c1e-77aa') => spawnSync(process.execPath, [HOOK], {
  input: JSON.stringify({ prompt, session_id: session }),
  env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  encoding: 'utf8',
})

test('brief: every owner message lands word for word in one file per session, outside git', () => {
  const root = mkdtempSync(join(tmpdir(), 'brief-'))
  try {
    say(root, 'сделай кнопку крупнее\nи шапку тёмной')
    const out = say(root, `ключ ${TOKEN} и фильтр не работает`)
    const dir = join(root, '.claude/briefs')
    assert.equal(readFileSync(join(dir, '.gitignore'), 'utf8'), '*\n')
    const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
    assert.equal(files.length, 1)
    assert.match(files[0], /^\d{4}-\d{2}-\d{2}-4f2a9c1e\.md$/)
    const text = readFileSync(join(dir, files[0]), 'utf8')
    assert.ok(text.includes('сделай кнопку крупнее\nи шапку тёмной'))
    assert.ok(text.includes('и фильтр не работает'))
    assert.ok(!text.includes(TOKEN))
    assert.match(out.stdout, /токен GitHub/)
    assert.ok(!out.stdout.includes(TOKEN))
    say(root, 'другая сессия', '9d0e1f2a-0000')
    assert.equal(readdirSync(dir).filter((f) => f.endsWith('.md')).length, 2)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('brief: an empty or broken input writes nothing and never fails the prompt', () => {
  const root = mkdtempSync(join(tmpdir(), 'brief-'))
  try {
    assert.equal(say(root, '   ').status, 0)
    assert.equal(existsSync(join(root, '.claude/briefs')), false)
    const broken = spawnSync(process.execPath, [HOOK], { input: '{', env: { ...process.env, CLAUDE_PROJECT_DIR: root }, encoding: 'utf8' })
    assert.equal(broken.status, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
