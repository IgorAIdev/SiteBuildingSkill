'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import f from '@/styles/form.module.css'
import s_ from './design.module.css'
import { Icon } from '@/components/Icon.tsx'
import { Choices, SaveBar } from './Choices.tsx'
import { useDesk, useStudio, type Fitted, type Intent, type Option, type Paint, type Paints, type Studio } from './studio.ts'

/* Выбор палитры — на вкладке «Цвет» страницы дизайн-системы (слово
   заказчика 29.09.2026: «переносить регулировку дизайна в дизайн систему на
   страницу… начнём с палитры»; И567). Раньше он стоял в плавающей панели
   (System → Color); там теперь ссылка сюда. Состояние — общее (studio.ts):
   щелчок перекрашивает весь сайт предпросмотром и пишет черновик, как в
   панели; «Сохранить вид» — та же проверка сочетания и публикация. Слова —
   без покупателей: витрина — заготовка шаблона, смотрит её заказчик (слово
   заказчика 29.09.2026: «нет никаких покупателей сейчас, это всё заготовка
   витрины»).

   Своя палитра строится из НАМЕРЕНИЯ — цвет марки, бумага, чернила —
   строителем набора (choice.mjs → engine/palette.mjs, `fitPalette`): набор
   верен по построению, что подвинуто — одной строкой (И275). */

/** Обещания строителя по-русски — по `id` (choice.mjs, `guarantees`); нового нет в списке — его слова. */
const PROMISE: Record<string, string> = {
  text: 'Текст читается на странице и на карточках', buttons: 'Надписи кнопок и плашек читаются', quiet: 'Тихая кнопка видна на странице, на карточке и на тёмной полосе',
  trail: 'Хвост стрелок главной кнопки виден на любом фоне', 'edge-off': 'У недоступной кнопки видна кромка', hero: 'Текст героя читается поверх любого снимка',
  apart: 'Марку не спутать со скидкой и наличием', ring: 'Кольцо фокуса видно на любом фоне', band: 'Слова, кнопки и плашки читаются на тёмной полосе',
  counter: 'Счётчик на кнопке покупки виден, число читается', caption: 'Подписи на снимках читаются без вуали', whole: 'День и ночь держат один порядок поверхностей, лишних оттенков нет',
}

/** Образец набора — кусок магазина его красками. Рисунок один на панель и
 *  страницу (look-panel/ui/swatch.mjs, И575): модуль панели берётся адресом. */
const SWATCH = '/look-panel/swatch.mjs'
function PaletteSample({ s, o }: { s: Studio; o: Option }) {
  const well = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let live = true
    import(/* webpackIgnore: true */ /* turbopackIgnore: true */ SWATCH).then((m: { paletteSample: (t: unknown) => Node }) => {
      if (live) well.current?.replaceChildren(m.paletteSample(s.choice.tileOf(o.seed!, s.catalog.steps)))
    }, () => {})
    return () => { live = false }
  }, [s, o])
  return <span ref={well} className={s_.setSwatch} />
}

function hueOf(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(...c), min = Math.min(...c), d = max - min
  if (!d) return 0
  const h = max === c[0] ? ((c[1] - c[2]) / d) % 6 : max === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4
  return (h * 60 + 360) % 360
}
/** Тот же цвет с другим тоном — светлота и насыщенность (HSL) остаются. */
function withHue(hex: string, h: number) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(...c), min = Math.min(...c), l = (max + min) / 2
  const sat = max === min ? 0.45 : (max - min) / (1 - Math.abs(2 * l - 1))
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(l, 1 - l)
  const ch = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [ch(0), ch(8), ch(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}
const HEX = /^#?[0-9a-f]{6}$/i
const hexOf = (v: string) => (HEX.test(v.trim()) ? (v.trim()[0] === '#' ? v.trim() : '#' + v.trim()).toUpperCase() : null)

type Theme = 'light' | 'dark'
const Seg = <T extends string>({ label, list, value, set, off }: { label: string; list: [T, string][]; value: T; set: (v: T) => void; off?: boolean }) => (
  <div className={p.seg} role="group" aria-label={label}>
    {list.map(([k, name]) => <button key={k} type="button" aria-pressed={value === k} aria-disabled={off || undefined} onClick={() => { if (!off) set(k) }}>{name}</button>)}
  </div>
)

/** Строитель своей палитры: намерение → замер → краски на весь сайт. */
function Builder({ s, close }: { s: Studio; close: () => void }) {
  const start = s.custom() && s.paints ? s.paints.intent ?? s.choice.intentOf(s.paints) : s.choice.intentOf(s.current().seed)
  const [intent, setIntent] = useState<Intent>({ ...start })
  const [name, setName] = useState(s.paints?.name ?? 'Своя')
  const [exact, setExact] = useState<{ light: Paint; dark: Paint } | null>(null)
  const [fitted, setFitted] = useState<Fitted | null>(null)
  const [fine, setFine] = useState<Theme>('light')
  const [grid, setGrid] = useState<Theme>('light')
  const first = useRef(true)
  useEffect(() => {
    /* Открыли на своей палитре — краски уже стоят, пересобирать не с чего. */
    if (first.current && s.custom()) { first.current = false; return }
    first.current = false
    const t = setTimeout(() => {
      const r = s.choice.fitPalette(intent, exact)
      setFitted(r)
      if (r.ok) s.setPaints({ name, light: r.seed.light, dark: r.seed.dark, intent: { ...intent } })
    }, 90)
    return () => clearTimeout(t)
    // имя — отдельной ручкой (`rename`), палитра от него не пересобирается
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, exact])
  const set = (x: Partial<Intent>) => setIntent((i) => ({ ...i, ...x }))
  const brand = fitted?.notes.find((n) => n.what === 'brand')
  const now: Paints = s.paints ?? s.current().seed
  const seed = exact ?? (s.paints ? { light: s.paints.light, dark: s.paints.dark } : null)
  return (
    <div className={s_.builder}>
      <div className={s_.builderHead}><h3>Своя палитра</h3><button type="button" className={b.btn} data-voice="bare" onClick={close}>Закрыть</button></div>
      <label className={f.field}><span className={f.label}>Имя</span>
        <input className={f.box} maxLength={40} value={name} onChange={(e) => { setName(e.target.value); s.rename(e.target.value.trim()) }} />
      </label>
      <div className={f.field}>
        <span className={f.label}>Цвет марки</span>
        <div className={p.cluster}>
          <input type="color" className={s_.pick} aria-label="Цвет марки" value={intent.brand.toLowerCase()} onChange={(e) => set({ brand: e.target.value.toUpperCase() })} />
          <input className={`${f.box} ${s_.hex}`} aria-label="Код цвета марки" maxLength={7} spellCheck={false} defaultValue={intent.brand} key={intent.brand}
            onChange={(e) => { const v = hexOf(e.target.value); e.target.setAttribute('aria-invalid', String(!v)); if (v) set({ brand: v }) }} />
        </div>
        <input type="range" className={s_.hue} min={0} max={359} aria-label="Тон марки" value={Math.round(hueOf(intent.brand))} onChange={(e) => set({ brand: withHue(intent.brand, Number(e.target.value)) })} />
        {brand ? (
          <p className={p.note}><span className={s_.dot} style={{ background: brand.from } as CSSProperties} /> → <span className={s_.dot} style={{ background: brand.to } as CSSProperties} /> {brand.mode === 'dark' ? 'В тёмной теме ваш цвет' : 'Ваш цвет'} на кнопках — {brand.why}.</p>
        ) : fitted && !fitted.ok ? <p className={p.note}>{fitted.notes[0]?.why}</p> : null}
      </div>
      <div className={f.field}><span className={f.label}>Бумага</span>
        <Seg label="Бумага" list={[['warm', 'Тёплая'], ['neutral', 'Нейтральная'], ['cool', 'Холодная']]} value={intent.paper} set={(v) => set({ paper: v })} />
        <Seg label="Оттенок бумаги" list={[['none', 'Без оттенка'], ['light', 'Лёгкий']]} value={intent.tint} set={(v) => set({ tint: v })} off={intent.paper === 'neutral'} />
      </div>
      <label className={f.tick}><input type="checkbox" checked={Boolean(intent.inkTowardBrand)} onChange={(e) => set({ inkTowardBrand: e.target.checked })} />Чернила — к цвету марки (тёмные настолько, чтобы читаться, всегда)</label>
      <details className={s_.more}>
        <summary>Точные коды цветов</summary>
        <Seg label="Тема" list={[['light', 'Светлая'], ['dark', 'Тёмная']]} value={fine} set={setFine} />
        <div className={s_.fine}>
          {(['paper', 'ink', 'accent'] as const).map((k) => (
            <label key={`${fine}-${k}`} className={f.field}><span className={f.label}>{{ paper: 'Бумага', ink: 'Чернила', accent: 'Марка' }[k]}</span>
              <input className={`${f.box} ${s_.hex}`} maxLength={7} spellCheck={false} defaultValue={seed?.[fine][k] ?? ''}
                onBlur={(e) => {
                  const v = hexOf(e.target.value)
                  e.target.setAttribute('aria-invalid', String(!v))
                  if (!v) return
                  const base = exact ?? { light: { ...(seed?.light ?? {}) }, dark: { ...(seed?.dark ?? {}) } }
                  setExact({ ...base, [fine]: { ...base[fine], [k]: v } })
                }} />
            </label>
          ))}
        </div>
        <p className={p.note}>Эти коды тоже доводятся: цвет, который не читается, сдвигается к ближайшему, который читается.</p>
      </details>
      <details className={s_.more}>
        <summary>Шкала · 7 семей × 12 ступеней</summary>
        <Seg label="Тема шкалы" list={[['light', 'Светлая'], ['dark', 'Тёмная']]} value={grid} set={setGrid} />
        <div className={s_.scale} role="img" aria-label={`Посчитанные ступени, ${grid === 'light' ? 'светлая' : 'тёмная'} тема`}>
          {s.choice.families(now, grid).map(([fam, hexes]) => (
            <div key={fam} className={s_.scaleRow}><span>{fam}</span>{hexes.map((h, i) => <i key={i} title={`${fam} ${i + 1} · ${h}`} style={{ background: h }} />)}</div>
          ))}
        </div>
      </details>
    </div>
  )
}

/** Что палитра обещает — замером строителя, числа под раскрытием. */
function Promises({ s }: { s: Studio }) {
  const g = s.choice.guarantees(s.custom() && s.paints ? s.paints : s.current().seed, s.catalog.steps)
  const bad = s.clashes().find((c) => c.x.field === 'palette' || c.y.field === 'palette')
  const num = (r: { got: number; unit: string }) => (r.unit === ':1' ? `${r.got}:1` : r.unit === 'Lc' ? `Lc ${Math.round(r.got)}` : `${Math.round(r.got)} ${r.unit}`)
  return (
    <div className={s_.promises}>
      <h3>Гарантировано</h3>
      <ul>
        {g.map((x) => <li key={PROMISE[x.id] ?? x.label} data-ok={x.ok}><Icon id={x.ok ? 'check' : 'x'} />{PROMISE[x.id] ?? x.label}</li>)}
        <li data-ok><Icon id="check" />Собрана для светлой и тёмной темы</li>
        {bad ? <li data-ok={false}><Icon id="x" />Не с «{s.title(bad.x.field === 'palette' ? bad.y.field : bad.x.field, bad.x.field === 'palette' ? bad.y.id : bad.x.id)}» — {bad.why}</li> : null}
      </ul>
      <details className={s_.more}>
        <summary>Числа</summary>
        {g.map((x) => <p key={PROMISE[x.id] ?? x.label} className={p.note}><b>{PROMISE[x.id] ?? x.label}: </b>{(['light', 'dark'] as const).map((m) => `${m === 'light' ? 'Светлая' : 'Тёмная'} ${x.rows.filter((r) => r.mode === m).map(num).join(', ')}`).join(' · ')}</p>)}
      </details>
    </div>
  )
}

export function PaletteStudio() {
  const { s } = useStudio()
  const desk = useDesk()
  const [building, setBuilding] = useState<boolean | null>(null)
  if (!s) return <p className={p.note}>Загружаю выбор палитры…</p>
  const open = building ?? s.custom()
  return (
    <div className={s_.studio}>
      <Choices s={s} field="palette" sample={(o) => <PaletteSample s={s} o={o} />} />
      {!desk ? <p className={p.note}>Свою палитру строят на компьютере.</p>
        : open ? <Builder s={s} close={() => setBuilding(false)} />
        : <button type="button" className={b.btn} onClick={() => setBuilding(true)}>{s.custom() ? 'Своя палитра' : 'Собрать свою палитру'}</button>}
      <Promises s={s} />
      <SaveBar />
    </div>
  )
}
