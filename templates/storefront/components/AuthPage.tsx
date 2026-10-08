import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './Account.module.css'
import type { AuthView } from '@/lib/account-view.ts'
import type { AccountState } from '@/lib/actions/account.ts'
import { AuthForm } from './AuthForm.tsx'

type Action = (prev: AccountState, form: FormData) => Promise<AccountState>

/* Страница входа, создания, сброса и подтверждения (И771) — стандартная форма
   входа (И780): колонка по центру страницы шириной формы, имя страницы и строка
   под ним (`pagehead`) по центру, форма с кнопкой во всю колонку, под ней
   пути словами («нет кабинета — создать», «назад ко входу»), что заказать
   можно и без кабинета, как магазин обращается с данными. Бриф —
   docs/design/кабинет.md. `landmark={false}` и `at` — образцом в дизайн-
   системе: у неё свой `main`, и форм там несколько. */
export function AuthPage({ view, action, permalink, landmark = true, at = '' }: { view: AuthView; action: Action; permalink: string; landmark?: boolean; at?: string }) {
  const Main = landmark ? 'main' : 'div'
  return (
    <Main id={landmark ? 'main' : undefined} className={`${p.wrap} ${p.section}`} data-air="head">
      <div className={`${p.stack} ${s.auth}`}>
        <div className={`${p.pagehead} ${s.head}`}>
          <h1>{view.title}</h1>
          <p>{view.lede}</p>
        </div>
        <AuthForm view={view} action={action} permalink={permalink} at={at} />
        {view.links.length || view.note || view.policy ? (
          <div className={s.ways}>
            {view.links.map((w) => (
              <p key={w.link.href} className={s.way}>
                {w.text ? <span>{w.text}</span> : null}
                <a className={`${b.word} ${p.tap} ${s.wayLink}`} href={w.link.href}>{w.link.label}</a>
              </p>
            ))}
            {view.note ? <p className={p.note}>{view.note}</p> : null}
            {view.policy ? <p className={p.note}><a className={p.tap} href={view.policy.href}>{view.policy.label}</a></p> : null}
          </div>
        ) : null}
      </div>
    </Main>
  )
}
