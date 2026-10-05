import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import m from '@/styles/menu.module.css'
import f from '@/styles/form.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { SortView } from '@/lib/catalog-view.ts'
import { t } from '@/lib/i18n/index.ts'
import { Icon } from '@/components/Icon.tsx'
import { SortMenu } from '@/components/SortMenu.tsx'
import { LangSwitch } from '@/components/LangSwitch.tsx'
import { ReachList } from '@/components/ReachList.tsx'
import { reachRows } from '@/lib/contacts.ts'
import { Part } from './parts.tsx'
import sf from './siteframe.module.css'

/* Контролы → «Меню» (И730; слово заказчика 04.10.2026: «у нас есть образец меню в
   дизайн-системе — давай делай страницу образцом меню… и делай единый источник
   правды меню для нашей витрины»). Каждое раскрытие сайта — на одной бумаге
   (`menu`) одними строками (styles/menu.module.css): порядок полки, язык, подменю
   шапки полками и гранями, «Ещё», грани каталога. Здесь они стоят раскрытыми,
   чтобы их было видно без мыши; порядок и язык ниже — живые, открываются нажатием.
   Строки отвечают руке видом «строка» (`b.row`), и подложка под рукой у всех одной
   формы — прямоугольник углом контрола, тоже из вида (слово заказчика 04.10.2026:
   «в одном меню под рукой пилюля, в другом прямоугольник… делай прямоугольник»);
   поэтому здесь же меню связи под трубкой — свои строки (знак, две строки), та же
   подложка. Выбранное — галочкой. */
const SHELVES: [string, string][] = [['pipette', 'Oil'], ['pill', 'Capsules'], ['cookie', 'Edibles'], ['pets', 'Pets']]
const FACETS: [string, string[]][] = [['Concentration', ['5%', '10%', '20%']], ['Type', ['Full spectrum', 'Broad spectrum', 'Isolate']]]

export function Menus({ lang }: { lang: Lang }) {
  const sort: SortView = {
    label: t(lang, 'catalog.sort'), current: t(lang, 'sort.popular'), said: `${t(lang, 'catalog.sort')}: ${t(lang, 'sort.popular')}`,
    options: (['popular', 'newest', 'price-asc', 'price-desc'] as const).map((value, i) => ({ value, label: t(lang, (['sort.popular', 'sort.newest', 'sort.priceAsc', 'sort.priceDesc'] as const)[i]), href: '#top', on: i === 0 })),
  }
  return (
    <>
      <Part title="Меню" lede="Одно устройство на все раскрытия сайта: одна бумага, одна строка ростом пальца, одна подпись группы, выбранное — галочкой в конце строки, без плашки. Под рукой строка ложится прямоугольником со скруглёнными углами — одним на все меню, и в меню связи тоже. Наведите и нажмите.">
        <ul className={`${p.cluster} ${sf.row}`} role="list">
          <li className={sf.sample}>
            <h3>Порядок полки</h3>
            <div className={`${p.menu} ${sf.paper}`}>
              <ul className={m.list}>{sort.options.map((o) => <li key={o.value}><a className={b.row} href={o.href} aria-current={o.on ? 'true' : undefined}>{o.label}</a></li>)}</ul>
            </div>
          </li>
          <li className={sf.sample}>
            <h3>Язык</h3>
            <div className={`${p.menu} ${sf.paper}`}>
              <ul className={m.list}>
                {([['ro', 'Română'], ['en', 'English'], ['hu', 'Magyar']] as const).map(([code, name]) => (
                  <li key={code}><a className={b.row} href="#top" lang={code} aria-current={code === lang ? 'true' : undefined}>{code.toUpperCase()}<span className={m.aside}>{name}</span></a></li>
                ))}
              </ul>
            </div>
          </li>
          <li className={sf.sample}>
            <h3>Подменю шапки: полки</h3>
            <div className={`${p.menu} ${sf.paper}`}>
              <ul className={m.list}>
                {SHELVES.map(([sign, name], i) => <li key={name}><a className={b.row} href="#top" aria-current={i === 1 ? 'true' : undefined}><Icon id={sign} />{name}</a></li>)}
              </ul>
            </div>
          </li>
          <li className={sf.sample}>
            <h3>Подменю шапки: грани</h3>
            <div className={`${p.menu} ${sf.paper}`}>
              <div className={p.cluster}>
                {FACETS.map(([group, values]) => (
                  <div key={group} className={p.stack}>
                    <p className={m.group}>{group}</p>
                    <ul className={m.list}>{values.map((v) => <li key={v}><a className={b.row} href="#top">{v}</a></li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </li>
          <li className={sf.sample}>
            <h3>Связь под трубкой</h3>
            <div className={`${p.menu} ${sf.paper}`}><ReachList rows={reachRows({ phone: t(lang, 'reach.phone'), email: t(lang, 'reach.email') })} /></div>
          </li>
          <li className={sf.sample}>
            <h3>Грань каталога</h3>
            <div className={`${p.menu} ${sf.paper} ${p.stack}`}>
              <p className={m.group}>Type</p>
              <ul className={m.list}>
                {['Full spectrum (9)', 'Broad spectrum (4)', 'Isolate (2)'].map((v, i) => (
                  <li key={v}><label className={`${f.tick} ${b.row}`}><input type="checkbox" defaultChecked={i === 0} /><span>{v}</span></label></li>
                ))}
              </ul>
              <button className={b.btn} data-wide type="button">Apply filters</button>
            </div>
          </li>
        </ul>
      </Part>
      <Part title="Живые раскрытия" lede="Те же меню, что на сайте: нажмите — раскроются под своей кнопкой, Escape и щелчок мимо закрывают.">
        <div className={p.cluster}>
          <SortMenu sort={sort} id="design-menu-sort" />
          <LangSwitch lang={lang} label={t(lang, 'nav.lang')} drop />
        </div>
      </Part>
    </>
  )
}
