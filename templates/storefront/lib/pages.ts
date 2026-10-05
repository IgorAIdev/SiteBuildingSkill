import type { Lang } from './locale.ts'
import type { Block, Image } from './source/contract.ts'
import { scene } from './source/sample/art.ts'

type SamplePage = { title: Record<Lang, string>; description: Record<Lang, string>; blocks: Record<Lang, Block[]> }
/* Снимок героя — сцена-образец (art.ts): текст героя лежит поверх него, поэтому
   подпись пустая — смысл несут заголовок и абзац, картинка их не повторяет. */
const HERO: Image = { src: scene(), alt: '', width: 1600, height: 1000 }
/* Протокол рядом с текстом блока «лаборатория» — образец партии из данных
   образца (products.ts), тот же, что стоит на карте товара. `url` — сам
   документ: блок ведёт к нему ссылкой. У образца это заглушка, помеченная
   «SAMPLE» (public/sample/), — настоящий протокол лаборатории даёт магазин. */
const FEATURED = ['ulei-cbd-full-spectrum', 'capsule-cbd-25', 'crema-cbd', 'ulei-caini-cbd']
/* Первая полка после категорий — масла (слово заказчика 27.09.2026:
   «первый блок после категорий — CBD Oil»). Разделов протокола и
   доставки на главной нет (слово заказчика 28.09.2026: «разделы лаб репорт,
   деливери убирай»): протокол — на карте товара, доставка — своей страницей. */
const OILS = ['ulei-cbd-full-spectrum', 'ulei-cbd-izolat-10', 'ulei-cbd-5-incepatori', 'ulei-cbd-20-seara', 'ulei-cbd-30-forte']
/* Полки кнопками героя — главные (слово заказчика 03.10.2026: «кнопки основных
   категорий: масло, капсулы, edibles и topicals; другие категории не
   размещаем»). Адреса образца — масла и капсулы; съедобного и мазей у образца
   нет, и кнопок их нет, а подставка движка (source/index.ts) находит их полки
   по виду (`edibles`, `topicals`), как полку ходовых. */
/* Полки кнопками героя — все полки магазина в порядке каталога (И735; слово
   заказчика 04.10.2026: «есть место и для второго ряда — размещай все категории
   кнопками»). */
const HERO_SHELVES = 'all' as const
/* Полка капсул — сразу за маслами (слово заказчика 03.10.2026: «категории
   капсулы ещё добавь после блока масел»). */
const CAPSULES = ['capsule-cbd-25', 'capsule-cbd-10']
/* МЕСТО ЗАКАЗЧИКА — «слово магазина» (docs/design/home.md, «Пустые места»):
   заголовок, два-три предложения о магазине своими словами и снимок с
   подписью. Нужно варианту главной Journal (стоит сразу за ходовыми), в
   остальных встаёт перед справкой. Пока пусто — блок молчит: на витрине ни
   заглушки, ни рамки (скилл shop, «Пустое состояние молчит»). Слова не
   сочиняются за магазин — их пишет владелец (CLAUDE.md, «Граница
   ответственности»). */
const STORY: Block = { type: 'story', title: '', body: '', image: null }

/* Блоки главной — как придут из Payload (план 4): тип и поля, без вида.
   Способы доставки, их срок и цену блок «delivery» берёт из данных
   магазина — того же списка, что выбор на оформлении (И95), — а в своих
   словах (`items`) несёт только то, чего в том списке нет: заметки об
   оплате. Способ словами здесь — второй источник срока и цены: «1–3 дня»
   стояли рядом с «1–2» из данных (И279). */
export const PAGES: Record<string, SamplePage> = {
  home: {
    title: { ro: 'Magazin CBD — uleiuri, capsule, cosmetice', en: 'CBD shop — oils, capsules, cosmetics', hu: 'CBD bolt — olajok, kapszulák, kozmetikumok' },
    description: {
      ro: 'Produse CBD cu buletin de analiză pentru fiecare lot. Livrare prin curier sau la punct de ridicare, plata ramburs.',
      en: 'CBD products with a lab report for every batch. Courier or parcel locker delivery, cash on delivery.',
      hu: 'CBD termékek minden tételhez laborjegyzőkönyvvel. Futár vagy csomagautomata, utánvétes fizetés.',
    },
    blocks: {
      ro: [
        { type: 'hero', title: 'Produse CBD cu buletin de analiză pentru fiecare lot', lede: 'Uleiuri, capsule și cosmetice din cânepă. Numărul lotului de pe etichetă este același cu cel din buletinul laboratorului, așa că știți ce este în flacon înainte de prima picătură.', image: HERO, shelves: HERO_SHELVES },
        { type: 'effects', title: 'Cumpără după efect', lede: 'Aceleași produse, grupate după motivul pentru care le aleg clienții. Pe pagina fiecărui efect găsiți toate formele: uleiuri, capsule și cosmetice.' },
        { type: 'featured', title: 'Uleiuri CBD', lede: 'Uleiuri din cânepă cu spectru complet sau izolat, de la 5 % la 30 %. Fiecare flacon are picurător dozat, iar numărul lotului de pe etichetă duce la buletinul de analiză al laboratorului.', ids: OILS, to: 'uleiuri' },
        { type: 'featured', title: 'Capsule CBD', lede: 'Doză fixă în fiecare capsulă: nu numărați picături și nu simțiți gustul uleiului. Numărul lotului de pe cutie duce la buletinul de analiză al laboratorului.', ids: CAPSULES, to: 'capsule' },
        { type: 'featured', title: 'Cele mai vândute', lede: 'Produsele pe care clienții le comandă din nou: uleiuri pentru început, capsule pentru doza fixă și cosmetice pentru îngrijirea zilnică. Toate cu buletin de analiză pentru fiecare lot.', ids: FEATURED },
        { type: 'reviews', title: 'Ce spun clienții', lede: 'Exemple de recenzii — recenziile reale ale magazinului vor apărea aici.', all: null },
        STORY,
        { type: 'posts', title: 'Ghiduri și articole', lede: 'Cum alegeți concentrația, cum citiți buletinul de analiză și prin ce diferă spectrul complet de izolat.' },
        { type: 'faq', title: 'Întrebări frecvente', items: [
          { q: 'Ce conține buletinul de analiză?', a: 'Concentrația de CBD și THC, metalele grele, pesticidele și solvenții reziduali ai lotului.' },
          { q: 'Unde găsesc numărul lotului?', a: 'Pe eticheta produsului; același număr apare în buletinul laboratorului.' },
          { q: 'Care este diferența dintre spectru complet și izolat?', a: 'Spectrul complet păstrează, pe lângă CBD, și alte substanțe ale cânepei și poate conține urme de THC în limita legală din UE; izolatul este CBD purificat, fără THC.' },
          { q: 'Cu ce concentrație să încep?', a: 'Cei care încearcă prima dată aleg de obicei 5 % și cresc treptat numărul de picături. O concentrație mai mare înseamnă mai puține picături pentru aceeași cantitate, nu un ulei mai bun.' },
          { q: 'Cât durează livrarea?', a: 'Depinde de metoda aleasă: fiecare metodă își arată termenul și prețul la finalizarea comenzii și pe pagina Livrare și plată.' },
          { q: 'Pot plăti la livrare?', a: 'Da, plata ramburs este disponibilă pentru livrarea prin curier și la punct de ridicare.' },
          { q: 'Cum returnez un produs?', a: 'Scrieți-ne numărul comenzii și vă trimitem instrucțiunile; termenul și condițiile sunt pe pagina Retur.' },
        ] },
      ],
      en: [
        { type: 'hero', title: 'CBD products with a lab report for every batch', lede: 'Oils, capsules and cosmetics made from hemp. The batch number on the label is the same as in the lab report, so you know what is in the bottle before the first drop.', image: HERO, shelves: HERO_SHELVES },
        { type: 'effects', title: 'Shop by effect', lede: 'The same products, grouped by what customers choose them for. Each effect page lists every form: oils, capsules and cosmetics.' },
        { type: 'featured', title: 'CBD oils', lede: 'Hemp oils in full spectrum or isolate, from 5 % to 30 %. Every bottle has a measured dropper, and the batch number on the label leads to the lab report for that batch.', ids: OILS, to: 'uleiuri' },
        { type: 'featured', title: 'CBD capsules', lede: 'A fixed dose in every capsule: no drops to count and no taste of oil. The batch number on the box leads to the lab report for that batch.', ids: CAPSULES, to: 'capsule' },
        { type: 'featured', title: 'Best sellers', lede: 'What customers order again: oils to start with, capsules for a fixed dose and cosmetics for daily care. Every one comes with a lab report for its batch.', ids: FEATURED },
        { type: 'reviews', title: 'What customers say', lede: 'Sample reviews — the shop’s real reviews will appear here.', all: null },
        STORY,
        { type: 'posts', title: 'Guides and articles', lede: 'How to choose a strength, read a lab report and tell full spectrum from isolate.' },
        { type: 'faq', title: 'Frequently asked questions', items: [
          { q: 'What does the lab report contain?', a: 'The CBD and THC content, heavy metals, pesticides and residual solvents of the batch.' },
          { q: 'Where do I find the batch number?', a: 'On the product label; the same number appears in the lab report.' },
          { q: 'What is the difference between full spectrum and isolate?', a: 'Full spectrum keeps, besides CBD, other compounds of the hemp plant and may hold traces of THC within the EU legal limit; isolate is purified CBD without THC.' },
          { q: 'Which strength should I start with?', a: 'First-timers usually pick 5 % and raise the number of drops gradually. A higher strength means fewer drops for the same amount, not a better oil.' },
          { q: 'How long does delivery take?', a: 'It depends on the method you choose: each method shows its time and price at checkout and on the Delivery and payment page.' },
          { q: 'Can I pay on delivery?', a: 'Yes, cash on delivery is available for courier and parcel locker delivery.' },
          { q: 'How do I return a product?', a: 'Send us the order number and we will reply with instructions; the deadline and conditions are on the Returns page.' },
        ] },
      ],
      hu: [
        { type: 'hero', title: 'CBD termékek minden tételhez laborjegyzőkönyvvel', lede: 'Kenderből készült olajok, kapszulák és kozmetikumok. A címkén lévő tételszám megegyezik a laborjegyzőkönyvben szereplővel, így már az első csepp előtt tudja, mi van az üvegben.', image: HERO, shelves: HERO_SHELVES },
        { type: 'effects', title: 'Vásároljon hatás szerint', lede: 'Ugyanazok a termékek, aszerint csoportosítva, amiért a vásárlók választják őket. Minden hatás oldalán megtalálja az összes formát: olajokat, kapszulákat és kozmetikumokat.' },
        { type: 'featured', title: 'CBD olajok', lede: 'Teljes spektrumú vagy izolátum kenderolajok 5 %-tól 30 %-ig. Minden üveghez adagoló pipetta jár, a címkén lévő tételszám pedig a tétel laborjegyzőkönyvéhez vezet.', ids: OILS, to: 'uleiuri' },
        { type: 'featured', title: 'CBD kapszulák', lede: 'Minden kapszulában azonos adag: nem kell cseppeket számolni, és nincs olajíz. A dobozon lévő tételszám a tétel laborjegyzőkönyvéhez vezet.', ids: CAPSULES, to: 'capsule' },
        { type: 'featured', title: 'Legnépszerűbb termékek', lede: 'Amit a vásárlók újra megrendelnek: olajok a kezdéshez, kapszulák a pontos adaghoz és kozmetikumok a napi ápoláshoz. Mindegyikhez tételenkénti laborjegyzőkönyv tartozik.', ids: FEATURED },
        { type: 'reviews', title: 'Mit mondanak a vásárlók', lede: 'Minta vélemények — itt jelennek meg majd a bolt valódi véleményei.', all: null },
        STORY,
        { type: 'posts', title: 'Útmutatók és cikkek', lede: 'Hogyan válasszon erősséget, hogyan olvassa a laborjegyzőkönyvet, és miben különbözik a teljes spektrum az izolátumtól.' },
        { type: 'faq', title: 'Gyakori kérdések', items: [
          { q: 'Mit tartalmaz a laborjegyzőkönyv?', a: 'A tétel CBD- és THC-tartalmát, nehézfém-, növényvédőszer- és oldószer-maradványait.' },
          { q: 'Hol találom a tételszámot?', a: 'A termék címkéjén; ugyanez a szám szerepel a laborjegyzőkönyvben.' },
          { q: 'Mi a különbség a teljes spektrum és az izolátum között?', a: 'A teljes spektrum a CBD mellett a kender más vegyületeit is megtartja, és az EU-s határértéken belül THC-nyomokat tartalmazhat; az izolátum tisztított CBD, THC nélkül.' },
          { q: 'Milyen erősséggel kezdjem?', a: 'Aki először próbálja, általában az 5 %-ot választja, és fokozatosan emeli a cseppek számát. A nagyobb erősség ugyanannyi CBD-hez kevesebb cseppet jelent, nem jobb olajat.' },
          { q: 'Mennyi ideig tart a szállítás?', a: 'A választott módtól függ: minden szállítási mód a rendelés véglegesítésekor és a Szállítás és fizetés oldalon mutatja az idejét és az árát.' },
          { q: 'Fizethetek átvételkor?', a: 'Igen, utánvéttel fizethet futáros és csomagautomatás szállításnál is.' },
          { q: 'Hogyan küldhetek vissza egy terméket?', a: 'Írja meg a rendelésszámot, és elküldjük az útmutatót; a határidőt és a feltételeket a Visszaküldés oldalon találja.' },
        ] },
      ],
    },
  },
}
