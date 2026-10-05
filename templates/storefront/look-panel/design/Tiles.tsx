import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import p from '@/styles/primitives.module.css'
import type { CSSProperties } from 'react'
import type { Lang } from '@/lib/locale.ts'
import { HOMES, type HomeVariant } from '@/lib/homes.ts'
import { content, source } from '@/lib/source/index.ts'
import { Effects } from '@/components/blocks/Effects.tsx'
import { Doors, effectDoors, type Door } from '@/components/blocks/Doors.tsx'
import type { BlockCtx } from '@/components/blocks/types.ts'
import { Part, States, Worn, type Hand } from './parts.tsx'
import { lookNow } from '@/lib/look.ts'
import s from './tiles.module.css'

/* Home → Плитки: одежды плитки (панель Look → Home → Tiles) — плитки ряда
   эффектов; плиток категорий на главной нет, категории — кнопками героя
   (И673). Настоящий блок сайта с одеждой, переданной ему, а не копия и не
   выбранное в панели (слово заказчика 30.09.2026). По одной плашке на
   одежду, на полу страницы (01.10.2026: «мне нужно только по одной планке
   с примером варианта плашки»); заголовок блока — имя одежды. */
const ZOOM = 'Снимок чуть приближается.'
const PRESS = 'линия по краю плашки темнеет. На телефоне это отклик на палец.'
/* Описание — как у карточек: что это, покой, наведение, нажатие (`States`,
   И602). На руку отвечает плашка, у всех одинаково (И601). */
/* Стекло плашки: число непрозрачности берётся из выпущенной палитры, чтобы
   в описании оно не отставало от сайта (`glassShare`). */
const glassHand = (share: number | null): Hand => {
  const seen = share === null ? '' : ` — ${share} %, сквозь него виден снимок на ${100 - share} %`
  const own = share === null ? '' : ` ${share} %,`
  return {
    what: `Та же пилюля, полупрозрачная, без стрелки: светлое стекло, тёмное имя. Непрозрачность стекла${seen}; её считает строитель палитры — не ниже границы, при которой имя читается на любом снимке.`,
    rest: `стекло${own} просвечивает, вокруг пилюли тихая окантовка, линии по краю плашки нет.`,
    hover: `стекло плавно становится непрозрачным (100 %), окантовка пилюли темнеет, тихая линия по краю плашки. ${ZOOM}`,
    press: `стекло непрозрачное (100 %), окантовка пилюли тёмная, ${PRESS}`,
  }
}

/* Доля непрозрачности стекла плашки из styles/palette.css витрины. */
async function glassShare(): Promise<number | null> {
  try {
    const css = await readFile(join(process.cwd(), 'styles', 'palette.css'), 'utf8')
    const hex = /--plate-glass:\s*light-dark\(#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})/.exec(css)?.[1]
    return hex ? Math.round((parseInt(hex, 16) / 255) * 100) : null
  } catch {
    return null
  }
}

const NAMES: Record<HomeVariant, [string, Hand]> = {
  caption: ['Caption', { what: 'Как карточка статьи блога: снимок, под ним имя и две строки об эффекте, на полу страницы. Описания у эффекта нет — стоит имя одно.', rest: 'снимок без линии по краю, стрелки нет.', hover: `тихая линия по краю снимка. ${ZOOM}`, press: 'линия по краю снимка темнеет. На телефоне это отклик на палец.' }],
  button: ['Button', { what: 'Имя белой кнопкой-пилюлей на снимке внизу слева, с тонкой кромкой, как кнопки связи.', rest: 'пилюля со стрелкой, линии по краю плашки нет.', hover: `тихая линия по краю плашки, стрелка чуть сдвигается. ${ZOOM}`, press: PRESS }],
  glass: ['Glass', glassHand(null)],
  frost: ['Frost', { what: 'Прямоугольник с углами кнопок, без заливки, с окантовкой: под ним размыт снимок — матовое стекло (backdrop blur). Имя — тёмной краской стекла палитры, без стрелки.', rest: 'снимок под именем чуть размыт, вокруг тихая окантовка, линии по краю плашки нет.', hover: `размытие то же, окантовка чуть темнее, тихая линия по краю плашки. ${ZOOM}`, press: `размытие то же, окантовка тёмная, ${PRESS}` }],
  bar: ['Bar', { what: 'Полупрозрачная лента с именем по низу снимка: и имя, и снимок видны.', rest: 'лента, линии по краю плашки нет.', hover: `тихая линия по краю плашки, стрелка чуть сдвигается. ${ZOOM}`, press: PRESS }],
  mount: ['Mount', { what: 'Снимок в белой плашке, имя под ним.', rest: 'белая плашка, линии по краю нет.', hover: `тихая линия по краю плашки, стрелка чуть сдвигается. ${ZOOM}`, press: PRESS }],
  under: ['Under', { what: 'Снимок, имя под ним на полу страницы (Aesop).', rest: 'снимок без линии по краю.', hover: `тихая линия по краю снимка, стрелка чуть сдвигается. ${ZOOM}`, press: 'линия по краю снимка темнеет. На телефоне это отклик на палец.' }],
  outline: ['Outline', { what: 'Белое имя прямо на снимке, вокруг букв — тихая окантовка вместо тени.', rest: 'имя без стрелки, линии по краю плашки нет.', hover: `тихая линия по краю плашки. ${ZOOM}`, press: PRESS }],
}

/* Регистр имени (панель Look → Home → Tile text): две плашки одной одежды,
   регистр задан ручкой на самой плашке — образец не читает выбор панели. */
const CASES = [
  ['Capitalised', 'Имя как написано: первая буква заглавная.', 'none'],
  ['ALL CAPS', 'Все буквы имени заглавные.', 'uppercase'],
] as const

/* Образец одежды — одна дверь под именем одежды: настоящий ряд дверей
   (Doors), а не блок целиком — шапка ряда с выходом и кнопками листания
   стоит один раз, в «Рядах плиток» ниже. */
const Sample = ({ id, title, home, door }: { id: string; title: string; home: HomeVariant; door: Door[] }) => (
  <section>
    <div className={p.sectionHead}><h2>{title}</h2></div>
    <Doors id={id} home={home} doors={door} />
  </section>
)

export async function Tiles({ lang }: { lang: Lang }) {
  const [fx, page] = await Promise.all([source().effects(lang), content().page(lang, 'home')])
  const effects = fx.ok ? fx.value : []
  const one = effectDoors(lang, effects.slice(0, 1))
  const site = (await lookNow()).home
  const names = { ...NAMES, glass: ['Glass', glassHand(await glassShare())] as [string, Hand] }
  /* Ряды — как на главной: заголовок и описание из данных страницы. */
  const blocks = page.ok ? page.value.blocks : []
  const eff = blocks.find((b) => b.type === 'effects')
  const ctx = { lang, home: site, effects } as unknown as BlockCtx
  return (
    <>
      <Part title="Ряд плиток" lede="Ряд эффектов главной в одежде, которая стоит на сайте: заголовок и описание из данных, справа кнопки листания и «View all» — набор «Уголок» из «Кнопок», рост 40. Весь ряд помещается — кнопок листания нет; в узкой коробке их нет тоже: ряд листают пальцем. Категории — не плитками, а кнопками на снимке героя (Home → Hero Block).">
        {eff && eff.type === 'effects' ? <Effects block={eff} ctx={ctx} place={{ air: null }} /> : null}
      </Part>
      <Part title="Одежды плитки" lede="Одежды плитки главной — по одной плитке на каждую. Выбирается в панели Look → Home → Tiles. Под каждой — как она отвечает руке.">
        <ul className={`${p.grid} ${s.variants}`}>
          {HOMES.map((home) => (
            <li key={home} className={s.variant}>
              <Sample id={`tile-${home}`} title={names[home][0]} home={home} door={one} />
              <Worn on={home === site} />
              <States {...names[home][1]} />
            </li>
          ))}
        </ul>
        <ul className={`${p.grid} ${s.variants}`}>
          {CASES.map(([title, note, value]) => (
            <li key={value} className={s.variant} style={{ '--door-case': value } as CSSProperties}>
              <Sample id={`tile-case-${value}`} title={title} home="button" door={one} />
              <States {...NAMES.button[1]} what={note} />
            </li>
          ))}
        </ul>
      </Part>
    </>
  )
}
