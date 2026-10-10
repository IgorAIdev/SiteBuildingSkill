# Доставка и оплата — общий механизм

**Черновик** (заказчик 23.09.2026): справочник `assets/commerce/carriers.json` —
рабочий список вариантов по странам, не готовое решение; механизм универсальный,
не прибит к одному рынку (первая редакция замысла называла easybox видом
доставки — `docs/superpowers/specs/2026-09-23-storefront-ro-design.md`); каждый
магазин выбирает и перепроверяет свои службы.

## Порядок работы

1. Найти страну рынка в `assets/commerce/carriers.json`.
2. Заказчик выбирает 2–4 службы — одну до двери, сеть пунктов выдачи или
   постаматов — и решает про наложенный платёж; ему показывается таблица
   его страны словами, не кодами.
3. Завести способы доставки в Vendure: код способа — id способа витрины,
   вид `address`/`pickup` и имя службы — поля способа.
4. Точки выдачи — адаптер к списку точек службы (`api.points`) или её
   виджет, поиск по городу.
5. Способы оплаты — обработчики на сервере Vendure; наложенный платёж —
   свой обработчик; тестовый в бой не идёт.
6. Страница «Доставка и оплата» — таблицей из того же списка, что выбор на
   оформлении (И95 скилла `shop`).
7. Профиль CBD — до запуска письменно спросить выбранную службу о пересылке
   CBD ([cbd-profile.md](cbd-profile.md), «Службы доставки»).

## Устройство в витрине

Вид способа — закрытый список из двух: до двери (`address`) и пункт выдачи
(`pickup`; тип точки — `office`, `locker`, `partner`, самовывоз продавца —
`shop`). Справочник ложится на них так: `door` → `address`; `office` →
`pickup` с типом `office` или `partner`; `locker` → `pickup` с типом
`locker`. Оплата — `on-delivery | transfer | online`; недопустимая
показывается выключенной с причиной, а не прячется. Договор —
`templates/storefront/lib/source/contract.ts`.

## Справочник по странам

Из `assets/commerce/carriers.json` (черновик, дата проверки — `checked`
реестра). «По некоторым службам» значит: наложенный платёж подтверждён не у
всех служб страны, а не что его нет вовсе.

| страна | до двери | пункты и постаматы | наложенный платёж |
| --- | --- | --- | --- |
| Болгария (BG) | Econt, Speedy, Sameday | Econt, Speedy, BOX NOW, Sameday | по некоторым службам |
| Румыния (RO) | FAN Courier, Sameday, Cargus, DPD, GLS, Poșta Română | FAN Courier, Sameday, Cargus, DPD, GLS, Poșta Română | да |
| Венгрия (HU) | Magyar Posta, GLS, FOXPOST, DPD, Packeta | Magyar Posta, GLS, FOXPOST, DPD, Packeta | по некоторым службам |
| Украина (UA) | Nova Post, Ukrposhta, Meest | Nova Post, Ukrposhta, Meest | по некоторым службам |
| Молдова (MD) | Poșta Moldovei, Nova Post, EVS Courier | Poșta Moldovei, Nova Post | по некоторым службам |
| Греция (GR) | ELTA Courier, ACS Courier, Speedex, Geniki Taxydromiki, Skroutz Last Mile | ELTA Courier, ACS Courier, Speedex, Geniki Taxydromiki, BOX NOW, Skroutz Last Mile | по некоторым службам |
| Сербия (RS) | Pošta Srbije (Post Express), Dexpress, BEX, AKS Express Kurir, City Express | Pošta Srbije (Post Express), Dexpress, BEX, AKS Express Kurir, City Express | да |
| Хорватия (HR) | Hrvatska pošta, GLS Croatia, DPD, Overseas Express | Hrvatska pošta, GLS Croatia, DPD, Overseas Express, BOX NOW | да |
| Словения (SI) | Pošta Slovenije, GLS, DPD | Pošta Slovenije, GLS, DPD | да |
| Польша (PL) | InPost, Poczta Polska (Pocztex), DPD, GLS | InPost, Poczta Polska (Pocztex), DPD, ORLEN Paczka, GLS | по некоторым службам |
| Чехия (CZ) | Balíkovna, DPD, PPL, GLS | Zásilkovna (Packeta), Balíkovna, DPD, PPL, GLS | да |
| Словакия (SK) | Slovenská pošta, DPD, GLS | Packeta, Slovenská pošta, DPD, GLS | да |
| Литва (LT) | LP EXPRESS, DPD, Venipak | LP EXPRESS, Omniva, DPD, Venipak | нет данных |
| Латвия (LV) | DPD, Venipak, Latvijas Pasts | Omniva, DPD, Venipak, Latvijas Pasts | нет данных |
| Эстония (EE) | Omniva, SmartPosti (Itella), DPD, Venipak | Omniva, SmartPosti (Itella), DPD, Venipak | нет данных |
| Германия (DE) | DHL, DPD, Hermes, GLS, UPS | DHL, DPD, Hermes, GLS, UPS | нет данных |
| Австрия (AT) | Österreichische Post, DPD, GLS | Österreichische Post, DPD, GLS, Hermes | нет данных |
| Италия (IT) | Poste Italiane, BRT, GLS | Poste Italiane, BRT, GLS, InPost | по некоторым службам |
| Испания (ES) | Correos, SEUR, MRW, GLS | Correos, SEUR, MRW, GLS, InPost | по некоторым службам |
| Португалия (PT) | CTT, DPD, GLS | CTT, DPD, GLS | по некоторым службам |
| Франция (FR) | Colissimo, Chronopost, DPD | Colissimo, Chronopost, Mondial Relay, DPD, Relais Colis | по некоторым службам |
| Бельгия (BE) | bpost, DPD, GLS | bpost, DPD, Mondial Relay, GLS | по некоторым службам |
| Нидерланды (NL) | PostNL, DHL, DPD, GLS | PostNL, DHL, DPD, GLS | нет данных |
| Ирландия (IE) | An Post, DPD, GLS | An Post, DPD, GLS | нет данных |

Перепроверять перед запуском: службы сливаются и закрываются. По
исследованию 23.09.2026 — Fastway Ireland ушла в процедуру банкротства
(окт. 2025, из справочника исключена совсем); Sameday закрывает бизнес в
Венгрии; Packeta и Foxpost в Венгрии объединяют сети постаматов; D Express
и City Express в Сербии становятся одной компанией под Австрийской почтой.
