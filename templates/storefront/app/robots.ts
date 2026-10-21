import type { MetadataRoute } from 'next'
import { siteUrlOf } from '@/lib/seo.ts'
import { CATALOG_IS_REAL } from '@/lib/flags.ts'
import { headers } from 'next/headers'
import { SITE_HEADER, DEFAULT_SITE, siteById } from '@/lib/sites.ts'

/* Карта сайта в robots — своего сайта: адрес берётся у сайта запроса. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = siteById((await headers()).get(SITE_HEADER) ?? '') ?? DEFAULT_SITE
  return {
    rules: CATALOG_IS_REAL ? { userAgent: '*', allow: '/' } : { userAgent: '*', disallow: '/' },
    sitemap: `${siteUrlOf(site)}/sitemap.xml`,
  }
}
