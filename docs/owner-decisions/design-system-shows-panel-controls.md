---
name: design-system-shows-panel-controls
description: design-system page only SHOWS variants; every choice/control lives in the Look panel — never put toggles or pickers on the page (palette is the one exception)
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9ab2a491-afca-48d3-94e5-4c425da649b9
  modified: 2026-09-30T07:54:13.552Z
---

The design-system page (`/<lang>/design`) shows variants so the owner can look at them (section separation, floor/background colour, buttons…). Controlling — picking, toggling, saving — is ALWAYS in the Look panel. Do not add switches, pickers or a «Save look» bar to a design-system tab.

**Why:** 30.09.2026, after I put four «С подложкой / Без подложки» switches on Главная → Разделение секций, the owner: «в дизайн системе показываются варианты… а управление ВСЕГДА в панели управления Look. запиши себе». Same rule as И572 (only the palette is chosen on both, with its builder).

**How to apply:** new setting = variants shown as static samples on the design page (force the values on the sample frame, e.g. inline `--band-*` vars) + a group in `look-panel/scripts/build-catalog.mjs` and a field in `ui/choice.mjs`. Never read the owner's hint «переместить в дизайн систему» as «move the controls»; ask what should be shown. See [[look-panel-architecture]] and [[design-with-skills]].
