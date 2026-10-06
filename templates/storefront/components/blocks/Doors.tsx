import p from '@/styles/primitives.module.css'
import s from './blocks.module.css'
import type { Effect, Image } from '@/lib/source/contract.ts'
import type { Lang } from '@/lib/locale.ts'
import { hrefFor } from '@/lib/href.ts'
import type { HomeVariant } from '@/lib/homes.ts'
import b from '@/styles/btn.module.css' // look-home:button,glass
import go from '@/styles/go.module.css'
import { Icon } from '../Icon.tsx'
import { shot } from '@/lib/shot.ts'

/** Дверь — имя, адрес, кадр и строка о ней; нет кадра — дверь стоит на
 *  краске пола, нет строки — стоит имя одно. */
export type Door = { key: string; name: string; href: string; image: Image | null; line: string | null }

/* Двери — плитки главной: ряд эффектов (Effects.tsx; слово заказчика
   03.10.2026: «ниже делай такой же блок только эффекты»). Плиток полок больше
   нет: полки — кнопками на снимке героя (слово заказчика 03.10.2026:
   «категории блок убирай… категории будут на херо изображении кнопками с
   иконками категорий», И673). Дверь — МЕСТО, а не товар: у неё
   нет листа, цены и строки описания, и одета она иначе, чем карточка товара
   (лист с ценой под снимком), — чтобы на главной одно не читалось другим.
   Все полки по-прежнему стоят на главной — кнопками героя: по ним покупатель
   на телефоне понимает, что продаётся (Baymard, docs/design/home.md). Кадр — пропорция ряда карточек
   (`--card-frame`, И736; до 04.10.2026 — 1.4, как у cbdin).

   Лентой, как полка товаров (рельса товаров): на телефоне соседняя выглядывает. Ссылка одна — имя, её область растянута
   на всю дверь.

   Одежда — значение вида (`home`, lib/homes.ts; панель Look → Home), образцы
   — вкладка «Плитки» дизайн-системы. Разметка одна; одежда решает, на чём
   стоит имя (`data-door`, blocks.module.css), и чем оно нарисовано:
   · button — тихая кнопка-пилюля на снимке внизу слева, на поверхности, с
     тонкой кромкой кнопок, как кнопки связи (слово заказчика 01.10.2026:
     «тень более нигде не используется… давай тонкую окантовку»; «квадратная
     кнопка некрасива, давай пилюлю»);
   · frost — имя прямоугольником органа (угол `--r-ctrl`) без заливки, с
     окантовкой, под ним размыт снимок — матовое стекло (слово заказчика
     01.10.2026; И613);
   · bar — полупрозрачная лента с именем по низу снимка (cbdin);
   · mount — снимок в белой плашке, имя под ним (cbdin);
   · under — имя под снимком на полу страницы (Aesop).
   · outline — белое имя прямо на снимке внизу слева, без плашки, с тихой
     окантовкой букв вместо тени (cbdin «Shadow»; слово заказчика 01.10.2026:
     «делай не тень, а окантовку тихую у текста»);
   · caption — как карточка статьи блога (PostCard): снимок, под ним имя и
     две строки описания эффекта на полу страницы (слово заказчика
     04.10.2026: «в таком же стиле как и плашка блога, т.е. изображение и
     ниже текст»). Строку несёт только эта одежда (`LINE`).
   У остальных имя — ссылка «куда ведёт» (`go`). Регистр имени — ручка
   `--door-case` (панель Look → Home → Tile text), одна на все одежды.
   На руку отвечает плашка, а не кнопка в ней, — у всех одежд одинаково:
   под рукой тихая окантовка плашки и сдвиг стрелки, нажатие — окантовка
   сильнее (blocks.module.css, И601). */
const LINK: Record<HomeVariant, string> = {
  caption: `${go.go} ${s.doorGo}`, // look-home:caption
  button: b.btn, // look-home:button
  glass: b.btn, // look-home:glass
  frost: b.btn, // look-home:frost
  bar: `${go.go} ${s.doorGo}`, // look-home:bar
  mount: `${go.go} ${s.doorGo}`, // look-home:mount
  under: `${go.go} ${s.doorGo}`, // look-home:under
  outline: `${go.go} ${s.doorGo}`, // look-home:outline
  minimal: `${go.go} ${s.doorGo}`, // look-home:minimal
}
/* Плашка, крашенная листом (`--plate`), объявляет себя полом (`data-plate`,
   styles/base.css): лента имени у `bar`, вся дверь у `mount`. */
/* Имя матовым стеклом — признак кнопки `data-frost` (styles/btn.module.css,
   И613): прямоугольник органа без заливки, под ним размыт снимок. */
const FROST: Partial<Record<HomeVariant, true>> = {
  frost: true, // look-home:frost
}
/* Строка о двери под именем — у одежды-подписи (как строка о статье). */
const LINE: Partial<Record<HomeVariant, true>> = {
  caption: true, // look-home:caption
}
const PLATE: Partial<Record<HomeVariant, 'door' | 'name'>> = {
  bar: 'name', // look-home:bar
  mount: 'door', // look-home:mount
}

/** Двери эффектов — на страницу эффекта. */
export const effectDoors = (lang: Lang, effects: readonly Effect[]): Door[] => effects.map((e) => ({ key: e.code, name: e.name, href: hrefFor(lang, { effect: e.code }), image: e.image, line: e.description || null }))

/** Ряд дверей — рельса `id` (её листают кнопки шапки ряда, RailHead). */
export function Doors({ id, home, doors }: { id: string; home: HomeVariant; doors: Door[] }) {
  return (
    <ul id={id} className={`${p.rail} ${s.doors}`} data-rail="goods" data-door={home}>
      {doors.map((d) => (
        <li key={d.key} className={s.door} data-plate={PLATE[home] === 'door' ? '' : undefined}>
          <div className={`${p.frame} ${s.doorShot}`}>{d.image ? <img {...shot(d.image, 'shelf', true)} alt="" decoding="async" /> : null}</div>
          <h3 className={s.doorName} data-plate={PLATE[home] === 'name' ? '' : undefined}><a className={LINK[home]} data-frost={FROST[home] ? '' : undefined} href={d.href}><span className={s.doorLabel}>{d.name}</span><Icon id="arrow-right" className={go.to} /></a></h3>
          {LINE[home] && d.line ? <p className={s.doorLine}>{d.line}</p> : null}
        </li>
      ))}
    </ul>
  )
}
