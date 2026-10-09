import { PluginCommonModule, VendurePlugin } from '@vendure/core'
import { WithdrawalStatement } from './withdrawal.entity'
import { WithdrawalService } from './withdrawal.service'
import { WithdrawalAdminResolver, WithdrawalShopResolver, adminApiExtensions, shopApiExtensions } from './withdrawal.api'

/* Отказ от договора кнопкой (И748): ст. 11a Директивы 2011/83 в редакции
   2023/2673, с 19.06.2026 (Румыния — OUG 18/2026). Витрина шлёт мутацию
   `submitWithdrawal` (templates/storefront/lib/source/vendure/commerce.ts,
   `withdraw`), плагин записывает заявление, ставит заметку в историю заказа и
   поднимает событие, на которое EmailPlugin шлёт подтверждение покупателю и
   уведомление магазину (withdrawal.email.ts). Установка — README.md рядом.

   Лицензия: Vendure — GPLv3 или коммерческая; плагин, собранный в сервер,
   связан ею (INTEGRATION.md набора). */
@VendurePlugin({
  imports: [PluginCommonModule],
  entities: [WithdrawalStatement],
  providers: [WithdrawalService],
  shopApiExtensions: { schema: shopApiExtensions, resolvers: [WithdrawalShopResolver] },
  adminApiExtensions: { schema: adminApiExtensions, resolvers: [WithdrawalAdminResolver] },
  compatibility: '^3.0.0',
})
export class WithdrawalPlugin {}
