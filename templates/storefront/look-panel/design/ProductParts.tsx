import f from '@/styles/form.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { Product } from '@/lib/source/contract.ts'
import { source } from '@/lib/source/index.ts'
import { sample } from '@/lib/source/sample/catalog.ts'
import { productView, labView, type LabView } from '@/lib/product-view.ts'
import { t } from '@/lib/i18n/index.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { ProductView } from '@/components/ProductView.tsx'
import { ProductDetails } from '@/components/ProductDetails.tsx'
import { Gallery } from '@/components/Gallery.tsx'
import { VariantPicker } from '@/components/VariantPicker.tsx'
import { AddToCart } from '@/components/AddToCart.tsx'
import { StickyBuy } from '@/components/StickyBuy.tsx'
import { QuickOrder } from '@/components/QuickOrder.tsx'
import { LabReport } from '@/components/LabReport.tsx'
import { FocusLine } from '@/components/FocusLine.tsx'
import { Price } from '@/components/Price.tsx'
import { Part } from './parts.tsx'
import s from './product.module.css'

/* Блоки → «Товар»: настоящие компоненты карты товара (И605) на настоящем
   товаре образца — том же, что открывает страница товара, теми же
   строителями (lib/product-view.ts), без выбора в адресе: стоит стандартный
   вариант, как у покупателя, пришедшего по ссылке. Товар — из первой
   страницы каталога тот, у кого больше всего того, что показывать: выбор
   из нескольких групп, несколько снимков, протокол партии.

   Карта целиком стоит первой, части — под ней, каждая своим разделом. Якоря
   слайдов и разделов у частей — свои (`design-…`): страница не держит двух
   узлов с одним именем. */
const fullness = (x: Product) => Math.min(x.optionGroups.length, 2) * 4 + (x.images.length > 1 ? 2 : 0) + (x.labReports.length ? 1 : 0)

async function shownProduct(lang: Lang): Promise<Product | null> {
  const page = await source().listing(lang, { facets: {}, sort: 'popular', page: null })
  if (!page.ok) return null
  const all = (await Promise.all(page.value.items.map((c) => source().product(lang, c.id)))).flatMap((r) => (r.ok ? [r.value] : []))
  return all.reduce<Product | null>((best, x) => (!best || fullness(x) > fullness(best) ? x : best), null)
}

/* Протокол партии. У движка торговли протоколов может не быть (у Vendure
   партий нет, lib/source/vendure/catalog.ts) — тогда показывается протокол
   образцового каталога набора тем же строителем, и подпись раздела это
   говорит. */
async function shownLab(lang: Lang, own: LabView | null): Promise<{ lab: LabView; stand: boolean } | null> {
  if (own) return { lab: own, stand: false }
  const ids = await sample.productIds()
  for (const id of ids.ok ? ids.value : []) {
    const r = await sample.product(lang, id)
    const report = r.ok ? r.value.labReports[0] : undefined
    if (report) return { lab: labView(lang, report), stand: true }
  }
  return null
}

export async function ProductParts({ lang }: { lang: Lang }) {
  const product = await shownProduct(lang)
  if (!product) {
    return (
      <Part title="Страница товара" lede="Магазин не отдал ни одного товара — показывать нечего.">
        <p lang={lang} />
      </Part>
    )
  }
  const [col, related] = await Promise.all([source().collection(lang, product.category), source().related(lang, product.id, 4)])
  const view = productView(lang, product, {}, { category: col.ok ? col.value : null, related: related.ok ? related.value : [] })
  const own = <T extends { id: string }>(xs: T[]) => xs.map((x) => ({ ...x, id: `design-${x.id}` }))
  const lab = await shownLab(lang, view.lab)

  return (
    <>
      <Part title="Страница товара" lede="Карта товара целиком, как её видит покупатель: снимки слева, имя, цена и покупка справа, под ними — описание и похожие товары.">
        <div lang={lang}>
          <ProductView view={view} lang={lang} submit={cartSubmit} call={cartCall} />
        </div>
      </Part>
      <Part title="Подробности товара" lede="Описание, состав и способ применения — заголовками и текстом под верхом карты товара, от левого края.">
        <div lang={lang}>
          <ProductDetails details={{ ...view.details, parts: own(view.details.parts) }} />
        </div>
      </Part>
      <Part title="Галерея снимков" lede="Главный снимок с листанием, сердце «в избранное» в его углу — как на карточке полки — и ряд миниатюр под ним: левая колонка карты товара.">
        <div lang={lang} className={s.gallery}>
          <Gallery view={{ ...view.gallery, slides: own(view.gallery.slides) }} save={{ id: view.id, ...view.save }} />
        </div>
      </Part>
      <Part title="Выбор варианта" lede="Группы выбора — крепость, объём и другие — над ценой; выбранное отмечено, сочетания, которого нет, нажать нельзя.">
        <div lang={lang} className={s.choice}>
          <VariantPicker groups={view.groups} error={null} />
        </div>
      </Part>
      <Part title="Кнопка «в корзину»" lede="Строка покупки под ценой: количество, «в корзину» и «быстрый заказ» одной строкой.">
        <div lang={lang} className={s.column}>
          <AddToCart lang={lang} buy={view.buy} hint={view.message} submit={cartSubmit} call={cartCall} />
        </div>
      </Part>
      <Part title="Полоса покупки внизу экрана" lede="Цена и «в корзину» у низа экрана телефона: появляется, когда строка покупки ушла вверх за край. Здесь — в рамке шириной телефона, пока карта товара выше прокручена из виду.">
        <div lang={lang} className={s.phone}>
          <StickyBuy buy="buy" label={view.buy.add}><Price now={view.price} was={view.was} /></StickyBuy>
        </div>
      </Part>
      <Part title="Быстрый заказ" lede="Кнопка рядом с «в корзину»: открывает окно с мессенджерами и полем телефона — заказ одним сообщением.">
        <div lang={lang}>
          <QuickOrder view={view.buy.quick} />
        </div>
      </Part>
      {lab ? (
        <Part title="Протокол партии" lede={`Анализ партии выбранного варианта: лаборатория, дата, CBD и THC. На карте открывается окном со знака у звёзд.${lab.stand ? ' У магазина протоколов пока нет — показан протокол образца.' : ''}`}>
          <div lang={lang} className={s.column}>
            <LabReport lab={lab.lab} level={3} />
          </div>
        </Part>
      ) : null}
      <Part title="Строка ошибки выбора" lede="Красная строка под первой невыбранной группой, когда «в корзину» нажали без выбора; на карте на неё сразу переходит фокус.">
        <div lang={lang}>
          <FocusLine id="design-choose-error" className={f.say} focus={false}>{t(lang, 'product.choose')}</FocusLine>
        </div>
      </Part>
    </>
  )
}
