import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import { isLang, type Lang } from '@/lib/locale.ts'
import { shellData, type ShellData } from '@/lib/shell.ts'
import { lookNow } from '@/lib/look.ts'
import type { Look } from '@/lib/source/contract.ts'
import { fontPreloads, lookCss } from '@/lib/look-values.ts'
import { t } from '@/lib/i18n/index.ts'
import { CheckoutHeader, Header } from './Header.tsx'
import { Footer } from './Footer.tsx'
import '@/styles/palette.css'
import '@/styles/scale.css'
import '@/styles/sign-masks.css'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/buttons.css'
import '@/styles/storefront.css'
import '@/styles/look.css'
import { PressFeedback } from './PressFeedback.tsx'
import { PaneSwipe } from './PaneSwipe.tsx'
import { HelpDock } from './HelpDock.tsx'
import { reachRows, supportHref, SUPPORT } from '@/lib/contacts.ts'
import { THEME_BOOT } from '@/lib/theme.ts'
import { CONSENT_BOOT } from '@/lib/consent.ts'
import { consentView, optionalOf } from '@/lib/consent-view.ts'
import { hrefFor } from '@/lib/href.ts'
import { COOKIE_DOC } from '@/lib/company.ts'
import { ConsentBanner } from './ConsentBanner.tsx'
import { ConsentPrefs } from './ConsentPrefs.tsx'
import { ConsentScripts } from './ConsentScripts.tsx'
import { BuildingNotice } from './BuildingNotice.tsx'
import { ordersOpen } from '@/lib/source/index.ts'

/* Документ витрины: язык, вид, пропуск к содержимому, шапка, подвал и общие
   стили. Один на двоих — макет языка (app/[lang]/layout.tsx) и страницу
   «не найдено» без макета (app/global-not-found.tsx): второй экземпляр
   документа разошёлся бы с первым на первой же правке.

   Вид (`look`, lib/look.ts) — один, готовыми значениями: блок стиля вида
   React поднимает в `<head>` (`precedence`) сразу после стилей сайта, и он
   перекрывает их умолчания на корне; значения проверены до страницы
   (lib/look-values.ts), внедрить через них CSS нечем. Шапка берёт по `look.header` свою разметку.

   Рама документа (`chrome`) — вторая ось, и её выбирает макет, а не вид:
   `full` — шапка с полками и подвал магазина; `checkout` — закрытая касса,
   знак и «назад в корзину», подвал строкой закона и помощи. Касса — свой
   корневой макет группы `app/(checkout)/[lang]` (разбор 24.09.2026, S2):
   вложенный макет шапку родителя не снимает.

   Согласие на cookie (И791) — только у магазина с необязательной категорией в
   реестре (lib/storage.json): скрипт до отрисовки (`CONSENT_BOOT`, как тема),
   полоса в потоке до ссылки «к содержимому», окно настроек и службы — в обеих
   рамах: закон о cookie действует и в кассе. Нет необязательных — нет ничего. */
export function Shell({ lang, data, look, chrome = 'full', children }: { lang: Lang; data: ShellData; look: Look; chrome?: 'full' | 'checkout'; children: ReactNode }) {
  const optional = optionalOf()
  const policy = data.docs.find((d) => d.slug === COOKIE_DOC)
  const consent = optional.length ? consentView(lang, policy ? { label: policy.title, href: hrefFor(lang, { doc: COOKIE_DOC }) } : null) : null
  /* `suppressHydrationWarning` — только на атрибуты самого <html>: скрипт
     панели вида ставит `data-look-panel` до оживления страницы, и React в
     разработке показывал «1 Issue» поверх витрины (28.09.2026). Так принято
     для признаков, которые ставит скрипт до React (темы, next-themes); на
     детей не распространяется. */
  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        {/* Выбранная тема — до первой отрисовки (lib/theme.ts). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        {consent ? <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOT }} /> : null}
        <style href="look" precedence="look">{lookCss(look)}</style>
        {/* Шрифты вида — заранее (`fontPreloads`): React
            поднимает `<link>` в `<head>`, и файл приходит до первой
            отрисовки, а не после неё (подмена сдвигала слова). */}
        {fontPreloads(look.fonts).map((href) => <link key={href} rel="preload" as="font" type="font/woff2" href={href} crossOrigin="" />)}
        {consent ? <ConsentBanner view={consent} optional={optional} /> : null}
        <a className={p.skip} href="#main" data-print="skip">{t(lang, 'skip')}</a>
        {/* Заказы не принимаются — полоса над шапкой в обеих рамах (И792): касса тоже говорит заранее, а не ошибкой у кнопки. */}
        {ordersOpen() ? null : <BuildingNotice text={t(lang, 'notice.building')} />}
        {chrome === 'checkout' ? <CheckoutHeader lang={lang} /> : <Header lang={lang} nav={data.nav} service={data.service} top={data.top} variant={look.header} />}
        {children}
        {/* У кассы подвала нет: «убирай этот текст внизу» (слово заказчика 08.10.2026) — выход один, «назад в корзину»;
            условия — ссылкой у кнопки заказа (PaymentForm), остальное — в подвале магазина (И325). */}
        {chrome === 'checkout' ? null : <Footer lang={lang} docs={data.docs} shelves={data.nav} />}
        {/* Окно помощи у края экрана (И547) — в магазине; касса закрыта, её
            выход один — «назад в корзину». */}
        {chrome === 'full' ? <HelpDock rows={reachRows({ phone: t(lang, 'reach.phone'), email: t(lang, 'reach.email') })} who={{ name: SUPPORT.name, href: supportHref() }} words={{ open: t(lang, 'reach.menu'), online: t(lang, 'reach.online'), top: t(lang, 'reach.top') }} /> : null}
        {consent ? <><ConsentPrefs view={consent} /><ConsentScripts /></> : null}
        {/* Окна за пальцем — один жест на документ (И494). */}
        <PaneSwipe />
        <PressFeedback />
        {/* eslint-disable-next-line @next/next/no-css-tags -- look-panel: стили панели — ссылкой на её адрес, сайт файлы панели не импортирует (И413) */}
        {process.env.LOOK_PICKER === 'on' ? <><link rel="stylesheet" href="/look-panel/look.css" precedence="look-panel" /><script src="/look-panel/look.js" async /></> : null}{/* look-panel: стили — до первой отрисовки (резерв --dock), скрипт — после */}
      </body>
    </html>
  )
}

/** Окно документа — одно на все корни: макет магазина (app/[lang]/layout.tsx),
 *  макет кассы (app/(checkout)/[lang]/layout.tsx) и «не найдено»
 *  (app/global-not-found.tsx); каждый корень его только берёт. На весь экран,
 *  с вырезом: стили читают вырез ролями `--edge-b` (низ: резерв под нижнюю
 *  полосу `--dock`) и `--edge-x` (бока: край страницы `.wrap`) в
 *  styles/tokens.css, а браузер отдаёт `env(safe-area-inset-*)` только окну,
 *  попросившему `viewport-fit=cover`: без него на iPhone это ноль (И301;
 *  семья `viewport` в check:seo). Корень без него теряет вырез молча — касса,
 *  выделенная своим корнем, потеряла бы первой. Увеличение не запрещается —
 *  WCAG 1.4.4. */
export const docViewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

/** Документ языка — у обоих корневых макетов (магазин и касса): язык из
 *  закрытого списка, данные рамы и вид — из источника, рама — своя. */
export async function LangDocument({ lang, chrome = 'full', children }: { lang: string; chrome?: 'full' | 'checkout'; children: ReactNode }) {
  if (!isLang(lang)) notFound()
  return <Shell lang={lang} data={await shellData(lang)} look={await lookNow()} chrome={chrome}>{children}</Shell>
}
