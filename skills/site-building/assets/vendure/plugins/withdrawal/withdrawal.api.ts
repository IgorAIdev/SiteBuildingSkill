import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { Allow, Ctx, ListQueryOptions, Permission, RequestContext, Transaction } from '@vendure/core'
import gql from 'graphql-tag'
import { WithdrawalStatement } from './withdrawal.entity'
import { WithdrawalService } from './withdrawal.service'

/* Shop API: одна мутация — второй шаг формы отказа («Confirmați
   retragerea»). Спрашивается ровно разрешённое (ст. 11a(2)): имя, номер
   заказа, адрес для подтверждения. Ответ — время приёма: витрина называет
   его покупателю сразу, письмо уходит следом. */
export const shopApiExtensions = gql`
  input SubmitWithdrawalInput {
    name: String!
    orderCode: String!
    emailAddress: String!
  }
  type WithdrawalReceipt {
    receivedAt: DateTime!
    orderCode: String!
    emailAddress: String!
  }
  extend type Mutation {
    submitWithdrawal(input: SubmitWithdrawalInput!): WithdrawalReceipt!
  }
`

/* Admin API: список заявлений канала, страницами (ListOptions Vendure
   строит сам по пустому объявлению). Читает тот, кто читает заказы. */
export const adminApiExtensions = gql`
  type WithdrawalStatement implements Node {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String!
    orderCode: String!
    emailAddress: String!
    languageCode: String!
    orderId: ID
  }
  type WithdrawalStatementList implements PaginatedList {
    items: [WithdrawalStatement!]!
    totalItems: Int!
  }
  input WithdrawalStatementListOptions
  extend type Query {
    withdrawalStatements(options: WithdrawalStatementListOptions): WithdrawalStatementList!
  }
`

@Resolver()
export class WithdrawalShopResolver {
  constructor(private service: WithdrawalService) {}

  @Mutation()
  @Transaction()
  async submitWithdrawal(@Ctx() ctx: RequestContext, @Args() args: { input: { name: string; orderCode: string; emailAddress: string } }) {
    const s = await this.service.submit(ctx, args.input)
    return { receivedAt: s.createdAt, orderCode: s.orderCode, emailAddress: s.emailAddress }
  }
}

@Resolver()
export class WithdrawalAdminResolver {
  constructor(private service: WithdrawalService) {}

  @Query()
  @Allow(Permission.ReadOrder)
  withdrawalStatements(@Ctx() ctx: RequestContext, @Args() args: { options?: ListQueryOptions<WithdrawalStatement> }) {
    return this.service.list(ctx, args.options)
  }
}
