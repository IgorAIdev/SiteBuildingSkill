import { AuthenticationStrategy, Injector, RequestContext, User } from '@vendure/core'
import { OAuth2Client } from 'google-auth-library'
import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'
import { grantOf, personOf, refusalOfError, type Grant, type Person, type Refusal } from './rules'
import { SocialAccounts } from './social-accounts'

type GoogleInput = { code?: string; codeVerifier?: string; redirectUri?: string }

/* Вход через Google (И787). Код с PKCE: витрина получает `code` на свой адрес
   возврата (`/api/auth/google/callback`), сервер меняет его на id_token
   секретом клиента и верификатором своего хода. Готовый ID-токен ввод не
   принимает: токен, увиденный где угодно (One Tap, журнал), входил бы час.
   Токен проверяет google-auth-library: подпись, aud = наш client id, издатель
   accounts.google.com, срок. Любая ошибка разговора с Google — код отказа, а
   не исключение: исключение витрина видела бы сбоем. */
export class GoogleAuthenticationStrategy implements AuthenticationStrategy<GoogleInput> {
  readonly name = 'google'
  private client: OAuth2Client
  private accounts = new SocialAccounts()
  private options: { clientId: string; clientSecret: string; redirectUris: string[] }

  constructor(options: { clientId: string; clientSecret: string; redirectUris: string[] }) {
    this.options = options
    this.client = new OAuth2Client({ clientId: options.clientId, clientSecret: options.clientSecret })
  }
  init(injector: Injector) { this.accounts.init(injector) }

  defineInputType(): DocumentNode {
    return gql`
      input GoogleAuthInput { code: String!  codeVerifier: String!  redirectUri: String! }
    `
  }

  async authenticate(ctx: RequestContext, input: GoogleInput): Promise<User | string> {
    const grant = grantOf(input, this.options.redirectUris)
    if (!grant.ok) return grant.reason
    const person = await this.person(grant.value)
    if (typeof person === 'string') return person
    /* Ошибки базы — наружу: транзакция `authenticate` откатится. */
    return this.accounts.enter(ctx, this.name, person)
  }

  private async person(grant: Grant): Promise<Person | Refusal> {
    try {
      const { tokens } = await this.client.getToken({ code: grant.code, codeVerifier: grant.codeVerifier, redirect_uri: grant.redirectUri })
      if (!tokens.id_token) return 'PROVIDER_REJECTED'
      const p = (await this.client.verifyIdToken({ idToken: tokens.id_token, audience: this.options.clientId })).getPayload()
      if (!p) return 'PROVIDER_REJECTED'
      const r = personOf({ provider: 'google', subject: p.sub, email: p.email ?? null, emailVerified: p.email_verified === true,
        hostedDomain: p.hd ?? null, firstName: p.given_name ?? '', lastName: p.family_name ?? '' })
      return r.ok ? r.value : r.reason
    } catch (e) {
      return refusalOfError(e)
    }
  }
}
