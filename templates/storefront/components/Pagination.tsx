import { Fragment } from 'react'
import Link from 'next/link'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './Pagination.module.css'
import type { FoldView, PagesView } from '@/lib/catalog-view.ts'
import { Icon } from './Icon.tsx'
import { FoldCount, FoldMore } from './FoldShelf.tsx'

/* Листание под полкой (И721, И731) — одной строкой по центру, слева направо:
   назад, номера, вперёд; «Показать ещё»; строка «Показано 25–48 из 85» (слово
   заказчика 04.10.2026: «кнопки страниц / show more / количество показываемых
   товаров»; полоску показанного он снял тем же словом). Стояли номера на
   квадратной плашке и слова у краёв — заказчик 04.10.2026: «у нас нет
   квадратных подложек и квадратных форм».

   Всё — органы набора, ничего не нарисовано здесь: «Показать ещё» — пилюля,
   как «View all» полок (марка под рукой `data-hand="pop"`, И704);
   стрелки — круглые кнопки листания полки (`data-pager`, уголок); номер —
   та же круглая кнопка, текущий — заливкой выбранного (`aria-current`,
   btn.module.css). Номера — по Material UI «Pagination» (круг 32–40,
   текущий залит) и Mantine «Pagination» (круг в волоске), обе MIT. Под
   рукой номер отвечает тихо — вуалью тихой кнопки, без марки: заливка
   выбранного у набора — краска марки, и номер под мышью выглядел бы
   текущим (замер 04.10.2026: под рукой oklab 0.32 при текущем 0.33).

   «Показать ещё» — настоящая ссылка на следующую страницу с `from`
   (`?page=2&from=1`, shownListing): мягкий переход без прокрутки (`Link`,
   `scroll={false}`, как у выбора варианта, И465) дописывает товары под
   показанными; без скрипта — обычный переход. Строка счёта говорит новое
   вслух (`aria-live`). Заранее не грузится (`prefetch={false}`): следующая
   полка — запросы к магазину, а не все её откроют.

   Вид — роль `--pager-look`: `rings` — номера тихой кнопкой сайта; было `count` — номера без кромки (снят 08.10.2026); `rings` — номера в
   кромке тихой; `compact` — «2 / 4» между стрелками. Разметка одна на все виды,
   видит один (запрос стиля, как у `--stock-look`).

   Две страницы — два круга «1» и «2» без стрелок у любого вида и в узкой
   коробке (`data-few`; слово заказчика 04.10.2026: «если страниц две — два
   кружочка, если больше — как сейчас»; И723).

   Полка телефона шагами (`fold`, И754): та же строка — номера, «Показать ещё»
   и счёт «24 of 85», только «Показать ещё» добавляет 24 карточки (`FoldMore`),
   а не страницу, и счёт — показанное (`FoldCount`); на широком у той же полки —
   страница и её счёт. Страница одна (`pages` нет) — строка живёт ради шагов и на
   широком не видна (`data-fold-only`). Без стрелки у «Показать ещё»: у
   Gymshark «Load More» словом, у Baymard «Load more» — слово кнопки. */
export function Pagination({ pages, fold = null }: { pages: PagesView | null; fold?: FoldView | null }) {
  return (
    <nav className={s.pages} aria-label={pages?.label ?? fold?.more} data-few={pages && pages.total <= 2 ? '' : undefined} data-fold-only={pages ? undefined : ''}>
      <div className={`${p.cluster} ${s.row}`}>
        {pages ? <Steps pages={pages} /> : null}
        {fold ? <FoldMore className={`${b.btn} ${s.unfold}`} label={fold.more} /> : null}
        {pages?.more ? <Link className={`${b.btn} ${s.next}`} data-hand="pop" href={pages.more} scroll={false} prefetch={false}>{pages.moreLabel}</Link> : null}
        {pages ? <p className={`${p.note} ${s.count}`} aria-live="polite">{pages.shown}</p> : null}
        {fold ? <FoldCount className={`${p.note} ${s.folded}`} shown={fold.shown} /> : null}
      </div>
    </nav>
  )
}

/** Назад — номера — вперёд. */
function Steps({ pages }: { pages: PagesView }) {
  return (
    <div className={`${p.cluster} ${s.steps}`}>
      <Step href={pages.prev} label={pages.prevLabel} rel="prev" sign="chevron-left" />
      <ol className={`${p.cluster} ${s.numbers}`}>
        {pages.items.map((it) => (
          <Fragment key={it.n}>
            {it.gap ? <li className={s.gap} aria-hidden="true">…</li> : null}
            <li>{it.href ? <a className={b.btn} data-pager href={it.href}>{it.n}</a> : <span className={b.btn} data-pager aria-current="page">{it.n}</span>}</li>
          </Fragment>
        ))}
      </ol>
      <p className={s.total}><b>{pages.now}</b> / {pages.total}</p>
      <Step href={pages.next} label={pages.nextLabel} rel="next" sign="chevron-right" />
    </div>
  )
}

/** Шаг назад или вперёд — круглая кнопка листания с уголком; на краю гаснет
 *  и из чтения вслух уходит (ссылки некуда), место в ряду держит. */
function Step({ href, label, rel, sign }: { href: string | null; label: string; rel: 'prev' | 'next'; sign: string }) {
  return href
    ? <a className={b.btn} data-pager data-hand="pop" href={href} rel={rel} aria-label={label}><Icon id={sign} /></a>
    : <span className={b.btn} data-pager aria-disabled="true" aria-hidden="true"><Icon id={sign} /></span>
}
