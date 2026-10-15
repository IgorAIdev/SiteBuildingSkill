---
name: cbdshop-is-croatia
description: "The fourth storefront (apps/storefront4, cbdshop.hr in CBD_ecommerce_eu) is for Croatia — hr, EUR; the Romanian ro/en/hu content in it is leftover template sample, not the market"
metadata:
  node_type: memory
  type: project
  originSessionId: 80ff41af-1fc5-42f0-8062-46ef154f325a
  modified: 2026-10-14T21:33:44.947Z
---

Owner, 15.10.2026: «мы четвёртую для Хорватии делаем, а тут Румыния написана». `apps/storefront4` (cbdshop.hr) targets **Croatia**; cbdin.ro (storefront3) is the Romanian one. Its `lib/i18n` still has only ro/en/hu and the sample content says «CBD shop in Romania», Bucharest, RON-era copy — inherited from the kit's Romanian-market template ([[storefront-template-ro]]).

**Why:** I took «ro, en, hu» from the template memory and the page text and told the owner the shop was for Romania; he corrected me. Domain `.hr` plus «четвёртая витрина» was the signal I skipped.

**How to apply:** for cbdshop.hr / storefront4 default to Croatian (hr) for labels in mock-ups and variants, not Romanian. Do not assume the market from sample text — check the domain and which storefront. Adding an `hr` locale and replacing Romanian sample copy is the owner's texts + a locale job; logged in `apps/storefront4/docs/open.md`, not yet done.

**Done 15.10.2026:** hr + en are in (PR #437 of CBD_ecommerce_eu), ro/hu removed from storefront4, Croatian slugs and sample data. Left to the owner: legal pages and blog (still English, Romanian law inside), shipping carriers, OIB/MBS, contacts, photos (product 1600×1600 square, effect tile 800×800).
