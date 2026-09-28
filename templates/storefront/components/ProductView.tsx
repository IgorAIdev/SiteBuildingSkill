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

/* Карта товара. Колонка покупки — группы, и воздух между группами крупнее
   воздуха внутри (И278, И444; бриф docs/design/карта-товара.md, §7): что
   это — марка, имя, цена; как купить — выбор варианта и строка покупки
   (количество, «в корзину», «быстрый заказ»); что внутри — поле основных
   параметров; о товаре — меню и разделы: описание, состав, применение,
   протокол (ProductDetails). Порядок — слово заказчика 27.09.2026 (И466):
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
          <Gallery view={view.gallery} />
        </div>
        <div className={`${p.stack} ${s.offer}`}>
          <div className={s.identity}>
            <h1 className={s.name}>{view.brand ? <span className={s.brand} translate="no">{view.brand} </span> : null}{view.name}</h1>
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
            <Price now={view.price} was={view.was} size="lead">
              {view.stock ? <span className={s.stock} data-level={view.stockLevel ?? undefined}>{view.stock}</span> : null}
            </Price>
            <AddToCart lang={lang} buy={view.buy} hint={view.message} submit={submit} call={call} />
          </div>
          {view.facts ? <KeyFacts facts={view.facts} /> : null}
          <ProductDetails details={view.details} />
        </div>
        <StickyBuy buy="buy" label={view.buy.add}><Price now={view.price} was={view.was} /></StickyBuy>
      </section>
      {view.related.length ? (
        <Shelf title={view.relatedTitle} id="related-title" all={view.relatedAll} cards={view.related} cart={{ submit, call }} className={s.related} />
      ) : null}
    </>
  )
}
