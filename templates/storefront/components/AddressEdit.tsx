'use client'
import { useActionState } from 'react'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import p from '@/styles/primitives.module.css'
import c from './Checkout.module.css'
import s from './Account.module.css'
import type { AddressFormView, Link } from '@/lib/account-view.ts'
import type { AccountState } from '@/lib/actions/account.ts'
import { Fields } from './Field.tsx'

type Action = (prev: AccountState, form: FormData) => Promise<AccountState>

/* Адрес кабинета (И771) — поля адреса кассы (улица; индекс рядом с городом;
   уезд списком рынка; страна словом), галочка «адрес по умолчанию» и одна
   громкая кнопка; «отменить» — тихим словом рядом. Поля несут приставку id
   (`at`): на странице адресов форм бывает две. */
export function AddressEdit({ form, action, permalink, cancel }: { form: AddressFormView; action: Action; permalink: string; cancel: Link | null }) {
  const [state, formAction, pending] = useActionState(action, null, permalink)
  return (
    <form className={s.form} action={formAction} noValidate aria-busy={pending}>
      {state?.message ? <p className={f.say} data-state="error" role="alert">{state.message}</p> : null}
      <fieldset className={`${f.rows} ${s.plain}`} disabled={pending}>
        <Fields rows={form.rows} state={state} at={form.at} />
        <p className={c.country}><span className={f.label}>{form.country.label}</span> {form.country.value}</p>
        <label className={f.tick}><input type="checkbox" name="isDefault" defaultChecked={form.isDefault.checked} />{form.isDefault.label}</label>
      </fieldset>
      {form.id ? <input type="hidden" name="id" value={form.id} /> : null}
      <div className={s.acts}>
        <button className={b.btn} data-voice="loud" type="submit" disabled={pending}>{form.submit}</button>
        {cancel ? <a className={`${b.word} ${p.tap}`} href={cancel.href}>{cancel.label}</a> : null}
      </div>
    </form>
  )
}
