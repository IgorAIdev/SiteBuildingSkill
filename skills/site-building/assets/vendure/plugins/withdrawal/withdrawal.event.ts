import { RequestContext, VendureEvent } from '@vendure/core'
import type { WithdrawalStatement } from './withdrawal.entity'

/* Заявление принято и записано — на это событие шлются два письма:
   покупателю подтверждение, магазину уведомление (withdrawal.email.ts). */
export class WithdrawalReceivedEvent extends VendureEvent {
  constructor(public ctx: RequestContext, public statement: WithdrawalStatement, public orderFound: boolean) {
    super()
  }
}
