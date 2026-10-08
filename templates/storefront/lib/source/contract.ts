import type { Lang } from '../locale.ts'
import type { HeaderVariant } from '../headers.ts'
import type { CardVariant } from '../cards.ts'
import type { HomeVariant } from '../homes.ts'
import type { Account } from './account-contract.ts'

export type Money = { minor: number; currency: string }
export type Stock = 'in' | 'low' | 'out'
/** Снимок. `srcset` — ширины того же снимка от сервера снимков источника
 *  (`адрес 400w, …`), если источник их умеет; нет — снимок один. Какую
 *  ширину взять, решает браузер по месту (lib/shot.ts). */
export type Image = { src: string; alt: string; width: number; height: number; srcset?: string }
export type OptionGroup = { code: string; name: string; options: { code: string; name: string }[] }
/** `was` — цена до скидки (Shopify `compareAtPrice`; у Vendure — своё поле
 *  варианта, план 4); `null` — скидки нет. */
/** `pack` — упаковка варианта (мг CBD и мера, `Pack` ниже): из неё карта
 *  товара считает поле основных параметров; `null` — мера неизвестна. */
export type Variant = { id: string; sku: string; name: string; price: Money; was: Money | null; stock: Stock; options: Record<string, string>; batch: string | null; pack: Pack | null }
export type LabReport = { batch: string; lab: string; date: string; cbdPercent: number; thcPercent: number; url: string }
/** `images` — снимки товара, первый — главный (у Vendure `featuredAsset`,
 *  за ним `assets` без него; план 4). */
/** `strength` — чем товар продаётся (`Strength` ниже), как у его карточки.
 *  `brand` — марка производителя; карта печатает её первой строкой имени
 *  (слово заказчика 25.09.2026: «вверху должен быть бренд указан»);
 *  `null` — марка не заявлена. У Vendure — поле товара `brand`. */
/** Товар. `ingredients` и `usage` — состав и способ применения, текстом
 *  магазина (разделы карты товара, И466); нет у движка — `null`, раздела нет.
 *  `standard` — вариант, выбранный на карте сам, пока покупатель не выбрал
 *  другой (И468): решение магазина; `null` — первый вариант в наличии. */
/** Сосед по линейке (И503): товар той же марки и того же имени с другой
 *  силой или мерой — свой адрес, свои значения выбора (`options` по кодам
 *  `optionGroups`). */
export type LineMember = { id: string; options: Record<string, string>; stock: Stock }
/** Оценка покупателей: средняя звёзд из пяти и число отзывов. `null` — отзывов
 *  нет или движок их не ведёт; витрина тогда строки звёзд не рисует вовсе. */
export type Rating = { value: number; count: number }
export type Product = { id: string; category: string; brand: string | null; rating: Rating | null; name: string; summary: string; description: string; ingredients: string | null; usage: string | null; standard: string | null; images: Image[]; optionGroups: OptionGroup[]; variants: Variant[]; labReports: LabReport[]; strength: Strength; line: LineMember[] }
export type Price = { kind: 'single'; value: Money } | { kind: 'range'; min: Money; max: Money }
/** Упаковка варианта — то, что покупатель CBD сравнивает на полке (shop,
 *  «Сила — две шкалы, проценты и миллиграммы»): CBD во всей упаковке, мг, и
 *  её мера — число и единица данных (`ml`, `g`, `pcs`). Процент не хранится:
 *  его считает `percentOf` (lib/facts.ts) из мг и мл — одна арифметика на
 *  полку, грань фильтра и проверку. `mg: null` — упаковка силы не заявляет. */
export type Pack = { mg: number | null; size: number; unit: 'ml' | 'g' | 'pcs' }
/** Чем товар продаётся (ось силы — свойство товара, а не категории;
 *  cbd-facet, §1): `percent` — концентрацией (масла), `mg` — содержанием
 *  (крем, капсулы). */
export type Strength = 'percent' | 'mg'
/** Товар на полке. `packs` — упаковки вариантов по порядку; у Vendure —
 *  поля варианта (план 4). `was` — цена до скидки у товара одной цены
 *  (у диапазона «от» прежней цены нет: неясно, чья она); `variant` — вариант,
 *  который кладётся в корзину прямо с полки, когда он у товара один;
 *  вариантов несколько — null, и кнопка полки ведёт к выбору (И284). */
/** `pick` — стандартный вариант товара (И473, `standardOf`): его кладёт
 *  «в корзину» с полки, его цену и упаковку карточка печатает; всё
 *  распродано — null. `variant` — его id. */
export type CardPick = { id: string; price: Money; was: Money | null; stock: Stock; pack: Pack | null }
export type Card = { id: string; category: string; brand: string | null; name: string; image: Image; price: Price; was: Money | null; variant: string | null; pick: CardPick | null; stock: Stock; strength: Strength; packs: Pack[] }
/** Грань фильтра. `count` — сколько товаров даст значение ПРИ ВСЕХ ДРУГИХ
 *  гранях (cbd-facet, §3): счёт по текущей выборке гасил соседние значения
 *  той же грани, и выбрать «масло ИЛИ капсулы» было нечем. */
/** `scoped` — грань живёт только внутри полки (у движка, где грань есть лишь у
 *  одной полки): снятие полки её выбор не уносит во все товары, где её нет
 *  (Amazon, «Any Department»: уходит то, чего нет в шире). У движка cbdin таких
 *  граней нет с 04.10.2026: содержание CBD, вид экстракта и цена стоят на любой
 *  полке (И742). */
/** `shelf` — грань полок магазина (категория): в фильтре она первая — самый
 *  важный выбор покупателя (слово заказчика 04.10.2026, И740). */
/** `bands` — значения грани не из каталога, а отрезки, посчитанные по товарам
 *  полки (CBD в упаковке, мг — И742): код значения — отрезок «от-до», и
 *  выбор работает, даже когда отрезки сдвинулись с ассортиментом. В меню
 *  шапки такие грани не идут: ссылка из меню на посчитанный отрезок стареет
 *  вместе с полкой. */
/* Общего заголовка «Содержание CBD» над концентрацией и мг нет (заказчик
   04.10.2026: «CBD content — слово удаляй»): каждая грань — своя группа
   фильтра со своим именем (И742). */
/** `values` — значения рамки: всё, что есть на полке страницы без выбора
 *  покупателя, и уже выбранное. `count` — сколько товаров даст значение при
 *  выборе других граней (cbd-facet, §3); ноль — значение стоит погашенным, а
 *  не пропадает (И750). */
export type Facet = { code: string; name: string; values: { code: string; name: string; count: number; selected: boolean }[]; scoped?: true; shelf?: true; bands?: true }
/** Полка. `image` — кадр полки на главной (4 : 3); у полки без снимка — null. */
/** Полка. `sign` — знак полки: имя знака из листа (`styles/icons.svg`), данные
 *  магазина; нет знака — `null`, фишка стоит словом (И422). */
/** `form` — вид товара полки (Form, lib/source/details.ts), когда источник его знает: им
 *  статья блога находит свою полку (`Post.shelf`, И749); у движка cbdin вид — адрес полки. */
export type Collection = { slug: string; name: string; description: string; image: Image | null; sign: string | null; form?: string }
/** Эффект — значение грани эффекта (`EFFECT_FACET`, source/effect.ts): повод, с которым
 *  покупатель приходит, а не форма товара. У него своя страница
 *  (`/[lang]/effect/[code]`) и плитка на главной. `description` — описание
 *  страницы для поиска, данные магазина; нет — пустое. `image` — кадр
 *  плитки; нет — null. */
export type Effect = { code: string; name: string; description: string; image: Image | null }
export type SortKey = 'popular' | 'newest' | 'price-asc' | 'price-desc'
/** `count` — спрошен только счёт (кнопка фильтра «Show 12 products» и числа
 *  у значений граней, пересчитанные на ещё не применённый выбор): источник
 *  отдаёт `total` и грани со счётом, без карточек. */
export type ListingQuery = { category?: string; q?: string; facets: Record<string, string[]>; sort: SortKey; page: string | null; count?: true }
export type Listing = { items: Card[]; total: number; page: number; pages: number; facets: Facet[]; invalid: string[] }
/** Статья блога (слово заказчика 28.09.2026: «блог — добавляй раздел»):
 *  разделы — как у документа, дата выхода и вопросы с ответами, которые
 *  страница несёт разметкой FAQPage (СЕО и GEO, И503). */
/** `image` — снимок статьи для её карточки (лента блога на главной, И729);
 *  нет — карточка стоит с пустым кадром той же меры. */
/** Рубрика блога — своя страница с адресом (И749; у cbdshop.bg рубрики были
 *  кнопками без адресов, и поиск их не видел). */
export type PostTopic = { slug: string; name: string; description: string }
/** Кто написал: имя, роль и строка о нём — у статьи о здоровье поиск ищет
 *  автора (E-E-A-T); «редакция» — тоже автор. */
export type PostAuthor = { name: string; role: string; bio: string }
/** Статья блога (И749, устройство — по блогу cbdshop.bg): `subtitle` — строка
 *  под именем; `tldr` — «Pe scurt», ответ первым; `updated` — дата правки, пишется
 *  только когда отличается от `date`; `featured` — «Începe de aici» первой;
 *  `sources` — первоисточники нумерованным списком; `shelf` — вид товара для
 *  полки «Produse potrivite» (Form, lib/source/details.ts). Разделы — разделы
 *  документа (`DocSection`), якорь у статьи может не быть — тогда `doc-N`. */
export type Post = {
  slug: string; date: string; updated: string | null; title: string; subtitle: string | null; summary: string; tldr: string | null
  topic: PostTopic | null; featured: boolean; image: Image | null; author: PostAuthor | null
  sections: (Omit<DocSection, 'id' | 'form'> & { id?: string })[]; faq: { q: string; a: string }[]
  sources: { title: string; url: string }[]; shelf: string | null
}
/** Отзыв покупателя (лента отзывов на главной, И728). `product` — о каком
 *  товаре, именем и адресом; `null` — отзыв о магазине. `rating` — целое от 1
 *  до 5. `author` — имя и буква фамилии, как подписал покупатель. `verified`
 *  — отзыв привязан к заказу: только тогда витрина пишет «Verified buyer» (ЕС,
 *  Omnibus). `video` — видеоотзыв: ролик (`src`; нет адреса — отзыв стоит
 *  текстом), постер и субтитры, если в ролике речь (`captions`, WebVTT). */
export type Review = {
  id: string; product: { name: string; href: string } | null; rating: number; title?: string; body: string
  author: string; date: string; verified: boolean
  video: { src: string | null; poster: Image; captions?: string | null } | null
}
/** Раздел документа (И748): `id` — якорь оглавления, один на всех языках;
 *  `body` — абзацы через пустую строку; ссылки внутри — `[слова](doc:retur)`,
 *  `(withdraw)`, `(catalog)` или `(https://…)`, реквизиты — `{company.name}` и
 *  соседи (lib/doc-view.ts заполняет их из lib/company.ts и lib/contacts.ts:
 *  данные магазина в одном месте, текст их не повторяет). `list` и `table` —
 *  после текста; `form: 'withdrawal'` — кнопка отказа от договора (OUG 34/2014,
 *  с 19.06.2026 — ст. 11a Директивы 2011/83). */
export type DocSection = { id: string; heading: string; body: string; list?: string[]; table?: { head: string[]; rows: string[][] }; note?: string; form?: 'withdrawal' }
/** Документ магазина: условия, доставка, возврат, гарантия, данные, cookie, о
 *  нас, анализы, доступность. `updated` — дата последней правки (ISO), строкой
 *  под именем; `faq` — вопросы с ответами (разметка FAQPage); `table:
 *  'delivery'` — первым разделом таблица способов из данных оформления. */
export type Doc = { slug: string; title: string; summary: string; updated: string | null; sections: DocSection[]; faq: { q: string; a: string }[]; table: 'delivery' | null }
export type Block =
  /** Герой — заголовок и абзац ПОВЕРХ широкого снимка (`image`, ≈ 16:10),
   *  под ними большая кнопка «В магазин» и кнопки главных полок. Снимок один:
   *  слайдер героя снят 01.10.2026. `shelves` — какие полки стоят кнопками,
   *  адресами полок по порядку (слово заказчика 03.10.2026: «кнопки основных
   *  категорий… другие категории не размещаем», И673); полки, которой у
   *  магазина нет, нет и кнопки; списка нет — кнопок полок нет. */
  | { type: 'hero'; title: string; lede: string; image: Image; shelves?: string[] | 'all' }
  /** Эффекты — рядом плиток; плитка ведёт на страницу эффекта. `lede` —
   *  описание ряда под заголовком, данные магазина; нет — заголовок стоит
   *  один. Полок блоком нет: они — кнопками на снимке героя (И673). */
  | { type: 'effects'; title: string; lede?: string }
  /** Полка товаров. `to` — полка каталога, куда ведёт «смотреть всё»
   *  (слаг категории); нет — весь каталог. `lede` — описание полки под
   *  заголовком, данные магазина; нет — заголовок стоит один. */
  | { type: 'featured'; title: string; lede?: string; ids: string[]; to?: string }
  /** `report` — образец протокола рядом с текстом: партия, лаборатория, замер. */
  | { type: 'faq'; title: string; items: { q: string; a: string }[] }
  /** Слово магазина — заголовок, несколько предложений своими словами и
   *  снимок с подписью. Место заказчика (docs/design/home.md, «Пустые
   *  места»): пустое молчит — ни заглушки, ни рамки на витрине. */
  | { type: 'story'; title: string; body: string; image: Image | null }
  /** Отзывы покупателей — лентой: видео первыми, за ними текст (И728). Сами
   *  отзывы — у источника (`Content.reviews`), блок называет ряд: заголовок,
   *  описание (у настоящего магазина — как он проверяет отзывы, ЕС Omnibus;
   *  у образца — что это образцы) и адрес «всех отзывов», если такая
   *  страница есть. Отзывов нет — блока нет. */
  | { type: 'reviews'; title: string; lede?: string; all?: string | null }
  /** Статьи блога — лентой последних из списка источника (`Content.posts`,
   *  И729); `limit` — сколько, умолчание 4. Статей нет — блока нет. */
  | { type: 'posts'; title: string; lede?: string; limit?: number }
export type Page = { slug: string; title: string; description: string; blocks: Block[] }
/** Обещания магазина, которые витрина печатает у кнопки заказа, — числом из
 *  данных, а не словом в коде. `returnDays` — срок возврата в днях (закон ЕС
 *  даёт не меньше 14, Директива 2011/83/ЕС, ст. 9; магазин вправе дать
 *  больше); `null` — магазин срок не назвал, и строки о возврате нет. У
 *  Payload — поле global «shop» (план 4). */
/** `freeDeliveryFrom` — сумма корзины, с которой доставка бесплатна; её
 *  назначает магазин (у Vendure — акция доставки), витрина не сочиняет. */
export type ShopFacts = { returnDays: number | null; freeDeliveryFrom: Money | null }
/** Вид витрины — ОДИН, готовыми значениями (CLAUDE.md, «Панель настройки
 *  физически отделена от сайта»; И270): свойства CSS обеих тем (`vars`,
 *  имя → значение из закрытого списка lib/look-slots.json), варианты шапки
 *  и карточки товара, состав главной (`header`, `card`, `home` — разметка из
 *  lib/headers.ts, lib/cards.ts, lib/homes.ts),
 *  шрифты со своих адресов (`fonts`, пусто — системный) и имена вариантов,
 *  из которых вид собран (`names`, для людей и панели; сайт их не читает).
 *  Каталога вариантов в сайте нет — он у панели вида. */
/** Размеры шрифта в долях кегля (scripts/font-fallback.mjs, `lookMetrics`):
 *  по ним сайт растягивает запасной шрифт под настоящий, и подмена не
 *  сдвигает слова. `widths` — средняя ширина знака при каждой толщине
 *  100…900 (ключ — толщина). Нет их — запасной стоит как есть. */
export type FontMetrics = { widths: Record<string, number>; ascent: number; descent: number; gap: number }
export type LookFont = { family: string; files: { url: string; weight: string; range: string }[]; metrics?: FontMetrics }
export type Look = { header: HeaderVariant; card: CardVariant; home: HomeVariant; vars: Record<string, string>; fonts: LookFont[]; names: Record<string, string> }
export type Result<T> = { ok: true; value: T } | { ok: false; reason: 'unavailable' | 'not-found' | 'bad-request' }

/** Торговля: Vendure в плане 4, образец — сейчас. */
export type Source = {
  collections(lang: Lang): Promise<Result<Collection[]>>
  collection(lang: Lang, slug: string): Promise<Result<Collection>>
  /** Эффекты, у которых есть товары, в порядке движка. */
  effects(lang: Lang): Promise<Result<Effect[]>>
  listing(lang: Lang, query: ListingQuery): Promise<Result<Listing>>
  cards(lang: Lang, ids: string[]): Promise<Result<Card[]>>
  product(lang: Lang, id: string): Promise<Result<Product>>
  related(lang: Lang, id: string, limit: number): Promise<Result<Card[]>>
  productIds(): Promise<Result<string[]>>
}

/** Содержание: Payload в плане 4, образец — сейчас. */
export type Content = {
  page(lang: Lang, slug: string): Promise<Result<Page>>
  docs(lang: Lang): Promise<Result<Doc[]>>
  /** Статьи блога — новые первыми. */
  posts(lang: Lang): Promise<Result<Post[]>>
  /** Рубрики блога в порядке показа (И749). */
  topics(lang: Lang): Promise<Result<PostTopic[]>>
  post(lang: Lang, slug: string): Promise<Result<Post>>
  /** Отзывы покупателей, одобренные магазином, — новые первыми (И728). У
   *  образца — lib/reviews.json; у Payload или дополнения Vendure — свои
   *  (план 4, docs/open.md «Отзывы покупателей»). */
  reviews(lang: Lang): Promise<Result<Review[]>>
  doc(lang: Lang, slug: string): Promise<Result<Doc>>
  /** Обещания магазина у кнопки заказа: срок возврата (`ShopFacts`). */
  facts(): Promise<Result<ShopFacts>>
  /** Вид витрины: у образца — lib/source/sample/look.json, у Payload — global
   *  «look» (план 4). `draft` — черновик для чернового режима (у образца
   *  look.draft.json рядом, у Payload — черновая версия global); черновика
   *  нет — опубликованный. Источник отдаёт как хранит; проверяет `accept`. */
  look(options?: { draft?: boolean }): Promise<Result<unknown>>
  /** Подписка на рассылку из подвала (И549): адрес уходит в список
   *  рассылки магазина — у Payload коллекция подписчиков или сервис
   *  рассылки (выбор — при запуске магазина); письмо-подтверждение шлёт он.
   *  Образец адрес принимает и не хранит. */
  subscribe(lang: Lang, email: string): Promise<Result<null>>
}

/* ── Покупка ─────────────────────────────────────────────────────────────
   Корзина, оформление, заказ. Итоги, скидку, доставку и допустимость оплаты
   считает источник (Vendure — сервер; образец — sample/commerce.ts), витрина
   не складывает цены. Доставка и оплата — общий механизм (И261): вид способа
   — закрытый список, имя службы — строка данных. */
export type CartLine = {
  id: string; productId: string; variantId: string; name: string
  options: { group: string; code: string; name: string }[]
  /** Упаковка варианта — та же, что у карточки полки и страницы товара: из неё строка «3000 mg · 10 ml»
   *  под именем (`lineFacts`); `null` — упаковка не названа, строки нет. */
  pack: Pack | null
  image: Image; unit: Money; quantity: number; total: Money
}
export type Cart = {
  lines: CartLine[]; quantity: number; subtotal: Money
  discounts: { code: string; amount: Money }[]; delivery: Money | null; total: Money
}
export type DeliveryKind = 'address' | 'pickup'
export type PointType = 'office' | 'locker' | 'partner' | 'shop'
export type DeliveryMethod = {
  id: string; kind: DeliveryKind; carrier: string | null; name: string; description: string
  price: Money; days: { min: number; max: number } | null
}
export type PickupPoint = { id: string; type: PointType; name: string; address: string; city: string; hours: string | null }
export type Address = { street: string; city: string; region: string; postalCode: string; country: string }
export type Contact = { email: string; firstName: string; lastName: string; phone: string }
export type Delivery = { method: DeliveryMethod; address: Address | null; point: PickupPoint | null }
export type DeliveryChoice = { methodId: string; address: Address | null; pointId: string | null }
export type PaymentKind = 'on-delivery' | 'transfer' | 'online'
export type PaymentMethod = { code: string; kind: PaymentKind; name: string; description: string; eligible: boolean; reason: string | null }
export type Checkout = { cart: Cart; contact: Contact | null; delivery: Delivery | null }
export type Order = { code: string; placedAt: string; contact: Contact; delivery: Delivery; payment: PaymentMethod; cart: Cart }
export type CommerceError =
  | 'unavailable' | 'not-found' | 'out-of-stock' | 'quantity'
  | 'coupon-invalid' | 'coupon-expired'
  | 'empty-cart' | 'no-contact' | 'no-delivery' | 'point-missing'
  | 'payment-ineligible' | 'payment-declined'
  /** Итог корзины не тот, что покупатель видел у кнопки заказа (И262). */
  | 'changed'
  /** Корзина пуста, а заказ этой сессии поставлен недавно — второе нажатие. */
  | 'placed'
  /** Источник заказов не ставит: витрина подключена к действующему магазину
   *  для показа (у Vendure — без `VENDURE_PLACE_ORDERS=on`). */
  | 'orders-off'
/** Запись. `added` — только у частичного успеха: сколько на самом деле в
 *  строке после записи, когда просили больше, чем есть на складе. */
export type Change<T> = { ok: true; value: T; added?: number } | { ok: false; error: CommerceError }

/* ── Кабинет покупателя (И771, И787) — account-contract.ts ── */
export * from './account-contract.ts'

/** Покупка: Vendure в плане 4, образец — сейчас. `session` — непрозрачный
 *  ключ сессии из cookie; `null` — сессии ещё нет. Первое добавление её
 *  заводит и возвращает. Кабинет — тем же объектом: сессия одна. */
export type Commerce = Account & {
  checkout(session: string | null, lang: Lang): Promise<Result<Checkout | null>>
  add(session: string | null, lang: Lang, variantId: string, quantity: number): Promise<{ session: string | null; change: Change<Cart> }>
  setQuantity(session: string, lang: Lang, lineId: string, quantity: number): Promise<Change<Cart>>
  remove(session: string, lang: Lang, lineId: string): Promise<Change<Cart>>
  applyCoupon(session: string, lang: Lang, code: string): Promise<Change<Cart>>
  removeCoupon(session: string, lang: Lang, code: string): Promise<Change<Cart>>
  setContact(session: string, lang: Lang, contact: Contact): Promise<Change<Checkout>>
  deliveryMethods(session: string | null, lang: Lang): Promise<Result<DeliveryMethod[]>>
  /** Точки способа `pickup`. Пустой город — все точки, если их у способа
   *  мало (магазин продавца), иначе пусто: тысячи постаматов списком не
   *  отдаются, их ищут по городу. */
  pickupPoints(lang: Lang, methodId: string, city: string): Promise<Result<PickupPoint[]>>
  setDelivery(session: string, lang: Lang, choice: DeliveryChoice): Promise<Change<Checkout>>
  paymentMethods(session: string, lang: Lang): Promise<Result<PaymentMethod[]>>
  /** Заказ — только по итогу, который покупатель видел у кнопки (Директива
   *  2011/83/ЕС, ст. 8(2); И262): `expected` — этот итог; иной у корзины —
   *  `'changed'`, заказ не ставится. */
  placeOrder(session: string, lang: Lang, paymentCode: string, expected: Money): Promise<Change<Order>>
  /** Заказ этой сессии, поставленный недавно (окно — у источника; у
   *  Vendure гость видит заказ два часа), иначе null. */
  lastOrder(session: string | null, lang: Lang): Promise<Result<Order | null>>
  /** Заявление об отказе от договора (И748): кнопка «Retrageți-vă din contract
   *  aici» — ст. 11a Директивы 2011/83 с 19.06.2026 (OUG 18/2026). Источник
   *  принимает имя, номер заказа и адрес и СРАЗУ шлёт на адрес подтверждение
   *  с содержанием заявления, датой и временем; `at` — когда принято (ISO).
   *  Не принимает — `unavailable`, и страница предлагает письмо: заявление
   *  любым ясным способом в срок тоже действительно. */
  withdraw(lang: Lang, statement: Withdrawal): Promise<Result<{ at: string }>>
}
/** Заявление об отказе — ровно то, что разрешено спрашивать (ст. 11a(2)):
 *  имя, номер заказа, адрес для подтверждения. */
export type Withdrawal = { name: string; order: string; email: string }
