import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { SITES } from '@/lib/sites.ts'
import { setSite } from '@/lib/site-now.ts'
import { LangDocument, docViewport } from '@/components/Shell.tsx'

/* Страницы — заранее на каждую пару «сайт × его язык» (lib/sites.ts). */
export const generateStaticParams = () => SITES.flatMap((site) => site.langs.map((lang) => ({ site: site.id, lang })))

/* Язык — закрытый список, как у макета магазина (app/[lang]/layout.tsx). */
export const dynamicParams = false

/* Окно документа — то же, что у макета магазина (components/Shell.tsx,
   `docViewport`): корень кассы свой, и без него касса теряла бы вырез на
   iPhone (И301). */
export const viewport: Viewport = docViewport

/* Касса — коридор со своей рамой документа (разбор 24.09.2026, S2 и X5):
   знак, «назад в корзину», шаги, подвал строкой закона и помощи; полок,
   поиска и подвала магазина нет. Свой КОРНЕВОЙ макет группы маршрутов, а не
   вложенный: шапку рисует документ, и вложенный макет снять шапку родителя
   не может. Адреса те же — `/ro/checkout/…`: группа адреса не даёт.
   «Спасибо» (`app/[lang]/checkout/done`) — уже магазин: коридор кончился, и
   полки снова нужны. */
export default async function CheckoutLayout({ children, params }: { children: ReactNode; params: Promise<{ site: string; lang: string }> }) {
  const { site, lang } = await params
  setSite(site)
  return <LangDocument lang={lang} chrome="checkout">{children}</LangDocument>
}
