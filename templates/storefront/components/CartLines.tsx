import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './Cart.module.css'
import type { CartLineView } from '@/lib/cart-view.ts'
import { QuantityStepper } from './QuantityStepper.tsx'
import { shot } from '@/lib/shot.ts'
import { SiteLink } from './SiteLink.tsx'

/* Строки корзины — одни на страницу корзины и на её шторку (CartPane):
   одна вещь — одно место (правило 10). Стоят внутри формы корзины
   (CartForm): счётчик и «Удалить» — её кнопки. Разбор строки — у `.line`
   в Cart.module.css; шторка меняет только ручку снимка (`--line-thumb`).
   Марка — первой строкой имени, как на карточке полки (слово заказчика 23.10.2026:
   «в карточке товара бренд нужно писать»). Цена за штуку — без слова «за штуку»
   (слово заказчика 03.10.2026): чтецу экрана оно остаётся скрытым (`unitSay`); в узком
   списке (телефон: и шторка, и страница) она стоит строкой фактов справа, имя — во всю
   ширину (слово заказчика 23.10.2026: «цена слишком высоко, её нужно ниже, и место
   освободится для строки названия»). Сумма строки —
   внизу, в одном ряду со счётчиком: она меняется вместе с ним. Счётчик — тот же,
   что на карте товара, и одет, как тихая кнопка каталога (И772). Под именем —
   упаковка тихой строкой (`lineFacts`: «3000 mg · 10 ml»); в узкой шторке цена за
   штуку встаёт в её строку справа (Cart.module.css, И764). Органы ряда — рисунком
   малого органа, палец получает цель запасом наружу (`p.tap`, `data-hit`). В шторке
   строка — та же, без карточки: лист у окна один (styles/pane.module.css, И772). */
export function CartLines({ lines }: { lines: CartLineView[] }) {
  return (
    <ul className={s.list}>
      {lines.map((l) => (
        <li key={l.id} className={s.line}>
          <div className={`${p.frame} ${s.thumb}`}><img {...shot(l.image, 'thumb', true)} alt="" decoding="async" /></div>
          <div className={s.what}>
            <SiteLink className={s.name} href={l.href}>{l.brand ? <span className={s.brand} translate="no">{l.brand}</span> : null}{l.name}</SiteLink>
            {l.facts ? <p className={`${p.note} ${s.facts}`}>{l.facts}</p> : null}
          </div>
          <p className={s.unit}><span aria-hidden="true">{l.unit}</span><span className={p.said}>{l.unitSay}</span></p>
          <div className={s.act}>
            <button className={`${b.word} ${p.tap} ${s.drop}`} data-hand="bad" type="submit" name="op" value={l.remove.op} aria-label={l.remove.label}>{l.remove.text}</button>
            <QuantityStepper ops={l.stepper} />
            <p className={s.sum}>{l.total}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
