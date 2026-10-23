import { Injector, OrderCodeStrategy, RequestContext, TransactionalConnection } from '@vendure/core'

/* Номер заказа — числом подряд с 1001, как у Shopify (#1001), а не шестнадцатью
   случайными знаками по умолчанию Vendure (`DefaultOrderCodeStrategy`). Его диктуют по
   телефону и пишут в назначении перевода; слово заказчика 23.10.2026: «ордер намбер
   сильно проще нужен, 4 цифры будет ок». Подряд — а не четыре случайные цифры: случайные
   совпадут уже через сотни заказов; после 9999 номер просто пятизначный.

   Счётчик — последовательность Postgres `order_code_seq`: `nextval` не повторяется и при
   двух заказах в одну миллисекунду, и при откате транзакции (номер тогда пропадает, а не
   выдаётся второй раз). Последовательность заводится при запуске, если её нет; начало —
   `ORDER_CODE_START` окружения (по умолчанию 1001) — магазину, у которого заказы уже были,
   ставят начало выше последнего номера.

   Код заказа Vendure выдаёт, когда создаётся заказ, — при первом товаре в корзине, а не
   при оформлении: брошенные корзины тоже берут номер, и в оформленных бывают пропуски
   (1001, 1004, …). Номер при этом короткий и не повторяется; сплошной ряд оформленных —
   отдельное поле на событии оформления, если магазину он понадобится. */
export class SequentialOrderCodeStrategy implements OrderCodeStrategy {
  private connection: TransactionalConnection | undefined

  async init(injector: Injector): Promise<void> {
    this.connection = injector.get(TransactionalConnection)
    const start = Number(process.env.ORDER_CODE_START ?? 1001)
    if (!Number.isInteger(start) || start < 1) throw new Error(`ORDER_CODE_START — целое больше нуля, а не «${process.env.ORDER_CODE_START}»`)
    await this.connection.rawConnection.query(`CREATE SEQUENCE IF NOT EXISTS order_code_seq START WITH ${start}`)
  }

  async generate(_ctx: RequestContext): Promise<string> {
    if (!this.connection) throw new Error('SequentialOrderCodeStrategy: init не вызван')
    const rows: { n: string }[] = await this.connection.rawConnection.query(`SELECT nextval('order_code_seq') AS n`)
    return String(rows[0].n)
  }
}
