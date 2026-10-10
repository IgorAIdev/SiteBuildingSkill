# Имена и ярусы — слой 1 основания

Когда читать: правило о трёх ярусах закона `craft` (раздел «Основание: роли,
имена, оси», слой 1, И224). Реестр — `tools/names.mjs`; семьи
`nameGrammar`, `stepDirect`, `deadName`, `tierUp` в `check:css`. Источники —
`research/site-building-2026-09-20/raw/findings/site-steps/steps_token-tiers.json`,
`steps_foundations-carbon-spectrum-atlassian.json`, `steps_foundations-material-apple.json`.

Содержание:

- [Три яруса, ссылки в одну сторону](#три-яруса-ссылки-в-одну-сторону)
- [Форма имени](#форма-имени)
- [Что говорят первоисточники](#что-говорят-первоисточники)
- [Реестр семей — из кода](#реестр-семей--из-кода)
- [Имя живёт по просителю](#имя-живёт-по-просителю)
- [Переименование — псевдоним со сроком](#переименование--псевдоним-со-сроком)

---

## Три яруса, ссылки в одну сторону

| Ярус | Что это | Кто выпускает | Кто читает |
|---|---|---|---|
| сырьё | ступени без смысла: `--n-12`, `--a-9`, `--sp-4`, `--fs-base` | строители палитры и шкал | только роли |
| роль | должность значения: `--ink`, `--pop`, `--pad-card`, `--air-page`, `--body-size`, `--r-card`, `--sh-2`, `--layer-header` | `styles/tokens.css`, строитель шкал | узлы и другие роли (цепочки алиасов разрешены — DTCG §7.2.2) |
| узел | ручка примитива: `--stack`, `--grid-gap`, `--pin-top`, `--tray-h` | сам примитив, на себе | тот, кто ставит примитив |

**Правило.** Сырьё никто не применяет напрямую; узел читает роль.
Исключение — оптика не выше пола ритма (`--sp-1`, `--sp-2`; CLAUDE.md,
правило 2).
**Чем мерится:** узел читает ступень — `stepDirect`; ссылка вверх (сырьё →
роль, роль → ручка узла, ручка на корне) — `tierUp`; оттенок — `hueDirect`.
**Ловушки.**
- Одно имя на двух ярусах: `--stack` был и стеком шрифтов в `tokens.css`, и
  отступом `stack` — отступ был нулём (→ `--face-stack`); `--n`, `--n-min`
  сетки совпали с `--n-N` (→ `--cols`, `--cols-min`).
- `hueDirect` слеп к семье вне `kit.config.json`: `.chipLab`, `.more`,
  `::selection`, каретка читали `--live-3`, `--live-11`, `--live-12`,
  `--live-4` (→ `--pop-ink`, `--pop-ink-hover`, `--pop-tint`, `--select`,
  `--on-select`; `--sage-*`, `--cyan-*`, `--live-*` сняты).
**Почему (И224):** ступени ритма в узлах — 25 мест (`--sp-3` … `--sp-9` →
`--air-block`, `--air-band`, `--gap-row`, `--gap-grid`, `--air-head`,
`--pad-inner`; `row`, `grid` — ступени `styles/scale.json`); `--fs-ui-*`
рукой (→ `--ctrl-fs-*` от строителя, в px); `--fs-page`, `--fs-lead` — имя
сырья у ролей (→ `--pagehead-size`, `--intro-size`).

## Форма имени

**Правило.** `--<понятие>[-<уточнение>]*`, от общего к частному: понятие
по назначению (`ink`, `pop`, `plate`, `pad`, `air`, `r`, `sh`, `layer`,
`ctrl` …), уточнение из списка (`soft`, `hover`, `press`, `fill`, `tint`,
`on`, `card`, `size` …), второе понятие цвета (`--on-pop`, `--hover-ctrl`)
или число. Имя по виду (`sage`, `cyan`, `live`, `amber`) в реестр не
попадает. Ручка примитива объявляется на примитиве и по умолчанию берёт
роль: `var(--stack, var(--air-block))`.
**Чем мерится:** `nameGrammar`.
**Почему:** перекраска марки переименовала бы всё (Curtis, Figma).

## Что говорят первоисточники

- Curtis: Namespace → Object → Base → Modifier; продвижение локально →
  группа (3+) → глобально; сначала обход («token gaps»), потом имена.
- Style Dictionary: `color_background_button_error, not
  button_color_error`; `button.color.primary → {color.primary}
→ {color.base.green}`. M3: компонентный токен без вписанных значений.
- Atlassian: `тип.куда.роль.акцент.состояние` (`color.icon.success`),
  `ensure-design-token-usage` падает на голом значении. Carbon: `$blue-60` →
  `$text-primary` → `$button-primary`.
- DTCG: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`,
  `cubicBezier`, составные `typography`, `shadow`, `border`.

## Реестр семей — из кода

<!-- families:names -->
| Группа | Понятия | Ярус |
| --- | --- | --- |
| colour | `--ink`, `--plate`, `--page`, `--surface`, `--pop`, `--select`, `--ctrl`, `--field`, `--rule`, `--border`, `--line`, `--ring`, `--scrim`, `--quiet`, `--thumb`, `--tile`, `--tick`, `--menu`, `--accent`, `--hover`, `--press`, `--chrome`, `--on`, `--bad`, `--ok`, `--warn`, `--sale`, `--info`, `--star`, `--band`, `--mark`, `--sign`, `--chosen` | роль |
| rhythm | `--pad`, `--air`, `--gap` | роль |
| text | `--hero`, `--pagehead`, `--prodhead`, `--panehead`, `--parthead`, `--logo`, `--price`, `--byline`, `--maker`, `--cardname`, `--cardprice`, `--cardbtn`, `--label`, `--blurb`, `--h2`, `--h3`, `--intro`, `--lede`, `--body`, `--note`, `--eyebrow`, `--measure`, `--face`, `--fs`, `--page` | роль |
| shape | `--r` | роль |
| depth | `--sh`, `--frost` | роль |
| motion | `--ease`, `--rise`, `--nudge`, `--creep`, `--open` | роль |
| state | `--state` | роль |
| layer | `--layer` | роль |
| control | `--ctrl`, `--chan`, `--chip`, `--tab`, `--dock`, `--edge`, `--grab` | роль |
| layout | `--wrap`, `--gut`, `--head`, `--anchor`, `--float`, `--chrome`, `--tile` | роль |
| ручки примитивов | `--stack-*`, `--cluster-*`, `--switch-*`, `--rail-*`, `--section-*`, `--sheet-*`, `--lede-*`, `--hero-*`, `--grid-*`, `--cols-*`, `--cell-*`, `--pin-*`, `--tray-*`, `--leaf-*`, `--chip-*`, `--qty-*`, `--chan-*`, `--side-*`, `--prose-*`, `--pinned-*`, `--sidebar-*`, `--frame-*`, `--btn-*`, `--seg-*`, `--gallery-*`, `--pane-*`, `--turn-*`, `--dot-*`, `--glyph-*`, `--toggle-*` | узел |
| сырьё | `--n-N`, `--a-N`, `--e-N`, `--sale-N`, `--warn-N`, `--ok-N`, `--info-N`, `--on-*-N`, `--sp-N`, `--fs-*` | сырьё |
| обязательные роли | `--bad`, `--bad-fill`, `--on-bad`, `--bad-tint`, `--bad-line`, `--ok`, `--ok-fill`, `--on-ok`, `--ok-tint`, `--quiet-tint`, `--on-quiet-tint`, `--logo-size`, `--logo-lead`, `--logo-weight`, `--logo-track`, `--parthead-size`, `--parthead-lead`, `--parthead-weight`, `--parthead-track`, `--menu-lead`, `--menu-weight`, `--menu-track`, `--menu-size`, `--head-full`, `--shot-frame`, `--measure-form`, `--sh-far-3`, `--sh-far-2`, `--mark-messenger`, `--mark-youtube`, `--mark-gmail`, `--pane-sheet`, `--mark-viber`, `--mark-telegram`, `--mark-whatsapp`, `--mark-instagram`, `--info`, `--info-tint`, `--warn`, `--warn-fill`, `--on-warn`, `--warn-tint`, `--star`, `--star-trade`, `--sale`, `--sale-fill`, `--on-sale`, `--sale-tint`, `--pop-press`, `--pop-ink-hover`, `--r-pop`, `--ease-exit`, `--band`, `--plate-2`, `--rule`, `--field`, `--scrim`, `--scrim-deck`, `--creep`, `--on-ink`, `--air-line`, `--air-set`, `--quiet-pop`, `--on-quiet-pop`, `--prodhead-size`, `--byline-size`, `--price-size`, `--price-lead`, `--price-weight`, `--price-track`, `--blurb-size`, `--blurb-lead`, `--blurb-weight`, `--blurb-track`, `--blurb-measure`, `--byline-lead`, `--byline-weight`, `--byline-track`, `--maker-size`, `--cardname-size`, `--cardname-lead`, `--cardname-weight`, `--cardname-track`, `--cardprice-size`, `--cardbtn-size`, `--cardbtn-lead`, `--cardbtn-weight`, `--cardbtn-track`, `--cardprice-lead`, `--cardprice-weight`, `--cardprice-track`, `--maker-lead`, `--maker-weight`, `--maker-track`, `--prodhead-lead`, `--prodhead-weight`, `--prodhead-track`, `--label-size`, `--label-lead`, `--label-weight`, `--label-track`, `--label-measure`, `--panehead-size`, `--panehead-lead`, `--panehead-weight`, `--panehead-track`, `--layer-helper`, `--layer-toast` | роль |
| объявлений в стилях набора | 1925, по форме 1925 | `tools/names.mjs`, `parse()` |
<!-- /families:names -->

## Имя живёт по просителю

**Правило.** Объявлено — значит читает узел, код, инструмент или тест, либо
роль — в `REQUIRED` (`tools/names.mjs`) для узла, который придёт с
магазином. Роль только шаблона витрины (`--measure-form`, `--head-full`) —
в `styles/tokens.css` и в `REQUIRED` с причиной (И626). Роль текста
применяется целиком, с весом и разрядкой.
**Чем мерится:** без читателя — `deadName` (не долг: снимается сразу).
Сырьё за читателя не спрашивается (лестница целиком, Radix: двенадцать
ступеней); ступень ритма без просителя — `check:scale`.
**Ловушки.** Без `REQUIRED` роль витрины в свежей установке без витрины
читателя не имеет — `deadName` роняет `selftest/install.test.mjs`.
**Почему:** было 50 имён без читателя.

## Переименование — псевдоним со сроком

**Правило.** Не поиск-замена; сторож падает на удалённом имени, на которое
ещё ссылаются (stylelint `value-no-unknown-custom-properties`).
**Чего реестр не делает.** Строгая грамматика вида
`--color-action-background-primary-hover` — решение заказчика, с псевдонимом
на каждое старое имя (`docs/open.md`). Ссылку на несуществующее имя без
запасного значения (`unknownVar`) не ловит — ждёт своего дефекта.
