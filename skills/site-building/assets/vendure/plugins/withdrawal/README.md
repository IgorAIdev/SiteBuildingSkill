# Плагин Vendure: заявление об отказе от договора

Кнопка «Retrageți-vă din contract aici» обязательна в ЕС с 19.06.2026 (ст. 11a
Директивы 2011/83 в редакции 2023/2673; Румыния — OUG 18/2026). Витрина набора
рисует оба шага (кнопку и форму с «Confirmați retragerea») и шлёт мутацию
`submitWithdrawal`. Этот плагин её принимает: записывает заявление, ставит
заметку в историю заказа и шлёт письма — подтверждение покупателю (содержание,
дата и время) и уведомление магазину. Правило набора — И748.

Проверено набором: правила и письмо (`rules.ts`) — `selftest/vendure-withdrawal.test.mjs`;
вызов из витрины — `templates/storefront/tests/vendure.test.ts` («withdrawal goes to the server plugin…»). Сборка
с `@vendure/core` — в проекте сервера (у набора своей копии Vendure нет).

## Установка в сервер (Vendure 3.x)

1. Скопировать папку в сервер: `src/plugins/withdrawal/`.
2. Шаблоны писем — к остальным шаблонам EmailPlugin сервера:
   `templates/withdrawal-received` и `templates/withdrawal-notify` →
   `static/email/templates/` (папка, которую читает `templateLoader`).
3. `vendure-config.ts`:

   ```ts
   import { WithdrawalPlugin, withdrawalReceivedHandler, withdrawalNotifyHandler } from './plugins/withdrawal'

   plugins: [
     WithdrawalPlugin,
     EmailPlugin.init({
       // …как было…
       handlers: [...defaultEmailHandlers, withdrawalReceivedHandler, withdrawalNotifyHandler('comenzi@magazin.ro')],
     }),
   ]
   ```

   `fromAddress` — тот же глобальный адрес писем, что у заказов (`globalTemplateVars`).
4. Миграция — новая таблица `withdrawal_statement`:
   `npx vendure migrate` → «Generate a new migration» → «Run».
5. Перезапустить сервер. Проверить в Shop API:

   ```graphql
   mutation { submitWithdrawal(input: { name: "Test", orderCode: "TEST-1", emailAddress: "test@example.com" }) { receivedAt } }
   ```

   Ответ — время приёма; в Admin API — `withdrawalStatements { items { orderCode createdAt } totalItems }`;
   у найденного заказа — заметка в истории.

## Как устроено

| файл | что делает |
|---|---|
| `rules.ts` | проверка полей (только имя, номер заказа, адрес — ст. 11a(2)); слова письма ro / en / hu; дата и время по Бухаресту |
| `withdrawal.entity.ts` | заявление: имя, номер, адрес, язык, канал, найденный заказ; время приёма — `createdAt` |
| `withdrawal.service.ts` | приём: проверка → поиск заказа в канале → запись → заметка в истории заказа → событие |
| `withdrawal.api.ts` | Shop API `submitWithdrawal`; Admin API `withdrawalStatements` (право — `ReadOrder`) |
| `withdrawal.email.ts` | письма на событие: покупателю и магазину |

Заявление принимается и тогда, когда заказа с таким номером нет: право на
отказ не зависит от опечатки покупателя — магазин получает уведомление с
пометкой «проверьте вручную». Отклоняются только пустые поля, мусорная длина
и адрес, на который нельзя послать подтверждение.

Пока плагина в сервере нет, витрина получает ошибку GraphQL и предлагает
написать на почту магазина: заявление любым ясным способом в срок тоже
действительно, но кнопка тогда не выполняет обещания.

Лицензия: Vendure — GPLv3 или коммерческая; плагин, собранный в сервер, связан
ею (`../../INTEGRATION.md`).
