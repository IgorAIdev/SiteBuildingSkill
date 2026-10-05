import p from '@/styles/primitives.module.css'
import type { Lang } from '@/lib/locale.ts'
import type { Block, Doc } from '@/lib/source/contract.ts'
import type { Asked } from '@/lib/listing.ts'
import { source, content, commerce } from '@/lib/source/index.ts'
import { sampleCommerce } from '@/lib/source/sample/commerce.ts'
import { readSession } from '@/lib/session.ts'
import { catalogView, emptyFor, shownFacets, type CatalogView } from '@/lib/catalog-view.ts'
import { frameTotal } from '@/lib/listing.ts'
import { lookNow } from '@/lib/look.ts'
import { contactView, deliveryTable } from '@/lib/checkout-view.ts'
import { shelfCard } from '@/lib/view.ts'
import { docView, withdrawWords } from '@/lib/doc-view.ts'
import { blogIndexView, postHeadView } from '@/lib/post-view.ts'
import { withdraw } from '@/lib/actions/withdraw.ts'
import { hrefFor, type Query } from '@/lib/href.ts'
import { t } from '@/lib/i18n/index.ts'
import { cartSubmit, cartCall } from '@/lib/actions/cart.ts'
import { saveContact } from '@/lib/actions/checkout.ts'
import { Catalog } from '@/components/Catalog.tsx'
import { SavedView, savedCards } from '@/components/SavedView.tsx'
import { SortMenu } from '@/components/SortMenu.tsx'
import { Featured } from '@/components/blocks/Featured.tsx'
import { Story } from '@/components/blocks/Story.tsx'
import { Faq } from '@/components/blocks/Faq.tsx'
import type { BlockCtx, Place } from '@/components/blocks/types.ts'
import { DocView } from '@/components/DocView.tsx'
import { BlogIndex } from '@/components/BlogIndex.tsx'
import { PostHead, PostIntro, PostSources } from '@/components/PostParts.tsx'
import { WithdrawForm } from '@/components/WithdrawForm.tsx'
import { DeliveryTable } from '@/components/DeliveryTable.tsx'
import { ContactForm } from '@/components/ContactForm.tsx'
import { Part, Worn, cssVar } from './parts.tsx'
import s from './catalogPages.module.css'

/* Блоки → «Каталог и страницы»: настоящие компоненты сайта этого раздела
   (И605) — на тех же данных и теми же строителями вида, что страницы
   сайта (app/[lang]/catalog, info/[doc], главная, шаг «контакты»), а не
   рисунок. Здесь ничего не выбирается: вид — в панели Look. Образцы — на
   языке витрины (`lang`), слова раздела — заказчику, по-русски. */

const CART = { submit: cartSubmit, call: cartCall }
const PLACE: Place = { air: null }
const ASKED: Asked = { facets: {}, sort: 'popular', page: null }
/* Второй порядок — другой выбранный, чтобы видно было отметку выбранного. */
const ASKED_PRICE: Asked = { ...ASKED, sort: 'price-asc' }
/* Документ без таблицы: доставка — со своей таблицей ниже, «О нас» —
   словами истории марки. */
const DOC = 'retur'
const ABOUT = 'despre-noi'

/* Способы доставки — тем же источником, что оформление, на сессии того, кто
   смотрит: Vendure отдаёт способы только заказу с корзиной, и без неё
   таблица пуста (так же пуста она сейчас и на странице «Доставка и
   оплата», docs/open.md). Пусто — образец набора, чтобы таблицу было видно. */
async function methodsFor(lang: Lang) {
  const r = await commerce().deliveryMethods(await readSession(), lang)
  return r.ok && r.value.length ? r : sampleCommerce.deliveryMethods(null, lang)
}

/* Фильтр полки — виды (И739; shop, references/catalog.md, «Фильтр полки:
   виды»): на ноутбуке — одна кнопка и панель (Allbirds) или строка раскрытий
   (Shopify Dawn, ASOS); на телефоне — шторка (Dawn, Gymshark) или пилюли
   вбок (Zalando, notino). Образец — настоящая полка категории с одним
   выбранным значением: видны пилюля полки, «9 din 16» и выбранное. Вид
   ставится ролью на коробке образца; на сайте — панелью Look → Card. */
const FILTER_LOOKS: [string, string][] = [['drawer', 'Ноутбук: кнопка «Filtre» и шторка сбоку, как корзина'], ['bar', 'Ноутбук: строка раскрытий над полкой']]
const FILTER_PHONES: [string, string][] = [['drawer', 'Телефон: кнопка «Filtre» и шторка сбоку'], ['pills', 'Телефон: пилюли параметров вбок']]

/** Полка первой категории с выбранным значением первой грани, где выбор сужает
 *  полку; одна строка карточек, без листания. */
async function filterSample(lang: Lang): Promise<CatalogView | null> {
  const cols = await source().collections(lang)
  const shelf = cols.ok ? cols.value[0] : null
  if (!shelf) return null
  const first = await source().listing(lang, { category: shelf.slug, ...ASKED })
  if (!first.ok) return null
  const value = shownFacets(first.value.facets, first.value.total).flatMap((f) => f.values.filter((v) => v.count > 0 && v.count < first.value.total).map((v) => ({ [f.code]: [v.code] })))[0] ?? {}
  const asked: Asked = { ...ASKED, facets: value }
  const at = (q: Query) => hrefFor(lang, { category: shelf.slug, ...q })
  const [r, all] = await Promise.all([source().listing(lang, { category: shelf.slug, ...asked }), frameTotal(source(), lang, asked, { category: shelf.slug })])
  if (!r.ok) return null
  const view = catalogView(lang, {
    title: shelf.name, lede: shelf.description, listing: r.value, asked, at, filters: true, empty: emptyFor(lang, asked, at),
    scope: { name: shelf.name, wider: (q) => hrefFor(lang, { catalog: true, ...q }) }, counted: { category: shelf.slug }, all,
  })
  return { ...view, cards: view.cards.slice(0, 4), pages: null, more: null }
}

/* История марки на главной пуста, пока магазин не написал своих слов, — и
   блок тогда молчит. Образец — на словах страницы «О нас» и снимке первого
   экрана главной: те же данные магазина, в форме блока. */
const storyOf = (about: Doc | null, image: Extract<Block, { type: 'hero' }>['image'] | null): Extract<Block, { type: 'story' }> | null =>
  about ? { type: 'story', title: about.title, body: about.sections.map((x) => x.body).join('\n\n'), image } : null

export async function CatalogPages({ lang }: { lang: Lang }) {
  const at = (q: Query) => hrefFor(lang, { catalog: true, ...q })
  const [listing, page, doc, about, methods, sample, { names }, posts, topics] = await Promise.all([
    source().listing(lang, ASKED), content().page(lang, 'home'), content().doc(lang, DOC), content().doc(lang, ABOUT), methodsFor(lang), filterSample(lang), lookNow(),
    content().posts(lang), content().topics(lang),
  ])
  /* Статья образца — первая с источниками: видны все части статьи. */
  const post = posts.ok ? posts.value.find((x) => x.sources.length) ?? posts.value[0] ?? null : null
  const base = { title: t(lang, 'catalog.title'), lede: t(lang, 'catalog.lede'), at, filters: true }
  const view = listing.ok ? catalogView(lang, { ...base, listing: listing.value, asked: ASKED, empty: emptyFor(lang, ASKED, at) }) : null
  const priced = listing.ok ? catalogView(lang, { ...base, listing: listing.value, asked: ASKED_PRICE, empty: emptyFor(lang, ASKED_PRICE, at) }) : null

  const blocks = page.ok ? page.value.blocks : []
  const featured = blocks.find((b): b is Extract<Block, { type: 'featured' }> => b.type === 'featured')
  const faq = blocks.find((b): b is Extract<Block, { type: 'faq' }> => b.type === 'faq')
  const hero = blocks.find((b): b is Extract<Block, { type: 'hero' }> => b.type === 'hero')
  const story = storyOf(about.ok ? about.value : null, hero?.image ?? null)
  const cards = featured ? await source().cards(lang, featured.ids) : null
  /* Полке, истории и вопросам из контекста главной нужны язык, карточки и
     корзина — остальное у главной, не у них. */
  const ctx = { lang, cart: CART, cards: cards?.ok ? Object.fromEntries(cards.value.map((c) => [c.id, shelfCard(lang, c)])) : {} } as Pick<BlockCtx, 'lang' | 'cart' | 'cards'> as BlockCtx
  const table = methods.ok ? deliveryTable(lang, methods.value) : null
  const saved = savedCards(lang, cards?.ok ? cards.value.slice(0, 3) : [])

  return (
    <>
      <Part title="Каталог" lede="Страница всех товаров: имя и строка о ней, над полкой — фильтры слева и сортировка справа, под ними — сколько товаров; дальше полка карточек и листание страниц. Так же устроены страницы категорий и поиска.">
        {view ? <div lang={lang}><Catalog view={view} cart={CART} inset /></div> : null}
      </Part>
      <Part title="Фильтр полки" lede="Виды фильтра на одной полке категории с одним выбранным значением. Категорию называет заголовок, в фильтре — имя окна и слово «All products» в его шапке; выбранное — пилюлями в строке фильтра; «9 din 16» — сколько осталось из полки. На ноутбуке — кнопка «Filtre» и шторка сбоку, как корзина, или строка раскрытий над полкой. На телефоне — кнопка и шторка сбоку, или пилюли параметров вбок под кнопкой. Кнопка «применить» сама пересчитывает, сколько товаров даст выбор. Колонки сбоку здесь нет: это другое устройство страницы — её строят, когда её выбрали. Какой вид стоит на сайте — помечено; сменить — панель Look → Card. Нажмите кнопки.">
        {sample ? (
          <>
            <div className={`${p.stack} ${s.looks}`}>
              {FILTER_LOOKS.map(([look, name]) => (
                <div key={look}>
                  <p className={s.lookName}>{name} <Worn on={look === (names['filter-look'] ?? 'drawer')} /></p>
                  <div lang={lang} style={cssVar('--filter-look', look)}><Catalog view={sample} cart={CART} inset ids={{ filters: `design-filters-wide-${look}`, sort: `design-sort-wide-${look}` }} /></div>
                </div>
              ))}
            </div>
            <div className={`${p.grid} ${s.phones}`}>
              {FILTER_PHONES.map(([look, name]) => (
                <div key={look}>
                  <p className={s.lookName}>{name} <Worn on={look === (names['filter-phone'] ?? 'drawer')} /></p>
                  <div lang={lang} style={cssVar('--filter-phone', look)}><Catalog view={sample} cart={CART} inset ids={{ filters: `design-filters-${look}`, sort: `design-sort-${look}` }} /></div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </Part>
      <Part title="Сортировка" lede="Справа над полкой: подпись и кнопка, под ней список порядков — популярные, дешевле, дороже. Каждый порядок — ссылка, выбранный отмечен. Здесь выбран «по цене».">
        {priced?.sort ? <div lang={lang}><SortMenu sort={priced.sort} id="design-sort-list" /></div> : null}
      </Part>
      <Part title="Избранное" lede="Страница сердечек: имя и строка о ней, под ними сохранённые карточки — те же, что в каталоге, с залитым сердцем. Список живёт в браузере покупателя; пустой — экран «Пустой экран» на вкладке состояний. Здесь — три первые карточки подборки.">
        {saved.length ? <div lang={lang}><SavedView lang={lang} cards={saved} cart={CART} /></div> : null}
      </Part>
      <Part title="Подборка товаров" lede="Полка на главной: заголовок и строка о подборке, стрелки листания, выход ко всей категории и карточки товаров одной лентой.">
        {featured ? <div lang={lang}><Featured block={featured} ctx={ctx} place={PLACE} /></div> : null}
      </Part>
      <Part title="История марки" lede="Слово магазина на главной: заголовок, несколько абзацев своими словами и снимок рядом. Пока слов нет, на сайте блок не показывается вовсе; здесь — на словах страницы «О нас».">
        {story ? <div lang={lang}><Story block={story} ctx={ctx} place={PLACE} /></div> : null}
      </Part>
      <Part title="Вопросы и ответы" lede="Внизу главной: заголовок слева, вопросы справа; ответ раскрывается нажатием на вопрос. Поисковики читают эти же вопросы.">
        {faq ? <div lang={lang}><Faq block={faq} ctx={ctx} place={PLACE} /></div> : null}
      </Part>
      <Part title="Страница-документ" lede="Условия, возврат, гарантия, конфиденциальность, cookie, «О нас», доставка, анализы: имя, строка о странице и дата правки; у длинного документа на ноутбуке — оглавление ссылками сбоку, приклеенное; разделы — заголовок над своим текстом; списки и таблицы — в тексте. Здесь — страница возврата.">
        {doc.ok ? <div lang={lang}><DocView view={docView(lang, doc.value)} /></div> : null}
      </Part>
      <Part title="Блог" lede="Список статей: имя, строка о блоге и счёт с датой последней правки; рубрики ссылками, текущая отмечена; закреплённая статья «Începe de aici» первой и крупно, остальные — сеткой карточек, новые первыми. Так же устроена страница рубрики, только без закреплённой.">
        {posts.ok && topics.ok ? <div lang={lang}><BlogIndex view={blogIndexView(lang, posts.value, topics.value)} label={t(lang, 'blog.topics')} /></div> : null}
      </Part>
      <Part title="Статья блога" lede="Страница-документ со своими частями: сверху рубрика ссылкой, имя, подзаголовок, автор и строка данных (дата, правка, минуты чтения); обложка с потолком высоты и «Pe scurt» — ответ первым; после текста — источники и тихая оговорка. Ниже на сайте идут вопросы, товары и «Citește mai departe».">
        {post ? (
          <div lang={lang}>
            <DocView
              view={docView(lang, post)}
              head={<PostHead view={postHeadView(lang, post)} />}
              intro={<PostIntro image={post.image} tldr={post.tldr} tldrLabel={t(lang, 'blog.tldr')} />}
            >
              <PostSources title={t(lang, 'blog.sources')} sources={post.sources} important={t(lang, 'blog.important')} disclaimer={t(lang, 'blog.disclaimer')} />
            </DocView>
          </div>
        ) : null}
      </Part>
      <Part title="Отказ от договора" lede="Второй шаг отказа: первый — громкая кнопка в подвале и на странице возврата. Три поля — ровно то, что разрешено спросить, — и одна кнопка «Confirmați retragerea». Не заполнено — строка под кнопкой, введённое остаётся; принято — строка с датой и временем на месте формы. Форма настоящая: заполненная, она отправит заявление.">
        <div className={`${p.stack} ${s.narrow}`} lang={lang}>
          <h3>{t(lang, 'withdraw.title')}</h3>
          <WithdrawForm action={withdraw.bind(null, lang)} words={withdrawWords(lang)} />
        </div>
      </Part>
      <Part title="Таблица доставки" lede="Первый раздел страницы «Доставка и оплата»: способ, срок и цена — строкой на способ. Способы — те же, что покупатель выбирает при оформлении.">
        {table ? (
          <div className={`${p.stack} ${s.narrow}`} lang={lang}>
            <h3 id="design-delivery">{table.caption}</h3>
            <DeliveryTable view={table} labelledBy="design-delivery" />
          </div>
        ) : null}
      </Part>
      <Part title="Контакты покупателя" lede="Первый шаг оформления заказа: почта, имя и телефон, одна громкая кнопка «дальше». Не заполнено — ошибка строкой под полем. Форма настоящая: заполненная, она отправит в оформление.">
        <div className={`${p.stack} ${s.narrow}`} lang={lang}>
          <h3 id="step-title">{t(lang, 'checkout.step.contact')}</h3>
          <ContactForm view={contactView(lang, null)} action={saveContact.bind(null, lang)} permalink={hrefFor(lang, { checkout: 'contact' })} />
        </div>
      </Part>
    </>
  )
}
