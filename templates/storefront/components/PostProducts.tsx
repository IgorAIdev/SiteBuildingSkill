import p from '@/styles/primitives.module.css'
import b from '@/styles/btn.module.css'
import s from './PostProducts.module.css'
import type { ShelfCard } from '@/lib/view.ts'
import type { CartActions } from './ProductCard.tsx'
import { ProductRow } from './ProductRow.tsx'
import { CartForm } from './CartForm.tsx'
import { AddLabel } from './AddLabel.tsx'

/* Товары статьи — строками в конце текста (вариант «В», выбор заказчика 23.10.2026 из трёх
   на его статье; research/article-products-2026-10-23.md). Товар назван в тексте ссылкой там,
   где о нём речь; здесь — повтор названного для дочитавших, до четырёх, по порядку упоминания
   (`namedProducts`). Строка — строка товара сайта (`ProductRow`, та же, что в окне поиска):
   снимок, марка, имя, упаковка, цена; рядом — «в корзину» кнопкой-знаком (круг, `data-pager`)
   с числом в корзине (`AddLabel`), как у карточки полки. Статья без названных товаров ставит
   три ходовых своей полки под именем «Matching products».

   Лист поверхности сайта — тот же, что лист страницы корзины (`--surface`, угол и поле
   карточки): отделяет товары от текста статьи, но не красит их рекламой (NN/g, banner
   blindness): ни краски марки, ни движения. Восьми ходовых после вопросов больше нет — ни
   один из тринадцати замеренных магазинов так не делает. */
export function PostProducts({ title, cards, cart }: { title: string; cards: ShelfCard[]; cart: CartActions }) {
  return (
    <section className={s.box} aria-labelledby="post-products">
      <h2 id="post-products" className={s.title}>{title}</h2>
      <ul className={s.list}>
        {cards.map((c) => (
          <li key={c.id} className={s.item}>
            <ProductRow card={c} facts stack />
            {c.buy.variant ? (
              <CartForm lang={c.lang} className={s.buy} refresh={false} quiet submit={cart.submit} call={cart.call} initial={null} timeout={c.buy.timeout} failed={c.buy.failed}>
                <input type="hidden" name="op" value="add" />
                <input type="hidden" name="variant" value={c.buy.variant} />
                <input type="hidden" name="quantity" value="1" />
                <button className={`${b.btn} ${p.tap}`} data-pager="" data-hand="pop" type="submit" aria-label={c.buy.name}>
                  <AddLabel variant={c.buy.variant} add={c.buy.add} short={c.buy.short} added={c.buy.added} />
                </button>
              </CartForm>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
