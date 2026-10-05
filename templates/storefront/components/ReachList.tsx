import type { ReactNode } from 'react'
import s from './ReachList.module.css'
import type { ReachRow } from '@/lib/contacts.ts'
import { Icon } from './Icon.tsx'
import { SIGN } from './marks.ts'

/** Первая строка окна помощи — кто отвечает: буква имени в круге вместо
 *  знака, роль и под ней имя. */
type Lead = { role: string; name: string; href: string | null }

/* Пути к магазину одним списком (слово заказчика 29.09.2026: «иконка
   трубки открывает подменю с мессенджерами как у cbdin, и плавающее окно
   как в cbdin»; И547). Один список на два места — меню трубки в шапке и
   окно помощи у края экрана (правило 10): строка — знак краской своей
   марки, имя, под ним адрес тоном вторичного текста. У окна помощи первая
   строка — «Онлайн-поддержка · имя» (`lead`): пункт меню, а не заголовок
   окна (слово заказчика 29.09.2026).

   Строка без адреса стоит надписью, нажатие прячется (как в быстром
   заказе, И442): заказчик видит, что канал есть и ждёт номера. Ссылка на
   чужой сайт (мессенджер в браузере) — в новой вкладке; звонок, почта и
   Viber открывают приложение и вкладки не требуют. */
const away = (href: string | null) => (href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})

/** Строка пути: знак (или буква имени), имя, адрес; без адреса — надпись. */
const row = (key: string, href: string | null, sign: ReactNode, name: string, value: string, mark?: string) => {
  const inner = <>{sign}<span className={s.name}>{name}</span><span className={s.value}>{value}</span></>
  return (
    <li key={key}>
      {href
        ? <a className={`${s.row} ${s.mark}`} data-mark={mark} href={href} {...away(href)}>{inner}</a>
        : <span className={`${s.row} ${s.mark}`} data-mark={mark} aria-disabled="true">{inner}</span>}
    </li>
  )
}

export function ReachList({ rows, lead }: { rows: ReachRow[]; lead?: Lead }) {
  return (
    <ul className={s.list}>
      {lead ? row('lead', lead.href, <span className={s.face} aria-hidden="true">{lead.name.slice(0, 1)}</span>, lead.role, lead.name) : null}
      {rows.map((r) => row(r.key, r.href, <Icon id={SIGN[r.key]} />, r.name, r.value, r.key))}
    </ul>
  )
}
