import p from '@/styles/primitives.module.css'
import s from './BuildingNotice.module.css'

/* Полоса «сайт ещё строится — заказы пока не принимаются» (И792; слово
   заказчика 08.10.2026: «открывай сайт для поисковиков… просто напиши на
   главной, что сайт в режиме создания, заказы пока не принимаются»). Стоит над
   шапкой на всех страницах, пока магазин не принимает заказы (`ordersOpen`,
   lib/source/index.ts): из поиска приходят на товар, а не на главную. Устройство
   — полоса объявления (HyperUI Announcements, MIT; Shopify Dawn, announcement
   bar): одна строка по середине. Вид — как у полосы согласия: светлая и тонкая,
   снизу волосок. `data-nosnippet` — служебная строка не идёт в описание
   страницы в выдаче (Google, «nosnippet»). */
export function BuildingNotice({ text }: { text: string }) {
  return (
    <aside className={s.notice} data-print="skip" data-nosnippet="">
      <p className={`${p.wrap} ${s.text}`}>{text}</p>
    </aside>
  )
}
