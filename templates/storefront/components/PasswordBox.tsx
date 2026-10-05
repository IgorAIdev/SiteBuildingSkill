'use client'
import { useState, type InputHTMLAttributes } from 'react'
import f from '@/styles/form.module.css'
import g from '@/styles/glyph.module.css'
import { useReady } from '@/lib/store.ts'
import { Icon } from './Icon.tsx'

/* Пароль и знак «показать» (И771): тот же ввод формы (`.box`), у его конца —
   тихий знак (`glyph`, одна кнопка-знак на сайт) с глазом; нажатый — залит
   краской марки, как отмеченное сердце (`aria-pressed`). Образец — Gymshark:
   глаз в поле пароля, 44 у края; Baymard — на телефоне пароль, который не
   видно, вводят с ошибкой. Пока скрипта нет, глаз не стоит: нажатие ничего
   бы не дало. Автозамена и заглавная буква телефона пароль не трогают. */
export function PasswordBox({ show, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { show: string }) {
  const [shown, setShown] = useState(false)
  const ready = useReady()
  return (
    <div className={f.secret}>
      <input {...input} className={f.box} type={shown ? 'text' : 'password'} placeholder=" " autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <button className={`${g.glyph} ${f.reveal}`} type="button" hidden={!ready} aria-pressed={shown} aria-label={show} aria-controls={input.id} onClick={() => setShown((x) => !x)}><Icon id="eye" /></button>
    </div>
  )
}
