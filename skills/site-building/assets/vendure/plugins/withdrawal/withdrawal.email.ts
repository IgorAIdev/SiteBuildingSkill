import { EmailEventListener } from '@vendure/email-plugin'
import { WithdrawalReceivedEvent } from './withdrawal.event'
import { letterOf } from './rules'

const varsOf = (e: WithdrawalReceivedEvent) => {
  const s = e.statement
  return letterOf(e.ctx.languageCode, { name: s.name, orderCode: s.orderCode, emailAddress: s.emailAddress, receivedAt: s.createdAt, orderFound: e.orderFound })
}

/* Подтверждение покупателю (ст. 11a(4): содержание, дата и время, на
   долговечном носителе — письмо). Шаблон — templates/withdrawal-received. */
export const withdrawalReceivedHandler = new EmailEventListener('withdrawal-received')
  .on(WithdrawalReceivedEvent)
  .setRecipient((e) => e.statement.emailAddress)
  .setFrom('{{ fromAddress }}')
  .setSubject('{{ subject }}')
  .setTemplateVars((e) => varsOf(e))

/* Уведомление магазину — на его адрес (`notifyEmail` плагина): заявление
   надо разобрать, а если номер заказа не найден — проверить руками. */
export const withdrawalNotifyHandler = (notifyEmail: string) =>
  new EmailEventListener('withdrawal-notify')
    .on(WithdrawalReceivedEvent)
    .setRecipient(() => notifyEmail)
    .setFrom('{{ fromAddress }}')
    .setSubject('{{ shopSubject }}')
    .setTemplateVars((e) => varsOf(e))
