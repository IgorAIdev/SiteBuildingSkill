---
name: category-buttons-grid
description: "Category buttons on the first screen are a panel axis cat-look: dot (pills with a sign circle, the template default) or grid (nine tiles, sign over the name); cbdshop.hr published grid on the owner's word, 14.10.2026"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 018WC1PgGtafakVpWgxEiuKK
  modified: 2026-10-14T18:00:00.000Z
---

14.10.2026, cbdshop.hr: «херня это в картинках смотреть, делай в артефакте, и вариантов больше, чтобы отличались от текущих, текущие заняты в третьей витрине» → twelve variants in an Artifact → «давай сетка девяти попробуем».

**Decision.** The look of the category buttons is a panel axis `cat-look` (Look → Home → «Category buttons»): `dot` — a row of pills with the sign in a circle (the template default, the form storefront 3 uses), `grid` — «Shop all» above and a grid of tiles under it, the sign over the name. The grid is `components/CategoryTile.tsx` (+ `.module.css`): a rounded box (`--r-card`), hairline `--rule`, the sign in `--pop`, the name in `--ink`; columns are computed by the grid (`repeat(auto-fit, minmax(6rem, 1fr))`, capped at 36rem) — three in a row on 360–414, two on 320; no media query. The word is read by the server (`ctx.cat` from `look.vars['--cat-look']`, Hero picks the markup), so it is in `READ_BY_SERVER` — a value equal to the stylesheet default must not be dropped.

**Why a control of its own and not a pill reshaped:** the pill's exception (always a full pill, sign circle at the end) stays true for the pill; a tile is another control — its height is its own (`data-tile`: `heroLane` does not compare it with the button row) and its label may take two lines by design (`data-lines`).

**Guards:** `tests/look.test.ts` (group list), `look-panel/tests/panel.test.ts` (Home fields), `selftest/craft-herotile.test.mjs` (forward and backward: a tile is not measured as a hero button, a plain button of another height is), `selftest/buttons.test.mjs` (one row of the path in each look).

**How to apply:** a new storefront starts on `dot`; the grid is chosen in the panel and published (`--cat-look: grid`). Related: [[category-buttons-pill-brand]], [[signs-45-degrees]].
