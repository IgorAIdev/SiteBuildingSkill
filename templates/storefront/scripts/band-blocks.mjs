import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/* Блоки главной, которым вид может дать подложку (И591): всё, что
   зарегистрировано в реестре блоков (`components/blocks/registry.tsx`,
   объект RENDERERS), кроме первого экрана. Новый блок в реестре получает
   выключатель в панели и свойство вида `--band-<блок>` без правки списка
   — этот файл читают сборка свойств вида (look-slots.mjs) и каталог панели. */
export function bandBlocks(site) {
  const file = join(site, 'components/blocks/registry.tsx')
  if (!existsSync(file)) return []
  const text = readFileSync(file, 'utf8')
  const body = /export const RENDERERS = \{([\s\S]*?)\}\s*satisfies/.exec(text)?.[1] ?? ''
  return [...body.matchAll(/^\s*([a-z][a-z0-9-]*)\s*:/gm)].map((m) => m[1]).filter((t) => t !== 'hero')
}
