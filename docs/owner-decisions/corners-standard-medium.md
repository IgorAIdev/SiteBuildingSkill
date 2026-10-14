---
name: corners-standard-medium
description: "Corners set «Medium» = control 8, card 12, sheet 16 (small 4, buttons pills): the standard, measured on live shops; 6 is not on the radii ladder, 8-for-all read flat (owner, 14.10.2026)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 018WC1PgGtafakVpWgxEiuKK
  modified: 2026-10-14T12:00:00.000Z
---

14.10.2026, cbdshop.hr: «радиус давай меньше, например 6» → (8 на всё) → «радиус давай другой, какой стандартный?». Also: «надеюсь через токены правильно задаются углы, у нас же дизайн-система».

**Decision.** `medium` (and its pill twin `medium-pill`): xs 4 · ctrl 8 · card 12 · sheet 16. Measured 14.10.2026 at 1440: card radius at Charlotte's Web 8, Olipop 16, Allbirds 16–20, Ritual, Glossier and Oura 0 (Oura 8 in places); buttons pills or 2–8. 6 is not on the ladder (`SHAPE.radii` = 0, 2, 4, 8, 12, 16 … in `tools/thresholds.mjs`, M3 ∪ Carbon); the ladder is not widened for a number the eye cannot tell from 8. Radii live only as tokens `--r-xs`, `--r-ctrl`, `--r-card`, `--r-sheet` from the look; a literal radius in a stylesheet is caught by `check:css`.

**How to apply:** `CORNER_NAMES` and `MEDIUM` in `look-panel/scripts/build-catalog.mjs`; the panel lists «Medium» and «Medium · pill». Related: [[round-forms-only]], [[panel-knob-reaches-all]].
