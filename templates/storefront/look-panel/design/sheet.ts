import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/* Что показывает страница набора — ИЗ ТЕХ ЖЕ ФАЙЛОВ, что носит сайт:
   ступени и роли размера — из выпуска строителя шкал (`styles/scale.css`,
   подпись роли — его же строкой), ступени красок — из выпуска строителя
   палитры (`styles/palette.css`), знаки — из листа (`styles/icons.svg`).
   Второго списка нет: строитель выпустил новую ступень — она на странице
   на следующем показе; правит палитру или шкалу другой чат — страница
   показывает его правку. Числа стоят не здесь, а меряются на странице
   (`Probe.tsx`): показанное = отрисованное. */

const STYLES = join(process.cwd(), 'styles')
const read = (name: string) => (existsSync(join(STYLES, name)) ? readFileSync(join(STYLES, name), 'utf8') : '')
/** Первый блок `:root{…}` файла — опубликованный набор; блоки наборов ниже
 *  (`[data-scale="…"]`) — варианты панели, их страница не показывает. */
const rootBlock = (css: string) => css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

export type Step = { name: string; note: string }

/** Роли и ступени строителя шкал с его подписью: `--sp-4: …; /* поле карточки *\/`. */
export function scaleSteps(prefix: string): Step[] {
  const out: Step[] = []
  for (const m of rootBlock(read('scale.css')).matchAll(/^\s*(--([a-z0-9-]+)):[^;]*;(?:\s*\/\*\s*(.*?)\s*\*\/)?/gm)) {
    if (m[2].startsWith(prefix)) out.push({ name: m[1], note: m[3] ?? '' })
  }
  return out
}

/** Семьи красок строителя палитры и их ступени — в порядке выпуска. */
export function paletteFamilies(): { family: string; steps: string[] }[] {
  const fams = new Map<string, string[]>()
  for (const m of rootBlock(read('palette.css')).matchAll(/^\s*--([a-z]+)-(\d+):/gm)) {
    fams.set(m[1], [...(fams.get(m[1]) ?? []), `--${m[1]}-${m[2]}`])
  }
  return [...fams].map(([family, steps]) => ({ family, steps }))
}

/** Знаки листа — все, по порядку листа. Делить их на «линию» и «заливку»
 *  странице незачем: показ один, пропорцию знак держит сам (И627). */
export function iconSheet(): string[] {
  return [...read('icons.svg').matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1])
}

/** Стили кнопки — из каталога панели вида (`look-panel/ui/catalog.json`,
 *  его собирает build-catalog из styles/buttons.json набора и сайта): у
 *  выпущенной витрины styles/buttons.json несёт только выбранный вид, все
 *  варианты держит панель (И614). Ось — главная, тихая, форма, ответ на
 *  руку; вариант — имя панели, «что это» по-русски и роли. */
export type ButtonStyle = { id: string; name: string; what: string; roles: Record<string, string> }
export type ButtonAxis = { id: string; name: string; what: string; options: ButtonStyle[] }
type Catalog = { axes?: { field: string; title?: string; name: string; what?: string }[]; groups?: Record<string, { id: string; name: string; line?: string; what?: string; vars?: Record<string, string> }[]> }
const CATALOG = join(process.cwd(), 'look-panel/ui/catalog.json')
export function buttonCatalog(): ButtonAxis[] {
  if (!existsSync(CATALOG)) return []
  const cat = JSON.parse(readFileSync(CATALOG, 'utf8')) as Catalog
  return (cat.axes ?? []).filter((a) => a.field.startsWith('btn-')).map((a) => ({
    id: a.field.slice(4), name: a.title ?? a.name, what: a.what ?? '',
    options: (cat.groups?.[a.field] ?? []).map((o) => ({ id: o.id, name: o.name, what: o.what || o.line || '', roles: o.vars ?? {} })),
  }))
}
