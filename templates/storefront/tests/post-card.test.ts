import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/* Карточка статьи без рамки держит две строки заголовка и две строки описания
   (И762): ряд одной высоты, под коротким заголовком нет пустой строки до
   следующего раздела. */
test('the post card keeps two lines for the title and two for the summary', () => {
  const css = readFileSync(new URL('../components/PostCard.module.css', import.meta.url), 'utf8')
  assert.match(css, /\.title\{[^}]*line-clamp:2;[^}]*min-block-size:2lh/)
  assert.match(css, /\.summary\{[^}]*line-clamp:2;[^}]*min-block-size:2lh/)
  /* Строка о статье держит две строки и прижата к заголовку (поправка И762):
     перенос у одной карточки тянул ряд; многоточие срезало рубрику. */
  assert.match(css, /\.meta\{min-block-size:2lh;display:flex;flex-direction:column;justify-content:flex-end\}/)
  assert.doesNotMatch(css, /\.meta\{[^}]*(nowrap|overflow)/)
  const tsx = readFileSync(new URL('../components/PostCard.tsx', import.meta.url), 'utf8')
  assert.match(tsx, /<p className=\{`\$\{p\.note\} \$\{s\.meta\}`\}>/)
})
