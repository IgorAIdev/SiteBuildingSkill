import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { siteLangParams } from '@/lib/sites.ts'
import { setSite } from '@/lib/site-now.ts'
import { LangDocument, docViewport } from '@/components/Shell.tsx'

/* Страницы — заранее на каждую пару «сайт × его язык» (lib/sites.ts). */
export const generateStaticParams = siteLangParams

/* Язык — закрытый список: `/contact`, `/bg`, `/xx` не принимаются за язык,
   а уходят мимо дерева — на свою страницу «не найдено» с кодом 404
   (app/global-not-found.tsx). Принятые за язык, они падали в `notFound()`
   макета, и Next отдавал пустую страницу ошибки (И257). */
export const dynamicParams = false

/* Окно документа — одно на все корни (components/Shell.tsx, `docViewport`):
   на весь экран, с вырезом (И301). */
export const viewport: Viewport = docViewport

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ site: string; lang: string }> }) {
  const { site, lang } = await params
  setSite(site)
  return <LangDocument lang={lang}>{children}</LangDocument>
}
