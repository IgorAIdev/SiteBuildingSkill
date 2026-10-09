import b from '@/styles/btn.module.css'
import pn from '@/styles/pane.module.css'
import s from './GuaranteeNotice.module.css'
import type { Lang } from '@/lib/locale.ts'
import { EU_GUARANTEE_NOTICE } from '@/lib/company.ts'
import { t } from '@/lib/i18n/index.ts'
import { PaneHead } from './PaneHead.tsx'

/* Уведомление ЕС о законной гарантии (Имплементационный регламент (ЕС)
   2025/1960, Приложение I; с 27.09.2026; И791) — картинкой ЕС без изменений, на
   языке страницы, в цвете. На странице гарантии — в разделе «Informarea
   armonizată a UE» (`inline`); в кассе у кнопки заказа — словом «Garanție legală
   2 ani», открывающим окно с картинкой (текст гарантии обещает показ в обоих
   местах). Окно — немодальное (`popover`, правило 8): посмотреть и закрыть,
   решения в нём нет; роль `dialog` — имя окна (у безымянного `div` имя не
   читается); тройка окна и шапка — общие (PaneHead). Файла нет
   (`EU_GUARANTEE_NOTICE`, lib/company.ts; кладёт человек с EUR-Lex) — не
   рисуется ничего, и раздела о нём на странице гарантии тоже нет
   (lib/doc-view.ts, `notice`): своё «подобие» знака ЕС уведомлением не является. */
export function GuaranteeNotice({ lang, inline = false, id = 'eu-guarantee' }: { lang: Lang; inline?: boolean; id?: string }) {
  const file = EU_GUARANTEE_NOTICE[lang]
  if (!file) return null
  const shot = <img className={s.shot} src={file.src} width={file.width} height={file.height} alt={t(lang, 'guarantee.alt')} loading="lazy" decoding="async" />
  if (inline) return <figure>{shot}</figure>
  return (
    <>
      <button className={b.word} type="button" popoverTarget={id}>{t(lang, 'guarantee.open')}</button>
      <div id={id} popover="auto" role="dialog" className={pn.pane} data-pane="dialog" aria-labelledby={`${id}-title`}>
        <PaneHead title={t(lang, 'guarantee.open')} titleId={`${id}-title`} close={t(lang, 'guarantee.close')} target={id} />
        <div className={pn.body}>{shot}</div>
      </div>
    </>
  )
}
