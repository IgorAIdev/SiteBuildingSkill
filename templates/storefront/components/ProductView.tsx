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
        <div className={`${p.stack} ${s.offer}`}>
          <div className={s.identity}>
            {/* Сердце «в избранное» стоит не у имени, а квадратной кнопкой в строке покупки — рядом с «В корзину» и «Быстрым заказом» (слово заказчика 02.10.2026). */}
            <div className={s.title}>
              <h1 className={s.name}>{view.brand ? <span className={s.brand} translate="no">{view.brand} </span> : null}{view.name}</h1>
            </div>
            {/* Оценка и протокол партии — одной строкой под именем: доверие к
                товару рядом (заказчик 28.09.2026: «lab report правее от звёзд»;
                И515). Артикул варианта — в конце той же строки (И589: слово
                заказчика 30.09.2026 «артикул нужно где-то разместить»; eMAG —
                «Cod produs» под именем). Наличие — первым в этой строке (слово заказчика
                02.10.2026: «in stock размещать первым в одной строке с отзывами и
                SKU»; раньше стояло у цены). Нет ничего — строки нет. */}
            {view.stock || view.rating || view.lab || view.sku ? (
              <div className={s.proof}>
                {view.stock ? <StockMark level={view.stockLevel}>{view.stock}</StockMark> : null}
                {view.rating ? <Rating rating={view.rating} /> : null}
                {view.lab ? <button className={b.btn} data-voice="bare" data-size="sm" type="button" popoverTarget="lab-report"><Icon id="flask" />{view.lab.chip}</button> : null}
                {view.sku ? <span className={s.sku} translate="no">{view.sku}</span> : null}
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
        </div>
        <StickyBuy buy="buy" label={view.buy.add} variant={view.buy.variant} added={view.buy.addedShort}><Price now={view.price} was={view.was} /></StickyBuy>
      </section>
      <ProductDetails details={view.details} />
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
