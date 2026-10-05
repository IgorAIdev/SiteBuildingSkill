---
name: all-browsers-final-check
description: "верно у меня" is not checked — the final check runs every browser (Chrome, Edge, Chromium, Firefox, WebKit); a browser-dependent trick is itself a defect
metadata:
  type: feedback
---

Owner's Chrome showed an arrow instead of the cosmetics/pets sign in the category-button circle (sign cut out by a mask over a sprite fragment), while the kit's Chromium and my own view were fine. His words: it's not acceptable that something works in one browser only; check it and write it into the final check and the skill.

**Why:** all rendered checks (`check:craft`, `sweep`) used one browser, so «верно у меня» passed. The cause in his Chrome 154 was never reproduced on this machine (Chrome 154, Edge 154 render fine).

**How to apply:** `check:engines` (tools/check-engines.mjs) compares frames across browsers; in `check:all -- --final` it requires all five (`ENGINES_REQUIRE=all`), a missing one is «не проверено», not green. A varying sign is placed as a sign (`<Icon>`, `.signDot`), never as a mask cut over a sprite fragment (`check:css` family `deadEffect`). Never answer «in another browser it's fine»; fix so it works in his browser. See [[no-screenshots-batch-prs]] for how I look at things (numbers first, an image only to debug a visual defect the owner reported). Rules journal: И630.
