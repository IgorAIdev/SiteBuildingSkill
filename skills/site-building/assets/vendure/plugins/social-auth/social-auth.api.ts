import { Query, Resolver } from '@nestjs/graphql'
import { Allow, Permission } from '@vendure/core'
import gql from 'graphql-tag'
import { publicProviders } from './rules'
import { SocialAuthPlugin } from './social-auth.plugin'

/* Какие кнопки рисовать (И787): только поставщики, настроенные на сервере, с
   открытыми id для адреса их окна (секрет наружу не уходит). Нет поставщика —
   нет кнопки на витрине, а не пустышка. */
export const shopApiExtensions = gql`
  type SocialSignInProvider { name: String!  clientId: String! }
  extend type Query { socialSignInProviders: [SocialSignInProvider!]! }
`

@Resolver()
export class SocialAuthShopResolver {
  @Query()
  @Allow(Permission.Public)
  socialSignInProviders() {
    return publicProviders(SocialAuthPlugin.options)
  }
}
