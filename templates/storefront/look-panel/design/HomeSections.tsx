import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import type { Lang } from '@/lib/locale.ts'
import { content, source } from '@/lib/source/index.ts'
import { shelfCard } from '@/lib/view.ts'
import { arrange } from '@/lib/homes.ts'
import { lookNow } from '@/lib/look.ts'
import type { Tone } from '@/lib/bands.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { Blocks } from '@/components/blocks/registry.tsx'
import { Doors, effectDoors } from '@/components/blocks/Doors.tsx'
import { RailHead } from '@/components/RailHead.tsx'
import { RailPager } from '@/components/RailPager.tsx'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import type { BlockCtx } from '@/components/blocks/types.ts'
import { Part } from './parts.tsx'
import s from './home.module.css'

/* Главная → Разделение секций: цвета полов и образец подложки под полками
   (слово заказчика 03.10.2026: «мне бы визуальный пример увидеть… хочу
   посмотреть, сравнить»; разбор — docs/design/home.md §8). Показ, не выбор:
   подложку секции включает панель Look (Admin → Sections, И591); страница
   показывает оба состояния настоящим блоком сайта, каждое — своим, а не
   выбранным в панели. Устройство — роль палитры `--band`, вид `--band-<блок>`. */
const FLOORS: [string, string, string][] = [
  ['--page', 'Страница', 'фон всего сайта'],
  ['--band', 'Подложка: тихая', 'чуть светлее страницы — для обычных секций'],
  ['--pop-tint', 'Подложка: марки', 'светлый тон цвета марки — выделить секцию (Instagram, рассылка)'],
  ['--page-deck', 'Подложка: тёмная', 'как шапка и подвал — самая заметная секция'],
  ['--plate', 'Карточка', 'белая карточка товара, корзина, шторка'],
]

export async function HomeSections({ lang }: { lang: Lang }): Promise<ReactNode> {
  const [cols, fx, page, look] = await Promise.all([source().collections(lang), source().effects(lang), content().page(lang, 'home'), lookNow()])
  const blocks = page.ok ? page.value.blocks : []
  /* Две полки товара из главной: первая стоит на полу, вторая — на тихой подложке. */
  const shelves = arrange(blocks).filter((x) => x.slot === 'featured').slice(0, 2)
  const ids = shelves.flatMap((x) => (x.block.type === 'featured' ? x.block.ids : []))
  const cards = ids.length ? await source().cards(lang, ids) : null
  const ctx = (featured: Tone) => ({
    lang, home: look.home, collections: cols.ok ? cols.value : [], effects: fx.ok ? fx.value : [],
    cards: cards?.ok ? Object.fromEntries(cards.value.map((c) => [c.id, shelfCard(lang, c)])) : {},
    spotlight: null, cart: { submit: cartSubmit, call: cartCall }, bands: { featured },
  }) as unknown as BlockCtx
  return (
    <>
      <Part title="Подложка под полками: на полу и на тихой подложке" lede="Настоящий блок полки товаров главной, каждый в своём состоянии: одна полка на полу страницы, другая на тихой подложке. Включается и сохраняется в панели Look: Admin → Sections → Featured.">
        <div className={s.rhythm}>
          {shelves[0] ? <section className={s.sample}><h3>Полка на полу страницы</h3><Blocks placed={[shelves[0]]} ctx={ctx('none')} /></section> : null}
          {shelves[1] ? <section className={s.sample}><h3>Полка на тихой подложке</h3><Blocks placed={[shelves[1]]} ctx={ctx('quiet')} /></section> : null}
        </div>
      </Part>
      <Part title="Шапка ряда и кнопки листания" lede="Ряд, который листают вбок, — плитки категорий и эффектов, полки товара: слева заголовок с описанием, справа кнопки листания и выход «View all». Выход есть, только когда есть страница «всё это» (скилл shop, catalog.md); кнопки листания видны, пока ряд не помещается целиком. Настоящие компоненты сайта, не копии.">
        {fx.ok && fx.value.length ? (
          <div className={s.rhythm}>
            <section className={s.sample}>
              <h3>Ряд с выходом</h3>
              <RailHead id="sys-rail-all" title="Shop by effect" lede="Ряд, у которого есть страница «всё это»" all={hrefFor(lang, { catalog: true })} lang={lang} />
              <Doors id="sys-rail-all-rail" home={look.home} doors={effectDoors(lang, fx.value)} />
            </section>
            <section className={s.sample}>
              <h3>Ряд без выхода</h3>
              <RailHead id="sys-rail-plain" title="Shop by effect" lede="Страницы «все эффекты» нет — кнопка выхода не стоит" all={null} lang={lang} />
              <Doors id="sys-rail-plain-rail" home={look.home} doors={effectDoors(lang, fx.value)} />
            </section>
            <section className={s.sample}>
              <h3>Кнопки листания отдельно</h3>
              <div className={p.cluster}><RailPager rail="sys-rail-lone-rail" back={t(lang, 'rail.prev')} next={t(lang, 'rail.next')} /></div>
              <Doors id="sys-rail-lone-rail" home={look.home} doors={effectDoors(lang, fx.value)} />
            </section>
          </div>
        ) : null}
      </Part>
      <Part title="Разделение секций" lede="Секции главной отделяются подложкой во всю ширину окна и воздухом. Включается и сохраняется в панели Look: Admin → Sections — у каждой секции ряд кружков: без подложки, тихая, марки, тёмная. Ниже — цвета этих подложек.">
        <div className={s.floors} aria-label="Цвет пола">
          {FLOORS.map(([v, name, note]) => (
            <div key={v} className={s.floor}><span className={s.chip} style={{ background: `var(${v})` }} /><b>{name}</b><code>{v}</code><span className={p.note}>{note}</span></div>
          ))}
        </div>
      </Part>
    </>
  )
}
