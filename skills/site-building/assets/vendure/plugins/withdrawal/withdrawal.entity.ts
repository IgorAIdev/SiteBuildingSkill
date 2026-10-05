import { DeepPartial, EntityId, ID, VendureEntity } from '@vendure/core'
import { Column, Entity } from 'typeorm'

/* Заявление об отказе от договора (И748). Хранится как есть — имя, номер
   заказа, адрес, язык, канал, — даже если заказа с таким номером нет:
   заявление действительно, магазин разбирается сам. `orderId` — найденный
   заказ (null — не найден). Время приёма — `createdAt`. */
@Entity()
export class WithdrawalStatement extends VendureEntity {
  constructor(input?: DeepPartial<WithdrawalStatement>) {
    super(input)
  }

  @Column() name!: string
  @Column() orderCode!: string
  @Column() emailAddress!: string
  @Column() languageCode!: string
  @EntityId() channelId!: ID
  @EntityId({ nullable: true }) orderId!: ID | null
}
