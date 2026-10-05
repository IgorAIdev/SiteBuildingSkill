'use client'
import b from '@/styles/btn.module.css'
import s from './SaveToggle.module.css'
import { useIsSaved, toggleSaved } from '@/lib/saved.ts'
import { Icon } from './Icon.tsx'

/* Сердце «в избранное» — одно на сайт: карточка полки и карта товара берут
   его отсюда. Вид — тихий знак сайта (styles/glyph.module.css), тот же, что
   у сердца в шапке. Нажатое — `aria-pressed`, знак залит краской марки
   (роль заливки знака `--sign-fill`, И625); где
   стоит — решает место (`className`), и только где. Слова — из данных места. */
/* `over` — на чём стоит: на снимке (`picture`) знак берёт стекло палитры,
   чтобы читаться над любым снимком (styles/glyph.module.css, И606). Место
   называет только факт, вид решает знак. */
/* Виды (слово заказчика 02.10.2026: «несколько видов кнопки избранное»; И638):
   `sign` — знак из листа (сердце — по умолчанию; остроконечное, закладка,
   звезда). Один орган: вид — свойство, а не второй компонент. */
/* `part` — малая часть пары (styles/btn.module.css, `.pair`): «В корзину» и
   сердце встык. Тот же знак и то же `aria-pressed`, но одета кнопкой набора, а
   не тихим знаком; голос — как у соседней части (`loud` или тихая). На карте
   товара сердце — на главном кадре (Gallery.tsx), как на карточке полки;
   квадратная кнопка в строке заказа снята 04.10.2026. */
export type SaveSign = 'heart' | 'heart-line' | 'bookmark' | 'star'
export function SaveToggle({ id, add, remove, over, sign = 'heart', part, className = '' }: { id: string; add: string; remove: string; over?: 'picture'; sign?: SaveSign; part?: 'loud' | 'quiet'; className?: string }) {
  const on = useIsSaved(id)
  return (
    <button className={part ? `${b.btn} ${className}` : `${s.save} ${className}`} type="button" data-over={over} data-part={part ? '' : undefined} data-voice={part === 'loud' ? 'loud' : undefined} aria-pressed={on} aria-label={on ? remove : add} onClick={() => toggleSaved(id)} data-save>
      <Icon id={sign} />
    </button>
  )
}
