import go from '@/styles/go.module.css'
import p from '@/styles/primitives.module.css'
import s from './Breadcrumbs.module.css'
import { Icon } from './Icon.tsx'

/* Крошки. Цепочка целиком стоит в разметке всегда; на узкой коробке крошек
   (меньше 560) вместо неё — один шаг назад к родителю, «← CBD oils»: путь
   целиком на телефоне не нужен никому, а назад нужно всем, и имя родителя
   называется, а не заменяется словом «Назад» (shop, blocks.md, «Цепочка
   крошек длиннее строки»). Родитель — последнее звено с адресом той же
   цепочки, второго списка нет. Разметка для поиска (`BreadcrumbList`) —
   полная, её собирает страница из той же цепочки. Имя звена пишется с
   заглавной всегда, как бы оно ни лежало в данных («oil» каталога cbdin;
   слово заказчика 02.10.2026). */
/** Цепочка до страницы: звенья с адресом и имя самой страницы последним.
 *  Одна на все страницы (документ, отказ от договора, статья, рубрика): массив,
 *  собранный прямо в JSX-пропе, ловит react-perf/jsx-no-new-array-as-prop —
 *  вызов функции снаружи снимает находку, и писать её у каждой страницы своей
 *  незачем (check:code, `twice`). */
export const trailTo = (path: { name: string; href: string }[], name: string) => [...path, { name }]

export function Breadcrumbs({ trail, label }: { trail: { name: string; href?: string }[]; label: string }) {
  const parent = trail.findLast((c) => c.href)
  return (
    <nav aria-label={label} className={s.crumbs}>
      <ol>
        {trail.map((c) => <li key={c.href ?? c.name}>{c.href ? <a className={p.tap} href={c.href}><span className={s.name}>{c.name}</span></a> : <span aria-current="page"><span className={s.name}>{c.name}</span></span>}</li>)}
      </ol>
      {parent ? <a className={`${go.go} ${s.back}`} data-to="back" href={parent.href}><Icon id="arrow-left" /><span className={s.name}>{parent.name}</span></a> : null}
    </nav>
  )
}
