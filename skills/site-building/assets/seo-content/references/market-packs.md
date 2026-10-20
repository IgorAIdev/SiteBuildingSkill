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
| «Ulei CBD pentru anxietate», «pentru dureri» в имени и H1 | «Ulei CBD 10 %, 10 ml, full spectrum» — состав и форма |
| раздел-эффект («Somn», «Relaxare», «ulei CBD pentru somn») | **разрешён** (И803): «Somn: uleiuri CBD și capsule pentru somn»; нельзя — «pentru un somn odihnitor» |
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

## Хорватия, hr (на 20.10.2026)

Досье: `CBDSeoMarketResearch/HR/hr-market-2026-10-20/` (dossier.md,
legal-hr.md, competitors.md, demand-hr.json, serp.json).

### Спрос и выдача

DataForSEO, 20.10.2026 (место 2191): **«cbd ulje» 1 600** (Google сливает с
«cbd ulja», «ulje cbd») — около 60 % спроса на масла; народное «ulje kanabisa»
210, «kanabis ulje» 110, «cbd kapi» 210. Доверие («iskustva», «forum»,
«najbolje cbd ulje» 210) и каналы («cbd ulje dm cijena» 320, «ljekarna» 140,
«Tisak») — вторая по силе группа. Наружное ≈ 1 300 («kanabis krema», «cbd
gel», «masažni gel»), для собак ≈ 860 («cbd ulje za pse» 320), город ≈ 1 500
(«cbd shop zagreb» 480). Капсулы, мармелад, паста, вейп — по 80–300;
эффекты почти не ищут, кроме сна («cbd ulje za spavanje» 110). **Ловушка** —
«ulje konoplje» 390 / «konopljino ulje» 170: половина выдачи — масло семян.
Ответ нейросети — в 10 из 18 выдач; соседи — mamakana.hr, kanabi.hr,
cbdsol.hr, naturecan.hr, аптеки и dm. Обращение у всех лидеров — «Vi».

### Право: статус товара и ТГК

- Промышленная конопля — **0,2 % ТГК суммарно** (Zakon o suzbijanju
  zlouporabe droga, ст. 2(1) т. 5, NN 39/19); предела для готового продукта
  нет; 0,3 % — только порог выплат CAP ЕС.
- CBD внутрь — новая пища без разрешения; HZJZ (27.05.2026): такие продукты
  не должны продаваться. EFSA 09.02.2026 — временный безопасный уровень, не
  разрешение.
- Косметика — с условиями 1223/2009 (CPNP, отчёт о безопасности, CBD не из
  соцветий); SCCS/1685/25 (24.04.2026) — до 0,19 %, в норму ещё не внесено.
- Для животных — неразрешённая кормовая добавка; вейп без никотина — без
  правовой категории; цветы для курения — онлайн-продажа запрещена (Zakon o
  ograničavanju uporabe duhanskih i srodnih proizvoda, ст. 23(7), NN 98/25).
- Потребитель: ZZP (NN 19/22, 59/23, 59/26) — отказ 14 дней (ст. 79), кнопка
  «raskid ugovora» с 19.06.2026 (ст. 81.a), надзор — Državni inspektorat;
  ODR закрыта 20.07.2025. Cookies — ZEK ст. 43(4); доступность — NN 89/2025.

### Право: запрещено → продающая замена

Словарь — `assets/claims/hr.json`. «Za spavanje» как имя раздела —
разрешено (И803), «za bolji san» — обещание. Рынок обещает «protiv bolova»,
«za anksioznost», «terapeutski učinak» — на продающей странице это
`fail` или `fix`: наружное — состав и место нанесения («gel za masažu s
CBD-om»), вечер — момент дня («za večernju rutinu»), масло — сила, мг, мл и
ТГК по протоколу партии; «pod jezik», «za unutarnju upotrebu» не пишутся.

### Источники

legal-hr.md досье (zakon.hr, narodne-novine.nn.hr, HZJZ, EFSA, HAKOM, Porezna
uprava, AZOP — все прочитаны 20.10.2026); `demand-hr.json`, `serp.json`.

## Новый рынок

Пакеты есть у Румынии (ro, hu, en), Венгрии, Хорватии (hr) и Болгарии (без правовой рамки);
Польши, Германии, Италии и остальных — нет. Пакета нет — начать с
[research.md](research.md) и шаблона
[market-dossier.md](../assets/market-dossier.md). Словаря запретов языка нет
(`assets/claims/<язык>.json`; у bg нет, у hr — с 20.10.2026) — заводится к текстам по образцу
соседнего (`ro.json`, `hu.json`), не к сбору. Когда досье готово и
проверено, его сжатый итог (спрос и выдача с датами, слово рынка, право с
нормами) попадает сюда отдельным разделом «Страна, язык (на дату)» в том
же порядке подразделов.
