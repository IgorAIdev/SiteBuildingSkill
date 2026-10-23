import p from '@/styles/primitives.module.css'
import s from './ProductView.module.css'
import type { ProductPageView } from '@/lib/product-view.ts'
import type { Outcome } from '@/lib/cart-ops.ts'
import { Breadcrumbs } from './Breadcrumbs.tsx'
import { Shelf } from './Shelf.tsx'
import { Gallery } from './Gallery.tsx'
import { VariantPicker } from './VariantPicker.tsx'
import { KeyFacts } from './KeyFacts.tsx'
import { AddToCart } from './AddToCart.tsx'
import { ProductDetails } from './ProductDetails.tsx'
import { Price } from './Price.tsx'
import { StickyBuy } from './StickyBuy.tsx'
import { Rating } from './Rating.tsx'
import { StockMark } from './StockMark.tsx'
import { LabReport } from './LabReport.tsx'
import { Icon } from './Icon.tsx'
import { PaneHead } from './PaneHead.tsx'
import pn from '@/styles/pane.module.css'
import b from '@/styles/btn.module.css'

/* Карта товара. Колонка покупки — группы, и воздух между группами крупнее
   воздуха внутри (И278, И444; бриф docs/design/карта-товара.md, §7): что
   это — марка, имя, цена; как купить — выбор варианта и строка покупки
   (количество, «в корзину», «быстрый заказ»); что внутри — поле основных
   параметров. Разделы о товаре (описание, состав, применение) — своим
   блоком под верхом страницы, во всю колонку текста от левого края: верх —
   галерея и колонка покупки — кончается полем параметров, и там же
   кончается ход приклеенной галереи (слово заказчика 28.09.2026: «вот тут
   должен заканчиваться скроллинг, а дескрипшен ниже новый блок к левому
   краю»; И512). Протокол партии — знаком и словом у наличия, сам — в окне. Порядок — слово заказчика 27.09.2026 (И466):
   «бренд, название, цена и количество и кнопки заказа; ниже параметры с
   подвалом; ниже горизонтальное меню». Описание ушло из первой группы в
   свой раздел. Порядок разметки — порядок чтения и на телефоне.

   Марка — первая строка ЗАГОЛОВКА, а не надпись над ним: полное имя товара
   «Câmpia Full-spectrum CBD oil» читается одним заголовком и вслух, и
   поиском; надпись над заголовком — запрет impeccable (`check:design`,
   семья `eyebrow`). */
export function ProductView({ view, lang, submit, call }: { view: ProductPageView; lang: string; submit: (form: FormData) => Promise<void>; call: (form: FormData) => Promise<Outcome> }) {
  return (
    <>
      <Breadcrumbs trail={view.crumbs} label={view.crumbLabel} />
      <section className={`${p.switcher} ${s.pdp}`}>
        {/* Галерея едет рядом с колонкой покупки, пока колонок две (`pinned`),
            и помещается в экран целиком — кадр, зазор, ряд миниатюр. */}
        <div className={`${p.pinned} ${p.bias} ${s.pin}`}>
          <Gallery view={view.gallery} save={{ id: view.id, ...view.save }} />
        </div>
        {/* `data-rhythm` — видимые просветы колонки меряет check:craft (`inkStep`): только ступени ритма. */}
        <div className={`${p.stack} ${s.offer}`} data-rhythm="">
          <div className={s.identity}>
            {/* Сердце «в избранное» стоит не у имени, а квадратной кнопкой в строке покупки — рядом с «В корзину» и «Быстрым заказом» (слово заказчика 02.10.2026). */}
            <div className={s.title}>
              <h1 className={s.name}>{view.brand ? <span className={s.brand} translate="no">{view.brand} </span> : null}{view.name}</h1>
            </div>
            {/* Оценка и протокол партии — одной строкой под именем: доверие к
                товару рядом (заказчик 28.09.2026: «lab report правее от звёзд»;
                И515). Наличие — первым, своей строкой над оценкой (слово заказчика
                02.10.2026: «in stock размещать первым»; 17.10.2026: «рейтинг в
                отдельной строке ниже наличия»). Артикул отсюда ушёл в сведения о
                товаре (ProductDetails; слово заказчика 23.10.2026 после замера пяти
                магазинов — наличие у цены у всех, номер товара у четырёх из пяти внизу,
                в характеристиках). Нет ничего — строки нет. */}
            {view.stock || view.rating || view.lab || view.trust.length ? (
              <div className={s.proof}>
                {view.stock ? (
                  <div className={s.proofRow}>
                    <StockMark level={view.stockLevel}>{view.stock}</StockMark>
                  </div>
                ) : null}
                {/* Строка доказательств — строка слов: «Lab report» висит полем за края, как слова
                    доверия рядом (`data-hang`), и шаг по краске один — 12 между всеми словами, а
                    строка ростом в строку текста. Без вывеса поле кнопки прибавлялось к зазору
                    (27 / 28 / 14) и поднимало строку до 32 (check:craft `inkGap`, `inkStep`, 23.10.2026). */}
                {view.rating || view.lab || view.trust.length ? (
                  <div className={s.proofRow}>
                    {view.rating ? <Rating rating={view.rating} /> : null}
                    {view.lab ? <button className={b.btn} data-voice="bare" data-size="sm" data-hang="inline" type="button" popoverTarget="lab-report"><Icon id="flask" />{view.lab.chip}</button> : null}
                    {view.trust.map((x) => <span key={x.icon} className={b.btn} data-voice="bare" data-size="sm" data-hang="inline" data-static><Icon id={x.icon} />{x.text}</span>)}
                  </div>
                ) : null}
              </div>
            ) : null}
            {/* Описание — между именем и выбором (слово заказчика 28.09.2026:
                «описание на всех карточках, между названием и ценой»):
                короткое «что это» из данных товара; полное — в разделах ниже. */}
            {view.summary ? <p className={s.summary}>{view.summary}</p> : null}
          </div>
          <div className={s.part} id="buy">
            {view.groups.length ? <div className={s.choice}><VariantPicker groups={view.groups} error={view.choose} /></div> : null}
            {/* Цена — у количества и кнопок заказа (слово заказчика
                28.09.2026): читается вместе с тем, что её меняет (выбор
                выше), и с тем, что по ней покупает (кнопка ниже). */}
            <Price now={view.price} was={view.was} size="lead" />
            <AddToCart lang={lang} buy={view.buy} hint={view.message} submit={submit} call={call} />
          </div>
          {view.facts ? <KeyFacts facts={view.facts} /> : null}
          {/* Сведения о товаре — в колонке справа, под покупкой (слово заказчика 17.10.2026: «фиксация картинки и скролл
              информации справа»): галерея стоит, пока читается колонка; в одну колонку порядок прежний — после сведений. */}
          <ProductDetails details={view.details} sku={view.sku} />
        </div>
        {/* Слева в строке у низа окна — имя товара над ценой (слово заказчика 23.10.2026: «слева
            внизу над ценой нужно название товара»): строка покупки ушла за край, и полоса говорит,
            что именно покупается. */}
        <StickyBuy buy="buy" label={view.buy.add} variant={view.buy.variant} added={view.buy.addedShort}>
          <div className={s.barWhat}><span className={s.barName}>{view.name}</span><Price now={view.price} was={view.was} /></div>
        </StickyBuy>
      </section>
      {/* Протокол партии — окном общего модуля (styles/pane.module.css):
          немодальное, `popover` — Escape, щелчок мимо и крестик закрывают
          сами (правило 8). */}
      {view.lab ? (
        <div id="lab-report" popover="auto" className={pn.pane} data-pane="dialog" aria-label={view.lab.title}>
          <PaneHead tag="span" title={view.lab.title} close={view.lab.close} target="lab-report" />
          <div className={pn.body}><LabReport lab={view.lab} level={3} /></div>
        </div>
      ) : null}
      {view.related.length ? (
        <Shelf title={view.relatedTitle} id="related-title" all={view.relatedAll} cards={view.related} cart={{ submit, call }} />
      ) : null}
    </>
  )
}
