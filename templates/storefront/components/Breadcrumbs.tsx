import go from '@/styles/go.module.css'
import p from '@/styles/primitives.module.css'
import s from './Breadcrumbs.module.css'
import { Icon } from './Icon.tsx'
import { SiteLink } from './SiteLink.tsx'
import { JsonLd } from './JsonLd.tsx'
import type { Lang } from '@/lib/locale.ts'
import { t } from '@/lib/i18n/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { breadcrumbLd } from '@/lib/ld.ts'

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
    <nav aria-label={label} className={s.crumbs} data-print="skip">
      <ol>
        {trail.map((c) => <li key={c.href ?? c.name}>{c.href ? <SiteLink className={p.tap} href={c.href}><span className={s.name}>{c.name}</span></SiteLink> : <span aria-current="page"><span className={s.name}>{c.name}</span></span>}</li>)}
      </ol>
      {parent ? <SiteLink className={`${go.go} ${s.back}`} data-to="back" href={parent.href}><Icon id="arrow-left" /><span className={s.name}>{parent.name}</span></SiteLink> : null}
    </nav>
  )
}

/* Крошки страницы — одно место на весь сайт (заказчик 22.10.2026: «может, крошки
   на всех страницах строятся одинаково и их нужно вынести в одно место?»). Страница
   называет только себя — имя и адрес — и, если она внутри блога, `blog`; цепочку
   «Home / … / имя», её вид и разметку `BreadcrumbList` для поиска собирает этот
   компонент из одной цепочки. До того каждая из шести страниц (рубрика, статья,
   документ, отказ, полка, эффект) собирала «Home» и разметку сама.

   Где крошки стоят: на каждой странице глубже первого уровня — полка и эффект
   («Home / CBD oil», разбор 28.09.2026, п. 6: «нет в каталоге»), товар, рубрика и
   статья блога, документ. Нет — на главной, на первом уровне («All products»,
   «Blog»: крошка «Home / Blog» повторяет меню), в поиске (у выдачи нет места в
   дереве), в корзине, оформлении и кабинете (Baymard: оформление закрыто от
   навигации; NN/g, «Breadcrumbs: 11 Design Guidelines»). Товар собирает цепочку из
   своей полки в представлении (`view.crumbs`) — рисует её тот же `Breadcrumbs`. */
export function PageCrumbs({ lang, name, href, blog = false }: { lang: Lang; name: string; href: string; blog?: boolean }) {
  const home = { name: t(lang, 'crumb.home'), href: hrefFor(lang, { home: true }) }
  const path = blog ? [home, { name: t(lang, 'blog.title'), href: hrefFor(lang, { blog: true }) }] : [home]
  return (
    <>
      <JsonLd data={breadcrumbLd([...path, { name, href }])} />
      <Breadcrumbs trail={trailTo(path, name)} label={t(lang, 'crumb.label')} />
    </>
  )
}
