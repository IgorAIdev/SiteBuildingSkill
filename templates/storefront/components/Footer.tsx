import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './Footer.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { Doc } from '@/lib/source/contract.ts'
import { isKey, t } from '@/lib/i18n/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { COMPANY, ANPC_SAL_URL, TERMS_DOC } from '@/lib/company.ts'
import { CONTACTS, MESSENGERS, SOCIALS, chatHref, telHref, mailHref } from '@/lib/contacts.ts'
import { Icon } from './Icon.tsx'
import { SIGN } from './marks.ts'
import { Logo } from './Logo.tsx'
import { Newsletter } from './Newsletter.tsx'
import { PayMarks } from './PayMarks.tsx'
import { subscribe } from '@/lib/actions/subscribe.ts'
import { COMPANY_IS_REAL } from '@/lib/flags.ts'

/* Документы по группам подвала (И748; румынский рынок: Legea 365/2002, OUG
   34/2014, OUG 140/2021, GDPR, Legea 506/2004, Legea 232/2022). Порядок —
   порядок списка; документа нет у магазина — нет ссылки. */
const HELP = ['livrare-si-plata', 'retur', 'garantie', 'contact']
const ABOUT = ['despre-noi', 'analize-de-laborator']
const LEGAL = [TERMS_DOC, 'confidentialitate', 'cookie-uri', 'accesibilitate']
/* Год строки прав — год сборки страницы, не отрисовки: страницы статичны. */
const YEAR = new Date().getFullYear()

/* Подвал магазина CBD (бриф docs/design/подвал.md; слово заказчика
   28.09.2026: «футер убогий… как в cbdin: политики и отказ от
   ответственности», затем «пиздец, а не подвал, переделай скилом»; разбор
   impeccable 28.09.2026). Сверху вниз: подписка на рассылку (Newsletter.tsx; на её
   месте стояла строка обещаний — слово заказчика 29.09.2026 «убирай»,
   И549); знак и четыре
   столбца — связь с мессенджерами подписью, магазин (полки из данных), о
   нас, помощь (порядок — слово заказчика 29.09.2026); основание — правила,
   SAL ANPC, год и продавец (закон 365/2002) слева, оговорка о CBD справа. Ссылки на платформу ЕС (SOL/ODR) нет:
   платформа закрыта 20.07.2025, пиктограмму SOL снял приказ ANPC 270/2026.

   Весь подвал — одним кеглем подписи; подпись столбца отличают вес и
   чернила, ссылки — вторичный тон (И540, И542). Столбцы ссылок —
   навигация, названная подписью (`aria-labelledby`). */
/* `idPrefix` — приставка к id подписей столбцов: второй подвал на странице
   (образец в дизайн-системе) не повторяет id первого. На сайте — пусто. */
export function Footer({ lang, docs, shelves, idPrefix = '' }: { lang: Lang; docs: Doc[]; shelves: { href: string; label: string }[]; idPrefix?: string }) {
  /* Документ в подвале — коротким общепринятым именем по адресу (И760; заказчик
     05.10.2026: «сокращай названия до коротких общепринятых»): полное название —
     заголовок его страницы; документа без короткого имени — по заголовку. */
  const name = (d: Doc) => { const key = `footer.doc.${d.slug}`; return isKey(key) ? t(lang, key) : d.title }
  const links = (slugs: string[]) => slugs.flatMap((slug) => docs.filter((d) => d.slug === slug)).map((d) => <li key={d.slug}><a className={b.word} href={hrefFor(lang, { doc: d.slug })}>{name(d)}</a></li>)
  /* Кнопка отказа от договора — первый шаг (ст. 11a Директивы 2011/83, с
     19.06.2026: видна всё время права на отказ; И748) — ссылкой «Помощи»
     сразу за возвратом. */
  const withdrawLink = <li key="withdraw"><a className={b.word} href={hrefFor(lang, { withdraw: true })}>{t(lang, 'footer.withdraw')}</a></li>
  const chats = MESSENGERS.flatMap((m) => { const href = chatHref(m, ''); return href ? [{ key: m.key, label: m.label, href }] : [] })
  return (
    <footer className={s.foot} data-ground="deck">
      {/* Языка в подвале нет (И484): он в шапке и в меню — там, где его
          ищут. Слово заказчика 27.09.2026: «я в жизни никогда не видел выбора
          языка в подвале — убирай». */}
      <div className={p.wrap}>
        <Newsletter
          action={subscribe.bind(null, lang)} policy={hrefFor(lang, { doc: 'confidentialitate' })}
          words={{ title: t(lang, 'news.title'), lead: t(lang, 'news.lead'), label: t(lang, 'news.label'), hint: t(lang, 'news.hint'), submit: t(lang, 'news.submit'), consent: t(lang, 'news.consent'), policy: t(lang, 'news.policy'), done: t(lang, 'news.done') }}
        />
      </div>
      <div className={`${p.wrap} ${s.top}`}>
        <div className={s.brand}>
          <a className={s.logo} href={hrefFor(lang, { home: true })}><Logo /></a>
          <p className={s.tagline}>{t(lang, 'footer.tagline')}</p>
          {/* Соцсети — знаками без слова, тихой кнопкой сайта без плиты
              (`btn`, `bare`): ответ на руку — вида «слово и знак», тот же,
              что у ссылок рядом (правило 10, И685). Оплата — ниже всех ссылок
              в основании подвала, знаками без плашки (`PayMarks`, И549, И783). */}
          <ul className={`${p.cluster} ${s.social}`} aria-label={t(lang, 'footer.social')}>
            {SOCIALS.filter((x) => x.href).map((x) => <li key={x.key}><a className={b.btn} data-voice="bare" data-pager="" href={x.href} target="_blank" rel="noopener noreferrer" aria-label={x.label}><Icon id={SIGN[x.key]} /></a></li>)}
          </ul>
        </div>
        <div className={`${p.cluster} ${s.cols}`}>
          <div className={s.col}>
            <p className={s.head} id={`${idPrefix}foot-contact`}>{t(lang, 'footer.contact')}</p>
            <ul className={s.list} aria-labelledby={`${idPrefix}foot-contact`}>
              <li><a className={b.word} href={telHref()}><Icon id="phone" />{CONTACTS.phone}</a></li>
              {/* Почта переносится по «@» (`wbr`): в половине телефона она шире ячейки (И760). */}
              <li><a className={b.word} href={mailHref()}><Icon id="mail" /><span>{CONTACTS.email.replace(/@.*/, '')}<wbr />{CONTACTS.email.replace(/^[^@]*/, '')}</span></a></li>
              {chats.map((m) => <li key={m.key}><a className={b.word} href={m.href} rel="noopener" data-mark={m.key}><Icon id={SIGN[m.key]} />{m.label}</a></li>)}
            </ul>
          </div>
          <nav className={s.col} aria-labelledby={`${idPrefix}foot-shop`}>
            <p className={s.head} id={`${idPrefix}foot-shop`}>{t(lang, 'footer.shop')}</p>
            <ul className={s.list}>{shelves.map((x) => <li key={x.href}><a className={b.word} href={x.href}><span className={s.shelf}>{x.label}</span></a></li>)}</ul>
          </nav>
          <nav className={s.col} aria-labelledby={`${idPrefix}foot-about`}>
            <p className={s.head} id={`${idPrefix}foot-about`}>{t(lang, 'footer.about')}</p>
            <ul className={s.list}>{links(ABOUT)}<li><a className={b.word} href={hrefFor(lang, { blog: true })}>{t(lang, 'nav.blog')}</a></li></ul>
          </nav>
          <nav className={s.col} aria-labelledby={`${idPrefix}foot-help`}>
            <p className={s.head} id={`${idPrefix}foot-help`}>{t(lang, 'footer.help')}</p>
            <ul className={s.list}>{links(HELP.slice(0, 2))}{withdrawLink}{links(HELP.slice(2))}</ul>
          </nav>
        </div>
      </div>
      {/* Основание: слева правила и продавец, справа, к правому краю, —
          оговорка о CBD (слово заказчика 29.09.2026: «в правую часть к
          правому краю двигай», и правила от этого встают выше). */}
      <div className={`${p.wrap} ${s.bottom}`}>
        <div className={s.base}>
          <ul className={s.legalLinks}>
            {links(LEGAL)}
            <li><a className={b.word} href={ANPC_SAL_URL} rel="noopener">{t(lang, 'footer.anpc')}</a></li>
          </ul>
          <PayMarks label={t(lang, 'footer.pay')} />
          <address className={s.seller}>
            © {YEAR} <span translate="no">{COMPANY.name}</span> · CUI {COMPANY.cui} · {COMPANY.regCom} · {COMPANY.address}
            {COMPANY_IS_REAL ? null : ` · ${t(lang, 'sample')}`}
          </address>
        </div>
        <p className={s.notice}>{t(lang, 'footer.disclaimer')}</p>
      </div>
    </footer>
  )
}
