import type { Block, Collection, Commerce, Content, Effect, Facet, Source } from './contract.ts'
import { sample } from './sample/catalog.ts'
import { sampleContent } from './sample/content.ts'
import { sampleCommerce } from './sample/commerce.ts'
import { vendureEnv, vendureSource } from './vendure/catalog.ts'
import { vendureCommerce } from './vendure/commerce.ts'
import { formOf } from './details.ts'
import { effectShot, shelfShot } from './sample/shelf-shots.ts'
import { CATEGORIES, EFFECTS } from '../products.ts'
import type { Lang } from '../locale.ts'
import { REVIEWS_ARE_REAL } from '../flags.ts'
import { categoryCopy, effectCopy } from '../content/shop-copy.ts'
import { EFFECT_FACET } from './effect.ts'

/* Один выбор источника на всю витрину (`SOURCE` в .env):
   · `sample` — образец в lib/ (по умолчанию);
   · `vendure` — торговля из Vendure Shop API: каталог и корзина движка
     (`VENDURE_SHOP_API_URL`, `VENDURE_CHANNEL_TOKEN`), содержание — пока
     образец; заказы ставятся только при `VENDURE_PLACE_ORDERS=on`;
   · `live` (Vendure + Payload) — план 4, содержание из Payload. */
const which = () => process.env.SOURCE ?? 'sample'

/** Принимает ли магазин заказы: образец ставит свои, движок — только словом
 *  `VENDURE_PLACE_ORDERS=on`. Пока нет — сайт говорит об этом полосой над
 *  шапкой (BuildingNotice, И792), а не только ошибкой у кнопки заказа. */
export const ordersOpen = (): boolean => which() === 'sample' || process.env.VENDURE_PLACE_ORDERS === 'on'

/* Редакционный лид известных полок — из content/shop-copy.ts на языке страницы.
   Незнакомые полки сохраняют описание движка. Кадр полки — у движка;
   у полки без снимка — кадр полки образца её вида
   (`formOf` по адресу, sample/shelf-shots.ts), пока свой кадр не даёт
   Payload (план 4): плашка полки без снимка — пустая плашка. */
const framed = (c: Collection, lang: Lang): Collection => {
  const form = c.image ? null : formOf([c.slug])
  const copy = categoryCopy(lang, c.slug)
  return { ...c, name: copy?.name ?? c.name, description: copy?.caption ?? copy?.lede ?? c.description, image: form ? shelfShot(form, c.name) : c.image }
}

/* Кадр эффекта — так же: у значения грани в движке снимка нет, и эффект
   берёт кадр образца по своему коду (sample/shelf-shots.ts); кода там нет —
   плитка без снимка. Описания у значения грани в движке тоже нет: эффект
   сначала берёт редакционный лид по коду, затем описание движка или образца
   (lib/products.ts, EFFECTS) — его
   читают строка плитки «Caption», вступление и описание страницы эффекта;
   кода там нет — описание пустое, как было. Пока своё не даст Payload (план 4). */
const told = (e: Effect, lang: Lang): string => { const c = effectCopy(lang, e.code); return c?.caption ?? c?.lede ?? (e.description || (EFFECTS.find((x) => x.effect === e.code)?.description[lang] ?? '')) }
/* Значение грани эффекта в фильтре — тем же именем, что хаб в меню и плитке
   (имя момента из shop-copy.ts, И788); у движка значение названо по-своему. */
const namedFacets = (facets: Facet[], lang: Lang): Facet[] => facets.map((f) => (f.code === EFFECT_FACET ? { ...f, values: f.values.map((v) => ({ ...v, name: effectCopy(lang, v.code)?.name ?? v.name })) } : f))
const shotOf = (e: Effect, lang: Lang): Effect => ({ ...e, name: effectCopy(lang, e.code)?.name ?? e.name, image: e.image ?? effectShot(e.code, e.name), description: told(e, lang) })

let trade: { source: Source; commerce: Commerce; content: Content } | null = null
function vendure() {
  if (!trade) {
    const env = vendureEnv()
    const engine = vendureSource(env)
    const catalog: Source = {
      ...engine,
      async collections(lang) { const r = await engine.collections(lang); return r.ok ? { ok: true, value: r.value.map((c) => framed(c, lang)) } : r },
      async collection(lang, slug) { const r = await engine.collection(lang, slug); return r.ok ? { ok: true, value: framed(r.value, lang) } : r },
      async effects(lang) { const r = await engine.effects(lang); return r.ok ? { ok: true, value: r.value.map((e) => shotOf(e, lang)) } : r },
      async listing(lang, query) { const r = await engine.listing(lang, query); return r.ok ? { ok: true, value: { ...r.value, facets: namedFacets(r.value.facets, lang) } } : r },
    }
    trade = { source: catalog, commerce: vendureCommerce({ ...env, placeOrders: process.env.VENDURE_PLACE_ORDERS === 'on' }), content: standIn(catalog) }
  }
  return trade
}

/* Содержание при торговле из Vendure — образец, пока не подключён Payload.
   Одно место образца знает товары по адресу — «Ходовые» главной, адреса
   товаров образца; у движка таких нет, и блок молча исчез бы. До Payload
   ходовые — первые четыре товара каталога движка по его порядку: подставка
   на время, записанная здесь, а не догадка на странице. */
function standIn(catalog: Source): Content {
  return {
    ...sampleContent,
    /* Отзывов у движка нет (в ядре Vendure их нет, приём — docs/open.md,
       «Отзывы покупателей»; И728). Пока отзывы образцовые
       (`REVIEWS_ARE_REAL = false`), шаблон на движке показывает образцы — с
       отметкой «Sample review» у каждой карточки, — но без ссылки на товар:
       товаров образца у движка нет, а образец о масле, приставленный к чужому
       товару движка, был бы отзывом не о том товаре. Флаг настоящести поднят —
       образцов нет вовсе, список пуст до приёма отзывов движком, и лента
       молчит. */
    async reviews(lang) {
      if (REVIEWS_ARE_REAL) return { ok: true, value: [] }
      const r = await sampleContent.reviews(lang)
      return r.ok ? { ok: true, value: r.value.map((x) => ({ ...x, product: null })) } : r
    },
    async page(lang, slug) {
      const r = await sampleContent.page(lang, slug)
      if (!r.ok || !r.value.blocks.some((b) => b.type === 'featured' || b.type === 'hero')) return r
      /* Полка категории (`to`) — первые товары полки движка того же вида:
         у образца масла — `uleiuri`, у движка — `oil`; вид полки (`formOf`)
         у них один. Такой полки у движка нет — полка пуста и молча не
         стоит. */
      const cols = await catalog.collections(lang)
      const engineShelf = (to: string) => {
        const form = CATEGORIES.find((c) => c.slug === to)?.form ?? formOf([to])
        return cols.ok ? cols.value.find((c) => c.slug === to || (form && formOf([c.slug]) === form))?.slug : undefined
      }
      const firstOf = async (category?: string) => {
        const top = await catalog.listing(lang, { category, facets: {}, sort: 'popular', page: null })
        return top.ok ? top.value.items.slice(0, category ? 5 : 4).map((c) => c.id) : []
      }
      /* Полки кнопками героя — тем же ходом: полка движка того же вида. */
      const blocks: Block[] = await Promise.all(r.value.blocks.map(async (b): Promise<Block> => (b.type === 'featured' ? (b.to ? { ...b, to: engineShelf(b.to), ids: engineShelf(b.to) ? await firstOf(engineShelf(b.to)) : [] } : { ...b, ids: await firstOf() })
        : b.type === 'hero' && Array.isArray(b.shelves) ? { ...b, shelves: b.shelves.flatMap((s) => engineShelf(s) ?? []) } : b)))
      return { ok: true, value: { ...r.value, blocks } }
    },
  }
}

export function source(): Source {
  if (which() === 'vendure') return vendure().source
  if (which() !== 'sample') throw new Error(`SOURCE=${which()} ещё не подключён — план 4`)
  return sample
}

export function content(): Content {
  if (which() === 'vendure') return vendure().content
  if (which() !== 'sample') throw new Error(`SOURCE=${which()} ещё не подключён — план 4`)
  return sampleContent
}

export function commerce(): Commerce {
  if (which() === 'vendure') return vendure().commerce
  if (which() !== 'sample') throw new Error(`SOURCE=${which()} ещё не подключён — план 4`)
  return sampleCommerce
}
