'use client'
import { useActionState } from 'react'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import p from '@/styles/primitives.module.css'
import s from './WithdrawForm.module.css'
import type { WithdrawState } from '@/lib/actions/withdraw.ts'

type Words = { name: string; order: string; email: string; confirm: string }
type Action = (prev: WithdrawState, form: FormData) => Promise<WithdrawState>

/* Второй шаг отказа от договора (ст. 11a Директивы 2011/83, с 19.06.2026;
   И748): три поля — ровно то, что разрешено спросить, — и одна кнопка, на
   которой написано только «Confirmați retragerea». Поля — тройка формы набора
   (styles/form.module.css: подпись, ввод, строка под ним). Принято —
   строкой с датой и временем на месте формы (`status`); не так — словами под
   кнопкой (`alert`), введённое остаётся. Без скрипта форма уходит обычной
   отправкой. */
export function WithdrawForm({ words, action }: { words: Words; action: Action }) {
  const [state, formAction, pending] = useActionState(action, null)
  if (state?.done) return <p className={f.say} role="status">{state.done}</p>
  const field = (name: 'name' | 'order' | 'email', label: string, type: 'text' | 'email', autoComplete: string) => (
    <div className={f.field}>
      <label className={f.label} htmlFor={`wd-${name}`}>{label}</label>
      <input className={f.box} id={`wd-${name}`} name={name} type={type} autoComplete={autoComplete} required placeholder=" " defaultValue={state?.values[name] ?? ''} aria-invalid={state?.message ? true : undefined} aria-describedby={state?.message ? 'wd-say' : undefined} />
    </div>
  )
  return (
    <form className={`${p.stack} ${s.form}`} action={formAction} noValidate aria-busy={pending}>
      {field('name', words.name, 'text', 'name')}
      {field('order', words.order, 'text', 'off')}
      {field('email', words.email, 'email', 'email')}
      <div><button className={b.btn} data-voice="loud" data-size="lg" type="submit" disabled={pending}>{words.confirm}</button></div>
      {state?.message ? <p className={f.say} data-state="error" id="wd-say" role="alert">{state.message}</p> : null}
    </form>
  )
}
