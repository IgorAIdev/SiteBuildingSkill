'use client'
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import sl from '@/styles/slides.module.css'
import go from '@/styles/go.module.css'
import { Icon } from './Icon.tsx'

/* Самолистание ленты: слайд стоит `ms`, `on` — идёт ли (пауза рукой —
   кнопкой рядом с точками), `held` — держится, пока над сценой рука или
   фокус и пока вкладка скрыта; дошло — `onEnd`. */
export type Clock = { ms: number; on: boolean; held: boolean; onEnd: () => void; onToggle: () => void; stop: string; play: string }

type Box = { x: number; w: number }

/* Указатель ленты — одна строка точек на сайт (styles/slides.module.css,
   И493, И584). Точка — ссылка на свой слайд; `className` — место, которое
   ставит узел (галерея — под кадром или на нём, герой — у низа сцены).
   Ползунок один на строку и перетекает: при смене слайда сначала тянется
   край со стороны новой точки, потом подтягивается другой. С `clock` он
   стоит точкой и растёт по дорожке за время слайда. */
export function Dots({ slides, current, pick, className = '', clock }: {
  slides: readonly { id: string; show: string }[]; current: number; pick: (e: MouseEvent<HTMLAnchorElement>, i: number) => void; className?: string
  clock?: Clock
}) {
  const lit = useRef<HTMLLIElement>(null)
  const was = useRef<{ at: number; runs: boolean } | null>(null)
  const flow = useRef<Animation | null>(null)
  const tick = useRef<Animation | null>(null)
  const runs = Boolean(clock?.on)
  /* Часы читаются из свежих пропсов: перезапускать движение из-за новой
     функции `onEnd` на каждом рендере узла нельзя. */
  const now = useRef(clock)
  useLayoutEffect(() => { now.current = clock })

  /* До отрисовки: иначе один кадр ползунок стоял на новом месте во всю
     дорожку, прежде чем поехать. */
  useLayoutEffect(() => {
    const el = lit.current
    if (!el) return
    const cs = getComputedStyle(el)
    const pin = (i: number) => el.parentElement!.children[i] as HTMLElement
    const dot = el.offsetHeight
    const pill = pin(current).offsetWidth - dot
    /* Откуда: пока ползунок в движении — с того места, где он сейчас; иначе
       — с прежней точки, замеренной сейчас (пока точки были скрыты, замер
       дал бы нули). */
    const prev = was.current
    const from: Box | null = !prev || !dot ? null
      : flow.current || tick.current ? { x: flow.current ? el.offsetLeft : pin(prev.at).offsetLeft, w: el.offsetWidth }
      : { x: pin(prev.at).offsetLeft, w: prev.runs ? dot : pill }
    was.current = { at: current, runs }
    flow.current?.cancel()
    tick.current?.cancel()
    flow.current = tick.current = null
    /* Куда — место, которое уже поставил CSS по `--at` и `data-clock`. */
    const to: Box = { x: el.offsetLeft, w: el.offsetWidth }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const px = (b: Box) => ({ insetInlineStart: `${b.x}px`, inlineSize: `${b.w}px` })

    function start() {
      flow.current = null
      const c = now.current
      if (!el || !c?.on) return
      const a = el.animate([{ inlineSize: `${to.w}px` }, { inlineSize: `${pill}px` }], { duration: c.ms, easing: 'linear', fill: 'forwards' })
      if (c.held) a.pause()
      a.onfinish = () => now.current?.onEnd()
      tick.current = a
    }

    if (from && !still && (from.x !== to.x || from.w !== to.w)) {
      const t = cs.getPropertyValue('--open-t').trim()
      const half = (parseFloat(t) || 0) * (t.endsWith('ms') ? 1 : 1000)
      /* Равномерно, без разгона и торможения у точки (слово заказчика 02.10.2026:
         «резкое ускорение к точке — не нужно»). */
      const ease = 'linear'
      /* Середина пути: ведущий край уже у новой точки, ведомый ещё на старой. */
      const mid: Box | null = to.x > from.x ? { x: from.x, w: to.x + to.w - from.x }
        : to.x < from.x ? { x: to.x, w: from.x + from.w - to.x }
        : null
      const frames: Keyframe[] = mid
        ? [{ ...px(from), easing: ease }, { ...px(mid), easing: ease }, px(to)]
        : [{ ...px(from), easing: ease }, px(to)]
      flow.current = el.animate(frames, { duration: mid ? half * 2 : half })
      flow.current.onfinish = start
    } else start()
  }, [current, runs])

  useEffect(() => {
    if (clock?.held) tick.current?.pause()
    else if (tick.current?.playState === 'paused') tick.current.play()
  }, [clock?.held])

  useEffect(() => () => { flow.current?.cancel(); tick.current?.cancel() }, [])

  return (
    <div className={`${sl.mark} ${className}`}>
      <ol className={sl.dots} data-clock={runs ? '' : undefined} style={{ '--at': current } as CSSProperties}>
        {slides.map((x, i) => (
          <li key={x.id}>
            <a className={sl.dot} href={`#${x.id}`} aria-label={x.show} aria-current={i === current ? 'true' : undefined} onClick={(e) => pick(e, i)} />
          </li>
        ))}
        <li ref={lit} className={sl.lit} aria-hidden="true" />
      </ol>
      {clock ? (
        <button type="button" className={`${go.go} ${sl.play}`} data-still="" aria-label={clock.on ? clock.stop : clock.play} onClick={clock.onToggle}>
          <Icon id={clock.on ? 'pause' : 'play'} />
        </button>
      ) : null}
    </div>
  )
}
