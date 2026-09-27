'use client'
import { usePathname } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import { StateScreen } from '@/components/StateScreen.tsx'
import { langOfPath } from '@/lib/locale.ts'
import { t } from '@/lib/i18n/index.ts'

/* Экран сбоя — общий экран состояния (StateScreen, И476): имя страницы,
   знак в круге, путь дальше — громкая кнопка повтора. До 27.09.2026 он
   повторял раскладку экрана своей разметкой, тихой кнопкой и без знака. */
export default function ErrorScreen({ reset }: { reset: () => void }) {
  const lang = langOfPath(usePathname())
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <StateScreen level={1} kind="unavailable" title={t(lang, 'error.title')} step={t(lang, 'error.retry')} icon="triangle-alert" loud retry={reset} />
    </main>
  )
}
