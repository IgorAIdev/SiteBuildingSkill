import type { Lang } from '../locale.ts'

/* Состав и способ применения — стандартные тексты по виду товара (И482).

   Слово заказчика 27.09.2026: «состав и применение напиши стандартные,
   какие-то». Текст один на вид товара, а не на товар: у всех масел линейки
   состав и способ приёма одни и те же, и поле на каждом товаре значило бы
   переписывать одно и то же в каждой карточке (так же устроен магазин:
   «How this kind of product is taken. The same for every product in the
   range», Payload, `product-copy`). Свой текст товара — у источника; нет
   его — стоит этот.

   Виды — закрытый список полок движка магазина (коды грани `category` в
   Vendure: oil, capsules, paste, edibles, pets, vape, cosmetics, topicals,
   flowers). Образец данных называет вид у своей полки (`form`).

   Слова — без обещаний здоровья (скилл shop, «Магазин CBD»): что внутри и
   как принимают, а не от чего помогает. Точный состав партии — в протоколе
   анализа и на упаковке, и текст об этом говорит. */
export type Form = 'oil' | 'capsules' | 'paste' | 'edibles' | 'pets' | 'vape' | 'cosmetics' | 'topicals' | 'flowers'

type Words = Record<Lang, string>
type Details = { ingredients: Words; usage: Words }

const DETAILS: Record<Form, Details> = {
  oil: {
    ingredients: {
      ro: 'Ulei purtător (MCT din nucă de cocos sau ulei din semințe de cânepă) și extract de cânepă (Cannabis sativa L.) din soiuri din catalogul comun al UE. Conținutul exact al lotului — în buletinul de analiză.',
      en: 'A carrier oil (MCT from coconut or hemp seed oil) and hemp extract (Cannabis sativa L.) from varieties in the EU common catalogue. The exact content of the batch is in its certificate of analysis.',
      hu: 'Hordozóolaj (kókuszból nyert MCT vagy kendermagolaj) és kenderkivonat (Cannabis sativa L.) az uniós közös fajtajegyzék fajtáiból. A tétel pontos tartalma az elemzési bizonylatban.',
    },
    usage: {
      ro: 'Agitați flaconul înainte de utilizare. Puneți picăturile sub limbă, țineți-le aproximativ un minut, apoi înghițiți. Începeți cu 2–3 picături o dată pe zi. Nu depășiți doza zilnică indicată pe etichetă.',
      en: 'Shake the bottle before use. Place the drops under the tongue, hold for about a minute, then swallow. Start with 2–3 drops once a day. Do not exceed the daily amount on the label.',
      hu: 'Használat előtt rázza fel az üveget. Cseppentse a nyelve alá, tartsa ott körülbelül egy percig, majd nyelje le. Kezdje napi egyszer 2–3 cseppel. Ne lépje túl a címkén jelzett napi mennyiséget.',
    },
  },
  capsules: {
    ingredients: {
      ro: 'Extract de cânepă (Cannabis sativa L.), ulei purtător (MCT sau ulei de măsline); învelișul capsulei — gelatină sau, unde scrie pe ambalaj, înveliș vegetal.',
      en: 'Hemp extract (Cannabis sativa L.), a carrier oil (MCT or olive oil); the capsule shell is gelatine or, where the pack says so, plant-based.',
      hu: 'Kenderkivonat (Cannabis sativa L.), hordozóolaj (MCT vagy olívaolaj); a kapszulahéj zselatin vagy — ahol a csomagolás ezt írja — növényi.',
    },
    usage: {
      ro: 'O capsulă pe zi, cu apă, în timpul mesei. Nu depășiți doza zilnică indicată pe etichetă.',
      en: 'One capsule a day with water, with a meal. Do not exceed the daily amount on the label.',
      hu: 'Napi egy kapszula vízzel, étkezés közben. Ne lépje túl a címkén jelzett napi mennyiséget.',
    },
  },
  paste: {
    ingredients: {
      ro: 'Extract concentrat de cânepă (Cannabis sativa L.), fără ulei purtător sau cu foarte puțin. Conținutul exact al lotului — în buletinul de analiză.',
      en: 'Concentrated hemp extract (Cannabis sativa L.) with little or no carrier oil. The exact content of the batch is in its certificate of analysis.',
      hu: 'Koncentrált kenderkivonat (Cannabis sativa L.), hordozóolaj nélkül vagy nagyon kevéssel. A tétel pontos tartalma az elemzési bizonylatban.',
    },
    usage: {
      ro: 'Puneți sub limbă o porție cât un bob de orez, țineți-o până se topește, apoi înghițiți. O dată pe zi. Nu depășiți doza zilnică indicată pe etichetă.',
      en: 'Place a rice-grain-sized amount under the tongue, hold until it melts, then swallow. Once a day. Do not exceed the daily amount on the label.',
      hu: 'Tegyen a nyelve alá egy rizsszemnyi mennyiséget, tartsa ott, amíg elolvad, majd nyelje le. Naponta egyszer. Ne lépje túl a címkén jelzett napi mennyiséget.',
    },
  },
  edibles: {
    ingredients: {
      ro: 'Ingrediente alimentare obișnuite și extract de cânepă (Cannabis sativa L.). Lista completă și alergenii — pe ambalaj.',
      en: 'Ordinary food ingredients and hemp extract (Cannabis sativa L.). The full list and allergens are on the pack.',
      hu: 'Szokásos élelmiszer-összetevők és kenderkivonat (Cannabis sativa L.). A teljes lista és az allergének a csomagoláson.',
    },
    usage: {
      ro: 'O porție pe zi, după cum scrie pe ambalaj. Nu depășiți doza zilnică indicată. Nu este destinat copiilor.',
      en: 'One serving a day, as the pack says. Do not exceed the daily amount on the label. Not intended for children.',
      hu: 'Napi egy adag a csomagoláson írtak szerint. Ne lépje túl a címkén jelzett napi mennyiséget. Gyermekek számára nem ajánlott.',
    },
  },
  pets: {
    ingredients: {
      ro: 'Ulei purtător potrivit animalelor (ulei de somon sau ulei din semințe de cânepă) și extract de cânepă (Cannabis sativa L.), fără arome artificiale.',
      en: 'A pet-friendly carrier oil (salmon oil or hemp seed oil) and hemp extract (Cannabis sativa L.), with no artificial flavours.',
      hu: 'Állatoknak való hordozóolaj (lazacolaj vagy kendermagolaj) és kenderkivonat (Cannabis sativa L.), mesterséges aroma nélkül.',
    },
    usage: {
      ro: 'Adăugați picăturile în hrană o dată pe zi. Cantitatea depinde de greutatea animalului — tabelul de pe etichetă. Pentru animale sub tratament, întrebați medicul veterinar.',
      en: 'Add the drops to food once a day. The amount depends on the animal’s weight — see the table on the label. For animals under treatment, ask your vet.',
      hu: 'Cseppentse az eledelre naponta egyszer. A mennyiség az állat testtömegétől függ — lásd a címkén lévő táblázatot. Kezelés alatt álló állatnál kérdezze meg az állatorvost.',
    },
  },
  vape: {
    ingredients: {
      ro: 'Propilenglicol, glicerină vegetală, extract de cânepă (Cannabis sativa L.) și, unde scrie pe ambalaj, arome. Fără nicotină.',
      en: 'Propylene glycol, vegetable glycerine, hemp extract (Cannabis sativa L.) and, where the pack says so, flavourings. No nicotine.',
      hu: 'Propilénglikol, növényi glicerin, kenderkivonat (Cannabis sativa L.) és — ahol a csomagolás ezt írja — aromák. Nikotinmentes.',
    },
    usage: {
      ro: 'Pentru țigarete electronice. Umpleți rezervorul, lăsați fitilul să se îmbibe câteva minute, apoi inhalați ușor. Doar pentru adulți.',
      en: 'For e-cigarettes. Fill the tank, let the wick soak for a few minutes, then inhale gently. Adults only.',
      hu: 'Elektromos cigarettához. Töltse fel a tartályt, hagyja néhány percig ázni a kanócot, majd óvatosan szívja. Csak felnőtteknek.',
    },
  },
  cosmetics: {
    ingredients: {
      ro: 'Uleiuri și unturi vegetale (de exemplu shea), extract de cânepă (Cannabis sativa L.), vitamina E. Lista completă (INCI) — pe ambalaj.',
      en: 'Plant oils and butters (such as shea), hemp extract (Cannabis sativa L.), vitamin E. The full list (INCI) is on the pack.',
      hu: 'Növényi olajok és vajak (például shea), kenderkivonat (Cannabis sativa L.), E-vitamin. A teljes lista (INCI) a csomagoláson.',
    },
    usage: {
      ro: 'Aplicați un strat subțire pe pielea curată și masați până se absoarbe. Doar pentru uz extern; evitați contactul cu ochii.',
      en: 'Apply a thin layer to clean skin and massage until absorbed. For external use only; avoid contact with the eyes.',
      hu: 'Vigyen fel vékony réteget a tiszta bőrre, és masszírozza be. Csak külsőleg; kerülje a szembe jutást.',
    },
  },
  topicals: {
    ingredients: {
      ro: 'Bază de cremă sau gel, extract de cânepă (Cannabis sativa L.) și, unde scrie pe ambalaj, uleiuri esențiale (mentol, arnică). Lista completă (INCI) — pe ambalaj.',
      en: 'A cream or gel base, hemp extract (Cannabis sativa L.) and, where the pack says so, essential oils (menthol, arnica). The full list (INCI) is on the pack.',
      hu: 'Krém- vagy gélalap, kenderkivonat (Cannabis sativa L.) és — ahol a csomagolás ezt írja — illóolajok (mentol, árnika). A teljes lista (INCI) a csomagoláson.',
    },
    usage: {
      ro: 'Aplicați pe zona dorită și masați ușor, de până la trei ori pe zi. Doar pentru uz extern; nu aplicați pe pielea lezată.',
      en: 'Apply to the area and massage in gently, up to three times a day. For external use only; not on broken skin.',
      hu: 'Vigye fel a kívánt területre, és finoman masszírozza be, naponta legfeljebb háromszor. Csak külsőleg; sérült bőrre ne használja.',
    },
  },
  flowers: {
    ingredients: {
      ro: 'Flori uscate de cânepă (Cannabis sativa L.) din soiuri din catalogul comun al UE, THC sub pragul legal. Nimic adăugat.',
      en: 'Dried hemp flowers (Cannabis sativa L.) from varieties in the EU common catalogue, THC below the legal limit. Nothing added.',
      hu: 'Szárított kendervirág (Cannabis sativa L.) az uniós közös fajtajegyzék fajtáiból, a törvényes határ alatti THC-vel. Semmi hozzáadva.',
    },
    usage: {
      ro: 'Produs aromatic de colecție. Păstrați în recipientul închis, la loc uscat și întunecat. Doar pentru adulți.',
      en: 'An aromatic collector’s product. Keep in the closed jar, somewhere dry and dark. Adults only.',
      hu: 'Aromás gyűjtői termék. Tartsa zárt edényben, száraz, sötét helyen. Csak felnőtteknek.',
    },
  },
}

const FORMS = new Set<string>(Object.keys(DETAILS))

/** Вид товара по кодам, которые знает источник (полка, грань), — первый
 *  знакомый; незнакомые — null: текста для них нет. */
export function formOf(codes: readonly string[]): Form | null {
  return (codes.find((c) => FORMS.has(c)) as Form | undefined) ?? null
}

/** Стандартные состав и применение вида товара на языке витрины. */
export function standardDetails(form: Form | null, lang: Lang): { ingredients: string | null; usage: string | null } {
  const d = form ? DETAILS[form] : null
  return { ingredients: d?.ingredients[lang] ?? null, usage: d?.usage[lang] ?? null }
}
