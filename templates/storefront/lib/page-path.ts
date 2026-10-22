import { usePathname } from 'next/navigation'
import { publicPath } from './sites.ts'

/** `usePathname` без сегмента сайта (`publicPath`, lib/sites.ts) — для ссылок и
 *  отметок «вы здесь» в клиентских частях. */
export const usePagePath = (): string => publicPath(usePathname())
