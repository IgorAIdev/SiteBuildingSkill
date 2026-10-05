'use client'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import b from '@/styles/btn.module.css'
import p from '@/styles/primitives.module.css'
import pn from '@/styles/pane.module.css'
import type { ReviewView } from '@/lib/review-view.ts'
import { shot } from '@/lib/shot.ts'
import { Icon } from './Icon.tsx'
import { PaneHead } from './PaneHead.tsx'
import s from './ReviewCard.module.css'

type Video = NonNullable<ReviewView['video']>

/** Тип ролика по расширению адреса: так браузер решает, брать ли источник, не скачивая. */
const CLIP_TYPES: Record<string, string> = { webm: 'video/webm', mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', ogv: 'video/ogg' }
const clipType = (src: string) => CLIP_TYPES[src.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''] ?? undefined

/* Видеоотзыв: постер — одна кнопка, она открывает окно с роликом (И728).

   Постер целиком — орган (рука на снимке — наплыв, как у карточки товара); круг
   «пуск» на нём — знак кнопки сайта (`b.btn data-pager`, И721: круглая форма),
   а не вторая кнопка: одно действие — одна цель. Так у myeq.com (замер
   04.10.2026: постер 237 × 369 и круг Play 40 по середине).

   Окно — `<dialog>` с `showModal()` (правило 8) и тройкой окна
   (styles/pane.module.css, И460): шапка стоит, тело прокручивается. Escape,
   возврат фокуса и затемнение — от браузера; нажатие мимо окна закрывает его,
   как у быстрого заказа. Ролик `preload="none"`: ни байта до нажатия. Играет
   только по нажатию (WCAG 2.2.2: само ничего не играет) и встаёт на паузу,
   когда окно закрыли. Без субтитров ролик начинает без звука (`muted`), звук —
   в его кнопках: ролик образца немой, а речь настоящего без субтитров иначе
   звучала бы тому, кто её не слышит (WCAG 1.2.2; субтитры — `captions`). */
export function ReviewPlay({ video, children }: { video: Video; children: ReactNode }) {
  const id = `clip-${useId().replace(/:/g, '')}`
  const box = useRef<HTMLDialogElement>(null)
  const clip = useRef<HTMLVideoElement>(null)
  /* Ролик встаёт в окно только по нажатию «пуск»: до того на странице одна обложка.
     Стоявший заранее `<video preload="none">` WebKit всё равно начинал грузить и
     держал загрузку страницы — главная не доходила до `load` за 60 с
     (check:engines, 05.10.2026); и трём роликам на главной до нажатия не место. */
  const [on, setOn] = useState(false)

  useEffect(() => {
    const d = box.current
    if (!d) return
    const miss = (e: MouseEvent) => { if (e.target === d) d.close() }
    const stop = () => clip.current?.pause()
    d.addEventListener('click', miss)
    d.addEventListener('close', stop)
    return () => { d.removeEventListener('click', miss); d.removeEventListener('close', stop) }
  }, [])

  /* Пуск — то, что обещает кнопка («Play…»); браузер может отказать, тогда ролик
     ждёт своей кнопки. Ролика до первого нажатия нет — пуск после того, как встал. */
  useEffect(() => { if (on) clip.current?.play().catch(() => undefined) }, [on])

  function open() {
    box.current?.showModal()
    if (on) clip.current?.play().catch(() => undefined)
    else setOn(true)
  }

  return (
    <>
      <button type="button" className={`${p.frame} ${s.media}`} aria-haspopup="dialog" aria-label={video.play} onClick={open}>
        <img {...shot(video.poster, 'shelf', true)} alt="" decoding="async" />
        <span className={`${b.btn} ${s.play}`} data-pager="" aria-hidden="true"><Icon id="play" /></span>
      </button>
      <dialog ref={box} className={pn.pane} data-pane="dialog" aria-labelledby={`${id}-title`}>
        <PaneHead title={video.heading} titleId={`${id}-title`} close={video.close} onClose={() => box.current?.close()} />
        <div className={pn.body}>
          <div className={s.watch}>
            <div className={`${p.frame} ${s.player}`}>
              {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- дорожка стоит, когда у ролика есть субтитры; без них ролик немой (muted), см. выше */}
              {on ? <video ref={clip} poster={video.poster.src} controls preload="none" playsInline muted={!video.captions}>
                {/* Ролик — источником с типом, а не адресом на самом ролике: браузер, который
                    тип не играет (WebKit без WebM, Safari до 17.4), пропускает источник сразу.
                    Адресом он брался разбирать файл и держал загрузку страницы — главная в
                    WebKit не доходила до `load` за 60 с (check:engines, 05.10.2026). */}
                <source src={video.src} type={clipType(video.src)} />
                {video.captions ? <track kind="captions" src={video.captions} srcLang={video.lang} default /> : null}
              </video> : null}
            </div>
            {children}
          </div>
        </div>
      </dialog>
    </>
  )
}
