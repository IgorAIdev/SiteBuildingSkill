import Link from 'next/link'
import type { AnchorHTMLAttributes } from 'react'

/* Ссылка сайта — одна на все. Адрес внутри сайта идёт мягким переходом
   (`next/link`): шапка, подвал и склад браузера (число избранного, корзина)
   остаются на месте, страница не мигает и не прыгает наверх, ссылки в окне
   подгружаются заранее. Обычная `<a href="/…">` грузит документ заново: шапка
   рисуется без чисел, потом с ними (заказчик 18.10.2026: «при переключении
   языка меню перезагружается, число избранного пропадает»).

   Мягко не идёт то, что браузер обязан сделать сам: чужой адрес, `tel:` /
   `mailto:`, якорь на этой же странице (`#main`), открытие в новой вкладке
   (`target`), скачивание (`download`), служебный адрес `/api/…`. Для них
   остаётся обычная `<a>`: решает здесь, а не в каждом месте. Проверка кода
   (семья `hardLink`) не пускает в разметку `<a href>` на внутренний адрес
   мимо этого файла.

   Язык — первый сегмент адреса, а корень страницы лежит под ним
   (`app/[site]/[lang]/layout.tsx`): смена языка — тот же корневой макет с другим
   параметром, то есть мягкий переход, а не загрузка. Образец — документация
   Next.js: «Navigating across multiple root layouts will cause a full page
   load» (nextjs.org/docs/app/api-reference/file-conventions/layout); у
   Shopify Hydrogen счётчик корзины живёт в общем состоянии и переживает
   переходы, а полная загрузка запаздывает с ним (shopify.dev, «Render a cart
   from client side»). */
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean; scroll?: boolean; replace?: boolean }

const INSIDE = /^\/(?!\/|api\/)/

export function SiteLink({ href, target, download, prefetch, scroll, replace, ...rest }: Props) {
  if (typeof href === 'string' && INSIDE.test(href) && !target && download === undefined) {
    return <Link href={href} prefetch={prefetch} scroll={scroll} replace={replace} {...rest} />
  }
  return <a href={href} target={target} download={download} {...rest} />
}
