import p from '@/styles/primitives.module.css'
import go from '@/styles/go.module.css'
import { Icon } from '@/components/Icon.tsx'
import { SIGN } from '@/components/marks.ts'
import { Part } from './parts.tsx'
import { GLYPH } from './ringSigns.ts'
import s from './socials.module.css'

/* Соцсети — «знак и слово» без движения (слово заказчика 30.09.2026:
   «давай знак и слово, без анимации движения»; знаки fb и youtube — в
   кольце, «залитая центральная часть, окантовка», по двум образцам заказчика:
   тонкое кольцо и залитая буква внутри). Показ до правки листа знаков: кольцо
   и вложенный знак собраны здесь из путей листа (ringSigns.ts); одобрит —
   знаки переедут в лист (tools/icons.mjs), а этот показ уйдёт.
   Кольцо — окантовка круга, знак — залитый, вдвое меньше круга и по его
   центру; штрих кольца — вес штриха сайта (`--icon-stroke`). */
const NETS = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['youtube', 'YouTube'], ['telegram', 'Telegram']] as const
type Key = (typeof NETS)[number][0]

/** Знак сети в кольце: окантовка и залитая середина. */
function Ring({ net }: { net: Key }) {
  const paths = GLYPH[net === 'telegram' ? 'send' : net]
  const cut = net === 'telegram'
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-ring="">
      {cut ? <mask id="ring-send-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" /><path d={paths[1]} stroke="#000" strokeWidth="2.4" strokeLinecap="round" fill="none" /></mask> : null}
      <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <g transform="translate(5.6 5.6) scale(.533)" fill="currentColor" stroke="none" mask={cut ? 'url(#ring-send-cut)' : undefined}>
        <path d={paths[0]} />
      </g>
    </svg>
  )
}

export function Socials() {
  return (
    <>
      <Part title="Иконки соцсетей в кольце" lede="Слева — как сейчас, справа — в кольце: окантовка и залитая середина, как в ваших образцах. Крупно и в рост иконки кнопки (22 пикселя). Показ до правки листа иконок: скажете «да» — иконки уйдут в лист.">
        <ul className={s.sets}>
          {NETS.map(([k, label]) => (
            <li key={k} className={s.set}>
              <span className={s.name}>{label}</span>
              <div className={s.deck} data-ground="deck">
                <div className={`${p.cluster} ${s.pair}`}>
                  <span className={s.big}><Icon id={SIGN[k]} /></span>
                  <span className={s.big}><Ring net={k} /></span>
                  <span className={s.small}><Icon id={SIGN[k]} /></span>
                  <span className={s.small}><Ring net={k} /></span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Part>
      <Part title="Соцсети: иконка и слово" lede="Иконка и имя сети в столбик: понятно без догадки, что за иконка. Без движения: под рукой меняется только цвет, нажатие — как у всех кнопок. Слева — иконки как сейчас, справа — в кольце.">
        <div className={`${p.grid} ${s.pairs}`}>
          {(['now', 'ring'] as const).map((mode) => (
            <div key={mode} className={s.set}>
              <span className={s.name}>{mode === 'now' ? 'Иконки как сейчас' : 'Иконки в кольце'}</span>
              <div className={s.deck} data-ground="deck">
                <ul className={s.col} aria-label="Соцсети">
                  {NETS.map(([k, label]) => (
                    <li key={k}><a className={`${go.go} ${s.still}`}>{mode === 'now' ? <Icon id={SIGN[k]} /> : <Ring net={k} />}{label}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Part>
    </>
  )
}
