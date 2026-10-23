# Номер заказа подряд — стратегия сервера Vendure

Номер заказа — числом подряд с 1001 (как у Shopify: #1001, #1002…), а не шестнадцатью
случайными знаками Vendure по умолчанию. Слово заказчика 23.10.2026: «ордер намбер
сильно проще нужен, 4 цифры будет ок». Витрина-образец нумерует так же
(`templates/storefront/lib/source/sample/commerce.ts`, `orderCode`).

## Установка

1. Скопировать `index.ts` в сервер Vendure магазина (например,
   `src/plugins/order-number/index.ts`).
2. В `vendure-config.ts`:

   ```ts
   import { SequentialOrderCodeStrategy } from './plugins/order-number'

   export const config: VendureConfig = {
     // …
     orderOptions: { orderCodeStrategy: new SequentialOrderCodeStrategy() },
   }
   ```

3. База — Postgres: номер берётся из последовательности `order_code_seq`, она
   заводится при запуске сама (`CREATE SEQUENCE IF NOT EXISTS`).
4. Магазин, у которого заказы уже были: перед первым запуском задать
   `ORDER_CODE_START` выше последнего номера, иначе ряд начнётся с 1001. Уже
   заведённую последовательность переставляет только `ALTER SEQUENCE order_code_seq
   RESTART WITH …` руками.

## Что знать

- Код заказа Vendure выдаёт при первом товаре в корзине, а не при оформлении:
  брошенные корзины тоже берут номер, и в оформленных бывают пропуски. Номер всё
  равно короткий и не повторяется.
- Старые заказы сохраняют свои прежние коды — меняется только выдача новых.
- Витрина номер не строит и не переписывает: она печатает `order.code`, как его
  отдал сервер (`lib/source/vendure/commerce.ts`).
