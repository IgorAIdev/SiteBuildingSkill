import type { NextConfig } from 'next'

/* Язык — первый сегмент адреса; корень ведёт на основной язык рынка.
   `globalNotFound` — адрес мимо дерева маршрутов получает свою страницу
   app/global-not-found.tsx: корневой макет витрины — `[lang]`, и собрать
   «не найдено» из макета и not-found.tsx корня нечем (И257). */
const config: NextConfig = {
  experimental: { globalNotFound: true },
  /* Сервер разработки отдаёт свои файлы (оживление страницы, горячая
     замена) только localhost: с телефона по адресу компьютера в сети
     страница рисовалась, а меню и шторки не открывались. Адреса сети даёт
     запускатель витрины (tools/storefront.mjs, DEV_ORIGINS); на сборку это
     не влияет. */
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(',').filter(Boolean),
  /* Круглый значок «N» сервера разработки стоит у левого нижнего угла
     поверх страницы: на полке каталога @1440 он закрывал кнопку «Add»
     первой карточки, и отрисованная проверка кнопки Publish браковала вид
     («мёртвая зона… перехватывает nextjs-portal»), а заказчик видел его
     поверх кнопок. На собранном сайте его нет; ошибки сборки сервер
     показывает и без значка. */
  devIndicators: false,
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }]
  },
  /* Вход и кабинет не встают в чужую рамку (И787): форма пароля и кнопки
     Google и Facebook под прозрачной чужой страницей — кликджекинг (OWASP
     «Clickjacking Defense»). Своя рамка того же сайта можно; X-Frame-Options —
     для браузеров без `frame-ancestors`. */
  async headers() {
    return [{ source: '/:lang/account/:path*', headers: [
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ] }]
  },
}

export default config
