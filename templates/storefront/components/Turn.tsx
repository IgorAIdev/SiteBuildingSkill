import t from '@/styles/turn.module.css'
import { Icon } from './Icon.tsx'

/* Знак раскрытия — один на сайт (styles/turn.module.css, И481): стрелка
   вниз, повёрнутая, пока открыто то, что она открывает. */
export function Turn() {
  return <Icon id="chevron-down" className={t.turn} />
}
