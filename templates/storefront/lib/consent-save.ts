import { recordConsent } from './actions/consent.ts'
import { CONSENT_EVENT, CONSENT_REVISION, choiceId, consentCookie, expiring, parseConsent, revokedOf, type Choice, type Optional } from './consent.ts'

/* Сохранить выбор о cookie — одним местом для полосы и окна настроек (И791;
   правило 10): cookie выбора (полгода, весь сайт), `data-consent="set"` на корне
   (полоса прячется CSS), событие выбора (службы встают, полоса говорит, что
   выбрано), запись в журнал. Отозвана категория — её cookie стираются, а
   страница перезагружается: скрипт службы, уже стоящий на странице, иначе писал
   бы дальше (orestbida, `autoClear` и `reloadPage`). Перезагрузка ждёт записи,
   не дольше `RECORD_WAIT`: уход со страницы обрывает запрос действия, и терялась
   бы как раз запись об отзыве (GDPR ст. 7 (1), (3); разбор 08.10.2026). Образцы
   дизайн-системы сюда не ходят — состояния сайта они не трогают (как избранное,
   И667). */
const RECORD_WAIT = 1500

export function saveChoice(categories: Optional[]): void {
  const before = parseConsent(document.cookie)
  const choice: Choice = { revision: CONSENT_REVISION, categories: [...categories], id: before?.id ?? choiceId(), at: Math.floor(Date.now() / 1000) }
  document.cookie = consentCookie(choice, location.protocol === 'https:')
  document.documentElement.dataset.consent = 'set'
  const revoked = revokedOf(before, choice.categories)
  for (const line of expiring(document.cookie, revoked, location.hostname)) document.cookie = line
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }))
  const recorded = recordConsent({ id: choice.id, revision: choice.revision, categories: choice.categories }).catch(() => {})
  if (revoked.length) void Promise.race([recorded, new Promise((done) => setTimeout(done, RECORD_WAIT))]).then(() => location.reload())
}
