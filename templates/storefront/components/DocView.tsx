import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import m from '@/styles/menu.module.css'
import tb from '@/styles/table.module.css'
import s from './DocView.module.css'
import type { DocPageView, Para, SectionView } from '@/lib/doc-view.ts'

/** Якорь раздела с таблицей: заголовок и таблица, которую он называет. */
export const DOC_TABLE = 'doc-table'

/* Строка документа: текст и ссылки (lib/doc-view.ts). Ссылка в тексте — вид
   «в тексте» (`prose` у колонки текста), на чужой сайт — с `noopener`. */
function Line({ runs }: { runs: Para }) {
  return <>{runs.map((r, _, all) => (r.href ? <a key={offsetOf(all, r)} href={r.href} rel={r.external ? 'noopener' : undefined}>{r.text}</a> : r.text))}</>
}

/* Ключи списков — из текста, как у истории марки (Story): абзац, пункт и строка
   таблицы — своим текстом, ячейка — именем столбца, кусок строки — местом в
   ней (две одинаковые ссылки в одном абзаце бывают, одно место — нет). */
const textOf = (runs: Para) => runs.map((r) => r.text).join('')
const offsetOf = (runs: Para, run: Para[number]) => textOf(runs.slice(0, runs.indexOf(run)))

/* Раздел — заголовок над своим текстом (И748): заголовок стоит вплотную к
   тексту (воздух строки), разделы разводит воздух блока (D1, И524). До 04.10.2026
   заголовок стоял узкой колонкой слева (`sidebar`) и читался оглавлением, но
   никуда не вёл; теперь оглавление — ссылками сбоку (cbdin.bg, cibdol), и
   вторая колонка заголовков ему мешала бы. */
function Part({ sec, body }: { sec: Pick<SectionView, 'id' | 'heading'>; body: ReactNode }) {
  return (
    <section className={`${p.stack} ${s.part}`} aria-labelledby={sec.id}>
      <h2 id={sec.id} className={s.heading}>{sec.heading}</h2>
      {body}
    </section>
  )
}

function SectionBody({ sec, forms }: { sec: SectionView; forms?: Partial<Record<'withdrawal', ReactNode>> }) {
  const head = sec.table?.head ?? []
  return (
    <div className={`${p.stack} ${p.prose} ${s.text}`}>
      {sec.paras.map((runs) => <p key={textOf(runs)}><Line runs={runs} /></p>)}
      {sec.list ? <ul>{sec.list.map((runs) => <li key={textOf(runs)}><Line runs={runs} /></li>)}</ul> : null}
      {sec.table ? (
        <div className={tb.scroll}>
          <table className={tb.table} aria-labelledby={sec.id}>
            <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {sec.table.rows.map((row) => (
                <tr key={row.map(textOf).join('|')}>{row.map((cell, c) => (c === 0 ? <th key={head[c]} scope="row"><Line runs={cell} /></th> : <td key={head[c]}><Line runs={cell} /></td>))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {/* Выноска — одна на статью (cbdshop.bg; И749): тихая плашка сведения. */}
      {sec.note ? <p className={s.note}><Line runs={sec.note} /></p> : null}
      {sec.form ? forms?.[sec.form] ?? null : null}
    </div>
  )
}

/* Документ: шапка (имя, строка о нём, дата правки), затем разделы; длинный
   документ — с оглавлением ссылками, приклеенным сбоку на широкой коробке
   (примитивы `sidebar` и `pinned`; cbdin.bg, cibdol), на узкой его нет —
   там оно стояло бы экраном ссылок между именем и текстом (cbdin.bg на
   телефоне: 460 px оглавления до первого раздела; cibdol на телефоне его
   прячет). Строки оглавления — строки меню набора (`m.list`, `b.row`).
   Таблица способов доставки — первым разделом (`table`, D2), её имя — его
   заголовок. Статья блога — тот же документ (И749): `head` — своя шапка
   (рубрика, имя, подзаголовок, автор, строка данных), `intro` — между шапкой
   и текстом (обложка, «Pe scurt»), `children` — в колонке текста после
   разделов (источники, «Important»). */
export function DocView({ view, table, tableTitle, meta, head, intro, forms, children }: {
  view: DocPageView; table?: ReactNode; tableTitle?: string; meta?: ReactNode; head?: ReactNode; intro?: ReactNode
  forms?: Partial<Record<'withdrawal', ReactNode>>; children?: ReactNode
}) {
  const parts = (
    <div className={`${p.stack} ${s.parts}`}>
      {table && tableTitle ? <Part sec={{ id: DOC_TABLE, heading: tableTitle }} body={table} /> : null}
      {view.sections.map((sec) => <Part key={sec.id} sec={sec} body={<SectionBody sec={sec} forms={forms} />} />)}
      {children}
    </div>
  )
  return (
    <article className={`${p.stack} ${s.doc}`}>
      <div className={`${p.pagehead} ${s.head}`}>
        {head ?? (
          <>
            <h1>{view.title}</h1>
            <p>{view.summary}</p>
            {view.updated ? <p className={p.note}>{view.updated}</p> : null}
            {meta}
          </>
        )}
      </div>
      {intro}
      {view.toc ? (
        <div className={`${p.sidebar} ${s.body}`}>
          <nav className={`${p.aside} ${p.pinned} ${s.toc}`} aria-labelledby="doc-toc">
            <p id="doc-toc" className={m.group}>{view.toc.label}</p>
            <ul className={m.list}>
              {view.toc.items.map((it) => <li key={it.id}><a className={b.row} href={`#${it.id}`}>{it.label}</a></li>)}
            </ul>
          </nav>
          {parts}
        </div>
      ) : parts}
    </article>
  )
}
