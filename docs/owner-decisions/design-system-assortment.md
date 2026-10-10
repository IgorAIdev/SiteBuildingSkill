---
name: design-system-assortment
description: "Design-system tabs are assortments of real things in tiles (like Знаки), not text summaries, \"where used\" lists or measurement rows"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 001b30d7-b41d-4277-9162-920f777bb39b
  modified: 2026-10-01T13:13:45.162Z
---

A design-system tab shows the assortment: a grid of tiles, each tile is the real thing + its name + how it's switched on. No family summaries in text, no "где стоит" lists, no rows of measurements or long ledes.

**Why:** 01.10.2026 the owner opened «Кнопки» and swore: «куча всякой поебени, но только не ассортимент всех кнопок»; «в значках разобрался — так и в кнопках». A first fix that only put tiles above the old text was also rejected — he expects me to judge what's junk myself.

**How to apply:** when building or fixing any /design tab, model it on the Signs tab (one tile grid); cut explanatory text down to one line. Related: [[design-system-shows-all]], [[design-system-shows-panel-controls]], [[samples-one-row]].
