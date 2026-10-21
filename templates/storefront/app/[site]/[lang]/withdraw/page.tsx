import type { Metadata } from 'next'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { toMetadata } from '@/lib/seo.ts'
import { breadcrumbLd } from '@/lib/ld.ts'
import { withdraw } from '@/lib/actions/withdraw.ts'
import { withdrawWords } from '@/lib/doc-view.ts'
import { Breadcrumbs, trailTo } from '@/components/Breadcrumbs.tsx'
import { JsonLd } from '@/components/JsonLd.tsx'
import { WithdrawForm } from '@/components/WithdrawForm.tsx'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  return toMetadata(lang, { title: t(lang, 'withdraw.title'), description: t(lang, 'withdraw.lede'), path: (l) => hrefFor(l, { withdraw: true }) })
}

/* Отказ от договора — второй шаг (И748): первый — кнопка «Retrageți-vă din
   contract aici» в подвале и на странице возврата (ст. 11a Директивы
   2011/83, с 19.06.2026: видна и доступна всё время права на отказ). Здесь —
   имя, строка о сроке и форма с одной кнопкой «Confirmați retragerea». Шапка
   — шапка страницы сайта (`pagehead`), форма — мерой формы, как касса. */
export default async function WithdrawPage({ params }: Props) {
  const lang = await langOf(params)
  const home = { name: t(lang, 'crumb.home'), href: hrefFor(lang, { home: true }) }
  const title = t(lang, 'withdraw.title')
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <JsonLd data={breadcrumbLd([home, { name: title, href: hrefFor(lang, { withdraw: true }) }])} />
      <Breadcrumbs trail={trailTo([home], title)} label={t(lang, 'crumb.label')} />
      <div className={p.stack}>
        <div className={p.pagehead}>
          <h1>{title}</h1>
          <p>{t(lang, 'withdraw.lede')}</p>
          <p className={p.note}>{t(lang, 'withdraw.term')}</p>
        </div>
        <WithdrawForm action={withdraw.bind(null, lang)} words={withdrawWords(lang)} />
      </div>
    </main>
  )
}
