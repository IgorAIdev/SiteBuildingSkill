import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import p from '@/styles/primitives.module.css'
import { langOf } from '@/lib/route.ts'
import { commerce, content } from '@/lib/source/index.ts'
import { hrefFor } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { deliveryTable } from '@/lib/checkout-view.ts'
import { toMetadata } from '@/lib/seo.ts'
import { breadcrumbLd } from '@/lib/ld.ts'
import { Breadcrumbs, trailTo } from '@/components/Breadcrumbs.tsx'
import { DeliveryTable } from '@/components/DeliveryTable.tsx'
import { DocView, DOC_TABLE } from '@/components/DocView.tsx'
import { DocTable } from '@/components/DocTable.tsx'
import { ConsentOpen } from '@/components/ConsentOpen.tsx'
import { GuaranteeNotice } from '@/components/GuaranteeNotice.tsx'
import { optionalOf, storageTable } from '@/lib/consent-view.ts'
import { Faq } from '@/components/blocks/Faq.tsx'
import { docView, plainOf } from '@/lib/doc-view.ts'
import b from '@/styles/btn.module.css'
import { JsonLd } from '@/components/JsonLd.tsx'
import { Unavailable } from '@/components/StateScreen.tsx'

type Props = { params: Promise<{ lang: string; doc: string }> }

const NO_AIR = { air: null }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langOf(params)
  const { doc } = await params
  const r = await content().doc(lang, doc)
  if (!r.ok) return {}
  return toMetadata(lang, { title: r.value.title, description: r.value.summary, path: (l) => hrefFor(l, { doc }) })
}

export default async function DocPage({ params }: Props) {
  const lang = await langOf(params)
  const { doc } = await params
  const r = await content().doc(lang, doc)
  if (!r.ok) {
    if (r.reason === 'unavailable') return <Unavailable lang={lang} />
    notFound()
  }
  const home = { name: t(lang, 'crumb.home'), href: hrefFor(lang, { home: true }) }
  /* Документ просит таблицу способов — она из списка оформления; источник
     покупки молчит — документ стоит без таблицы, а не падает. */
  const methods = r.value.table === 'delivery' ? await commerce().deliveryMethods(null, lang) : null
  const view = methods?.ok ? deliveryTable(lang, methods.value) : null
  /* Политика cookie (И791): первым разделом — строго необходимое из реестра
     (lib/storage.json); рукописной таблицы нет — она расходилась с кодом. */
  const storage = r.value.table === 'storage' ? storageTable(lang, 'necessary') : null
  const lead = view ? { id: DOC_TABLE, heading: view.caption } : storage ? { id: DOC_TABLE, heading: storage.caption } : null
  const table = view ? <DeliveryTable view={view} labelledBy={DOC_TABLE} /> : storage ? <DocTable head={storage.head} rows={storage.rows} labelledBy={DOC_TABLE} /> : null
  const page = docView(lang, r.value, lead)
  /* Вещи сайта в разделах документа (`slot`): кнопка отказа — первый шаг (И748),
     ведёт к форме, где второй шаг — «Confirmați retragerea», вид — громкая кнопка
     сайта; «Setări cookie» и таблицы необязательных категорий — только у магазина,
     где они есть (раздел `when: consent`); уведомление ЕС о гарантии — картинкой
     ЕС без изменений (Регл. 2025/1960; нет файла — ничего). */
  const slots = {
    withdrawal: <p><a className={b.btn} data-voice="loud" href={hrefFor(lang, { withdraw: true })}>{t(lang, 'withdraw.button')}</a></p>,
    'cookie-settings': <p><ConsentOpen label={t(lang, 'consent.open')} voice="quiet" /></p>,
    'cookie-optional': optionalOf().map((c) => { const x = storageTable(lang, c); const id = `storage-${c}`; return <div key={c} className={p.stack}><h3 id={id}>{x.caption}</h3><DocTable head={x.head} rows={x.rows} labelledBy={id} /></div> }),
    'guarantee-notice': <GuaranteeNotice lang={lang} inline />,
  }
  /* Вопросы документа — блок FAQ сайта с разметкой FAQPage (И503); ответ —
     строкой без разметки ссылок. */
  const faq = r.value.faq.length ? { type: 'faq' as const, title: t(lang, 'doc.faq'), items: r.value.faq.map((x) => ({ q: plainOf(x.q), a: plainOf(x.a) })) } : null
  return (
    <main id="main" className={`${p.wrap} ${p.section}`} data-air="head">
      <JsonLd data={breadcrumbLd([home, { name: r.value.title, href: hrefFor(lang, { doc }) }])} />
      <Breadcrumbs trail={trailTo([home], r.value.title)} label={t(lang, 'crumb.label')} />
      <DocView view={page} table={table} slots={slots} />
      {faq ? <Faq block={faq} place={NO_AIR} /> : null}
    </main>
  )
}
