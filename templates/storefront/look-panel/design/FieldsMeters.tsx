import p from '@/styles/primitives.module.css'
import f from '@/styles/form.module.css'
import s from './design.module.css'
import type { Lang } from '@/lib/locale.ts'
import { goalOf } from '@/lib/cart-view.ts'
import { MARKET } from '@/lib/market.ts'
import { content } from '@/lib/source/index.ts'
import { GoalMeter } from '@/components/GoalMeter.tsx'
import { Switch } from '@/components/Switch.tsx'
import { Part } from './parts.tsx'
import { FieldElements, ProgressElements } from './Elements.tsx'

/* Система → «Поля и индикаторы» (слово заказчика 03.10.2026: «это не кнопки
   и не иконки, а что это, и как назовём этот пункт меню в дизайн-системе…
   и поля туда же перенесём»; И668). Название — по справочникам: Material 3 и
   IBM Carbon называют полосу хода «progress indicator», а поле для текста —
   «text field» / «text input»; у обоих это не кнопки и не знаки, а то, что
   показывает или принимает значение. Сюда сложено то, что не кнопка и не
   иконка и не страница: поле ввода сайта, полоса до бесплатной доставки —
   настоящими компонентами, и всё присланное заказчиком того же рода (поля,
   индикаторы хода) — живыми кадрами. Выбор вида — в панели Look, здесь
   только показ.

   Образцы полосы — настоящий `GoalMeter` с числами того же вида, что у
   корзины (`goalOf`): порог — из данных магазина, нет его — сто в валюте
   рынка, чтобы образец был. */
const STATES: [string, number][] = [['Добрано треть', 0.3], ['Почти у порога', 0.85], ['Порог взят', 1]]

export async function FieldsMeters({ lang }: { lang: Lang }) {
  const facts = await content().facts()
  const from = (facts.ok ? facts.value.freeDeliveryFrom : null) ?? { minor: 10000, currency: MARKET.currency }
  return (
    <>
      <Part title="Поле ввода" lede="Одно поле на весь сайт: поиск, почта, касса. Подпись над полем, ошибка — строкой под ним.">
        <div className={s.form}>
          <label className={f.field}><span className={f.label}>Эл. почта</span><input className={f.box} type="email" placeholder="name@example.com" /></label>
          <label className={f.field}><span className={f.label}>Телефон</span><input className={f.box} type="tel" aria-invalid="true" defaultValue="07" /><span className={f.say} data-state="error">Номер короче, чем нужно</span></label>
          <label className={f.field}><span className={f.label}>Недоступно</span><input className={f.box} disabled defaultValue="Bucharest" /></label>
          <label className={f.tick}><input type="checkbox" defaultChecked />Согласен с условиями</label>
          <label className={f.tick}><input type="radio" name="design-radio" defaultChecked />Курьером</label>
        </div>
      </Part>
      <Part title="Переключатель" lede="Да или нет одним нажатием, когда решение действует сразу и по отдельности, — категории cookie в окне настроек. Подпись слева, дорожка справа, нажимается вся строка. Выключен — тихая плашка, включён — главный цвет; погашенный — включён всегда (необходимые cookie). Порт HyperUI.">
        <div className={s.form}>
          <Switch label="Выключен" name="design-switch-off" defaultChecked={false} />
          <Switch label="Включён" name="design-switch-on" defaultChecked />
          <Switch label="Включён всегда · погашен" name="design-switch-lock" defaultChecked disabled />
        </div>
      </Part>
      <FieldElements />
      <Part title="Полоса до бесплатной доставки" lede="Стоит в корзине под шапкой шторки и в сводке страницы корзины: сколько ещё добрать до бесплатной доставки; у порога заливается краской успеха. Порог и сумма — из данных магазина. Три состояния одной и той же полосы.">
        <div className={`${p.grid} ${s.floors}`}>
          {STATES.map(([name, share]) => (
            <div key={name} className={s.floor} data-plate="">
              <p className={p.note}>{name}</p>
              <div className={s.stretch}><GoalMeter goal={goalOf(lang, Math.round(from.minor * share), from)} /></div>
            </div>
          ))}
        </div>
      </Part>
      <ProgressElements />
    </>
  )
}
