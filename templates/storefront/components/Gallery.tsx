'use client'
import { useSyncExternalStore } from 'react'
import p from '@/styles/primitives.module.css'
import sl from '@/styles/slides.module.css'
import s from './Gallery.module.css'
import type { GalleryView } from '@/lib/product-view.ts'
import { Arrows } from './Arrows.tsx'
import { Dots } from './Dots.tsx'
import { useSlides } from './useSlides.ts'
import { shot } from '@/lib/shot.ts'

const never = () => () => {}

/* Галерея товара: главный кадр — лента слайдов с прилипанием, под ним ряд
   миниатюр (или точек — ручка `--pdp-thumbs`). Без скрипта работает
   целиком: у каждого слайда якорь, миниатюра — ссылка на него, лента
   листается пальцем и колесом. Скрипт добавляет стрелки на кадре и держит
   отметку текущей миниатюры; помнит компонент одно — номер слайда.

   Размер — не здесь: блок целиком (кадр, зазор, ряд) помещается в экран
   правилом Gallery.module.css (И278), разметка о высоте окна не знает. */
export function Gallery({ view }: { view: GalleryView }) {
  /* Лента и точки — общее устройство (useSlides, Dots; И493). */
  const { strip, current, show, pick, onScroll } = useSlides(view.slides.length)
  /* Стрелки — только со скриптом: без него они ничего не умеют. Снимок
     сервера — «скрипта нет», после гидратации — «есть». */
  const live = useSyncExternalStore(never, () => true, () => false)
  const many = view.slides.length > 1

  return (
    <div className={s.gallery} data-gallery="" data-many={many ? '' : undefined}>
      <div className={`${p.frame} ${s.stage}`}>
        {/* Ленту клавиатура берёт и без tabIndex: прокручиваемая коробка без
            фокусируемых детей сама становится целью Tab (Chrome 130+, Firefox). */}
        <div ref={strip} className={`${sl.strip} ${s.strip}`} role="region" aria-label={view.label} onScroll={onScroll}>
          {view.slides.map((slide, i) => (
            <div key={slide.id} id={slide.id} className={`${sl.slide} ${s.slide}`}>
              <img
                {...shot(slide, 'stage', i !== 0)} alt={slide.alt} decoding="async"
                fetchPriority={i === 0 ? 'high' : undefined}
              />
            </div>
          ))}
        </div>
        {view.badge ? <span className={`${p.cut} ${s.badge}`}>{view.badge}</span> : null}
        {many && live ? <Arrows back={view.prev} next={view.next} onBack={() => show(current - 1)} onNext={() => show(current + 1)} className={s.arrow} /> : null}
      </div>
      {many ? (
        <>
          <ol className={s.thumbs}>
            {view.slides.map((slide, i) => (
              <li key={slide.id}>
                <a className={`${p.frame} ${s.thumb}`} href={`#${slide.id}`} aria-label={slide.show} aria-current={i === current ? 'true' : undefined} onClick={(e) => pick(e, i)}>
                  <img {...shot(slide, 'thumb', true)} alt="" decoding="async" />
                </a>
              </li>
            ))}
          </ol>
          <Dots slides={view.slides} current={current} pick={pick} className={s.dots} />
        </>
      ) : null}
    </div>
  )
}
