import type { ReactNode } from 'react'
import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import m from '@/styles/menu.module.css'
import s from './DocView.module.css'
import type { DocPageView, SectionView } from '@/lib/doc-view.ts'
import type { DocSlot } from '@/lib/source/contract.ts'
import { DocTable, Line, textOf } from './DocTable.tsx'
import { Turn } from './Turn.tsx'

/** Якорь раздела с таблицей: заголовок и таблица, которую он называет. */
export const DOC_TABLE = 'doc-table'

/* Раздел — заголовок над своим текстом (И748): заголовок стоит вплотную к
   тексту (воздух строки), разделы разводит воздух блока (D1, И524). До 04.10.2026
   заголовок стоял узкой колонкой слева (`sidebar`) и читался оглавлением, но
   никуда не вёл; теперь оглавление — ссылками сбоку (cbdin.bg, cibdol), и
   вторая колонка заголовков ему мешала бы. */
/* Номер раздела договорного документа (И791) — текстом перед заголовком, тем же
   кеглем и весом, краской вторичного текста, цифры моноширинные: на пункт
   ссылаются («art. 8»; cbdmania, Farmacia Tei), оглавление и текст говорят одним
   номером. От заголовка — обычным пробелом, своего числа нет. */
function Part({ sec, body }: { sec: Pick<SectionView, 'id' | 'num' | 'heading'>; body: ReactNode }) {
  return (
    <section className={`${p.stack} ${s.part}`} aria-labelledby={sec.id}>
      <h2 id={sec.id} className={s.heading}>{sec.num ? <><span className={s.num}>{sec.num}.</span>{' '}</> : null}{sec.heading}</h2>
      {body}
    </section>
  )
}

export type DocSlots = Partial<Record<DocSlot, ReactNode>>

function SectionBody({ sec, slots }: { sec: SectionView; slots?: DocSlots }) {
  return (
    <div className={`${p.stack} ${p.prose} ${s.text}`}>
      {sec.paras.map((runs) => <p key={textOf(runs)}><Line runs={runs} /></p>)}
      {sec.list ? <ul>{sec.list.map((runs) => <li key={textOf(runs)}><Line runs={runs} /></li>)}</ul> : null}
      {sec.table ? <DocTable head={sec.table.head} rows={sec.table.rows} labelledBy={sec.id} /> : null}
      {/* Выноска — одна на статью (cbdshop.bg; И749): тихая плашка сведения. */}
      {sec.note ? <p className={s.note}><Line runs={sec.note} /></p> : null}
      {sec.slot ? slots?.[sec.slot] ?? null : null}
    </div>
  )
}

/* Документ: шапка (имя, строка о нём, дата правки), затем разделы; длинный
   документ — с оглавлением ссылками, приклеенным сбоку на широкой коробке
   (примитивы `sidebar` и `pinned`; cbdin.bg, cibdol), на узкой его нет —
   там оно стояло бы экраном ссылок между именем и текстом (cbdin.bg на
   телефоне: 460 px оглавления до первого раздела; cibdol на телефоне его
   прячет). Строки оглавления — строки меню набора (`m.list`, `b.row`). На
   узкой коробке оглавление — одной свёрнутой строкой «Pe această pagină (17)»
   под шапкой (И791): раскрытая — те же строки; свёртка — вид свёртки меню
   (`m.fold`, И734). Оглавление не печатается (`data-print`, base.css).
   Таблица способов доставки или строго необходимых cookie — первым разделом
   (`table`, D2; имя и номер — `view.lead`). Статья блога — тот же документ
   (И749): `head` — своя шапка (рубрика, имя, подзаголовок, автор, строка
   данных), `intro` — между шапкой и текстом (обложка, «Pe scurt»), `children` —
   в колонке текста после разделов (источники, «Important»). */
export function DocView({ view, table, meta, head, intro, slots, children }: {
  view: DocPageView; table?: ReactNode; meta?: ReactNode; head?: ReactNode; intro?: ReactNode
  slots?: DocSlots; children?: ReactNode
}) {
  const items = view.toc ? view.toc.items.map((it) => <li key={it.id}><a className={b.row} href={`#${it.id}`}>{it.label}</a></li>) : null
  const parts = (
    <div className={`${p.stack} ${s.parts}`}>
      {table && view.lead ? <Part sec={view.lead} body={table} /> : null}
      {view.sections.map((sec) => <Part key={sec.id} sec={sec} body={<SectionBody sec={sec} slots={slots} />} />)}
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
            {view.updated ? <p className={p.note}><time dateTime={view.updatedIso ?? undefined}>{view.updated}</time></p> : null}
            {meta}
          </>
        )}
        {/* Свёрнутое оглавление узкой коробки — в шапке, а не соседом шапки: скрытый на
            широкой сосед менял шаг стопки между шапкой и вступлением статьи (шов дважды,
            check:craft 08.10.2026), а раскрытый уходил под обложку. */}
        {view.toc ? (
          <nav className={s.peek} aria-label={view.toc.label} data-print="skip">
            <details className={m.fold}>
              <summary>{view.toc.label} ({view.toc.items.length})<Turn /></summary>
              <ul className={m.list}>{items}</ul>
            </details>
          </nav>
        ) : null}
      </div>
      {intro}
      {view.toc ? (
        <div className={`${p.sidebar} ${s.body}`}>
          <nav className={`${p.aside} ${p.pinned} ${s.toc}`} aria-labelledby="doc-toc" data-print="skip">
            <p id="doc-toc" className={m.group}>{view.toc.label}</p>
            <ul className={m.list}>{items}</ul>
          </nav>
          {parts}
        </div>
      ) : parts}
    </article>
  )
}
