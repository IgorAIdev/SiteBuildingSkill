'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* Страница корзины держит себя свежей сама (И696). Запись в корзину больше не
   пересобирает текущую страницу на сервере: её ответ нёс заново собранную
   страницу, где бы покупатель ни стоял, и «+» в шторке на главной ждал
   секунду, пока сервер собирал главную со всеми полками (слово заказчика
   03.10.2026: «смена количества в корзине происходит очень долго, секунды»).
   Шторка и кнопка «в корзину» перечитывают своё сами; страница корзины —
   этим стражем: любая удачная запись шлёт `cart:changed` — страница
   перерисовывается;
   открыта заново или возвращена «Назад» из памяти роутера — сверяет свою
   отметку (`stamp`, `cartStamp`) с корзиной и перерисовывается, если
   разошлась. */
export function CartFresh({ lang, stamp }: { lang: string; stamp: string }) {
  const router = useRouter()
  useEffect(() => {
    const redraw = () => router.refresh()
    const stop = new AbortController()
    fetch(`/api/cart?lang=${lang}`, { signal: stop.signal, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { stamp?: string | null } | null) => { if (j?.stamp && j.stamp !== stamp) redraw() })
      .catch(() => {})
    window.addEventListener('cart:changed', redraw)
    return () => { stop.abort(); window.removeEventListener('cart:changed', redraw) }
  }, [lang, stamp, router])
  return null
}
