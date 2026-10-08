'use client'
import { useEffect, useId, useState } from 'react'
import b from '@/styles/btn.module.css'
import pn from '@/styles/pane.module.css'
import s from './HelpDock.module.css'
import type { ReachRow } from '@/lib/contacts.ts'
import { ReachList } from './ReachList.tsx'
import { Icon } from './Icon.tsx'

type Words = { open: string; online: string; top: string }

/* Окно помощи у края экрана (слово заказчика 29.09.2026: «делай плавающее
   окно как в cbdin»; И547). Стопка в правом нижнем углу: «наверх» — над
   кнопкой, кнопка — пути связи окном над ней. Окно — `popover` (правило 8,
   немодальное): Escape, щелчок мимо и возврат фокуса — от браузера;
   открытое окно кнопка показывает крестиком — вторым знаком (`data-open="sign"`,
   модуль кнопки), краски не меняя. Устройство окна — общий модуль
   (styles/pane.module.css, `data-pane="dock"`); шапки у окна нет — в нём
   тот же список путей, что под трубкой в шапке (ReachList.tsx), первой
   строкой — «Онлайн-поддержка · имя»: пункт меню, а не заголовок окна.

   Стопка висит всегда — поэтому у неё номер слоя (`--layer-helper`), а у
   окна нет. Над строкой покупки у низа окна (StickyBuy.tsx) стопка
   поднимается на её рост (`--bottom-bar`): кнопка не ложится на «в
   корзину».

   «Наверх» появляется, когда прокручен целый экран, — раньше до верха
   рукой подать. Помнит компонент одно: прокручен ли экран.

   `bare` — только кнопки, как они стоят на сайте: «наверх» показана, окна и
   его списка нет, нажатия ничего не делают. Так их показывает дизайн-система
   (слово заказчика 02.10.2026: «нужны только кнопки»). */
function up() {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  /* Кнопка уходит вместе с прокруткой — фокус встаёт на начало
     страницы, а не теряется. */
  document.querySelector<HTMLElement>('header a')?.focus({ preventScroll: true })
}

export function HelpDock({ rows, who, words, bare }: { rows: ReachRow[]; who: { name: string; href: string | null }; words: Words; bare?: boolean }) {
  const [far, setFar] = useState(false)
  /* id окна — свой у каждого экземпляра (окно на сайте и образец в
     дизайн-системе на одной странице). */
  const id = `help-${useId().replace(/:/g, '')}`
  useEffect(() => {
    const on = () => {
      setFar(window.scrollY > window.innerHeight)
      /* Прокрутили страницу — открытое у неё окно закрывается (слово
         заказчика 29.09.2026: «закрытие не только по клику, а и по
         скроллингу сайта, в cbdin так тоже сделано»). Метка
         `data-scroll-shut` — у окна помощи и меню трубки в шапке. */
      for (const el of document.querySelectorAll<HTMLElement>('[data-scroll-shut]:popover-open')) el.hidePopover()
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <div className={s.dock} data-print="skip">
      <button className={`${b.btn} ${s.top}`} type="button" data-pager="" data-float="" data-shown={far || bare ? '' : undefined} inert={!far && !bare} aria-label={words.top} onClick={bare ? undefined : up}><Icon id="arrow-up" /></button>
      <button className={`${b.btn} ${s.knob}`} type="button" data-open="sign" data-pager="" data-float="deck" popoverTarget={bare ? undefined : id} aria-label={words.open}><Icon id="message-circle" /><Icon id="x" /></button>
      {bare ? null : <div id={id} popover="auto" className={pn.pane} data-pane="dock" data-scroll-shut aria-label={words.online}>
        <div className={pn.body}>
          <ReachList rows={rows} lead={{ role: words.online, name: who.name, href: who.href }} />
        </div>
      </div>}
    </div>
  )
}
