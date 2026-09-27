import type { Lang } from './locale.ts'
import type { Block, Image, LabReport } from './source/contract.ts'
import { scene } from './source/sample/art.ts'
import { LAB_REPORTS } from './products.ts'

type SamplePage = { title: Record<Lang, string>; description: Record<Lang, string>; blocks: Record<Lang, Block[]> }
/* Снимок героя — сцена-образец (art.ts): текст героя лежит поверх него, поэтому
   подпись пустая — смысл несут заголовок и абзац, картинка их не повторяет. */
const HERO: Image = { src: scene(), alt: '', width: 1600, height: 1000 }
const HERO_OILS: Image = { src: scene('oils'), alt: '', width: 1600, height: 1000 }
const HERO_CARE: Image = { src: scene('care'), alt: '', width: 1600, height: 1000 }
/* Протокол рядом с текстом блока «лаборатория» — образец партии из данных
   образца (products.ts), тот же, что стоит на карте товара. `url` — сам
   документ: блок ведёт к нему ссылкой. У образца это заглушка, помеченная
   «SAMPLE» (public/sample/), — настоящий протокол лаборатории даёт магазин. */
const LOT = 'RO-2409-10'
const REPORT: LabReport = { batch: LOT, ...LAB_REPORTS[LOT], url: `/sample/lab-${LOT}.pdf` }
const FEATURED = ['ulei-cbd-full-spectrum', 'capsule-cbd-25', 'crema-cbd', 'ulei-caini-cbd']
/* Первая полка после категорий — масла (слово заказчика 27.09.2026:
   «первый блок после категорий — CBD Oil»). */
const OILS = ['ulei-cbd-full-spectrum', 'ulei-cbd-izolat-10', 'ulei-cbd-5-incepatori', 'ulei-cbd-20-seara', 'ulei-cbd-30-forte']
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
        { type: 'hero', title: 'Produse CBD cu buletin de analiză pentru fiecare lot', lede: 'Uleiuri, capsule și cosmetice din cânepă. Numărul lotului de pe etichetă este același cu cel din buletinul laboratorului.', cta: 'Vedeți produsele', image: HERO, more: [{ title: 'Uleiuri CBD de la 5 % la 30 %', lede: 'Spectru complet sau izolat, picurător dozat. Buletin de analiză pentru fiecare lot.', cta: 'Vedeți uleiurile', to: 'uleiuri', image: HERO_OILS }, { title: 'Cosmetice cu CBD', lede: 'Cremă, ser și balsam de buze. Lista completă a ingredientelor pe fiecare ambalaj.', cta: 'Vedeți cosmeticele', to: 'cosmetice', image: HERO_CARE }] },
        { type: 'categories', title: 'Categorii' },
        { type: 'featured', title: 'Uleiuri CBD', ids: OILS, to: 'uleiuri' },
        { type: 'featured', title: 'Cele mai vândute', ids: FEATURED },
        { type: 'lab', title: 'Buletin de analiză pentru fiecare lot', body: 'Laboratorul măsoară CBD, THC, metale grele, pesticide și solvenți. Buletinul fiecărui lot este pe pagina produsului.', report: REPORT },
        STORY,
        { type: 'delivery', title: 'Livrare și plată', items: [
          { title: 'Plata ramburs', body: 'Plătiți la primirea coletului.' },
        ] },
        { type: 'faq', title: 'Întrebări frecvente', items: [
          { q: 'Ce conține buletinul de analiză?', a: 'Concentrația de CBD și THC, metalele grele, pesticidele și solvenții reziduali ai lotului.' },
          { q: 'Unde găsesc numărul lotului?', a: 'Pe eticheta produsului; același număr apare în buletinul laboratorului.' },
          { q: 'Cât durează livrarea?', a: 'De obicei 1–3 zile lucrătoare; termenul exact apare la finalizarea comenzii.' },
          { q: 'Pot plăti la livrare?', a: 'Da, plata ramburs este disponibilă pentru livrarea prin curier și la punct de ridicare.' },
        ] },
      ],
      en: [
        { type: 'hero', title: 'CBD products with a lab report for every batch', lede: 'Oils, capsules and cosmetics made from hemp. The batch number on the label is the same as in the lab report.', cta: 'See the products', image: HERO, more: [{ title: 'CBD oils from 5 % to 30 %', lede: 'Full spectrum or isolate, a measured dropper. A lab report for every batch.', cta: 'See the oils', to: 'uleiuri', image: HERO_OILS }, { title: 'CBD cosmetics', lede: 'Cream, serum and lip balm. The full ingredient list on every pack.', cta: 'See the cosmetics', to: 'cosmetice', image: HERO_CARE }] },
        { type: 'categories', title: 'Categories' },
        { type: 'featured', title: 'CBD oils', ids: OILS, to: 'uleiuri' },
        { type: 'featured', title: 'Best sellers', ids: FEATURED },
        { type: 'lab', title: 'A lab report for every batch', body: 'The lab measures CBD, THC, heavy metals, pesticides and solvents. Every batch report is on the product page.', report: REPORT },
        STORY,
        { type: 'delivery', title: 'Delivery and payment', items: [
          { title: 'Cash on delivery', body: 'Pay when the parcel arrives.' },
        ] },
        { type: 'faq', title: 'Frequently asked questions', items: [
          { q: 'What does the lab report contain?', a: 'The CBD and THC content, heavy metals, pesticides and residual solvents of the batch.' },
          { q: 'Where do I find the batch number?', a: 'On the product label; the same number appears in the lab report.' },
          { q: 'How long does delivery take?', a: 'Usually 1–3 working days; the exact time is shown at checkout.' },
          { q: 'Can I pay on delivery?', a: 'Yes, cash on delivery is available for courier and parcel locker delivery.' },
        ] },
      ],
      hu: [
        { type: 'hero', title: 'CBD termékek minden tételhez laborjegyzőkönyvvel', lede: 'Kenderből készült olajok, kapszulák és kozmetikumok. A címkén lévő tételszám megegyezik a laborjegyzőkönyvben szereplővel.', cta: 'Termékek megtekintése', image: HERO, more: [{ title: 'CBD olajok 5 %-tól 30 %-ig', lede: 'Teljes spektrum vagy izolátum, adagoló pipetta. Minden tételhez laborjegyzőkönyv.', cta: 'Olajok megtekintése', to: 'uleiuri', image: HERO_OILS }, { title: 'CBD kozmetikumok', lede: 'Krém, szérum és ajakbalzsam. A teljes összetevőlista minden csomagoláson.', cta: 'Kozmetikumok megtekintése', to: 'cosmetice', image: HERO_CARE }] },
        { type: 'categories', title: 'Kategóriák' },
        { type: 'featured', title: 'CBD olajok', ids: OILS, to: 'uleiuri' },
        { type: 'featured', title: 'Legnépszerűbb termékek', ids: FEATURED },
        { type: 'lab', title: 'Minden tételhez laborjegyzőkönyv', body: 'A labor méri a CBD- és THC-tartalmat, a nehézfémeket, a növényvédő szereket és az oldószereket. Minden tétel jegyzőkönyve a termékoldalon található.', report: REPORT },
        STORY,
        { type: 'delivery', title: 'Szállítás és fizetés', items: [
          { title: 'Utánvét', body: 'Fizessen a csomag átvételekor.' },
        ] },
        { type: 'faq', title: 'Gyakori kérdések', items: [
          { q: 'Mit tartalmaz a laborjegyzőkönyv?', a: 'A tétel CBD- és THC-tartalmát, nehézfém-, növényvédőszer- és oldószer-maradványait.' },
          { q: 'Hol találom a tételszámot?', a: 'A termék címkéjén; ugyanez a szám szerepel a laborjegyzőkönyvben.' },
          { q: 'Mennyi ideig tart a szállítás?', a: 'Általában 1–3 munkanap; a pontos időt a rendelés véglegesítésekor látja.' },
          { q: 'Fizethetek átvételkor?', a: 'Igen, utánvéttel fizethet futáros és csomagautomatás szállításnál is.' },
        ] },
      ],
    },
  },
}
