'use client'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import sl from '@/styles/slides.module.css'
import s from './blocks.module.css'
import type { ImageAttrs } from '@/lib/shot.ts'
import { Dots } from '../Dots.tsx'
import { Arrows } from '../Arrows.tsx'
import { useSlides } from '../useSlides.ts'

/** `show` — имя слайда вслух («Слайд 2 из 3»), оно же у его точки. */
export type HeroSlideView = { id: string; show: string; title: string; lede: string; cta: string; href: string; image: ImageAttrs; alt: string }

/* Слайдер героя сцены (И493). Слово заказчика 27.09.2026: «герой делай
   слайдер, тогда указатель слайдера должен быть». Лента и точки — общее
   устройство с галереей товара (useSlides, Dots); сам не листается
   (Material 3, NN/g: автоповорот уводит слайд из-под пальца и глаза), листает
   палец, колесо, точка и стрелка. Имя страницы (h1) — у первого слайда; у следующих
   заголовок тем же рисунком, но не вторым h1.

   Сцена целиком — первый экран (И492): высота слайда — `--hero-fit` (окно
   за вычетом прилипшей шапки и нижней полосы), снимок забирает остаток,
   текст и кнопка видны без прокрутки. Точки лежат у низа сцены. */
export function HeroSlides({ slides, label, prev, next }: { slides: HeroSlideView[]; label: string; prev: string; next: string }) {
  const { strip, current, show, pick, onScroll } = useSlides(slides.length)
  const many = slides.length > 1
  return (
    <section className={`${p.wrap} ${p.flush} ${s.heroBand}`}>
      <div className={s.hero} data-ground="deck" data-many={many ? '' : undefined} role="region" aria-roledescription={many ? 'carousel' : undefined} aria-label={many ? label : undefined}>
        <div ref={strip} className={sl.strip} onScroll={onScroll}>
          {slides.map((x, i) => (
            <div key={x.id} id={x.id} className={`${sl.slide} ${s.heroSlide}`} role={many ? 'group' : undefined} aria-roledescription={many ? 'slide' : undefined} aria-label={many ? x.show : undefined}>
              <div className={s.heroShot}>
                <img {...x.image} alt={x.alt} fetchPriority={i === 0 ? 'high' : undefined} />
              </div>
              <div className={s.heroText}>
                {i === 0 ? <h1 className={s.heroTitle}>{x.title}</h1> : <p className={s.heroTitle}>{x.title}</p>}
                <p>{x.lede}</p>
                <div className={p.cluster}><a className={b.btn} data-voice="loud" data-size="lg" href={x.href}>{x.cta}</a></div>
              </div>
            </div>
          ))}
        </div>
        {many ? <Dots slides={slides} current={current} pick={pick} className={s.heroDots} /> : null}
        {/* Стрелки — у низа сцены по бокам точек (И502): без них мышь не
            знала, что сцена листается. */}
        {many ? <div className={s.heroNav}><Arrows back={prev} next={next} onBack={() => show(current - 1)} onNext={() => show(current + 1)} atStart={current === 0} atEnd={current === slides.length - 1} /></div> : null}
      </div>
    </section>
  )
}
