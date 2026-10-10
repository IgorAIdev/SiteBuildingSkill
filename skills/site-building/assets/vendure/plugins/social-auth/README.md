# Плагин Vendure: вход через Google и Facebook

Витрина набора рисует под формой входа и создания кабинета кнопки «Continue with
Google» и «Continue with Facebook» — но только для поставщиков, которых называет
этот плагин (`socialSignInProviders`). Нет плагина или ключей — нет кнопок, а не
пустышки. Правило набора — И787 (поправка к И780).

Как идёт вход:

1. Покупатель жмёт кнопку. Витрина кладёт `state` и верификатор PKCE (у обоих
   поставщиков) в httpOnly cookie на 10 минут (на https — `__Host-shop_oauth`)
   и уводит в окно Google или Facebook с `code_challenge` (S256).
2. Поставщик возвращает его на адрес витрины `/api/auth/<google|facebook>/callback`
   с одноразовым кодом.
3. Витрина шлёт код сюда: `authenticate(input: { google: { code, codeVerifier,
   redirectUri } }, rememberMe: true)` — с токеном гостя, чтобы корзина переехала.
   Ввод — только код с верификатором: готовых токенов поставщика (ID-токен,
   токен Facebook) мутация не принимает — чужой токен того же приложения входил
   бы весь свой срок; украденный код без верификатора своего хода не войдёт.
4. Плагин меняет код на токен секретом приложения и верификатором (секреты живут
   только здесь; у Facebook — POST, секрет не в адресе), проверяет его и входит в
   кабинет — по таблице «Кабинет по адресу» ниже. Ответ — новый
   `vendure-auth-token`, как у `login`.

Что проверено и чем:
- правила (`rules.ts`) — `selftest/vendure-social-auth.test.mjs` в `npm test` набора;
- вызов из витрины — `templates/storefront/tests/account.test.ts` и `tests/social.test.ts`;
- 08.10.2026, разово, вне набора (у набора своей копии Vendure нет): все файлы
  плагина собраны `tsc --strict` против `@vendure/core` 3.7.4 и
  `google-auth-library` 10; `social-accounts.ts` прогнан на настоящих сущностях
  Vendure с подставными службами (захват через Facebook → письмо владельца
  снимает связь и сессии; Google перехватывает неподтверждённый кабинет;
  подтверждённый пароль остаётся); стратегия Facebook — с подставным `fetch`
  (POST, верификатор, секрет и токен не в адресе, коды отказа);
- не проверено: вход против настоящих Google и Meta — при запуске магазина,
  первым входом каждым поставщиком. PKCE у Facebook вместе с `client_secret` —
  так же ходит Auth.js (PKCE у него по умолчанию у всех поставщиков); Meta пишет:
  `code_verifier` необязателен, обязателен без `client_secret`.

## Что нужно от владельца сервера

1. **Vendure не ниже 3.7.3** (лучше 3.7.4): `npm ls @vendure/core`. До 3.7.3
   внешний вход открывал захват чужого кабинета (GHSA-wr5h-x3x6-4h23,
   GHSA-6j36-r6pr-59x4) — на старом движке плагин не даст серверу стартовать.
   `authOptions.requireVerification` — `true` (умолчание Vendure): без
   подтверждения письмом Google к кабинету с паролем не привязывается (см.
   «Кабинет по адресу»). Гостевой заказ на адрес кабинета —
   `allowGuestCheckoutForRegisteredCustomers: false` (умолчание): иначе заказы
   гостя ложились бы в кабинет, заведённый чужим Facebook с его адресом.
2. **Google Cloud Console** (аккаунт магазина):
   - проект → «Google Auth Platform» / экран согласия OAuth: тип External, имя
     магазина, почта поддержки, адрес главной, адрес политики
     конфиденциальности на домене магазина; опубликовать (Production);
   - для имени и логотипа магазина на экране согласия — проверка бренда: домен
     подтверждён в Search Console, главная и политика на том же домене;
   - «Clients» / «Credentials» → OAuth client ID, тип «Web application»;
     «Authorized redirect URIs»: `https://<домен>/api/auth/google/callback`;
   - области — `openid`, `email`, `profile` (чувствительных нет, проверки
     приложения Google они не требуют);
   - Client ID и Client secret — в переменные ниже.
3. **Meta for Developers**:
   - приложение (тип «Consumer» / вариант «Authenticate and request data from
     users with Facebook Login»), продукт Facebook Login for Web;
   - Facebook Login → Settings → «Valid OAuth Redirect URIs»:
     `https://<домен>/api/auth/facebook/callback`; «Use Strict Mode» — включён;
   - App settings → Basic: адрес политики конфиденциальности и адрес
     инструкции по удалению данных (или обратный вызов удаления — одно из
     двух обязательно), категория, значок;
   - права `public_profile` и `email`; для всех людей — режим Live и, где Meta
     просит, проверка приложения (App Review) и проверка бизнеса. Для магазина
     CBD Meta может спросить о товарах — сверить при запуске;
   - можно включить «Require App Secret» — плагин и так шлёт `appsecret_proof`;
   - App ID и App secret — в переменные ниже.
4. **Политика конфиденциальности магазина** — строка о входе через Google и
   Facebook: что получаем (имя, адрес почты, id у поставщика) и зачем. Текст —
   заказчика.

Названия пунктов в консолях Google и Meta меняются — сверять с экраном.

## Установка в сервер (Vendure 3.7.3+)

1. Скопировать папку в сервер: `src/plugins/social-auth/`.
2. Зависимость: `npm i google-auth-library@^10` (Node 20+; на Node 22+ можно
   `^11`). Facebook — без библиотек (`fetch` Node). `graphql`, `graphql-tag` —
   уже у `@vendure/core`.
3. `vendure-config.ts`:

   ```ts
   import { SocialAuthPlugin } from './plugins/social-auth'

   export const config: VendureConfig = {
     authOptions: {
       tokenMethod: ['bearer', 'cookie'],   // витрина читает vendure-auth-token
       // shopAuthenticationStrategy заново НЕ задавать: плагин дописывает свои
       // стратегии к NativeAuthenticationStrategy (вход паролем остаётся)
     },
     plugins: [
       SocialAuthPlugin.init(process.env),
       // …остальные…
     ],
   }
   ```

   Если в конфиге уже стоит свой `shopAuthenticationStrategy`, в нём должен
   остаться `new NativeAuthenticationStrategy()` — иначе пропадёт вход паролем.
4. Миграции нет: способ входа — сущность ядра `ExternalAuthenticationMethod`.
5. Переменные окружения сервера (Coolify), перезапуск.
6. Предел частоты на прокси (Traefik, middleware `rateLimit`, например 10 в
   минуту с адреса) — для `/api/auth/` витрины и для Shop API: каждый вход —
   один-два вызова Google или Meta и работа базы, а `authenticate` открыт.
7. Проверить в Shop API:

   ```graphql
   { socialSignInProviders { name clientId } }
   ```

   Ответ — список включённых поставщиков; на витрине появляются их кнопки.

## Переменные окружения

| имя | пример | что |
|---|---|---|
| `GOOGLE_CLIENT_ID` | `1234-abc.apps.googleusercontent.com` | Google: id клиента (открытый) |
| `GOOGLE_CLIENT_SECRET` | секрет клиента | Google: только здесь, не в витрине и не в репозитории |
| `FACEBOOK_APP_ID` | `123456789012345` | Facebook: id приложения (открытый) |
| `FACEBOOK_APP_SECRET` | секрет приложения | Facebook: только здесь |
| `FACEBOOK_GRAPH_VERSION` | `v26.0` | версия Graph API; пусто или криво — `v26.0` |
| `SOCIAL_AUTH_REDIRECT_URIS` | `https://shop.example/api/auth/google/callback,https://shop.example/api/auth/facebook/callback` | адреса возврата витрины через запятую — те же, что в консолях; https (http — только localhost) |

Нет пары id + секрет — поставщик выключен. Нет ни одного адреса возврата —
выключены оба: код без адреса из списка не войдёт.

## Как устроено

| файл | что делает |
|---|---|
| `rules.ts` | чистые правила без `@vendure/*`: ввод (`grantOf`), человек поставщика (`personOf`), кабинет по адресу (`decide`), что снять, когда адрес доказан (`toDrop`, `UNPROVEN`), `appSecretProof`, ошибки поставщика (`refusalOfError`), настройки (`optionsOf`, `publicProviders`) |
| `google.strategy.ts` | код + верификатор → `id_token` (секрет клиента) → `verifyIdToken` → кабинет |
| `facebook.strategy.ts` | код + верификатор → токен (POST, секрет клиента) → `/me` (токен заголовком, `appsecret_proof`) → кабинет |
| `social-accounts.ts` | вход в кабинет по решению `decide`: связь, кабинет по адресу, привязка, перехват, создание через ядро; `verified` — снятие недоказанных связей после письма владельца |
| `social-auth.api.ts` | Shop API `socialSignInProviders` |
| `social-auth.plugin.ts` | `SocialAuthPlugin.init(env)`; стратегии — в `authOptions.shopAuthenticationStrategy`; блокирующий обработчик `AccountVerifiedEvent` |

### Кабинет по адресу

Доказанный адрес — Google с `email_verified` и адресом `@gmail.com` или Workspace
(`hd`); Facebook подтверждения не сообщает — никогда.

| найдено | доказанный адрес (Google) | недоказанный (Facebook) |
|---|---|---|
| кабинета с адресом нет | новый, `verified` | новый, не `verified` — ничей, пока адрес не докажут |
| кабинет подтверждён письмом магазина (`verified`, `requireVerification`) | привязка; пароль владельца остаётся, недоказанные связи и сессии уходят | `EMAIL_IN_USE` |
| кабинет не подтверждён никем (`verified = false`) | перехват: неподтверждённый пароль, другие связи и все сессии уходят, кабинет — `verified` и связан с Google | `EMAIL_IN_USE` |
| `requireVerification: false` | `EMAIL_IN_USE`: кто ставил пароль — неизвестно, снять его — запереть владельца | `EMAIL_IN_USE` |

Владелец подтвердил адрес письмом магазина (`verifyCustomerAccount`) — связи
Facebook с кабинета и его сессии снимаются в той же транзакции: кабинет,
заведённый чужим Facebook с чужим адресом, иначе остался бы открытым чужому
(обратный порядок к GHSA-wr5h-x3x6-4h23). Так же устроен Firebase Auth («one
account per email»: доказанный вход снимает недоказанные).

Коды отказа (`InvalidCredentialsError.authenticationError`), витрина говорит их
словами: `INPUT_INVALID`, `REDIRECT_NOT_ALLOWED`, `PROVIDER_REJECTED` — «вход не
завершился»; `PROVIDER_UNAVAILABLE` — «сервис не отвечает»; `EMAIL_MISSING` —
поставщик не дал адрес; `EMAIL_UNVERIFIED` — адрес в Google не подтверждён;
`EMAIL_IN_USE` — кабинет с этим адресом уже есть (что кабинет есть, узнаёт только
тот, кто вошёл к поставщику с этим адресом; исключение записано в договоре
витрины, `account-contract.ts`).

Вторая очередь (не сделано): привязать Facebook изнутри кабинета, вошедшего
паролем; обратный вызов удаления данных Meta; кабинет для покупателя, который
раньше покупал гостем (ядро заводит второй Customer с тем же адресом).

Лицензия: Vendure — GPLv3 или коммерческая; плагин, собранный в сервер, связан
ею (`../../INTEGRATION.md`). `google-auth-library` — Apache-2.0.
