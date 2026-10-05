'use client'
import { useEffect, useState, type SyntheticEvent } from 'react'
import p from '@/styles/primitives.module.css'
import go from '@/styles/go.module.css'
import s from './design.module.css'
import e from './elements.module.css'
import { Icon } from '@/components/Icon.tsx'

/* Все нарисованные элементы набора, которые прислал заказчик, — живыми
   отрисовками (папка `elements/` набора; панель вида копирует её в
   `look-panel/ui/elements/`, а страница берёт список оттуда — тот же, что
   у Admin → Elements панели). Слово заказчика 29.09.2026: «кнопок я много
   копировал, где-то много кнопок должно быть в папке». Сама страница
   элементов не рисует: кадр — страница элемента со своим наведением и
   нажатием; подпись — номер, имя, где элемент стоит выбором панели.
   Разбор по роду — кнопки первыми. Нет сборки элементов — строка о том,
   как её сделать, а не пустая вкладка. */
type El = { n: string; dir: string; name: string; kind: string; kinds?: string[]; set?: string }

const ORDER = ['кнопка', 'кнопка-знак', 'знак-ссылка', 'фишка', 'лоток', 'переключатель', 'вкладки', 'поле', 'меню', 'раскрывашка', 'ход', 'заглушка', 'путь', 'оценка', 'цена', 'подсказка', 'карточка']
const KIND: Record<string, string> = {
  'кнопка': 'Кнопки', 'кнопка-знак': 'Кнопки-иконки', 'знак-ссылка': 'Иконки-ссылки', 'фишка': 'Фишки', 'лоток': 'Лотки', 'переключатель': 'Переключатели',
  'вкладки': 'Вкладки и сегменты', 'поле': 'Поля', 'меню': 'Меню', 'карточка': 'Карточки', 'раскрывашка': 'Раскрывающиеся списки', 'ход': 'Ход: полоса и шаги', 'заглушка': 'Заглушки загрузки', 'путь': 'Путь: крошки и листание', 'оценка': 'Оценка', 'цена': 'Цена', 'подсказка': 'Подсказки', 'сообщение': 'Сообщения', 'форма': 'Формы', 'окно': 'Окна',
}
const BASE = '/look-panel/elements'
/* Скрыто со страницы по слову заказчика 30.09.2026 («66 · Стекло марки — блок этих кнопок удали»): в каталоге набора и в панели элемент остаётся. */
/* И 01 · «Пилюли шапки» (слово заказчика 01.10.2026: «лупа и корзина у нас
   есть, этот подблок удаляй полностью»): его кнопка листания — элемент 68. */
const HIDDEN = new Set(['66', '01'])
/* Пары об одном — на одной плашке под общим именем (слово заказчика
   01.10.2026: «как это переименовать, чтоб общее было в названии, это ж про
   одно и то же… расположи их на одной белой подложке», И624). Ключ — номер
   первого; у каждой половины — её отличие. */
const PAIRS: Record<string, { name: string; parts: [string, string][] }> = {
  '21': { name: 'Полоски меню', parts: [['21', 'в крестик'], ['22', 'в стрелку']] },
}
const PAIRED = new Set(Object.values(PAIRS).flatMap((x) => x.parts.slice(1).map(([n]) => n)))

/* Кнопки — во вкладке Buttons (слово заказчика 01.10.2026: «делай раздел
   Buttons и туда перенеси все кнопки, которые есть в разделе элементы,
   соответственно из раздела элементы удали те кнопки», И619): сетка одна,
   вкладка выбирает роды. */
/** Кнопка — элемент первого рода «кнопка»: слово, можно со знаком. */
export const isButton = (x: El) => x.kind === 'кнопка'
/* Стрелки листания без кружка (11 «штрих», 12 «разбег») — анимированные знаки,
   а не кнопки: на их основе кнопки и делаются (слово заказчика 01.10.2026). */
const ARROW_SIGNS = new Set(['11', '12'])
/** Знак — знак без слова, который нажимают: значки шапки, стрелки «куда
 *  ведёт», лотки значков, полоски меню, луна и солнце, сердце (слово
 *  заказчика 01.10.2026: «это не кнопки, это знаки, иконки — они должны быть
 *  в разделе знаки», И620). Ползунки, карточки, формы и окна — ни то, ни другое. */
export const isSign = (x: El) => ARROW_SIGNS.has(x.n) || x.kind === 'кнопка-знак' || (['лоток', 'переключатель'].includes(x.kind) && Boolean(x.kinds?.includes('кнопка-знак')))

/** Кнопка листания — круглая стрелка «куда ведёт» (род «знак-ссылка»):
 *  кнопка, а не знак (слово заказчика 01.10.2026: «кнопки листания делай
 *  отдельный подраздел… ты их неверно в знаки засунул, это кнопки», И624). */
export const isPager = (x: El) => x.kind === 'знак-ссылка'

/** Поле — элемент первого рода «поле»: ввод текста, поиск, список выбора, поле с кнопкой встык. */
export const isField = (x: El) => x.kind === 'поле'
/** Индикатор хода — первого рода «ход»: полоса до порога, шаги оформления. */
export const isProgress = (x: El) => x.kind === 'ход'

/* Поля и индикаторы — во вкладке Система → Поля и индикаторы (слово заказчика
   03.10.2026: «это не кнопки и не иконки… и поля туда же перенесём», И668):
   оттуда они из «Элементов» убраны, как кнопки и иконки до них. */
export const Elements = () => <ElementGrid keep={(x) => !isButton(x) && !isSign(x) && !isPager(x) && !isField(x) && !isProgress(x)} title="Присланные элементы" lede="Всё, кроме кнопок, иконок, полей и индикаторов: кнопки — во вкладке Система → Buttons, иконки — Система → Иконки, поля и индикаторы — Система → Поля и индикаторы. Наведите и нажмите: состояния пробуете сами." live />

/** `live` — кадр без застывших состояний (`?live`, elements/stage.js): покой, наведение,
 *  нажатие и фокус видны рукой на самом элементе (слово заказчика 01.10.2026, И620). */
/** Живой кадр — ростом со свою страницу: у одной кнопки и у ряда пилюль он разный. */
const fit = (ev: SyntheticEvent<HTMLIFrameElement>) => {
  const f = ev.currentTarget, body = f.contentDocument?.body
  if (!body) return
  /* По нижнему краю видимого содержимого, а не по росту страницы: её тело
     тянется на весь кадр, и рост страницы рос бы вместе с кадром. */
  /* Образец плитки — вровень с кнопками соседних плиток: кадр ростом с орган
     и равным полем с обеих сторон, без страничных 24 пикселей и растяжки на
     весь кадр; по центру его ставит плитка (.famSample), как любую кнопку. */
  if (f.dataset.tile !== undefined) {
    body.style.minBlockSize = '0'
    body.style.paddingBlock = '8px'
  }
  const end = Math.max(...[...body.children].map((c) => c.getBoundingClientRect().bottom))
  f.style.blockSize = `${Math.ceil(end + parseFloat(getComputedStyle(body).paddingBlockEnd))}px`
  /* Половина пары — шириной со свой элемент и поле кадра с боков: пара
     встаёт в строку, когда помещается (И624). */
  if (f.dataset.pair === undefined) return
  const live = body.querySelector('.live')
  const wide = live ? Math.max(...[...live.children].map((c) => c.scrollWidth)) : 0
  if (wide) f.style.inlineSize = `${Math.ceil(wide + live!.getBoundingClientRect().top * 2)}px`
}

export function ElementGrid({ keep, title, lede, live }: { keep: (x: El) => boolean; title: string; lede: string; live?: boolean }) {
  const [list, setList] = useState<El[] | null | false>(null)
  const [kind, setKind] = useState<string>('')
  useEffect(() => {
    fetch(`${BASE}/list.json`).then((r) => (r.ok ? r.json() : Promise.reject())).then((l: El[]) => setList(l.filter((x) => !HIDDEN.has(x.n) && keep(x))), () => setList(false))
    // отбор — постоянная функция вкладки
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (list === null) return <p className={p.note}>Загружаю элементы…</p>
  if (!list) return <p className={p.note}>Элементы ещё не собраны: соберите каталог панели (`npm run look:catalog -- --from &lt;набор&gt;`).</p>
  const kinds = [...new Set(list.map((x) => x.kind))].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99))
  const rank = (k: string) => ORDER.indexOf(k) + 1 || 99
  const shown = (kind ? list.filter((x) => x.kind === kind) : [...list].sort((a, b) => rank(a.kind) - rank(b.kind) || a.n.localeCompare(b.n, undefined, { numeric: true })))
  return (
    <section className={s.part} aria-label={title}>
      <div className={p.sectionHead}><hgroup><h2>{title}</h2><p>{lede}{live ? '' : ' В кадре элемент живой: наведите и нажмите. Подпись — номер (по нему можно писать «33») и имя.'}</p></hgroup></div>
      <div className={`${s.subtabs} ${e.kinds}`} role="group" aria-label="Род элемента">
        <button type="button" aria-pressed={!kind} onClick={() => setKind('')}>Все</button>
        {kinds.map((k) => (
          <button key={k} type="button" aria-pressed={k === kind} onClick={() => setKind(k)}>{KIND[k] ?? k}</button>
        ))}
      </div>
      <ul className={`${p.grid} ${e.grid}`}>
        {shown.filter((x) => !PAIRED.has(x.n)).map((x) => PAIRS[x.n] ? (
          <li key={x.dir}>
            <figure className={e.el}>
              <div className={`${p.cluster} ${e.pair}`}>
                {PAIRS[x.n].parts.map(([n, what]) => {
                  const y = list.find((z) => z.n === n)
                  return y ? <iframe key={n} className={e.frame} data-pair="" data-live={live ? '' : undefined} onLoad={live ? fit : undefined} src={`${BASE}/${y.dir}/element.html${live ? '?live' : ''}`} loading="lazy" title={`${n} · ${PAIRS[x.n].name}: ${what}`} tabIndex={-1} /> : null
                })}
              </div>
              <figcaption>
                <b>{PAIRS[x.n].name}</b>
                {live ? <span>{PAIRS[x.n].parts.map(([, what]) => what).join(' · ')}</span> : <span className={p.cluster}>{PAIRS[x.n].parts.map(([n, what]) => {
                  const y = list.find((z) => z.n === n)
                  return y ? <a key={n} className={go.go} href={`${BASE}/${y.dir}/element.html`} target="_blank" rel="noopener">{n} · {what}<Icon id="arrow-right" /></a> : null
                })}</span>}
              </figcaption>
            </figure>
          </li>
        ) : (
          <li key={x.dir}>
            <figure className={e.el}>
              <iframe className={e.frame} data-live={live ? '' : undefined} onLoad={live ? fit : undefined} src={`${BASE}/${x.dir}/element.html${live ? '?live' : ''}`} loading="lazy" title={`${x.n} · ${x.name}`} tabIndex={-1} />
              <figcaption>
                <b>{live ? x.name : `${x.n} · ${x.name}`}</b>
                {live ? null : <a className={go.go} href={`${BASE}/${x.dir}/element.html`} target="_blank" rel="noopener">Открыть<Icon id="arrow-right" /></a>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}


/** Присланные поля — вкладка Система → Поля и индикаторы. */
export const FieldElements = () => <ElementGrid keep={isField} title="Присланные поля" lede="Поля, которые прислал заказчик: ввод, поиск, список выбора, поле с кнопкой. Нажмите в поле и пишите: состояния пробуете сами." live />

/** Присланные индикаторы хода — та же вкладка. Образец, который уже стоит на сайте (`в наборе`), здесь не повторяется: он — настоящий компонент выше. */
export const ProgressElements = () => <ElementGrid keep={(x) => isProgress(x) && !x.set} title="Присланные индикаторы" lede="Полоса до бесплатной доставки: на сайте стоит тонкая (она выше, настоящим компонентом); широкая с суммой в заливке — запасной вид. Скажите «широкая» — и она встанет на сайт. Остальные виды (100–104) отложены как не подходящие стилю набора и лежат в каталоге. Ниже — шаги оформления заказа." live />

/** Анимированные знаки — вкладка Система → Знаки (И620, И624). */
export const SignElements = () => <ElementGrid keep={isSign} title="Анимированные иконки" lede="Иконки, которые отвечают на руку движением: сердце наливается, полоски меню складываются в крестик или стрелку, луна сменяется солнцем, иконки в лотке шевелятся, стрелки листания без кружка едут вперёд — на их основе делаются кнопки листания. Наведите и нажмите." live />


/* `only` — «button» (все кнопки, ещё не в наборе) или номера элементов, которые строка страницы берёт по смыслу (стрелки листания по видам, слово заказчика 01.10.2026). */
/* Хранилище одно — набор (styles/buttons.json): образец, переведённый в
   вариант набора (`в наборе` в elements.json), на странице не стоит — стоит
   сам вариант. Образец, ещё не переведённый, показан той же плиткой, что
   кнопка сайта: живой, с именем, без «Открыть» (слово заказчика 01.10.2026:
   «как нам в системе это хранить… единообразно», И626). Плитки — внутрь
   чужой сетки, своей обёртки нет. */
export function ElementTiles({ only }: { only: 'button' | readonly string[] }) {
  const [list, setList] = useState<El[]>([])
  useEffect(() => {
    const keep = (x: El) => !HIDDEN.has(x.n) && !x.set && (only === 'button' ? isButton(x) : only.includes(x.n))
    fetch(`${BASE}/list.json`).then((r) => (r.ok ? r.json() : [])).then((l: El[]) => setList(l.filter(keep)), () => setList([]))
  }, [only])
  return (
    <>
      {list.map((x) => (
        <li key={x.dir} className={s.btnStyle}>
          <span className={s.famSample}><iframe className={e.frame} data-live="" data-tile="" onLoad={fit} src={`${BASE}/${x.dir}/element.html?live`} loading="lazy" title={x.name} tabIndex={-1} /></span>
          <span className={s.btnName}>{x.name}</span>
        </li>
      ))}
    </>
  )
}
