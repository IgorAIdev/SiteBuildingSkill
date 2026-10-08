# Адаптер Vendure Shop API — ресурсы

Порядок работы и контракт — [references/vendure.md](../../references/vendure.md).
Файлы — ESM без React, Next, SDK и GraphQL-клиента. Копировать в серверный
слой витрины (`lib/vendure/` или `packages/sources`), не в компоненты.

1. `request.mjs` — один запрос к Shop API: канал заголовком `vendure-token`,
   язык и валюта параметрами, сессия `Authorization: Bearer`. Возвращает
   `unavailable | http | graphql | ok` вместо исключения и продлённый
   `vendure-auth-token`, который сервер витрины кладёт в cookie
   `httpOnly; secure; sameSite=lax; path=/`. Подсказки кэша фреймворка —
   через `init` (`{ next: { tags } }`, `{ cache: 'no-store' }`).
2. `result.mjs` — чтение union-результата мутации по `__typename`;
   `InsufficientStockError` — частичный успех с обновлённым заказом.
3. `money.mjs` — целые в минорных единицах, точность `MoneyStrategy` сервера
   (по умолчанию 2), одна функция форматирования, `SinglePrice | PriceRange`.
4. `search.mjs` — `facet.<code>` в адресе → `facetValueFilters`
   (ИЛИ внутри грани, И между гранями); `?page=N` → `take/skip`, мусор → 404.
5. `asset.mjs` — `srcset` сервером ассетов Vendure (`w`, `h`, `mode`,
   `format`, `fpx/fpy`) и тот же фокус в `object-position`.
6. `product.mjs` — скрыть опции общих групп без варианта (Vendure 3.6+) и
   передать товар в `assets/commerce/variant-selection.mjs` по стабильным `code`.
7. `plugins/withdrawal/` — плагин СЕРВЕРА Vendure (не витрины): заявление об
   отказе от договора кнопкой (ст. 11a Директивы 2011/83, с 19.06.2026; И748) —
   мутация `submitWithdrawal`, запись, заметка в истории заказа, письма
   покупателю и магазину. Установка — `plugins/withdrawal/README.md`.
8. Кабинет покупателя (И771) — в адаптере шаблона витрины
   (`templates/storefront/lib/source/vendure/account.ts`); серверу Vendure — две
   настройки: `authOptions.requireVerification` и адреса писем EmailPlugin
   (references/vendure.md, «Кабинет покупателя»).
9. `plugins/social-auth/` — плагин СЕРВЕРА Vendure: вход через Google и Facebook
   (И787) — стратегии `google` и `facebook` для `authenticate` (код с адреса
   возврата витрины с верификатором PKCE меняет сервер, секреты только у него),
   кабинет по адресу — только доказанным адресом (недоказанные связи снимает
   письмо владельца), запрос `socialSignInProviders` — какие кнопки
   рисовать. Пол — Vendure 3.7.3. Установка — `plugins/social-auth/README.md`.

`product.mjs` частично взят из vendurehq/nextjs-starter-vendure (MIT) —
лицензия рядом, `VENDURE-STARTER-LICENSE.md`. Остальное — собственный код набора.
Сам Vendure — GPLv3 или коммерческая лицензия: витрина обращается к нему по
сети и этим не связана; плагины, собираемые в сервер Vendure, — связаны.

Проверено: `selftest/vendure-resources.test.mjs`. Против живого сервера —
движок cbdin (Vendure 3.7, канал `cbdin`, 25.09.2026) через адаптер шаблона
витрины `templates/storefront/lib/source/vendure/` (`SOURCE=vendure`): каталог,
грани, листание, товар, корзина, оформление до оплаты. Для другого проекта —
сверить версию Vendure, `MoneyStrategy`, стратегию остатков и стратегию
преобразования картинок в его конфиге.
