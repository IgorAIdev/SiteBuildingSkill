import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import { Icon } from '@/components/Icon.tsx'
import { QuantityStepper } from '@/components/QuantityStepper.tsx'
import { SITE_LOOK } from '@/lib/counter-look.ts'
import { VariantPicker } from '@/components/VariantPicker.tsx'
import { SaveToggle } from '@/components/SaveToggle.tsx'
import { HelpDock } from '@/components/HelpDock.tsx'
import { CartForm } from '@/components/CartForm.tsx'
import { CartLines } from '@/components/CartLines.tsx'
import { CartPane } from '@/components/CartPane.tsx'
import type { OptionGroupLinks } from '@/lib/variant.ts'
import { cartView } from '@/lib/cart-view.ts'
import { reachRows, supportHref, SUPPORT } from '@/lib/contacts.ts'
import { shot } from '@/lib/shot.ts'
import { source } from '@/lib/source/index.ts'
import { t } from '@/lib/i18n/index.ts'
import type { Lang } from '@/lib/locale.ts'
import { Part } from './parts.tsx'
import { Probe } from './Probe.tsx'
import { cartOf, sampleLines, stillCall, stillSubmit } from './CheckoutParts.tsx'
import s from './design.module.css'

/* Вкладка «Ноутбук и телефон» (И768). Слово заказчика 05.10.2026: «может
   вообще все кнопки перерисовать для десктопа и для мобайла, чтоб было в
   дизайн-системе?». Перерисовывать нечего: кнопка одна, рост ей даёт шкала,
   а под пальцем его меняет `@media (pointer:coarse)`. У каждого такого блока
   есть близнец на рамке `data-pointer='coarse'` (строитель шкал и модули;
   сверяет check:css, семья `fingerTwin`), и плитка ставит ОДИН настоящий
   компонент дважды: слева как есть — мышь ноутбука, справа в рамке пальца —
   телефон и планшет. Ширина у половин одна: меняется только рука. Числа —
   замер отрисованного (`Probe`, `hit`): рост и цель пальца. Вид — тот, что
   стоит на сайте (панель Look): здесь сравнивают руку, а не варианты. */

type Hand = 'mouse' | 'finger'
const HANDS: [Hand, string][] = [['mouse', 'Ноутбук'], ['finger', 'Телефон']]

/** Плитка: орган под мышью и под пальцем, под каждым — замер узла `pick`. */
function Pair({ name, pick = 'button, a', children }: { name: string; pick?: string; children: (hand: Hand) => ReactNode }) {
  return (
    <li className={s.btnStyle}>
      <div className={`${p.grid} ${s.hands}`}>
        {HANDS.map(([hand, label]) => (
          <div key={hand} className={s.hand} data-row="" data-pointer={hand === 'finger' ? 'coarse' : undefined}>
            <span className={s.btnName}>{label}</span>
            <div className={s.handSample}>{children(hand)}</div>
            <Probe what="hit" pick={pick} />
          </div>
        ))}
      </div>
      <span className={s.btnName}>{name}</span>
    </li>
  )
}

/** Выбор крепости со страницы товара — одна группа, выбрано 10 %. */
const STRENGTH: OptionGroupLinks[] = [
  { code: 'strength', name: 'Крепость', options: [['5', '5 %'], ['10', '10 %'], ['15', '15 %']].map(([code, name]) => ({ code, name, href: '#top', current: code === '10' })) },
]
const FIELD = { label: 'Количество', name: undefined, min: 1, max: 9, initial: 2, less: 'Меньше', more: 'Больше' }

export async function Pointers({ lang }: { lang: Lang }) {
  const [shelves, lines] = await Promise.all([source().collections(lang), sampleLines(lang)])
  const picture = (shelves.ok ? shelves.value : []).find((c) => c.image)?.image
  const view = lines.length ? cartView(lang, cartOf(lines, null), null) : null
  return (
    <Part title="Ноутбук и телефон" lede="Один и тот же орган дважды: слева — как его жмут мышью на ноутбуке, справа — пальцем на телефоне и планшете. Кнопки с надписью под пальцем на ступень выше; мелкие органы — сердце, фишка, счётчик — остаются рисунком 32, а пальцу добавляется невидимый запас до 44. Число — замер: высота, «цель» — куда попадёт палец. Наведите и нажмите.">
      <div className={s.group}>
        <ul className={`${p.grid} ${s.btnStyles}`} data-wide="">
          <Pair name="Кнопка малая">{() => <button className={b.btn} data-size="sm" type="button"><Icon id="sliders-horizontal" />Фильтры</button>}</Pair>
          <Pair name="Кнопка средняя">{() => <button className={b.btn} type="button">Подробнее</button>}</Pair>
          <Pair name="Главная кнопка">{() => <button className={b.btn} data-voice="loud" type="button"><Icon id="shopping-cart" />В корзину</button>}</Pair>
          <Pair name="Главная кнопка крупная">{() => <button className={b.btn} data-voice="loud" data-size="lg" type="button">К оформлению</button>}</Pair>
          <Pair name="Знак без слова — сердце">{() => <SaveToggle id="design-finger-save" add="В избранное" remove="Убрать из избранного" />}</Pair>
          <Pair name="Сердце на снимке">{() => (
            <div className={`${p.frame} ${s.heartShot}`}>
              {picture ? <img {...shot(picture, 'shelf', true)} alt="" decoding="async" /> : null}
              <span className={p.cut}>−17 %</span>
              <SaveToggle id="design-finger-heart" add="В избранное" remove="Убрать из избранного" over="picture" />
            </div>
          )}</Pair>
          <Pair name="Фишка выбранного фильтра">{() => <a className={p.chip} data-pill href="#top" aria-label="Снять 10 %">10 %<Icon id="x" /></a>}</Pair>
          <Pair name="Выбор варианта">{() => <VariantPicker groups={STRENGTH} error={null} />}</Pair>
          <Pair name="Счётчик на странице товара" pick="[role='group'] button">{() => <QuantityStepper look={SITE_LOOK} field={FIELD} />}</Pair>
          <Pair name="Связь и «Наверх»">{() => (
            <div className={s.dockSample}>
              <HelpDock bare rows={reachRows({ phone: t(lang, 'reach.phone'), email: t(lang, 'reach.email') })} who={{ name: SUPPORT.name, href: supportHref() }} words={{ open: t(lang, 'reach.menu'), online: t(lang, 'reach.online'), top: t(lang, 'reach.top') }} />
            </div>
          )}</Pair>
        </ul>
      </div>
      {/* Строка корзины — та же, что на странице корзины и в шторке; шторка
          открывается настоящая, в рамке своей руки. Счётчик корзины — только
          здесь: рост ему ставит строка (`--qty-h`, Cart.module.css), и отдельно
          от неё он показал бы чужой рост. Номеров страниц нет: в половине плитки
          они сворачиваются в «1 / 2», а круг листания — та же средняя кнопка. */}
      {view ? (
        <div className={s.group}>
          <ul className={`${p.grid} ${s.btnStyles}`} data-row="">
            <Pair name="Строка корзины и шторка" pick="[role='group'] button">{(hand) => (
              <div className={s.handCart}>
                <CartForm lang={lang} submit={stillSubmit} call={stillCall} initial={null} timeout={view.messages.timeout} failed={view.messages.failed}>
                  <CartLines lines={view.lines.slice(0, 1)} />
                </CartForm>
                <button className={b.btn} type="button" popoverTarget={`design-finger-cart-${hand}`}>Открыть шторку корзины</button>
                <CartPane lang={lang} id={`design-finger-cart-${hand}`} src={`/api/cart?lang=${lang}`} title={t(lang, 'cart.title')} close={t(lang, 'nav.close')} shown={view} />
              </div>
            )}</Pair>
          </ul>
        </div>
      ) : null}
    </Part>
  )
}
