import tb from '@/styles/table.module.css'
import type { Para } from '@/lib/doc-view.ts'

/* Строка документа и таблица документа — у одного хозяина (правило 10): их берут
   страница-документ (DocView, сервер) и окно настроек cookie (ConsentPrefs,
   браузер). Отдельным файлом, чтобы окно в браузере не тянуло за собой весь
   DocView с его стилями (разбор 08.10.2026). */

/* Ключи списков — из текста, как у истории марки (Story): абзац, пункт и строка
   таблицы — своим текстом, ячейка — именем столбца, кусок строки — местом в
   ней (две одинаковые ссылки в одном абзаце бывают, одно место — нет). */
export const textOf = (runs: Para) => runs.map((r) => r.text).join('')
const offsetOf = (runs: Para, run: Para[number]) => textOf(runs.slice(0, runs.indexOf(run)))

/* Строка документа: текст и ссылки (lib/doc-view.ts). Ссылка в тексте — вид
   «в тексте» (`prose` у колонки текста), на чужой сайт — с `noopener`. */
export function Line({ runs }: { runs: Para }) {
  return <>{runs.map((r, _, all) => (r.href ? <a key={offsetOf(all, r)} href={r.href} rel={r.external ? 'noopener' : undefined}>{r.text}</a> : r.text))}</>
}

/** Таблица документа — одна разметка на раздел с таблицей и на таблицы cookie из
 *  реестра (страница cookie, окно настроек; правило 10): первый столбец —
 *  заголовок строки, имя таблицы — заголовок, который её называет. */
export function DocTable({ head, rows, labelledBy }: { head: string[]; rows: Para[][]; labelledBy: string }) {
  return (
    <div className={tb.scroll}>
      <table className={tb.table} aria-labelledby={labelledBy}>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.map(textOf).join('|')}>{row.map((cell, c) => (c === 0 ? <th key={head[c]} scope="row"><Line runs={cell} /></th> : <td key={head[c]}><Line runs={cell} /></td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
