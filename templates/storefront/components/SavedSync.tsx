'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSaved } from '@/lib/saved.ts'
import { useReady } from '@/lib/store.ts'
import { hrefFor } from '@/lib/href.ts'
import type { Lang } from '@/lib/locale.ts'

/* Адрес страницы избранного — вслед складу: открыли её без списка в адресе
   или сняли сердце на ней — адрес меняется на нынешний список, и сервер
   рисует полку заново. Не рисует ничего. */
export function SavedSync({ lang, shown }: { lang: Lang; shown: string }) {
  const saved = useSaved()
  const ready = useReady()
  const router = useRouter()
  useEffect(() => {
    if (ready && saved.join(',') !== shown) router.replace(hrefFor(lang, { saved }), { scroll: false })
  }, [ready, saved, shown, lang, router])
  return null
}
