import type { Lang } from '@/lib/locale.ts'
import type { Collection, Effect, Post, Review } from '@/lib/source/contract.ts'
import type { ShelfCard } from '@/lib/view.ts'
import type { PledgesView } from '@/lib/pledges.ts'
import type { Air, HomeVariant } from '@/lib/homes.ts'
import type { Tone } from '@/lib/bands.ts'
import type { CartActions } from '../ProductCard.tsx'

/** Доставка для блока главной: способы — тем же видом, что выбор на
 *  оформлении (`deliveryView`, И95), и адрес страницы условий доставки,
 *  если она есть. Собирает страница; источник молчит — способов нет. */
/** `home` — вариант главной из вида (lib/homes.ts): блок раскладывается по
 *  нему. `pledges` — обещания покупки из данных магазина (lib/pledges.ts);
 *  их ставит вариант, которому они нужны у первого экрана. `cart` — запись
 *  в корзину для кнопки карточки полки; действия передаёт страница.
 *  `spotlight` — товар первого экрана: первый из ходовых страницы; его
 *  кладёт на снимок вариант, у которого герой показывает товар; ходовых
 *  нет — null. `effects` — эффекты для их ряда дверей; источник молчит —
 *  пусто, и ряда нет. `reviews` и `posts` — отзывы и статьи источника
 *  содержания для их лент (И728, И729); молчит источник — пусто, и ленты нет. */
export type BlockCtx = { lang: Lang; home: HomeVariant; collections: Collection[]; effects: Effect[]; cards: Record<string, ShelfCard>; spotlight: ShelfCard | null; pledges: PledgesView; cart: CartActions; bands: Readonly<Record<string, Tone>>; reviews: Review[]; posts: Post[] }
/** Место блока на главной: воздух над ним — роль примитива `section`
 *  (`data-air`); null — воздух раздела. */
export type Place = { air: Air | null }
