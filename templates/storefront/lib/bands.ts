/* Подложка секции главной — вид `--band-<блок>` (панель Look → Admin →
   Sections, И591): у каждого блока, кроме первого экрана, своё слово из
   четырёх. Сайт читает его из вида на сервере и кладёт на обёртку блока
   разметкой (`data-tone`), поэтому панель меняет главную перезагрузкой
   страницы, как разметку. Краски — роли палитры: `--band` (тихая),
   `--pop-tint` (марки), `--page-deck` (тёмная, как шапка и подвал). */
export const TONES = ['none', 'quiet', 'brand', 'dark'] as const
export type Tone = (typeof TONES)[number]

/** Подложка блока по его типу; вид её не назвал или назвал чужое слово — без подложки. */
export const toneOf = (vars: Readonly<Record<string, string>>, type: string): Tone => {
  const v = vars[`--band-${type}`]
  return TONES.find((t) => t === v) ?? 'none'
}
