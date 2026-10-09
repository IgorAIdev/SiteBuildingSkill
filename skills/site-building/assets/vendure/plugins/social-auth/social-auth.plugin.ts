import { OnApplicationBootstrap } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { AccountVerifiedEvent, EventBus, Injector, PluginCommonModule, VendurePlugin } from '@vendure/core'
import { FacebookAuthenticationStrategy } from './facebook.strategy'
import { GoogleAuthenticationStrategy } from './google.strategy'
import { optionsOf, type Options } from './rules'
import { SocialAccounts } from './social-accounts'
import { SocialAuthShopResolver, shopApiExtensions } from './social-auth.api'

/* Вход через Google и Facebook (И787). Стратегии дописываются в
   authOptions.shopAuthenticationStrategy рядом с NativeAuthenticationStrategy —
   вход паролем остаётся. Пол версии — 3.7.3: раньше внешний вход открывал
   захват кабинета (GHSA-wr5h-x3x6-4h23, GHSA-6j36-r6pr-59x4); на старом движке
   сервер не стартует. Подтверждение адреса письмом магазина снимает с кабинета
   связи, адрес не доказывавшие (Facebook), в той же транзакции — блокирующий
   обработчик `AccountVerifiedEvent` (social-accounts.ts). Установка — README.md
   рядом.

   Лицензия: Vendure — GPLv3 или коммерческая; плагин, собранный в сервер,
   связан ею (INTEGRATION.md набора). */
@VendurePlugin({
  imports: [PluginCommonModule],
  shopApiExtensions: { schema: shopApiExtensions, resolvers: [SocialAuthShopResolver] },
  configuration: (config) => {
    const o = SocialAuthPlugin.options
    const shop = [...(config.authOptions.shopAuthenticationStrategy ?? [])]
    if (o.google) shop.push(new GoogleAuthenticationStrategy({ ...o.google, redirectUris: o.redirectUris }))
    if (o.facebook) shop.push(new FacebookAuthenticationStrategy({ ...o.facebook, redirectUris: o.redirectUris }))
    config.authOptions.shopAuthenticationStrategy = shop
    return config
  },
  compatibility: '>=3.7.3 <4.0.0',
})
export class SocialAuthPlugin implements OnApplicationBootstrap {
  static options: Options = { google: null, facebook: null, redirectUris: [] }
  /** Настройки — из окружения сервера (README, «Переменные»). */
  static init(env: Record<string, string | undefined> = process.env) {
    SocialAuthPlugin.options = optionsOf(env)
    return SocialAuthPlugin
  }

  constructor(private eventBus: EventBus, private moduleRef: ModuleRef) {}

  onApplicationBootstrap() {
    const accounts = new SocialAccounts()
    accounts.init(new Injector(this.moduleRef))
    this.eventBus.registerBlockingEventHandler({
      event: AccountVerifiedEvent,
      id: 'social-auth-drop-unproven-links',
      handler: (event) => accounts.verified(event.ctx, event.customer),
    })
  }
}
