'use client'
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import type { LiveCount } from '@/lib/catalog-view.ts'

/* Живой счёт фильтра (И734, И740): на каждую галочку — один запрос счёта на
   ещё не применённый выбор (`/api/shelf-count`), и из одного ответа берут и
   кнопка «Show 3 products», и числа у всех значений граней — «против всех
   граней, кроме своей», как у полки (cbd-facet, §3). Числа у значений стояли
   от применённого выбора и расходились с кнопкой (заказчик 04.10.2026:
   «количества в фильтрах должны быть зависимы от другого выбора, а то в
   кнопке 3 продукта, а в колонке эффект и 10, и 13»).

   Без скрипта и до гидратации — числа применённого выбора и «применить»:
   надпись со счётом, отданная сервером, врала бы, как только тронут галочку.
   Источник молчит — то же. Обёртка разметки не добавляет (Provider).
   `facets` — null, пока ответа нет; в ответе нет значения — его счёт ноль,
   а не прежнее число (И750: у косметики «20 % (4)» стояло от применённого
   выбора, потому что грань процентов выпала из ответа). */
type Said = { total: number; label: string; facets: Record<string, Record<string, number>> | null }
const Live = createContext<Said | null>(null)
const asked = new Map<string, Promise<Said | null>>()
const ask = (url: string) => {
  if (!asked.has(url)) {
    asked.set(url, fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? (r.json() as Promise<Said>) : null)).catch(() => null))
  }
  return asked.get(url)!
}
/* Ждём, пока покупатель перестанет ставить галочки подряд. */
const WAIT = 180
/* Скрипт ожил: на сервере и до гидратации — нет. Подписки нет — флаг не меняется. */
const still = () => () => {}

export function LiveFilter({ form, live, children }: { form: string; live: LiveCount; children: ReactNode }) {
  const alive = useSyncExternalStore(still, () => true, () => false)
  /* Ответ живого счёта помнит, к какой полке он (`of`): полка сменилась — до
     нового ответа стоят её собственные числа. */
  const of = `${live.href}|${live.total}|${live.label}`
  const [answer, setAnswer] = useState<{ of: string; said: Said | null } | null>(null)
  useEffect(() => {
    const el = document.getElementById(form) as HTMLFormElement | null
    if (!el) return
    let wait = 0
    let last = ''
    const recount = () => {
      window.clearTimeout(wait)
      wait = window.setTimeout(() => {
        const facets = new URLSearchParams()
        for (const [k, v] of new FormData(el)) if (k.startsWith('facet.') && typeof v === 'string') facets.append(k, v)
        const url = `${live.href}&${facets}`
        last = url
        ask(url).then((d) => { if (url === last) setAnswer({ of, said: d }) })
      }, WAIT)
    }
    el.addEventListener('change', recount)
    return () => { window.clearTimeout(wait); el.removeEventListener('change', recount) }
  }, [form, live.href, of])
  const said = useMemo((): Said | null => {
    if (!alive) return null
    return answer?.of === of ? answer.said : { total: live.total, label: live.label, facets: null }
  }, [alive, answer, of, live.total, live.label])
  return <Live.Provider value={said}>{children}</Live.Provider>
}

/** Галочка значения грани с числом (И750): число — из живого счёта, пока его
 *  нет — применённого выбора. Ноль — галочка гаснет: выбор её не находит, и
 *  поставить её — пустая полка (заказчик 05.10.2026: «должны становиться
 *  неактивными и количество ноль»). Отмеченная с нулём не гаснет — её надо
 *  снять. Подпись и строку меню даёт разметка грани (Filters.tsx). */
export function ValueTick({ code, value, name, count, selected }: { code: string; value: string; name: string; count: number; selected: boolean }) {
  const facets = useContext(Live)?.facets
  const n = facets ? (facets[code]?.[value] ?? 0) : count
  const [on, setOn] = useState(selected)
  return (
    <>
      <input type="checkbox" name={`facet.${code}`} value={value} defaultChecked={selected} disabled={n === 0 && !on} onChange={(e) => setOn(e.currentTarget.checked)} />
      <span>{name} <span className={p.muted}>({n})</span></span>
    </>
  )
}

/** Кнопка «применить» со счётом (Baymard 2026: кнопка пакетного фильтра
 *  говорит, сколько товаров даст выбор). Ноль — «No products», выключена:
 *  отправка вела бы в пустую полку. Одна на раскрытие грани и на низ окна. */
export function ApplyCount({ idle, ...rest }: { idle: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const said = useContext(Live)
  return (
    <button type="submit" {...rest} disabled={said?.total === 0}>
      {said ? said.label : idle}
    </button>
  )
}
