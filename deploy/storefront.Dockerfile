# Витрина скилла на сервере заказчика — чтобы шаблон открывался по адресу
# из какой угодно сессии, облачной тоже (И434). Это витрина скилла, не
# магазин: своё приложение в своём проекте Coolify, к cbdin и cbdshop
# отношения не имеет. Заводит и выкатывает её `npm run storefront:server`.
#
# Порядок тот же, что у `npm run storefront` на машине: витрина ставится из
# шаблона набора, получает вид витрины шаблона из `showcase/`, ставит
# зависимости — дальше не сервер разработки, а сборка и `next start`.
# Каталог — образец данных: поисковикам витрина закрыта сама (`robots` —
# disallow, страницы — noindex, пока каталог не настоящий). Панель вида
# включена и публикует: сервер даёт сайту писать файлы. Опубликованное живёт
# до следующей сборки — в скилл его забирает `npm run storefront --
# --save-look --from <адрес>`.
#
# Две ступени: собирается витрина с набором, инструментами сборки и кэшами,
# на сервер едут только собранный сайт и проверка вида.

FROM node:24-slim AS build
WORKDIR /kit
COPY . .
RUN node tools/storefront.mjs --prepare && rm -rf /root/.npm
WORKDIR /kit/.storefront
# Свой адрес витрины (SITE_URL) задаёт приложению `npm run storefront:server`;
# robots и карта сайта собираются заранее — без него они ведут на localhost (И459).
ARG SITE_URL
# Витрина скилла показывает товары настоящего каталога — движок Vendure
# магазина cbdin (слово заказчика 28.09.2026: «к Vendure подключай, чтоб с
# него товары показывались»; И503). Адрес Shop API и код канала — не ключи:
# их отдаёт любой запрос витрины. Заказы выключены: VENDURE_PLACE_ORDERS не
# задан, это действующий магазин. Переменные окружения Coolify важнее этих.
# Панель входит в страницы, собранные заранее, — флаг нужен уже сборке.
ENV NEXT_TELEMETRY_DISABLED=1 \
    SOURCE=vendure \
    VENDURE_SHOP_API_URL=https://vendure.cbdshop.bg/shop-api \
    VENDURE_CHANNEL_TOKEN=cbdin \
    VENDURE_FALLBACK_LANG=en \
    LOOK_PICKER=on
RUN npm run build \
 && npm prune --omit=dev --no-audit --no-fund \
 && rm -rf .next/cache /root/.npm

FROM node:24-slim
# Панель публикует вид только после отрисованной проверки сочетания
# (check:craft: контраст и вес по пикселям, обе темы, все ширины) — ей
# нужны браузер без окна и обработка снимков. Лежат в стороне от сайта,
# версии закреплены; путь им называют PLAYWRIGHT и SHARP (tools/browser.mjs).
WORKDIR /opt/check
RUN npm i --no-audit --no-fund playwright@1.63.0 sharp@0.35.4 \
 && npx playwright install --with-deps --only-shell chromium \
 && rm -rf /root/.npm
ENV PLAYWRIGHT=/opt/check/node_modules/playwright/index.mjs \
    SHARP=/opt/check/node_modules/sharp/dist/index.mjs \
    NEXT_TELEMETRY_DISABLED=1 \
    SOURCE=vendure \
    VENDURE_SHOP_API_URL=https://vendure.cbdshop.bg/shop-api \
    VENDURE_CHANNEL_TOKEN=cbdin \
    VENDURE_FALLBACK_LANG=en \
    LOOK_PICKER=on

WORKDIR /site
COPY --from=build /kit/.storefront ./
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3000"]
