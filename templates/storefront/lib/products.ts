import type { Form } from './source/details.ts'
import { LOCALES, type Lang } from './locale.ts'
import { BIND, percent } from './format.ts'
import type { Pack, Strength } from './source/contract.ts'

type T = Record<Lang, string>
/** Одна строка на каждый язык страницы — числом, которое пишет запись языка
 *  (lib/format.ts, И347), а не набранным рукой по-румынски на всех трёх. */
const each = (write: (lang: Lang) => string): T => Object.fromEntries(LOCALES.map((l) => [l, write(l)])) as T
/** `form` — вид товара полки: по нему витрина берёт стандартные состав и
 *  применение (lib/source/details.ts, И482). */
export type SampleCategory = { slug: string; name: T; description: T; sign: string; form: Form }
/** `price` — в минорных единицах валюты рынка (у образца — евроцентах);
 *  `was` — цена до скидки, если вариант продаётся со скидкой; `pack` — CBD
 *  в упаковке и её мера (contract.ts, `Pack`). */
export type SampleVariant = { id: string; sku: string; options: Record<string, string>; price: number; was?: number; stock: 'in' | 'low' | 'out'; batch: string; pack: Pack }
/** `facets` — грани, которые НЕ считаются из упаковки: форма и эффект. Концентрацию
 *  (`putere`) образец выводит из `pack` сам (sample/catalog.ts): набранная
 *  рукой, она расходилась с этикеткой — капсулы 25 mg числились «10 %», масло
 *  для кошек 2,5 % — «5 %». */
export type SampleProduct = {
  id: string; cat: string; family?: string; label: string; hue: number; popular: number; strength: Strength
  /** День, когда товар появился в магазине (ISO): порядок «Newest» (И709). */
  added: string
  /** Марка производителя — данные образца: настоящую даёт каталог магазина. */
  brand: string | null
  /** Оценка покупателей образца; нет — у товара отзывов нет (И512). */
  rating?: { value: number; count: number }
  /** Вариант, выбранный на карте сам (И468); нет — первый в наличии. */
  standard?: string
  name: T; summary: T; description: T
  facets: Record<string, string[]>
  groups: { code: string; name: T; options: { code: string; name: T }[] }[]
  variants: SampleVariant[]
  /** Товары одной линейки (та же марка и то же имя, И503): у каждой силы и
   *  меры свой товар, свой адрес и своя карточка; выбор на карте ведёт к
   *  соседу. Пусто — товар один. Заполняет `split`, не данные. */
  line?: { id: string; options: Record<string, string>; stock: SampleVariant['stock'] }[]
}

export const CATEGORIES: SampleCategory[] = [
  { slug: 'uleiuri', name: { ro: 'Uleiuri CBD', en: 'CBD oils', hu: 'CBD olajok' }, description: { ro: 'Uleiuri cu CBD în mai multe concentrații.', en: 'CBD oils in several strengths.', hu: 'CBD olajok több erősségben.' }, sign: 'pipette', form: 'oil' },
  { slug: 'capsule', name: { ro: 'Capsule', en: 'Capsules', hu: 'Kapszulák' }, description: { ro: 'Doză fixă în fiecare capsulă.', en: 'A fixed dose in every capsule.', hu: 'Minden kapszulában azonos adag.' }, sign: 'pill', form: 'capsules' },
  { slug: 'cosmetice', name: { ro: 'Cosmetice', en: 'Cosmetics', hu: 'Kozmetikumok' }, description: { ro: 'Creme și balsamuri cu CBD.', en: 'Creams and balms with CBD.', hu: 'CBD-s krémek és balzsamok.' }, sign: 'soap-dispenser', form: 'cosmetics' },
  { slug: 'animale', name: { ro: 'Pentru animale', en: 'For pets', hu: 'Háziállatoknak' }, description: { ro: 'Uleiuri pentru câini și pisici.', en: 'Oils for dogs and cats.', hu: 'Olajok kutyáknak és macskáknak.' }, sign: 'pets', form: 'pets' },
]

/** Эффект образца — значение грани `effect` (у движка cbdin грань та же):
 *  повод, с которым покупатель приходит, а не форма товара. У эффекта своя
 *  страница (`/[lang]/effect/[effect]`; shop, catalog.md: «Признак,
 *  вынесенный в навигацию, обязан быть страницей»), плитка на главной и
 *  описание для поиска. Имена — из плиток cbdin (слово заказчика 30.09.2026);
 *  ключ записан `effect:` — по нему дерево адресов (tools/routes.mjs)
 *  находит страницы эффектов. */
export type SampleEffect = { effect: string; name: T; description: T }
export const EFFECTS: SampleEffect[] = [
  { effect: 'sleep', name: { ro: 'Somn', en: 'Sleep', hu: 'Alvás' }, description: { ro: 'Produse pe care clienții le iau seara: uleiuri și capsule, fiecare cu buletin de analiză pentru lotul său.', en: 'Products customers take in the evening: oils and capsules, each with a lab report for its batch.', hu: 'Termékek, amelyeket a vásárlók este használnak: olajok és kapszulák, mindegyik a tétel laborjegyzőkönyvével.' } },
  { effect: 'relief', name: { ro: 'Îngrijirea corpului', en: 'Body care', hu: 'Testápolás' }, description: { ro: 'Creme și uleiuri concentrate pentru îngrijirea corpului și masaj, fiecare cu buletin de analiză pentru lotul său.', en: 'Creams and stronger oils for body care and massage, each with a lab report for its batch.', hu: 'Krémek és erősebb olajok testápoláshoz és masszázshoz, mindegyik a tétel laborjegyzőkönyvével.' } },
  { effect: 'relax', name: { ro: 'Stres și anxietate', en: 'Stress and anxiety', hu: 'Stressz és szorongás' }, description: { ro: 'Uleiuri și capsule pe care clienții le aleg pentru o zi liniștită, fiecare cu buletin de analiză pentru lotul său.', en: 'Oils and capsules customers choose for a calm day, each with a lab report for its batch.', hu: 'Olajok és kapszulák, amelyeket a vásárlók egy nyugodt naphoz választanak, mindegyik a tétel laborjegyzőkönyvével.' } },
  { effect: 'skin', name: { ro: 'Piele și față', en: 'Skin and face', hu: 'Bőr és arc' }, description: { ro: 'Ser de față și balsam de buze cu CBD pentru îngrijirea zilnică, fiecare cu buletin de analiză pentru lotul său.', en: 'Face serum and lip balm with CBD for daily care, each with a lab report for its batch.', hu: 'CBD-s arcszérum és ajakbalzsam a napi ápoláshoz, mindegyik a tétel laborjegyzőkönyvével.' } },
  { effect: 'recovery', name: { ro: 'Sport și masaj', en: 'Sport and massage', hu: 'Sport és masszázs' }, description: { ro: 'Cremă pentru masaj după antrenament, cu buletin de analiză pentru lotul său.', en: 'Cream for massage after training, with a lab report for its batch.', hu: 'Krém edzés utáni masszázshoz, a tétel laborjegyzőkönyvével.' } },
  { effect: 'dogs', name: { ro: 'Câini', en: 'Dogs', hu: 'Kutyák' }, description: { ro: 'Ulei CBD pentru câini, în concentrație potrivită pentru animale, cu buletin de analiză pentru lotul său.', en: 'CBD oil for dogs in a strength made for pets, with a lab report for its batch.', hu: 'CBD olaj kutyáknak, állatokhoz illő erősségben, a tétel laborjegyzőkönyvével.' } },
]

export const FACETS: { code: string; name: T; values: { code: string; name: T }[] }[] = [
  { code: 'forma', name: { ro: 'Formă', en: 'Form', hu: 'Forma' }, values: [
    { code: 'ulei', name: { ro: 'Ulei', en: 'Oil', hu: 'Olaj' } },
    { code: 'capsule', name: { ro: 'Capsule', en: 'Capsules', hu: 'Kapszula' } },
    { code: 'crema', name: { ro: 'Cremă', en: 'Cream', hu: 'Krém' } },
    { code: 'pentru-animale', name: { ro: 'Pentru animale', en: 'For pets', hu: 'Háziállatoknak' } },
  ] },
  /* Значение грани «Сила» — число: его имя пишет запись языка страницы
     («2.5 %» по-английски, «2,5 %» по-румынски и по-венгерски). Набранное
     рукой, по-английски оно стояло с запятой. */
  { code: 'putere', name: { ro: 'Concentrație', en: 'Strength', hu: 'Erősség' }, values: ['2.5', '5', '10', '20', '30'].map((code) => ({ code, name: each((l) => percent(l, Number(code))) })) },
  { code: 'effect', name: { ro: 'Efect', en: 'Effect', hu: 'Hatás' }, values: EFFECTS.map((e) => ({ code: e.effect, name: e.name })) },
]

const strength = (codes: string[]) => ({ code: 'putere', name: { ro: 'Concentrație', en: 'Strength', hu: 'Erősség' }, options: codes.map((c) => ({ code: c, name: each((l) => percent(l, Number(c))) })) })
/* Объём и счёт штук — число с единицей неразрывно (`BIND`, lib/format.ts):
   «10 / ml» рвалось в сводке заказа на телефоне (И387). */
const volume = (codes: string[]) => ({ code: 'volum', name: { ro: 'Volum', en: 'Volume', hu: 'Térfogat' }, options: codes.map((c) => ({ code: c, name: { ro: `${c}${BIND}ml`, en: `${c}${BIND}ml`, hu: `${c}${BIND}ml` } })) })
const count = (codes: string[]) => ({ code: 'bucati', name: { ro: 'Bucăți', en: 'Count', hu: 'Darab' }, options: codes.map((c) => ({ code: c, name: { ro: `${c}${BIND}buc.`, en: `${c}${BIND}pcs`, hu: `${c}${BIND}db` } })) })

/* Первым стоит товар с самым большим выбором вариантов: дерево адресов
   (tools/routes.mjs) берёт в дорогие проверки первую семью и первый товар
   без семьи. */
const LINES: SampleProduct[] = [
  { id:'ulei-cbd-full-spectrum', cat:'uleiuri', family:'ulei-full', label: 'CBD', hue: 145, popular: 1, added: '2025-03-12', brand: 'Câmpia', rating: { value: 4.7, count: 128 }, strength: 'percent', standard: 'uf-10-10',
    name: { ro: 'Ulei CBD full spectrum', en: 'Full-spectrum CBD oil', hu: 'Teljes spektrumú CBD olaj' },
    summary: { ro: 'Extract de flori de cânepă în ulei MCT, cu tot spectrul de canabinoizi și terpene ai plantei. Picurătorul dozat măsoară fiecare picătură la fel, seară de seară.', en: 'Hemp flower extract in MCT oil, with the full range of cannabinoids and terpenes of the plant. The measured dropper gives the same drop every time, evening after evening.', hu: 'Kendervirág-kivonat MCT olajban, a növény teljes kannabinoid- és terpénkészletével. Az adagoló pipetta minden alkalommal ugyanakkora cseppet ad, estéről estére.' },
    description: { ro: 'Extract din flori de cânepă din soiuri înscrise în catalogul comun al UE, în ulei MCT. Fiecare lot are buletin de analiză.', en: 'Extract of hemp flowers from varieties in the EU common catalogue, in MCT oil. Every batch has a lab report.', hu: 'Az EU közös fajtajegyzékében szereplő kenderfajták virágkivonata MCT olajban. Minden tételhez laborjegyzőkönyv tartozik.' },
    facets: { forma: ['ulei'], effect: ['sleep', 'relax'] },
    groups: [strength(['5', '10', '20', '30']), volume(['10', '30'])],
    variants: [
      { id: 'uf-5-10', sku: 'UF-5-10', options: { putere: '5', volum: '10' }, price: 3490, stock: 'in', batch: 'RO-2409-05', pack: { mg: 500, size: 10, unit: 'ml' } },
      { id: 'uf-10-10', sku: 'UF-10-10', options: { putere: '10', volum: '10' }, price: 4490, stock: 'in', batch: 'RO-2409-10', pack: { mg: 1000, size: 10, unit: 'ml' } },
      { id: 'uf-10-30', sku: 'UF-10-30', options: { putere: '10', volum: '30' }, price: 8990, stock: 'low', batch: 'RO-2409-10', pack: { mg: 3000, size: 30, unit: 'ml' } },
      { id: 'uf-20-10', sku: 'UF-20-10', options: { putere: '20', volum: '10' }, price: 6490, stock: 'in', batch: 'RO-2409-20', pack: { mg: 2000, size: 10, unit: 'ml' } },
      { id: 'uf-30-10', sku: 'UF-30-10', options: { putere: '30', volum: '10' }, price: 8490, stock: 'out', batch: 'RO-2409-30', pack: { mg: 3000, size: 10, unit: 'ml' } },
    ] },
  { id:'ulei-cbd-izolat-10', cat:'uleiuri', label: '10 %', hue: 190, popular: 4, added: '2025-06-15', brand: 'Câmpia', rating: { value: 4.6, count: 52 }, strength: 'percent',
    name: { ro: 'Ulei CBD izolat 10 %', en: 'CBD isolate oil 10 %', hu: 'CBD izolátum olaj 10 %' },
    summary: { ro: 'CBD izolat pur în ulei de semințe de cânepă presat la rece, fără THC detectabil. Gust neutru, potrivit celor care vor doar CBD, fără alte substanțe ale plantei.', en: 'Pure CBD isolate in cold-pressed hemp seed oil, with no detectable THC. A neutral taste for those who want CBD alone, without the other compounds of the plant.', hu: 'Tiszta CBD izolátum hidegen sajtolt kendermagolajban, kimutatható THC nélkül. Semleges íz azoknak, akik csak CBD-t szeretnének, a növény többi anyaga nélkül.' },
    description: { ro: 'CBD izolat, dizolvat în ulei de semințe de cânepă presat la rece.', en: 'CBD isolate dissolved in cold-pressed hemp seed oil.', hu: 'Hidegen sajtolt kendermagolajban oldott CBD izolátum.' },
    facets: { forma: ['ulei'], effect: ['relax'] },
    groups: [],
    variants: [{ id: 'ui-10-10', sku: 'UI-10-10', options: {}, price: 3990, stock: 'in', batch: 'RO-2408-I10', pack: { mg: 1000, size: 10, unit: 'ml' } }] },
  { id:'ulei-cbd-5-incepatori', cat:'uleiuri', label: '5 %', hue: 120, popular: 3, added: '2025-05-20', brand: 'Câmpia', rating: { value: 4.5, count: 64 }, strength: 'percent',
    name: { ro: 'Ulei CBD 5 % pentru început', en: 'CBD oil 5 % starter', hu: 'CBD olaj 5 % kezdőknek' },
    summary: { ro: 'Concentrație blândă de 5 % pentru primele săptămâni cu CBD. Începeți cu câteva picături seara și creșteți doza treptat, după cum vă simțiți.', en: 'A gentle 5 % strength for your first weeks with CBD. Start with a few drops in the evening and raise the dose step by step, as you feel your way.', hu: 'Enyhe, 5 %-os erősség az első CBD-s hetekre. Kezdje esténként néhány cseppel, és emelje az adagot fokozatosan, ahogy jólesik.' },
    description: { ro: 'Pentru cine încearcă un ulei CBD pentru prima dată.', en: 'For those trying a CBD oil for the first time.', hu: 'Azoknak, akik először próbálnak CBD olajat.' },
    facets: { forma: ['ulei'], effect: ['relax'] },
    groups: [],
    variants: [{ id: 'us-5-10', sku: 'US-5-10', options: {}, price: 2990, stock: 'in', batch: 'RO-2409-S05', pack: { mg: 500, size: 10, unit: 'ml' } }] },
  { id:'ulei-cbd-20-seara', cat:'uleiuri', family:'ulei-seara', label: '20 %', hue: 250, popular: 6, added: '2025-09-10', brand: 'Câmpia', rating: { value: 4.8, count: 41 }, strength: 'percent', standard: 'ul-20-10',
    name: { ro: 'Ulei CBD 20 % cu lavandă', en: 'CBD oil 20 % with lavender', hu: 'CBD olaj 20 % levendulával' },
    summary: { ro: 'Ulei CBD de 20 % cu ulei esențial de lavandă, gândit pentru seară. Aroma florală acoperă gustul de plantă, iar picurătorul dozat păstrează aceeași măsură.', en: 'A 20 % CBD oil with lavender essential oil, made for the evening. The floral scent softens the herbal taste, and the measured dropper keeps the same dose.', hu: '20 %-os CBD olaj levendula illóolajjal, esti használatra. A virágos illat tompítja a növényi ízt, az adagoló pipetta pedig ugyanazt az adagot tartja.' },
    description: { ro: 'Ulei CBD 20 % cu ulei esențial de lavandă.', en: 'CBD oil 20 % with lavender essential oil.', hu: '20 %-os CBD olaj levendula illóolajjal.' },
    facets: { forma: ['ulei'], effect: ['sleep'] },
    groups: [volume(['10', '30'])],
    variants: [
      { id: 'ul-20-10', sku: 'UL-20-10', options: { volum: '10' }, price: 6990, stock: 'in', batch: 'RO-2409-L20', pack: { mg: 2000, size: 10, unit: 'ml' } },
      { id: 'ul-20-30', sku: 'UL-20-30', options: { volum: '30' }, price: 8990, stock: 'in', batch: 'RO-2409-L20', pack: { mg: 6000, size: 30, unit: 'ml' } },
    ] },
  { id:'ulei-cbd-30-forte', cat:'uleiuri', label: '30 %', hue: 10, popular: 8, added: '2025-11-05', brand: 'Câmpia', rating: { value: 4.6, count: 23 }, strength: 'percent',
    name: { ro: 'Ulei CBD 30 % forte', en: 'CBD oil 30 % forte', hu: 'CBD olaj 30 % forte' },
    summary: { ro: 'Cea mai mare concentrație din gamă, 30 %, pentru cei care cunosc deja CBD. Mai puține picături pentru aceeași doză, într-un flacon de 10 ml care ține mult.', en: 'Our highest strength, 30 %, for those who already know CBD. Fewer drops for the same dose, in a 10 ml bottle that lasts a long time.', hu: 'A kínálat legerősebb olaja, 30 %, azoknak, akik már ismerik a CBD-t. Kevesebb csepp ugyanahhoz az adaghoz, egy sokáig kitartó 10 ml-es üvegben.' },
    description: { ro: 'Pentru cine folosește deja uleiuri CBD.', en: 'For those who already use CBD oils.', hu: 'Azoknak, akik már használnak CBD olajat.' },
    facets: { forma: ['ulei'], effect: ['sleep', 'relief'] },
    groups: [],
    variants: [{ id: 'uf30-10', sku: 'UF30-10', options: {}, price: 8990, was: 10490, stock: 'in', batch: 'RO-2409-F30', pack: { mg: 3000, size: 10, unit: 'ml' } }] },
  { id:'capsule-cbd-25', cat:'capsule', family:'capsule', label: '25 mg', hue: 30, popular: 2, added: '2025-04-02', brand: 'Floare Verde', rating: { value: 4.4, count: 87 }, strength: 'mg', standard: 'cc-30',
    name: { ro: 'Capsule CBD 25 mg', en: 'CBD capsules 25 mg', hu: 'CBD kapszula 25 mg' },
    summary: { ro: 'Capsule vegane cu 25 mg CBD fiecare, pentru o doză exactă fără picurător. Fără gust, ușor de luat la drum, cu buletin de analiză pentru fiecare lot.', en: 'Vegan capsules with 25 mg of CBD each, for an exact dose without a dropper. No taste, easy to take on the go, with a lab report for every batch.', hu: 'Vegán kapszulák, egyenként 25 mg CBD-vel, pontos adaghoz pipetta nélkül. Íztelen, útközben is könnyen bevehető, minden tételhez laborjegyzőkönyvvel.' },
    description: { ro: 'Fiecare capsulă conține 25 mg CBD.', en: 'Each capsule contains 25 mg CBD.', hu: 'Minden kapszula 25 mg CBD-t tartalmaz.' },
    facets: { forma: ['capsule'], effect: ['sleep', 'relax'] },
    groups: [count(['30', '60'])],
    variants: [
      { id: 'cc-30', sku: 'CC-30', options: { bucati: '30' }, price: 3990, was: 4690, stock: 'in', batch: 'RO-2409-C25', pack: { mg: 750, size: 30, unit: 'pcs' } },
      { id: 'cc-60', sku: 'CC-60', options: { bucati: '60' }, price: 5990, stock: 'low', batch: 'RO-2409-C25', pack: { mg: 1500, size: 60, unit: 'pcs' } },
    ] },
  { id:'capsule-cbd-10', cat:'capsule', label: '10 mg', hue: 45, popular: 9, added: '2026-03-03', brand: 'Floare Verde', rating: { value: 4.2, count: 19 }, strength: 'mg',
    name: { ro: 'Capsule CBD 10 mg', en: 'CBD capsules 10 mg', hu: 'CBD kapszula 10 mg' },
    summary: { ro: 'Capsule de 10 mg CBD pentru o doză mică și constantă în fiecare zi. O cutie de 30 de bucăți ajunge pentru o lună, fără să numărați picături.', en: 'Capsules of 10 mg of CBD for a small, steady dose every day. A box of 30 lasts a month, with no drops to count.', hu: 'Egyenként 10 mg CBD-t tartalmazó kapszulák kis, egyenletes napi adaghoz. A 30 darabos doboz egy hónapra elég, cseppszámolás nélkül.' },
    description: { ro: 'Fiecare capsulă conține 10 mg CBD.', en: 'Each capsule contains 10 mg CBD.', hu: 'Minden kapszula 10 mg CBD-t tartalmaz.' },
    facets: { forma: ['capsule'], effect: ['relax'] },
    groups: [],
    variants: [{ id: 'cm-30', sku: 'CM-30', options: {}, price: 3490, stock: 'in', batch: 'RO-2408-C10', pack: { mg: 300, size: 30, unit: 'pcs' } }] },
  { id:'crema-cbd', cat:'cosmetice', label: 'crema', hue: 20, popular: 5, added: '2025-08-01', brand: 'Floare Verde', rating: { value: 4.5, count: 71 }, strength: 'mg',
    name: { ro: 'Cremă cu CBD', en: 'CBD cream', hu: 'CBD krém' },
    summary: { ro: 'Cremă cu 500 mg CBD în 50 ml, cu unt de shea și ulei de cânepă. Se absoarbe repede și nu lasă urme grase; lista completă a ingredientelor e pe cutie.', en: 'A cream with 500 mg of CBD in 50 ml, with shea butter and hemp oil. It sinks in quickly and leaves no greasy trace; the full ingredient list is on the box.', hu: '500 mg CBD 50 ml krémben, sheavajjal és kenderolajjal. Gyorsan beszívódik, nem hagy zsíros nyomot; a teljes összetevőlista a dobozon található.' },
    description: { ro: 'Cremă cu CBD și mentol.', en: 'Cream with CBD and menthol.', hu: 'Krém CBD-vel és mentollal.' },
    facets: { forma: ['crema'], effect: ['relief', 'recovery'] },
    groups: [],
    variants: [{ id: 'cr-50', sku: 'CR-50', options: {}, price: 2490, stock: 'in', batch: 'RO-2409-CR', pack: { mg: 500, size: 50, unit: 'ml' } }] },
  { id:'balsam-buze-cbd', cat:'cosmetice', label: 'balsam', hue: 340, popular: 10, added: '2026-05-18', brand: 'Floare Verde', rating: { value: 4.3, count: 38 }, strength: 'mg',
    name: { ro: 'Balsam de buze cu CBD', en: 'CBD lip balm', hu: 'CBD ajakbalzsam' },
    summary: { ro: 'Balsam de buze cu 50 mg CBD, ceară de albine și ulei de cânepă. Hrănește buzele uscate de vânt și frig și încape în orice buzunar.', en: 'A lip balm with 50 mg of CBD, beeswax and hemp oil. It soothes lips dried by wind and cold, and fits in any pocket.', hu: 'Ajakbalzsam 50 mg CBD-vel, méhviasszal és kenderolajjal. Ápolja a széltől és hidegtől kiszáradt ajkakat, és bármelyik zsebbe belefér.' },
    description: { ro: 'Balsam cu ceară de albine și CBD.', en: 'Beeswax balm with CBD.', hu: 'Méhviaszos balzsam CBD-vel.' },
    facets: { forma: ['crema'], effect: ['skin'] },
    groups: [],
    variants: [{ id: 'bb-5', sku: 'BB-5', options: {}, price: 1190, stock: 'in', batch: 'RO-2408-BB', pack: { mg: 50, size: 5, unit: 'g' } }] },
  { id:'ser-fata-cbd', cat:'cosmetice', label: 'ser', hue: 300, popular: 11, added: '2026-07-09', brand: null, rating: { value: 4.4, count: 29 }, strength: 'mg',
    name: { ro: 'Ser de față cu CBD', en: 'CBD face serum', hu: 'CBD arcszérum' },
    summary: { ro: 'Ser ușor pentru față cu CBD și acid hialuronic, în 30 ml. Textură fluidă care se așază sub cremă, dimineața sau seara.', en: 'A light face serum with CBD and hyaluronic acid, in 30 ml. A fluid texture that sits well under your cream, morning or evening.', hu: 'Könnyű arcszérum CBD-vel és hialuronsavval, 30 ml. Folyékony állag, amely jól illik a krém alá, reggel vagy este.' },
    description: { ro: 'Ser cu CBD și acid hialuronic.', en: 'Serum with CBD and hyaluronic acid.', hu: 'Szérum CBD-vel és hialuronsavval.' },
    facets: { forma: ['crema'], effect: ['skin'] },
    groups: [],
    variants: [{ id: 'sf-30', sku: 'SF-30', options: {}, price: 3290, stock: 'out', batch: 'RO-2407-SF', pack: { mg: null, size: 30, unit: 'ml' } }] },
  { id:'ulei-caini-cbd', cat:'animale', family:'animale-caini', label: 'dog', hue: 90, popular: 7, added: '2026-01-22', brand: 'Câmpia', rating: { value: 4.7, count: 46 }, strength: 'percent', standard: 'ac-10',
    name: { ro: 'Ulei CBD pentru câini', en: 'CBD oil for dogs', hu: 'CBD olaj kutyáknak' },
    summary: { ro: 'Ulei CBD pentru câini, cu ulei de somon pe care îl mănâncă bucuros. Picurătorul gradat ajută la doza potrivită greutății câinelui.', en: 'A CBD oil for dogs, with salmon oil they happily eat. The marked dropper helps you give the dose that suits your dog’s weight.', hu: 'CBD olaj kutyáknak, lazacolajjal, amelyet szívesen megesznek. A jelölt pipetta segít a kutya testsúlyához illő adagot adni.' },
    description: { ro: 'Ulei CBD 5 % cu ulei de somon, pentru câini.', en: 'CBD oil 5 % with salmon oil, for dogs.', hu: '5 %-os CBD olaj lazacolajjal, kutyáknak.' },
    facets: { forma: ['pentru-animale'], effect: ['dogs'] },
    groups: [volume(['10', '30'])],
    variants: [
      { id: 'ac-10', sku: 'AC-10', options: { volum: '10' }, price: 2290, stock: 'in', batch: 'RO-2409-AC', pack: { mg: 500, size: 10, unit: 'ml' } },
      { id: 'ac-30', sku: 'AC-30', options: { volum: '30' }, price: 2990, stock: 'in', batch: 'RO-2409-AC', pack: { mg: 1500, size: 30, unit: 'ml' } },
    ] },
  { id:'ulei-pisici-cbd', cat:'animale', label: 'cat', hue: 60, popular: 12, added: '2026-08-27', brand: 'Câmpia', rating: { value: 4.5, count: 17 }, strength: 'percent',
    name: { ro: 'Ulei CBD pentru pisici', en: 'CBD oil for cats', hu: 'CBD olaj macskáknak' },
    summary: { ro: 'Ulei CBD blând de 2,5 % pentru pisici, în 10 ml. Fără arome adăugate, cu picurător fin pentru doze mici, pe hrană sau direct.', en: 'A gentle 2.5 % CBD oil for cats, in 10 ml. No added flavours, with a fine dropper for small doses, on food or straight.', hu: 'Enyhe, 2,5 %-os CBD olaj macskáknak, 10 ml. Hozzáadott aroma nélkül, finom pipettával a kis adagokhoz, ételre vagy közvetlenül.' },
    description: { ro: 'Concentrație redusă, pentru pisici.', en: 'A low strength, for cats.', hu: 'Alacsony erősség, macskáknak.' },
    facets: { forma: ['pentru-animale'] },
    groups: [],
    variants: [{ id: 'ap-10', sku: 'AP-10', options: {}, price: 1990, stock: 'low', batch: 'RO-2409-AP', pack: { mg: 250, size: 10, unit: 'ml' } }] },
]

/* Отдельный товар на каждую силу и меру (слово заказчика 28.09.2026:
   «отдельный товар на каждый процент и объём — это же СЕО, нужно, чтоб в
   поиске индексировались все товары»; И503). Образец записан линейками —
   товар с вариантами, как его удобно читать, — и здесь раскладывается так,
   как его держит каталог магазина: вариант становится товаром со своим
   адресом, а линейка — списком соседей (`line`) для выбора на карте.
   Стандартный вариант линейки держит её прежний адрес (ходовые главной,
   похожие и проверки ссылаются на него); остальные — адрес с мерой. */
const UNIT: Record<string, string> = { putere: '', volum: 'ml', bucati: 'buc' }
const slugOf = (base: string, v: SampleVariant) => `${base}-${Object.entries(v.options).map(([k, c]) => `${c.replace('.', '-')}${UNIT[k] ?? ''}`).join('-')}`
function split(p: SampleProduct): SampleProduct[] {
  if (p.variants.length < 2) return [p]
  const main = p.standard ?? p.variants[0].id
  const idOf = (v: SampleVariant) => (v.id === main ? p.id : slugOf(p.id, v))
  const line = p.variants.map((v) => ({ id: idOf(v), options: v.options, stock: v.stock }))
  return p.variants.map((v) => ({ ...p, id: idOf(v), standard: v.id, variants: [v], line }))
}
export const PRODUCTS: SampleProduct[] = LINES.flatMap(split)

/** Состав и способ применения — образец данных по полке (И466): настоящий
 *  текст у каждого товара даёт каталог магазина. */
export const LAB_REPORTS: Record<string, { lab: string; date: string; cbdPercent: number; thcPercent: number }> = {
  'RO-2409-05': { lab: 'Laborator de exemplu', date: '2026-09-02', cbdPercent: 5.1, thcPercent: 0.12 },
  'RO-2409-10': { lab: 'Laborator de exemplu', date: '2026-09-02', cbdPercent: 10.2, thcPercent: 0.15 },
  'RO-2409-20': { lab: 'Laborator de exemplu', date: '2026-09-03', cbdPercent: 20.4, thcPercent: 0.18 },
  'RO-2409-30': { lab: 'Laborator de exemplu', date: '2026-09-03', cbdPercent: 30.1, thcPercent: 0.19 },
  'RO-2409-C25': { lab: 'Laborator de exemplu', date: '2026-09-04', cbdPercent: 10.0, thcPercent: 0.05 },
}
