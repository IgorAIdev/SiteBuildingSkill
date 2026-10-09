import s from './Logo.module.css'
import { BRAND } from '@/lib/company.ts'

/* Знак магазина — один на сайт: шапка и подвал берут его отсюда (правило
   10). Четыре варианта в разметке, виден один — вид `--logo` из панели
   (Header → Logo; стенд вариантов — https://claude.ai/artifact/4EVgv9Eu9Jh8YUZmL4V3Bz,
   слово заказчика 29.09.2026: «логотипы 1, 2, 3, 6 — выбор в панель, по
   умолчанию 6, в нём CBD заглавными»). Имя — данные магазина (`BRAND`):
     pill   CBDin и страна плашкой марки (вариант 6, умолчание);
     word   cbdin строчными, «.ro» краской марки (1);
     split  CBD прописными, «in» лёгким краской марки, «.RO» мелко сверху (2);
     leaf   точка над «i» — лист конопли краской марки (3).
   Скрытые варианты — `display:none`: вслух читается только видимый. */
export function Logo() {
  const { head, tail, country } = BRAND
  const low = `${head}${tail}`.toLowerCase()
  const at = low.indexOf('i')
  const end = <span className={s.end}>.{country.toLowerCase()}</span>
  return (
    <span className={s.logo} translate="no" data-logo="">
      <span className={s.pill}>{head}{tail}<span className={s.tag}>{country}</span></span>
      <span className={s.word}>{low}{end}</span>
      <span className={s.split}>{head}<span className={s.tail}>{tail}</span><span className={s.sup}>.{country}</span></span>
      <span className={s.leaf}>
        {at < 0 ? low : <>{low.slice(0, at)}<span className={s.i}>ı<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c3 4 4 8 0 14C8 10 9 6 12 2z" /><path d="M12 16c-4-1-7-4-8-8 4 0 7 3 8 8zM12 16c4-1 7-4 8-8-4 0-7 3-8 8z" /></svg></span>{low.slice(at + 1)}</>}
        {end}
      </span>
    </span>
  )
}
