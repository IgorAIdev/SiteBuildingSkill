'use client'
import b from '@/styles/btn.module.css'
import { CONSENT_OPEN, CONSENT_PREFS } from '@/lib/consent.ts'

/* «Setări cookie» — одна кнопка на три места (И791): словом в подвале (`word`,
   как ссылки ряда закона), тихой кнопкой на странице cookie (`quiet`) и словом в
   полосе согласия (`bare`, третье действие рядом с двумя равными; cbdmania,
   orestbida `showPreferences`). Открывает окно настроек (ConsentPrefs) событием:
   окно само читает текущий выбор перед показом, а не держит прежний. `target` —
   id окна (у образца дизайн-системы — свой). */
export function ConsentOpen({ label, voice, target = CONSENT_PREFS }: { label: string; voice: 'word' | 'quiet' | 'bare'; target?: string }) {
  const open = () => window.dispatchEvent(new CustomEvent(CONSENT_OPEN, { detail: target }))
  return (
    <button className={voice === 'word' ? b.word : b.btn} data-voice={voice === 'bare' ? 'bare' : undefined} type="button" aria-haspopup="dialog" onClick={open}>
      {label}
    </button>
  )
}
