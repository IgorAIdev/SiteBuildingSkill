import b from '@/styles/btn.module.css'
import p from '@/styles/primitives.module.css'
import s from './Account.module.css'
import type { SocialView } from '@/lib/account-view.ts'
import { Icon } from './Icon.tsx'
import { PROVIDER_SIGN } from './marks.ts'

/* Вход через поставщика (И787) — под главной кнопкой формы входа и создания:
   «или» между волосками, ниже кнопки поставщиков стопкой во всю колонку (образец
   заказчика 24.09.2026 — пять форм из пяти; eMAG, ASOS; shadcn/ui login-04/05 и
   signup-04/05, MIT). Кнопка — кнопка основы (`btn`) ростом главной, одежда
   поставщика (`data-provider`, btn.module.css): кромка и пол по правилам Google
   при любом виде тихой кнопки в панели; громкая на экране одна — «Sign in».
   Знак — из листа через карту знаков поставщиков (`PROVIDER_SIGN`, своими
   красками). Одна форма: поставщик — значение нажатой кнопки; без скрипта
   уходит обычной отправкой. Своя форма, не внутри формы почты: формы не
   вкладываются. */
export function SocialSignIn({ view, action }: { view: SocialView; action: (form: FormData) => Promise<void> }) {
  return (
    <div className={p.stack}>
      <p className={`${p.note} ${s.or}`}>{view.or}</p>
      <form className={`${p.stack} ${s.providers}`} action={action}>
        {view.buttons.map((x) => (
          <button key={x.provider} className={b.btn} data-size="lg" data-wide data-provider={x.provider} type="submit" name="provider" value={x.provider}>
            <Icon id={PROVIDER_SIGN[x.provider]} />{x.label}
          </button>
        ))}
        {/* Скрытые поля — после кнопок: шаг стопки ставится соседу, и скрытое
            поле первым дало бы первой кнопке лишний шаг сверху. */}
        <input type="hidden" name="from" value={view.from} />
        {view.next ? <input type="hidden" name="next" value={view.next} /> : null}
      </form>
    </div>
  )
}
