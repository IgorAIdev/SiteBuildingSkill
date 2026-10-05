---
name: verify-pages-use-system
description: when a control (heart, button, counter, selector) is added to the design system, check at once that every page instance comes from that same component
metadata:
  type: feedback
---

Owner 02.10.2026: «сразу проверяй, что на страницах сердечки, кнопки из
дизайн-системы берутся, как только мы их вносим в дизайн-систему».

**Why:** several controls on the site were drawn before the design system
existed (product-page option chips, hearts); the owner cannot tell whether a
page still carries its own copy.

**How to apply:** after putting a control or a new variant on the design page,
open a catalog page and the product page in the browser and read the class
list of every instance (`[data-save]`, `.seg`, `.qty`, buttons): they must be
the design system's component classes (e.g. `SaveToggle` + `glyph` + `press`),
none a local look-alike. Report the count and the result in plain words.
Related: [[design-system-shows-all]], [[design-system-shows-panel-controls]].


**04.10.2026, owner furious («пиздёж», «ты блять не из дизайн-системы её берёшь… внеси это в проверку, чтоб всё из дизайн-системы бралось, чтоб был единый источник правды»):** I told the owner the filter drawer was «the same window as the cart»; its head was light, the cart's dark — each window wrote its head by hand, only the cart set the dark floor. Fixed: one `components/PaneHead.tsx` for every window head, `check:system` family `ownedPart` (registry `OWNED`: module parts only their component may write), design-system samples included.

**How to apply (added):** never claim two things are «the same» from the code's comments — measure both rendered (colour, height) first. A shared thing assembled from module classes by hand in several places is a defect: give it a component and a line in `OWNED`.
