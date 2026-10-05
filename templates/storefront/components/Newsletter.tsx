'use client'
import { useActionState, useId } from 'react'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import p from '@/styles/primitives.module.css'
import s from './Newsletter.module.css'
import type { NewsState } from '@/lib/actions/subscribe.ts'

type Words = { title: string; lead: string; label: string; hint: string; submit: string; consent: string; policy: string; done: string }
type Action = (prev: NewsState, form: FormData) => Promise<NewsState>

/* Подписка на рассылку — верхний ярус подвала (слово заказчика
   29.09.2026: «полосу обещаний убирай, в этом месте подвала делай форму
   подписки как принято у профи»; И549). Как у сильных магазинов (Aesop,
   Glossier, Charlotte's Web, naturecan): слева — зачем подписываться,
   заголовком и строкой; справа — одно поле и кнопка одной парой (`f.send`,
   И481); под парой — мелко, что отписаться можно всегда, и ссылка на то, как
   обращаются с данными (GDPR, ст. 13: цель — до согласия). Ни имени, ни
   дня рождения: каждое лишнее поле — минус подписчики.

   Имя поля для чтеца — подпись, спрятанная глазу (`said`): в строке виден
   образец в поле, а подпись поля не пропадает с первой буквой. Ответ —
   на месте пары: принято — строкой благодарности (`status`); не так —
   словами под полем (`alert`), введённое остаётся. Без скрипта форма уходит
   обычной отправкой. */
export function Newsletter({ words, action, policy }: { words: Words; action: Action; policy: string }) {
  const [state, formAction, pending] = useActionState(action, null)
  /* id — свои у каждого экземпляра: подписка стоит в подвале и образцом в
     дизайн-системе, на одной странице. */
  const id = `news-${useId().replace(/:/g, '')}`
  return (
    <div className={`${p.switcher} ${s.news}`}>
      <div className={s.intro}>
        <p className={s.title} id={`${id}-title`}>{words.title}</p>
        <p className={s.lead}>{words.lead}</p>
      </div>
      <div className={s.side}>
        {state?.done
          ? <p className={s.done} role="status">{words.done}</p>
          : (
            <form className={s.form} action={formAction} noValidate aria-labelledby={`${id}-title`} aria-busy={pending}>
              <label className={p.said} htmlFor={`${id}-email`}>{words.label}</label>
              <div className={f.send}>
                <input className={f.box} id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="email" required placeholder={words.hint} defaultValue={state?.email ?? ''} aria-invalid={state?.message ? true : undefined} aria-describedby={state?.message ? `${id}-say` : undefined} />
                <button className={b.btn} data-voice="loud" type="submit" disabled={pending}>{words.submit}</button>
              </div>
              {state?.message ? <p className={f.say} data-state="error" id={`${id}-say`} role="alert">{state.message}</p> : null}
            </form>
          )}
        <p className={s.consent}>{words.consent} <a href={policy}>{words.policy}</a></p>
      </div>
    </div>
  )
}
