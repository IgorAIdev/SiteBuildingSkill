import type { Lang } from './locale.ts'

/* Слова о действии — то, чего витрина CBD не говорит ни своими словами, ни
   чужими (И728; скилл shop, «Ни одного здравного утверждения на витрине»).
   Цитату покупателя показывает магазин, и она — его утверждение (Регламент
   (ЕС) 1924/2006, ст. 10: утверждение о пользе для здоровья запрещено, пока
   оно не разрешено и не внесено в список; у CBD разрешённых нет). Значит, в
   отзыве не бывает сна, тревоги, боли, стресса, «успокаивает» и «лечит» —
   отзыв говорит о вкусе, упаковке, пипетке, доставке, протоколе и
   обслуживании.

   Список — основы слов по языкам рынка, без учёта регистра; совпадение — по
   началу слова (`\b` у латиницы с диакритикой ненадёжен, поэтому граница —
   не буква перед основой). Это сито, а не юрист: оно ловит очевидное в
   образцах и в том, что придёт из админки; спорное решает юрист магазина.
   Названия эффектов в навигации (грань `effect`) — повод, а не обещание, и
   этим ситом не меряются. */
export const CLAIM_WORDS: Record<Lang, readonly string[]> = {
  en: ['sleep', 'insomnia', 'anxi', 'stress', 'calm', 'relax', 'pain', 'ache', 'relie', 'heal', 'cure', 'treat', 'therap', 'inflam', 'sore', 'symptom', 'migraine', 'arthrit', 'joint', 'mood', 'depress', 'seizure', 'epilep', 'immun', 'health'],
  ro: ['somn', 'insomn', 'anxi', 'stres', 'calm', 'liniști', 'relax', 'durer', 'dureri', 'vindec', 'trata', 'terap', 'inflam', 'simptom', 'migren', 'artrit', 'articula', 'dispoziți', 'depresi', 'epileps', 'imunit', 'sănăt'],
  hu: ['alvás', 'alud', 'álmatlan', 'szorong', 'stressz', 'nyugod', 'nyugtat', 'ellazul', 'relax', 'fájd', 'fáj ', 'gyógy', 'kezel', 'terápi', 'gyullad', 'tünet', 'migrén', 'ízület', 'hangulat', 'depresszi', 'epilepsz', 'immun', 'egészség'],
}

const LETTER = /\p{L}/u

/** Основы слов о действии, найденные в тексте, — пусто, если их нет. */
export function claimsIn(lang: Lang, text: string): string[] {
  const low = ` ${text.toLocaleLowerCase(lang)} `
  return CLAIM_WORDS[lang].filter((stem) => {
    for (let at = low.indexOf(stem); at >= 0; at = low.indexOf(stem, at + 1)) if (!LETTER.test(low[at - 1])) return true
    return false
  })
}
