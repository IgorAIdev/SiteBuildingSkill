import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './ProductCard.module.css'
import type { ShelfCard } from '@/lib/view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { lookNow } from '@/lib/look.ts'
import { CartForm } from './CartForm.tsx'
import { AddLabel } from './AddLabel.tsx'
import { Price } from './Price.tsx'
import { Icon } from './Icon.tsx'
import { SaveToggle } from './SaveToggle.tsx'
import { t } from '@/lib/i18n/index.ts'
import { shot } from '@/lib/shot.ts'
import { SITE_INFO, type CardInfo, type CardVariant } from '@/lib/cards.ts'

/** Запись в корзину — действия сервера, которые карточке передаёт страница
 *  (компонент в бекенд сам не ходит, И248): те же, что у кнопки карты
 *  товара и строк корзины. */
export type CartActions = { submit: (form: FormData) => Promise<void>; call: (form: FormData) => Promise<Outcome> }

/* Ссылка одна — имя товара; её область нажатия растянута на всю карточку
   (ProductCard.module.css), поэтому снимок не ссылка, а кадр: вторая ссылка
   на тот же товар была бы органом без имени.

   Три группы, и порядок их — порядок решения покупателя (разбор 24.09.2026,
   X3): снимок; что это — марка, имя и строка фактов (сила, мера, мг); за сколько —
   цена. Наличие — не строка, а плашка на снимке и только исключением: «мало»
   или «нет» (lib/view.ts, `flag`). Строкой оно сдвигало цену у одних
   карточек ряда и не у других.

   Плашка — внутри ссылки, рядом с заголовком, а не в нём: нажатие на неё
   ведёт на товар, имя ссылки говорит и наличие («CBD oil for cats Low
   stock»), а заголовок остаётся именем. Стояла в кадре, мимо ссылки, с
   `pointer-events:none` — и растянутая область ссылки ложилась поверх её
   слов (check:detect, `occluded`, /en/search?q=oil).

   Вариант карточки — значением вида (`card`, lib/cards.ts): разметка одна,
   вариант меняет одежду — поверхность, линию, поле (ProductCard.module.css).
   `data-product-card` — договор товарной полки (shop, «Каталог и полка»):
   по нему отрисованная проверка меряет плотность ряда.

   «За сколько» — цена (прежняя над ней, зачёркнутая) и «в корзину» (слово
   заказчика 25.09.2026: «да, делай кнопку и старую цену»). Кнопка — та же
   запись, что у кнопки карты товара (`CartForm`, одна полоса на корзину):
   у товара одного варианта кладёт его, у товара с выбором ведёт на карту с
   `choose=1` (И284) — со словом «Choose», а не «Add», чтобы нажатие не
   обещало того, чего не сделает. Кнопка стоит над растянутой ссылкой имени,
   во всю ширину под ценой.

   Подача фактов — `info` (lib/cards.ts, `CARD_INFO`): разметка групп одна,
   меняется только то, что стоит под именем. Страница дизайн-системы
   показывает эту же карточку во всех подачах — образец не рисуется второй
   раз, и размеры у него те же, что на сайте. Там же — все одежды набора
   рядом (`dress`): страница показывает, что есть, а не что выбрано в
   панели (слово заказчика 30.09.2026). Сайт `dress` не передаёт — одежду
   даёт вид.

   `sample` — образец для выбора вида, а не товар на полке (заказчик
   30.09.2026: «нажатие на карточки в Look не должно вести на товар, убери
   ссылки — это ж для выбора дизайна только»): имя без адреса, «в корзину»
   ничего не пишет. Разметка и ответ на руку — те же. */
export async function ProductCard({ card, eager = false, cart, info = SITE_INFO, dress, sample = false }: { card: ShelfCard; eager?: boolean; cart: CartActions; info?: CardInfo; dress?: CardVariant; sample?: boolean }) {
  const variant = dress ?? (await lookNow()).card
  return (
    <article className={s.card} data-card={variant} data-product-card="">
      <div className={`${p.frame} ${s.shot}`}>
        <img {...shot(card.image, 'shelf', !eager)} alt="" decoding="async" />
      </div>
      <SaveToggle id={card.id} add={t(card.lang, 'save.add', { name: card.name })} remove={t(card.lang, 'save.remove', { name: card.name })} over="picture" className={s.save} />
      <div className={s.body}>
        <div className={s.what}>
          <a className={s.link} href={sample ? undefined : card.href}>
            {/* Марка — первой строкой над именем, как на карте товара: слово
                заказчика 27.09.2026 «бренд · название · параметры · цена ·
                кнопка». Не переводится — имя собственное. */}
            {card.brand ? <span className={s.brand} translate="no">{card.brand}</span> : null}
            <h3 className={s.name}>{card.name}</h3>
            {/* Плашка на снимке одна: наличие-исключение важнее скидки —
                «нет» отменяет покупку, а скидку цена и так говорит строкой. */}
            {card.flag ? <span className={`${p.cut} ${s.flag}`} data-cut={card.flag.level}>{' '}{card.flag.text}</span>
              : card.sale ? <span className={`${p.cut} ${s.flag}`}>{' '}{card.sale}</span> : null}
          </a>
          <Facts card={card} info={info} />
        </div>
        <div className={s.foot}>
          <Price now={card.price} was={card.was} size="card" />
          {sample ? (
            <button className={`${b.btn} ${p.tap} ${s.add}`} data-hand="pop" type="button" aria-label={card.buy.name}><AddLabel add={card.buy.add} short={card.buy.short} added={card.buy.added} /></button>
          ) : card.buy.variant ? (
            <CartForm lang={card.lang} className={s.buy} refresh={false} quiet submit={cart.submit} call={cart.call} initial={null} timeout={card.buy.timeout} failed={card.buy.failed}>
              <input type="hidden" name="op" value="add" />
              <input type="hidden" name="variant" value={card.buy.variant} />
              <input type="hidden" name="quantity" value="1" />
              <button className={`${b.btn} ${p.tap} ${s.add}`} data-hand="pop" type="submit" aria-label={card.buy.name}>
                <AddLabel variant={card.buy.variant} add={card.buy.add} short={card.buy.short} added={card.buy.added} />
              </button>
            </CartForm>
          ) : (
            <a className={`${b.btn} ${p.tap} ${s.add}`} data-hand="pop" href={card.buy.ask} aria-label={card.buy.name}>{card.buy.choose}</a>
          )}
        </div>
      </div>
    </article>
  )
}

/* Факты под именем по подаче. Числа — готовые строки вида (lib/view.ts):
   блок не считает. Нечего сказать — ничего не стоит. */
function Facts({ card, info }: { card: ShelfCard; info: CardInfo }) {
  const of = (...keys: string[]) => keys.map((k) => card.figures.find((f) => f.key === k)).filter((f) => f !== undefined)
  if (info === 'min' || !card.facts) return null
  /* Доза в капле — со знаком капли, вслух — словами («CBD in one drop»):
     одно «5 mg» рядом с «1000 mg» не говорило, на что оно. */
  if (info === 'pills') return <p className={s.pills}>{of('total', 'size', 'dose').map((f, i) => <span key={f.key} data-lead={i === 0 || undefined}>{f.value}{f.per === 'drop' ? <><Icon id="droplet" /><span className={p.said}> {f.label}</span></> : null}</span>)}</p>
  const dose = info === 'lines' ? of('dose')[0] : undefined
  return (
    <div className={s.facts} data-info={info}>
      <p className={p.note}>{card.facts}</p>
      {dose ? <p className={p.note}>{dose.value} · {dose.label}</p> : null}
    </div>
  )
}
