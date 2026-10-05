'use client'
import { useEffect, useState, type MouseEvent } from 'react'
import { Dots } from '@/components/Dots.tsx'

/* Иконка слайдера — указатель сайта (components/Dots): точки и ползунок,
   который перетекает от точки к точке, и самолистание: ползунок растёт по
   дорожке за время слайда, дошёл — перетёк в следующую точку; кнопка рядом
   останавливает и запускает. Слово заказчика 02.10.2026: «слайдер сделай
   рабочим, он же работал ранее, и стоп/плей — кнопкой». Слайдов тут нет:
   страница показывает сам указатель; точку можно нажать. */
const SLIDES = [{ id: 'icon-1', show: 'Слайд 1' }, { id: 'icon-2', show: 'Слайд 2' }, { id: 'icon-3', show: 'Слайд 3' }] as const
const STAY_MS = 3000

export function SliderIcon() {
  const [at, setAt] = useState(0)
  const [on, setOn] = useState(true)
  const [hidden, setHidden] = useState(false)
  /* Вкладка скрыта — слайд держится (иначе ползунок бежал бы, пока на него
     никто не смотрит). */
  useEffect(() => {
    const read = () => setHidden(document.hidden)
    read()
    document.addEventListener('visibilitychange', read)
    return () => document.removeEventListener('visibilitychange', read)
  }, [])
  const pick = (e: MouseEvent<HTMLAnchorElement>, i: number) => { e.preventDefault(); setAt(i) }
  const clock = { ms: STAY_MS, on, held: hidden, onEnd: () => setAt((i) => (i + 1) % SLIDES.length), onToggle: () => setOn((v) => !v), stop: 'Остановить', play: 'Запустить' }
  return <Dots slides={SLIDES} current={at} pick={pick} clock={clock} />
}
