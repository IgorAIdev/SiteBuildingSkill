import type { ReactNode } from 'react'
import b from '@/styles/btn.module.css'
import pn from '@/styles/pane.module.css'
import p from '@/styles/primitives.module.css'
import { Icon } from './Icon.tsx'

/* Шапка окна — одна на все окна сайта (И671, поправка 04.10.2026): шторки
   меню, фильтров и корзины, окна посреди экрана, окно поиска сверху и их
   образцы в дизайн-системе. Тёмная палуба (`data-ground='deck'`, base.css),
   заголовок, крестик — здесь, а не у окна. До этого шапку писало каждое окно
   само, и тёмной её сделала себе только корзина (03.10.2026): заказчик открыл
   фильтр рядом с корзиной — «у окна корзины вверху закрашена шапка, а в твоём
   меню не закрашена… потому что ты не из дизайн-системы её берёшь». Части
   шапки (`bar`, `title`, `close` из styles/pane.module.css) пишет только этот
   файл — семья `ownedPart` в `check:system`.

   Окно говорит, что в шапке, а не как она выглядит:
     title   заголовок окна (`tag` — `span`, когда окно на странице не
             раздел, как протокол партии);
     aside   тихое рядом с заголовком (число штук корзины);
     end     слово у крестика («All products» фильтра полки);
     children вместо заголовка (поле окна поиска);
     wide    содержимое в мере страницы — окно сверху во всю ширину;
     target / onClose  что закрывает крестик: `popover` по id или `<dialog>`. */
export function PaneHead({ title, titleId, tag: Tag = 'h2', aside, end, children, close, target, onClose, wide, className }: {
  title?: ReactNode
  titleId?: string
  tag?: 'h2' | 'span'
  aside?: ReactNode
  end?: ReactNode
  children?: ReactNode
  close: string
  target?: string
  onClose?: () => void
  wide?: boolean
  className?: string
}) {
  const head = title === undefined ? null : <Tag id={titleId} className={pn.title}>{title}</Tag>
  const inner = (
    <>
      {aside ? <div className={pn.lead}>{head}<span className={pn.aside}>{aside}</span></div> : head}
      {children}
      {end}
      <button className={`${b.btn} ${pn.close}`} data-voice="bare" data-pager="" type="button" popoverTarget={target} popoverTargetAction={target ? 'hide' : undefined} onClick={onClose} aria-label={close}><Icon id="x" /></button>
    </>
  )
  return (
    <div className={className ? `${pn.bar} ${className}` : pn.bar} data-ground="deck">
      {/* Мера страницы — не прямо на полу: `wrap` прямо на `data-ground` примитив
          делает листом с его полем и воздухом (primitives.module.css), а шапка
          окна — полоса, не лист. */}
      {wide ? <div className={pn.wide}><div className={`${p.wrap} ${pn.row}`}>{inner}</div></div> : inner}
    </div>
  )
}
