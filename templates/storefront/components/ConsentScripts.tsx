'use client'
import { useEffect } from 'react'
import { CONSENT_EVENT, SERVICES, allowed, parseConsent } from '@/lib/consent.ts'

/* Чужие скрипты — только после согласия своей категории (И791; Legea 506/2004
   ст. 4 (5), EDPB 2/2023): на старте и после каждого выбора ставит `<script async>`
   служб разрешённых категорий (`SERVICES`, lib/consent.ts) и их начальную строку;
   до согласия чужого скрипта на странице нет ни одного. Адрес службы живёт
   только в `SERVICES` — проверка (tests/consent.test.ts) не пускает внешний
   `<script src>` в разметку сайта мимо него. Разметки нет. */
export function ConsentScripts() {
  useEffect(() => {
    const put = () => {
      for (const s of allowed(parseConsent(document.cookie), SERVICES)) {
        if (document.querySelector(`script[data-service="${s.key}"]`)) continue
        const tag = document.createElement('script')
        tag.src = s.src
        tag.async = true
        tag.dataset.service = s.key
        document.head.append(tag)
        if (s.init) {
          const init = document.createElement('script')
          init.dataset.service = `${s.key}-init`
          init.textContent = s.init
          document.head.append(init)
        }
      }
    }
    put()
    window.addEventListener(CONSENT_EVENT, put)
    return () => window.removeEventListener(CONSENT_EVENT, put)
  }, [])
  return null
}
