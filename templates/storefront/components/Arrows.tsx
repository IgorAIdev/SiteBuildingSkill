import go from '@/styles/go.module.css'
import { Icon } from './Icon.tsx'

/* Стрелки листания — одни на сайт (правило 10, И502): галерея товара,
   слайдер героя и полки товаров. Слово заказчика 28.09.2026: «на слайдере
   нет кнопок, откуда клиенту знать, что это слайдер». Точки и край соседней
   карточки подсказывают, но не зовут: мышь не свайпает, и без стрелок ряд
   читался неподвижным. Кнопка — ссылочная круглая кнопка набора
   (`go`, `data-around="edge"`): кружок с обводкой на бумаге. Где стоят — на
   кадре, у низа сцены или в строке заголовка полки — решает место
   (`className`); на краю ленты стрелка гаснет (`atStart`, `atEnd`). */
export function Arrows({ back, next, onBack, onNext, atStart = false, atEnd = false, className = '' }: {
  back: string; next: string; onBack: () => void; onNext: () => void; atStart?: boolean; atEnd?: boolean; className?: string
}) {
  return (
    <>
      <button type="button" className={`${go.go} ${className}`} data-around="edge" data-to="back" aria-label={back} onClick={onBack} disabled={atStart}>
        <Icon id="chevron-left" />
      </button>
      <button type="button" className={`${go.go} ${className}`} data-around="edge" aria-label={next} onClick={onNext} disabled={atEnd}>
        <Icon id="chevron-right" />
      </button>
    </>
  )
}
