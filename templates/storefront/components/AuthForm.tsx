'use client'
import { useActionState } from 'react'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import p from '@/styles/primitives.module.css'
import s from './Account.module.css'
import type { AuthView } from '@/lib/account-view.ts'
import type { AccountState } from '@/lib/actions/account.ts'
import { Fields } from './Field.tsx'

type Action = (prev: AccountState, form: FormData) => Promise<AccountState>

/* Форма входа, создания, сброса и подтверждения (И771) — тройки полей
   набора, одна громкая кнопка. «Забыли пароль» — тихим словом под паролем
   (Dawn, Gymshark, Allbirds — 3 из 3). Не так — словами над полями
   (`alert`), у поля — его ошибка; дело сделано без перехода (письмо ушло) —
   слова на месте формы (`status`). Без скрипта форма уходит обычной
   отправкой на свою же страницу (`permalink`). Имя формы — имя страницы;
   `at` — приставка id полей, когда форм на странице несколько. */
export function AuthForm({ view, action, permalink, at = '' }: { view: AuthView; action: Action; permalink: string; at?: string }) {
  const [state, formAction, pending] = useActionState(action, null, permalink)
  if (state?.done) return <p className={f.say} role="status">{state.done}</p>
  return (
    <form className={s.form} action={formAction} noValidate aria-busy={pending} aria-label={view.title}>
      {state?.message ? <p className={f.say} data-state="error" role="alert">{state.message}</p> : null}
      {view.rows.length ? (
        <fieldset className={`${f.rows} ${s.plain}`} disabled={pending}>
          <Fields rows={view.rows} state={state} at={at} />
          {view.forgot ? <a className={`${b.word} ${p.tap} ${s.forgot}`} href={view.forgot.href}>{view.forgot.label}</a> : null}
        </fieldset>
      ) : null}
      {Object.entries(view.hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <button className={b.btn} data-voice="loud" data-size="lg" type="submit" disabled={pending}>{view.submit}</button>
    </form>
  )
}
