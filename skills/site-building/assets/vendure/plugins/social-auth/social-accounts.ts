import { HistoryEntryType } from '@vendure/common/lib/generated-types'
import { AuthenticationMethod, ConfigService, Customer, CustomerService, ExternalAuthenticationMethod, ExternalAuthenticationService,
  HistoryService, Injector, RequestContext, SessionService, TransactionalConnection, UnverifiedExternalEmailError, User,
  UserService } from '@vendure/core'
import { decide, toDrop, type Person, type Way } from './rules'

/* Вход в кабинет по человеку, которого назвал поставщик (И787). Решение —
   `decide` и `toDrop` (rules.ts, тест набора), здесь только исполнение.
   Привязка к существующему кабинету — своя, а не createCustomerAndUser: ядро
   ищет кабинет по customer.emailAddress первой строкой и после гостевой
   покупки берёт Customer без пользователя — и заводит второй кабинет; и ядро
   при привязке оставляет всё прежнее — пароль, сессии, другие связи.

   Недоказанный адрес (Facebook) заводит кабинет, но кабинет этот ничей:
   пока владелец адреса не докажет его, связь с Facebook — единственный вход.
   Доказал (письмо магазина — `verified`, или Google) — связь с Facebook и
   сессии кабинета снимаются: иначе кабинет, заведённый чужим Facebook с
   чужим адресом, после подтверждения владельцем остался бы открытым и
   чужому (обратный порядок к GHSA-wr5h-x3x6-4h23 и GHSA-6j36-r6pr-59x4). */
export class SocialAccounts {
  private ext!: ExternalAuthenticationService
  private users!: UserService
  private customers!: CustomerService
  private history!: HistoryService
  private sessions!: SessionService
  private config!: ConfigService
  private connection!: TransactionalConnection

  init(injector: Injector) {
    this.ext = injector.get(ExternalAuthenticationService)
    this.users = injector.get(UserService)
    this.customers = injector.get(CustomerService)
    this.history = injector.get(HistoryService)
    this.sessions = injector.get(SessionService)
    this.config = injector.get(ConfigService)
    this.connection = injector.get(TransactionalConnection)
  }

  async enter(ctx: RequestContext, strategy: string, p: Person): Promise<User | string> {
    const linked = await this.ext.findCustomerUser(ctx, strategy, p.subject)
    const existing = linked ? undefined : await this.users.getUserByEmailAddress(ctx, p.email, 'customer')
    const hasLink = !!existing?.authenticationMethods?.some((m) => m instanceof ExternalAuthenticationMethod && m.strategy === strategy && m.externalIdentifier === p.subject)
    const decision = decide({ linkedUser: !!linked, existingUser: !!existing, existingHasThisLink: hasLink, proven: p.proven,
      existingVerified: !!existing?.verified, requireVerification: this.config.authOptions.requireVerification })
    switch (decision) {
      case 'enter-linked': return linked as User
      case 'enter-existing': return existing as User
      case 'EMAIL_IN_USE': return 'EMAIL_IN_USE'
      case 'link':
      case 'claim': return this.attach(ctx, existing as User, strategy, p.subject, decision)
      case 'create':
        try {
          return await this.ext.createCustomerAndUser(ctx, { strategy, externalIdentifier: p.subject, emailAddress: p.email,
            firstName: p.firstName, lastName: p.lastName, verified: p.proven })
        } catch (e) {
          /* Ядро нашло кабинет, которого не нашли мы (адрес у Customer другим
             регистром) — тот же ответ, что у недоказанного адреса. */
          if (e instanceof UnverifiedExternalEmailError) return 'EMAIL_IN_USE'
          throw e
        }
    }
  }

  /** Владелец подтвердил адрес письмом магазина (`AccountVerifiedEvent`): связи,
   *  адрес не доказывавшие, и сессии кабинета уходят в той же транзакции. */
  async verified(ctx: RequestContext, customer: Customer): Promise<void> {
    const found = await this.connection.getRepository(ctx, Customer).findOne({ where: { id: customer.id }, relations: { user: { authenticationMethods: true } } })
    if (found?.user) await this.drop(ctx, found.user, 'verified')
  }

  /** Шаги ядра при привязке: способ входа сохранён и дописан пользователю, в
   *  историю покупателя — «зарегистрирован (стратегия)»; у `claim` — и
   *  «подтверждён»: адрес доказал Google. */
  private async attach(ctx: RequestContext, user: User, strategy: string, subject: string, why: 'link' | 'claim'): Promise<User> {
    await this.drop(ctx, user, why)
    const method = await this.connection.getRepository(ctx, ExternalAuthenticationMethod)
      .save(new ExternalAuthenticationMethod({ strategy, externalIdentifier: subject }))
    user.authenticationMethods = [...(user.authenticationMethods ?? []), method]
    if (why === 'claim') user.verified = true
    const saved = await this.connection.getRepository(ctx, User).save(user)
    const customer = await this.customers.findOneByUserId(ctx, saved.id, false)
    if (customer) {
      await this.history.createHistoryEntryForCustomer({ ctx, customerId: customer.id, type: HistoryEntryType.CUSTOMER_REGISTERED, data: { strategy } })
      if (why === 'claim') await this.history.createHistoryEntryForCustomer({ ctx, customerId: customer.id, type: HistoryEntryType.CUSTOMER_VERIFIED, data: { strategy } })
    }
    return saved
  }

  /** Снять способы входа по `toDrop` и, если снято хоть что-то, закрыть все
   *  сессии кабинета — новую сессию входа ядро создаёт уже после. */
  private async drop(ctx: RequestContext, user: User, why: 'link' | 'claim' | 'verified'): Promise<void> {
    const methods = user.authenticationMethods ?? []
    const ways: Way[] = methods.map((m) => (m instanceof ExternalAuthenticationMethod ? { native: false, strategy: m.strategy } : { native: true, strategy: null }))
    const gone = toDrop(why, ways).map((i) => methods[i])
    if (!gone.length) return
    await this.connection.getRepository(ctx, AuthenticationMethod).remove(gone)
    user.authenticationMethods = methods.filter((m) => !gone.includes(m))
    await this.sessions.deleteSessionsByUser(ctx, user)
  }
}
