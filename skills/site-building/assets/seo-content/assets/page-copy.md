# Формат сдачи страницы

Текст сдаётся данными, а не документом: так его читают сайт и
`scripts/lint-copy.mjs`. Одна страница — один объект; файл — массив.

```json
{
  "id": "category:oil",
  "lang": "ro",
  "type": "category",
  "level": "A",
  "query": {
    "primary": "ulei cbd",
    "secondary": ["ulei de canabis", "ulei cbd full spectrum", "ulei cbd pret"],
    "origin": "AC 2026-10-08; VOL ulei cbd 2400 (2026-09)"
  },
  "name": "Ulei CBD",
  "title": "Ulei CBD (ulei de canabis): full spectrum, broad și izolat | CBDin",
  "description": "…110–165 знаков, факты…",
  "heading": "Ulei CBD (ulei de canabis)",
  "lede": "…≤ 40 слов над сеткой, главный запрос в первом предложении…",
  "caption": "…подпись плитки, 1 строка…",
  "sections": [{ "heading": "Ce concentrație să alegeți?", "paragraphs": ["…"] }],
  "faq": { "title": "Întrebări despre uleiul CBD", "items": [{ "q": "…?", "a": "…" }] },
  "links": [{ "label": "ulei CBD full spectrum", "href": "/ro/…" }],
  "sources": [{ "label": "EFSA, 09.02.2026", "url": "https://…" }]
}
```

| поле | обязательно | что |
| --- | --- | --- |
| `type` | да | `home`, `category`, `hub`, `product`, `slice`, `guide`, `faq`, `trust` |
| `level` | да | `A` продающая, `B` гид о состоянии, `C` право |
| `query.primary` | да | главный запрос словами рынка |
| `query.secondary` | да | 3–8 вторичных; проверка ищет половину |
| `query.origin` | да | происхождение и дата |
| `name` | у полки и хаба | короткое имя для меню, плиток, крошек |
| `nameIsLabel` | если имя — слово рынка о состоянии («Sleep») по решению владельца | кто и когда решил; проверка `condition` не считает имя обещанием в имени, h1, title, подписи и заголовке FAQ |
| `title`, `description`, `heading`, `lede` | да | сниппет, H1, текст над сеткой |
| `caption` | у полки и хаба | подпись плитки ≠ `lede` ≠ `description` |
| `sections`, `faq` | по типу | под сеткой; число вопросов — профиль проекта |

Проверка:

```sh
node <seo-content>/scripts/lint-copy.mjs --pages pages.json \
  [--profile profile.json] [--json]
```

`profile.json` — нормы проекта, например
`{ "faq": { "home": [6, 8], "category": [5, 10], "hub": [5, 10], "product": [5, 8], "guide": [3, 10] } }`.
Выход: находки `fail` и `warn`; код выхода 1 при любом `fail`. Из кода —
`import { lintPages } from '<seo-content>/scripts/lint-copy.mjs'`.
