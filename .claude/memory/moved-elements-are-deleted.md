---
name: moved-elements-are-deleted
description: when an element is carried into the system (Buttons, signs, panel look), delete it from elements/ and its catalog entry in the same pass; check the system for it by meaning first
metadata:
  type: feedback
---

Owner 03.10.2026, three times in one session: «из элементов удали, они ж есть в системе» (icon sheet 15, category chips 65, size picker 97; pager 95 followed by the same logic).

**Why:** a sample left in `elements/` after it lives in the system is a second place for the same thing; the owner opens the Elements tab and thinks it is still missing (element 15's header said «Нет в листе набора — 20» while all twenty were already in the sheet, 7 under local names). See [[download-dont-draw]], [[elements-draw-not-embed]].

**How to apply:** (1) compare a sample with the system by meaning and by path data before saying «нет в системе» (script: parse the sample's shapes, match the d-strings in `skills/site-building/assets/icons/*`); (2) carry only what is missing — as a role value (`--seg-look`, `--pager-look`) or a sign — never a second drawing; (3) remove the folder and the `elements.json` entry (round-trips byte-exact with `JSON.stringify(j, null, 2) + '\n'`), then `node tools/elements.mjs`; (4) a full pill (`--r-pop`) is only for the main action (`popRadius`) — a pill variant of a chooser cannot be added, say so; (5) a new look group touches ~16 files — mirror `stock-look` (grep it).
