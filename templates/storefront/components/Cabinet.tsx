import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import go from '@/styles/go.module.css'
import c from './Checkout.module.css'
import s from './Account.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { CabinetView } from '@/lib/account-view.ts'
import { signOut } from '@/lib/actions/account.ts'
import { shot } from '@/lib/shot.ts'
import { RecapLines } from './OrderReview.tsx'
import { StateScreen } from './StateScreen.tsx'
import { Icon } from './Icon.tsx'

/* Кабинет вошедшего (И771; устройство — Dawn, `customers/account.liquid`):
   заказы главной колонкой — карточкой каждый, со снимком первого товара,
   номером, датой и состоянием словом, суммой и числом штук; карточка ведёт
   на заказ целиком. Сбоку — кто я, адрес по умолчанию со ссылкой на все
   адреса и выход. Пустой список — экран «пусто» с шагом к товарам.
   `landmark={false}` — образцом внутри дизайн-системы, у которой свой `main`. */
export function Cabinet({ lang, view, landmark = true }: { lang: Lang; view: CabinetView; landmark?: boolean }) {
  const Main = landmark ? 'main' : 'div'
  return (
    <Main id={landmark ? 'main' : undefined} className={`${p.wrap} ${p.section}`} data-air="head">
      <div className={p.pagehead}><h1>{view.title}</h1></div>
      <div className={p.sidebar}>
        <section className={s.part} aria-labelledby="orders-title">
          <h2 id="orders-title">{view.orders.title}</h2>
          {view.orders.empty ? (
            <StateScreen level={2} kind="empty" title={view.orders.empty.title} step={view.orders.empty.step} href={view.orders.empty.href} />
          ) : (
            <ul className={s.orders}>
              {view.orders.rows.map((o) => (
                <li key={o.code} className={s.order}>
                  <span className={`${p.frame} ${c.shot}`}>{o.images[0] ? <img {...shot(o.images[0], 'thumb', true)} alt="" decoding="async" /> : null}</span>
                  <span className={s.orderWhat}>
                    <a className={s.orderName} href={o.href}>{o.title}</a>
                    <span className={p.note}>{o.placed} · <span className={s.status}>{o.status}</span></span>
                  </span>
                  <span className={s.orderSum}>
                    <span className={c.itemSum}>{o.total}</span>
                    <span className={p.note}>{o.count}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className={`${p.aside} ${s.side}`}>
          <section className={s.part} aria-labelledby="details-title">
            <h2 id="details-title">{view.details.title}</h2>
            <RecapLines lines={view.details.lines} />
          </section>
          <section className={s.part} aria-labelledby="addresses-title">
            <h2 id="addresses-title">{view.addresses.title}</h2>
            {view.addresses.lines ? <RecapLines lines={view.addresses.lines} /> : <p className={p.note}>{view.addresses.none}</p>}
            <a className={`${go.go} ${p.tap}`} href={view.addresses.manage.href}>{view.addresses.manage.label}<Icon id="arrow-right" /></a>
          </section>
          <form action={signOut.bind(null, lang)}>
            <button className={b.btn} type="submit"><Icon id="log-out" />{view.signOut}</button>
          </form>
        </aside>
      </div>
    </Main>
  )
}
