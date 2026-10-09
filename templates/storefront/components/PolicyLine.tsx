import p from '@/styles/primitives.module.css'

/* «Cum folosim datele» — строка о политике данных там, где данные собирают
   (GDPR ст. 13 — сведения в момент сбора): под формой кабинета (И771) и под
   полями контакта в кассе (И791; подвала у кассы нет — И325). Одна разметка на
   оба места (правило 10): тихая сноска, ссылка с запасом нажатия под пальцем. */
export function PolicyLine({ link }: { link: { label: string; href: string } }) {
  return <p className={p.note}><a className={p.tap} href={link.href}>{link.label}</a></p>
}
