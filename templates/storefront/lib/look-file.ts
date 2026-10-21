/* Файл опубликованного вида сайта (образец; у Payload — global «look» сайта).
   Сайт по умолчанию держит прежние имена — look.json и look.draft.json: их
   читают сборка стилей, каталог панели и проверка сочетаний. Другой сайт —
   look.<id>.json; пока его нет, сайт носит вид сайта по умолчанию
   (docs/plans/multi-site.md, Ш3). */
export const lookFileName = (site: { id: string }, isDefault: boolean, draft = false): string =>
  isDefault ? (draft ? 'look.draft.json' : 'look.json') : (draft ? `look.draft.${site.id}.json` : `look.${site.id}.json`)
