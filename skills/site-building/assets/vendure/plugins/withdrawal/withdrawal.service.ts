import { Injectable } from '@nestjs/common'
import { HistoryEntryType } from '@vendure/common/lib/generated-types'
import {
  EventBus, HistoryService, ListQueryBuilder, ListQueryOptions, OrderService, PaginatedList,
  RequestContext, TransactionalConnection, UserInputError,
} from '@vendure/core'
import { WithdrawalStatement } from './withdrawal.entity'
import { WithdrawalReceivedEvent } from './withdrawal.event'
import { checkStatement, noteOf, type StatementInput } from './rules'

/* Приём заявления об отказе (И748): проверка полей (rules.ts), поиск заказа
   в канале, запись, заметка в истории заказа (видна в админке у заказа) и
   событие, на которое уходят письма. Всё — в транзакции запроса
   (`@Transaction()` у мутации): письмо уходит только о записанном заявлении. */
@Injectable()
export class WithdrawalService {
  constructor(
    private connection: TransactionalConnection,
    private orderService: OrderService,
    private historyService: HistoryService,
    private eventBus: EventBus,
    private listQueryBuilder: ListQueryBuilder,
  ) {}

  async submit(ctx: RequestContext, input: Partial<StatementInput>): Promise<WithdrawalStatement> {
    const checked = checkStatement(input)
    if (!checked.ok) throw new UserInputError(`withdrawal: invalid ${checked.reason}`)
    const order = await this.orderService.findOneByCode(ctx, checked.value.orderCode)
    const statement = await this.connection.getRepository(ctx, WithdrawalStatement).save(new WithdrawalStatement({
      ...checked.value,
      languageCode: ctx.languageCode,
      channelId: ctx.channelId,
      orderId: order?.id ?? null,
    }))
    if (order) {
      await this.historyService.createHistoryEntryForOrder({
        ctx, orderId: order.id, type: HistoryEntryType.ORDER_NOTE,
        data: { note: noteOf({ ...checked.value, receivedAt: statement.createdAt }) },
      }, false)
    }
    await this.eventBus.publish(new WithdrawalReceivedEvent(ctx, statement, Boolean(order)))
    return statement
  }

  async list(ctx: RequestContext, options?: ListQueryOptions<WithdrawalStatement>): Promise<PaginatedList<WithdrawalStatement>> {
    const [items, totalItems] = await this.listQueryBuilder
      .build(WithdrawalStatement, options, { ctx, where: { channelId: ctx.channelId } })
      .getManyAndCount()
    return { items, totalItems }
  }
}
