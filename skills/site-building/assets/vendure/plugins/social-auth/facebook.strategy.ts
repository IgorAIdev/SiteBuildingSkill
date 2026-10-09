import { AuthenticationStrategy, Injector, RequestContext, User } from '@vendure/core'
import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'
import { appSecretProof, grantOf, personOf, refusalOfError, type Grant, type Person, type Refusal } from './rules'
import { SocialAccounts } from './social-accounts'

type FacebookInput = { code?: string; codeVerifier?: string; redirectUri?: string }
type Me = { id?: string; email?: string; first_name?: string; last_name?: string }

/* Вход через Facebook (И787). Код с PKCE меняется на токен пользователя
   секретом приложения и верификатором своего хода (POST, секрет не в адресе;
   Meta: `code_verifier` вместе с `client_secret` или вместо него; так же
   ходит Auth.js — PKCE у него по умолчанию). Токен из такого обмена выдан
   только нашему приложению — готовых токенов ввод не принимает. Профиль — /me
   с токеном в заголовке и appsecret_proof. Адрес Facebook не доказан никогда:
   к существующему кабинету по адресу вход не привязывается, а кабинет,
   заведённый им, отдаёт связь, когда адрес докажет владелец
   (social-accounts.ts). Токены и профиль в журнал не пишутся. */
export class FacebookAuthenticationStrategy implements AuthenticationStrategy<FacebookInput> {
  readonly name = 'facebook'
  private accounts = new SocialAccounts()
  private options: { appId: string; appSecret: string; graphVersion: string; redirectUris: string[] }

  constructor(options: { appId: string; appSecret: string; graphVersion: string; redirectUris: string[] }) {
    this.options = options
  }
  init(injector: Injector) { this.accounts.init(injector) }

  defineInputType(): DocumentNode {
    return gql`
      input FacebookAuthInput { code: String!  codeVerifier: String!  redirectUri: String! }
    `
  }

  async authenticate(ctx: RequestContext, input: FacebookInput): Promise<User | string> {
    const grant = grantOf(input, this.options.redirectUris)
    if (!grant.ok) return grant.reason
    const person = await this.person(grant.value)
    if (typeof person === 'string') return person
    return this.accounts.enter(ctx, this.name, person)
  }

  private async person(grant: Grant): Promise<Person | Refusal> {
    const { appId, appSecret, graphVersion } = this.options
    const base = `https://graph.facebook.com/${graphVersion}`
    try {
      const { access_token: token } = await this.json<{ access_token?: string }>(`${base}/oauth/access_token`, {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: grant.redirectUri, code: grant.code, code_verifier: grant.codeVerifier }),
      })
      if (!token) return 'PROVIDER_REJECTED'
      const me = await this.json<Me>(`${base}/me?${new URLSearchParams({ fields: 'id,email,first_name,last_name', appsecret_proof: appSecretProof(token, appSecret) })}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      const r = personOf({ provider: 'facebook', subject: me.id ?? '', email: me.email ?? null, emailVerified: false,
        hostedDomain: null, firstName: me.first_name ?? '', lastName: me.last_name ?? '' })
      return r.ok ? r.value : r.reason
    } catch (e) {
      return refusalOfError(e)
    }
  }

  /** Один вызов Graph API: тайм-аут 8 с, не-2xx — исключение со статусом. Ни
   *  секрет, ни токен в адрес не попадают — журнал прокси их не увидит. */
  private async json<T>(url: string, init: RequestInit): Promise<T> {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw Object.assign(new Error('graph'), { status: r.status })
    return (await r.json()) as T
  }
}
