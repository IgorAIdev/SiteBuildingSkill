# Пакеты рынков: спрос, слово рынка и право по странам

Содержание:
- [Как читать пакет](#как-читать-пакет)
- [Румыния, ro (на 08.10.2026)](#румыния-ro-на-08102026)
- [Венгрия и Румыния, hu (на 08.10.2026)](#венгрия-и-румыния-hu-на-08102026)
- [Румыния, en (на 08.10.2026)](#румыния-en-на-08102026)
- [Болгария, bg (на 02.09.2026)](#болгария-bg-на-02092026)
- [Новый рынок](#новый-рынок)

Здесь — данные известных рынков, а не метод. Метод сбора — в
[research.md](research.md) и [markets.md](markets.md), метод правовой
рамки — в [compliance.md](compliance.md). Всё отсюда на новом рынке — гипотеза
`H` до замера: объёмы не переносятся, правовые выводы чужой страны не
переносятся вовсе. Профиль — CBD.

## Как читать пакет

Раздел рынка — пара «страна × язык». В нём: **Спрос и выдача** (что
замерено, с датой), **Слово рынка** (что набирают и что ловушка), **Право**
(что нельзя обещать и чем заменить, с нормой и датой), **Источники**
(регуляторы страны). Даты в разделах — даты замера; дата частоты, дата
выдачи и дата правового вывода — три разные даты. Нашли новое — правится
раздел своего рынка, а не метод. Словарь запретов языка —
`assets/claims/<язык>.json`.

## Румыния, ro (на 08.10.2026)

### Спрос и выдача

Голова `ulei cbd` ≈ 2 400 в месяц (DataForSEO, 09.2026);
`ulei cbd pentru somn` ≈ 10 — «CBD + состояние» почти не ищут. Подсказки:
`ulei de canabis` — отдельная голова; хвосты `pret`, `pareri`, `farmacie`,
`dr max`, `catena`, `emag`, `1000 mg`, `full spectrum`, `caini`, `pisici`,
`legal in romania`, `test antidrog`. Выдача: по `% ` — карточки товаров
(10 из 10), по спектру, форме и животным — полки, по сну и тревоге —
статьи, по праву — гиды магазинов. Сильные соседи — аптеки (Farmacia Tei,
Dr. Max, Catena) и eMAG.

### Право: статус товара и ТГК

- Масла в Румынии продаются как косметика; у них нет «приёма внутрь»,
  «sub limbă», «doză zilnică». Капсулы и сладости — статус решает юрист;
  до решения — без «supliment alimentar» и без режима приёма.
- ТГК — факт протокола партии: «THC: {значение} conform buletinului
  lotului». Порог 0,2 % — для растения (Legea 339/2005), не для готового
  товара; «legal până la 0,2 %» не писать. «Fără THC» — только у изолята
  и broad с протоколом: «THC nedetectabil conform buletinului».
- Право — с датой и нормой; без «100 % legal», «legal peste tot».

### Право: запрещено → продающая замена

| запрещено | замена |
| --- | --- |
| «Ulei CBD pentru anxietate», «pentru dureri», «pentru somn» в имени и H1 | «Ulei CBD 10 %, 10 ml, full spectrum» — состав и форма |
| раздел, названный владельцем по рынку («Somn», «Relaxare») | имя-ярлык без глагола результата: «Somn: uleiuri CBD, capsule și ceai pentru rutina de seară»; не «pentru un somn odihnitor» |
| «somn odihnitor», «adormi mai ușor», «reduce stresul», «relaxează-te» | хаб «Seara»: «uleiuri cu CBN, capsule, ceai pentru rutina de seară» |
| «împotriva durerilor», «ameliorează», «analgezic», «antiinflamator» | «Cremă de masaj cu CBD și mentol, efect de răcorire pe piele» — ощущение на коже, не результат |
| «recuperare după antrenament», «pentru mușchi obosiți» | хаб «Sport și masaj»: «creme, balsamuri și ulei de masaj cu CBD» |
| «susține sistemul nervos / articulațiile», «echilibrează sistemul endocanabinoid» | место нанесения без функции: «cremă pentru masajul corpului» |
| «medicament natural», «remediu», «tratament», «vindecă» | одной фразой в блоке предупреждений: «CBD nu este un medicament» |
| «studiile arată că…», «dovedit clinic», «recomandat de medici» | статья B: «ce se știe și ce nu se știe»; позиция EFSA с датой |
| «fără efecte secundare», «100 % sigur», «sigur pentru copii» | «Nu este recomandat sub 18 ani, femeilor însărcinate sau care alăptează. A nu se lăsa la îndemâna copiilor» |
| «Luați 3 picături dimineața», «creșteți doza» | «Mod de utilizare: conform etichetei»; арифметика можно: «o picătură are aproximativ 5 mg» |
| «cel mai bun ulei CBD», «cele mai mici prețuri» | «comparați după prețul pe mg»; факт, а не превосходная степень |
| «aprobat de ANSVSA / EFSA» | — убрать; уведомление CPNP — не одобрение |
| вопрос FAQ «Pot combina CBD cu somnifere?» на полке | в FAQ-хабе: «Pot folosi CBD dacă iau medicamente? Întrebați medicul: CBD poate interacționa cu unele medicamente» |

Разрешено и продаёт: «Buletin de analiză pentru fiecare lot» (если
правда), «Livrare în 1–2 zile» (из данных), «Ulei CBD 10 % Night — aromă
de lavandă» (имя по моменту и аромату), «Gummies CBD: 30 bucăți, 10 mg
CBD/bucată».

### Источники

Ярус 1 страны — ANSVSA, ANPC, ANMDMR; ярус 2 — Monitorul Oficial
(ярусы — в [compliance.md](compliance.md)).

## Венгрия и Румыния, hu (на 08.10.2026)

### Спрос и выдача

Относится и к Трансильвании (`RO/hu`), и к Венгрии (`HU/hu`). Фразы:
`cbd olaj`, `kannabisz olaj`, `cbd kapszula`, `cbd gumicukor`, `cbd krém`,
`cbd balzsam`, `cbd olaj kutyáknak`; у лидеров обращение на «te».

### Право

NKFH 24.07.2026 прямо назвал недопустимыми «alvást támogató» и
обезболивание, а также маскировку под ароматическое или косметическое
масло с приёмом внутрь.

- Не писать о товаре: gyógyít, kezel, enyhít, csillapít,
  fájdalomcsillapító, gyulladáscsökkentő, szorongásoldó, nyugtató,
  alvást támogató, elalvást segít, immunerősítő, bizonyítottan, «ajánlott
  napi adag».
- Косметика — только наружно: без «nyelv alá», «lenyelhető».
- ТГК — фактом протокола; дети, беременность, лекарства — «nem ajánlott».
- Замены: «CBD olaj 10% (1000 mg), 10 ml, teljes spektrumú»; «hűsítő
  masszázskrém CBD-vel»; «esti termékek: CBN-t tartalmazó olaj».
- Словаря у регулятора нет — каждый венгерский текст читает человек.

### Источники

Ярус 1 страны — NKFH, OGYÉI; ярус 2 — njt.hu.

## Румыния, en (на 08.10.2026)

### Спрос и выдача

Своего спроса мало, конкуренции почти нет: `cbd shop romania`,
`cbd oil romania`, `is cbd legal in romania`. Общие `cbd for dogs`,
`cbd cream` — иностранный интент, не целить.

### Право: английские страницы магазина ЕС

- Нельзя: treat, cure, heal, relieve, pain relief, anti-inflammatory,
  clinically proven, doctor recommended, no side effects, safe for
  children, anxiety, insomnia, depression, «sleep better», «calmer»,
  «stress-free», «recovery» как результат, «THC-free» абсолютом, «approved».
- Обязательно одним блоком: «Not a medicine», «18+ only», беременность,
  кормление, лекарства → врач, «keep out of reach of children».
- Факты вместо расплывчатых слов; без декоративных символов.

## Болгария, bg (на 02.09.2026)

### Спрос и выдача

DataForSEO, 02.09.2026: масла 47 % спроса, наружное для суставов 16 %,
капсулы 11 %; народное «канабис ойл» сильнее «cbd»; крепость и спектр
словами почти не ищут; в выдаче статьи и карточки, аптеки — четверть.

### Право

В пакете не собрано: правовая рамка Болгарии заводится досье по шагу 2
[research.md](research.md); словаря `assets/claims/bg.json` нет. Выводы
других стран на Болгарию не переносятся.

## Новый рынок

Пакета нет — начать с [research.md](research.md) и шаблона
[market-dossier.md](../assets/market-dossier.md). Когда досье готово и
проверено, его сжатый итог (спрос и выдача с датами, слово рынка, право с
нормами) попадает сюда отдельным разделом «Страна, язык (на дату)» в том
же порядке подразделов.
