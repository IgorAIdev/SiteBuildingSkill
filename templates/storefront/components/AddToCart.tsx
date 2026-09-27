import Form from 'next/form'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import s from './ProductView.module.css'
import type { BuyView } from '@/lib/product-view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { CartForm } from './CartForm.tsx'
import { QuantityStepper } from './QuantityStepper.tsx'
import { QuickOrder } from './QuickOrder.tsx'
import { AddLabel } from './AddLabel.tsx'
import { Icon } from './Icon.tsx'

/* Покупка на карте товара — одна строка: количество, «в корзину» и рядом
   «быстрый заказ» (слово заказчика 25.09.2026, И441, И442), ростом крупного
   органа; кнопки делят остаток строки, не помещаются — переносятся. Цены на
   кнопке нет: она стоит под именем, второй раз не нужна.

   Удачная запись строки под кнопкой не занимает и «View cart» не ставит:
   «положено» говорит корзина в шапке (CartLink, И441), форма тихая
   (`quiet`) — исход читается вслух, ошибка видна строкой.

   Варианта ещё не выбрали — кнопка НЕ выключена (Baymard: выключенная
   кнопка прячет, почему нельзя): строка — форма перехода на адрес карты с
   `choose=1` (`buy.ask`), и карта покажет «Choose an option» у групп выбора,
   с фокусом на этой строке. Без скрипта это обычный переход, со скриптом —
   мягкий (`next/form`), место чтения не прыгает. Количество в этом переходе
   не едет: поле без имени, выбор его всё равно сбросит.

   Выключена кнопка только там, где выбирать нечего (распродано, сочетания
   нет): почему — подсказка под строкой. Подпись количества — для чтения
   вслух: число рядом с кнопкой понятно без слова, а видимое слово над полем
   сдвигало строку. Счётчик — тот же, что в строке корзины (QuantityStepper):
   количество на сайте меняется одним органом. */
export function AddToCart({ lang, buy, hint, submit, call }: { lang: string; buy: BuyView; hint: string | null; submit: (form: FormData) => Promise<void>; call: (form: FormData) => Promise<Outcome> }) {
  const row = (
    <>
      <QuantityStepper field={{ label: buy.quantity, name: buy.variant ? 'quantity' : undefined, min: 1, max: buy.max, less: buy.less, more: buy.more }} />
      <button className={`${b.btn} ${s.add}`} data-voice="loud" data-size="lg" type="submit" disabled={!buy.variant && !buy.ask} aria-describedby={hint ? 'buy-hint' : undefined}><Icon id="shopping-cart" /><AddLabel add={buy.add} added={buy.added} /></button>
      <QuickOrder view={buy.quick} />
      {hint ? <p className={f.say} id="buy-hint" role="status">{hint}</p> : null /* строка сообщения — одна на сайт (f.say, И476) */}
    </>
  )
  if (!buy.variant && buy.ask) {
    return (
      <Form action={buy.ask.action} scroll={false} className={s.buy}>
        {buy.ask.keep.map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
        {row}
      </Form>
    )
  }
  return (
    <CartForm
      key={buy.variant /* другой вариант — другая надпись: «Added» прежнего не переезжает (И469) */}
      lang={lang} className={s.buy} refresh={false} quiet submit={submit} call={call}
      initial={null} timeout={buy.timeout} failed={buy.failed}
    >
      <input type="hidden" name="op" value="add" />
      <input type="hidden" name="variant" value={buy.variant ?? ''} />
      {row}
    </CartForm>
  )
}
