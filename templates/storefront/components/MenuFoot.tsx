import b from '@/styles/btn.module.css'
import m from '@/styles/menu.module.css'
import s from './Header.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { ServiceLink } from '@/lib/shell.ts'
import { t } from '@/lib/i18n/index.ts'
import { Icon } from './Icon.tsx'
import { SavedLink } from './SavedLink.tsx'
import { AccountLink } from './AccountLink.tsx'
import { LangSwitch } from './LangSwitch.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'

/* Низ шторки меню — служебное под полками (И770, поправка И772). Слово заказчика
   05.10.2026: «внизу плохо, огромная неаккуратная панель выбора языка, одинокий
   переключатель темы, дизайн не согласован; туда же иконки избранного и кабинет»;
   затем, увидев строки: «в меню это нужно кнопками-иконками, а не текстом;
   переключение языков кнопками на единой подложке, стильно, минималистично».

   Две группы под чертой:
   · «куда ещё» — о нас, блог, доставка, контакты — строками меню набора
     (styles/menu.module.css, образец shadcn/ui DropdownMenu, MIT): знак и слово,
     потому что это переходы, а не действия; знак — из данных шапки
     (lib/shell.ts);
   · «моё и как показать» — одним рядом: избранное с числом, кабинет и тема —
     знаками-кнопками шапки (`glyph`, styles/glyph.module.css: те же, что в шапке
     на широкой коробке, без слов), справа язык — кодами на одной подложке
     (`seg`, вид `tray`: выбранный приподнят над подложкой; тот же орган, что в
     шапке при двух языках). Слова у знаков нет — имя им даёт `aria-label`; язык —
     код, вслух код и имя языка (`LangSwitch`).
   Один компонент на шапку и дизайн-систему — образец и сайт берут одну деталь. */
export function MenuFoot({ lang, top, service }: { lang: Lang; top: ServiceLink[]; service: ServiceLink[] }) {
  /* Ссылки верхней строки и служебные шторки — одним списком, без повторов
     (контакты стоят в обоих). */
  const links = [...top.filter((l) => !service.some((x) => x.href === l.href)), ...service]
  return (
    <div className={s.sheetFoot}>
      {links.length ? (
        <ul className={m.list} data-tone="quiet">
          {links.map((l) => <li key={l.href}><a className={b.row} href={l.href}>{l.sign ? <Icon id={l.sign} /> : null}{l.label}</a></li>)}
        </ul>
      ) : null}
      <div className={s.sheetTools}>
        <div className={s.sheetSigns}>
          <SavedLink lang={lang} label={t(lang, 'nav.saved')} />
          <AccountLink lang={lang} label={t(lang, 'nav.account')} sheet />
          <ThemeToggle label={t(lang, 'theme.toggle')} className={s.glyph} sun={s.sun} moon={s.moon} />
        </div>
        <LangSwitch lang={lang} label={t(lang, 'nav.lang')} />
      </div>
    </div>
  )
}
