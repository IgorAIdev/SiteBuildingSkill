---
name: round-forms-only
description: "Buttons and controls are pills and circles — no square plates; exception: the hover plate of a menu/list row is a rounded rectangle (--r-ctrl), one shape for all menus (owner, angry, 04.10.2026)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 73df96ff-20ee-4e34-a42d-5ff41d6ace8c
  modified: 2026-10-04T06:42:09.096Z
---

04.10.2026, on the catalog pagination (current page on a square tone plate, «Next page» word at the edge): «поставил какая попалась, а не какая нужна… подбирать под общий дизайн нужно, у нас нет квадратных подложек и квадратных форм». Fixed as И721: «Показать ещё» pill + count line + bar, page numbers as round `data-pager` buttons, current filled `--chosen`.

**Why:** buttons on the site are one pill form (Allbirds model) and round pager circles; a control dropped in with the library's default square look reads as foreign, and the owner has to catch it.

**How to apply:** before shipping any new or downloaded control, take the site's own button pieces (`data-pill`, `data-pager`, `data-hand="pop"`) instead of the sample's shapes; no square tone plate as a «you are here» mark. Check hover vs current: the brand hand fill equals `--chosen`, so a number must answer with the veil, not the brand. Related: [[allbirds-reference]], [[download-dont-draw]], [[verify-pages-use-system]].

**Exception — rows in menus and windows (04.10.2026, owner angry again):** the hover plate of a list row is a rounded rectangle (`--r-ctrl`), not a pill. Screenshots: contact menu row = rectangle, «Oil» submenu row = pill → «почему не единообразие согласно дизайн-системе… делай прямоугольник, меню должно браться из дизайн-системы». The pill came from my own reading of this very memory (И730 put `--r-pop` on menu rows). Shape now lives in the `row` view (`styles/btn.module.css`), nobody else writes a row radius; guards `rowShape` in check:css and check:craft. Before applying a form rule to a new kind of thing, check what the same kind already looks like on the site — sameness beats the general rule. Related: [[verify-pages-use-system]].

**Since 04.10.2026 the button corner is one knob — Shape → Corners:** owner first — «у нас нет одинообразия кнопок» (card «Add to cart» rectangle under hero pills); I tied all buttons to Buttons → Shape «Pill» and the owner, angry: «кнопки перестали реагировать на панель… радиус в коде прописал?», then «Crisp выбран — кнопки пилюли, ты не починил». Final (peer session): scale role `--r-btn`, set by Corners; every corner set has a «· pill» twin (crisp-pill etc., `--r-btn` = `--r-pop`); `--ctrl-btn-pill` gone. Every `.btn` — quiet, loud, pager circle, hero category — takes `--r-btn`; no `data-pill` on buttons (chips keep `.chip[data-pill]`). Card buy = brand under the hand (`data-hand="pop"`); hero row = equal plates, first «Shop all».

**How to apply:** uniform = routed through the knob the owner will actually turn ([[panel-knob-reaches-all]]); never a fixed value or a per-instance marker the panel can't move; after the change, turn that knob and measure that the site moves.

**Exception (04.10.2026, owner):** hero category buttons (`data-cat`) are always full pills in the brand colour, whatever Corners says — see [[category-buttons-pill-brand]].

**Second exception (04.10.2026, owner):** rail head buttons — prev/next circles and «View all» — are always circle/pill, whatever Corners says: «эти кнопки квадратные — плохо… понимаю, что ты их к панели подключил, но тут нужны пилюли, чтоб не такие массивные были». Kind marker `data-rail-nav` (not `data-rail` — that name is the rail primitive's knob), `.btn[data-rail-nav]{--btn-r:var(--r-pop)}`, И747; page-number circles of Pagination still follow Corners.
