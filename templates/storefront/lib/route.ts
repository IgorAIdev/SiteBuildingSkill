import { notFound } from 'next/navigation'
import { isLang, type Lang } from './locale.ts'
import { setSite, siteNow } from './site-now.ts'

/** Язык страницы из адреса. Макет уже отказал чужому языку; страница
 *  спрашивает сама, потому что тип params у неё — строка. Сайт из того же
 *  адреса (`/[site]/[lang]/…`, lib/sites.ts) ставится запросу — его читают
 *  canonical, карта и переключатель языков; язык не своего сайта — 404. */
export async function langOf(params: Promise<{ lang: string; site?: string }>): Promise<Lang> {
  const { lang, site } = await params
  setSite(site)
  if (!isLang(lang) || !siteNow().langs.includes(lang)) notFound()
  return lang
}
