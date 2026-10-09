---
name: design-system-shows-all
description: The design-system page shows every variant the kit has (by rendering the real site component with the variant passed in), never just the one picked in the Look panel
metadata:
  type: feedback
---

The owner said on 30.09.2026: «в дизайн-системе не нужно показывать, что выбрано в панели Look, тут нужно показать варианты, какие у нас есть в дизайн-системе». The same day: «проверь, что все параметры, размеры, шрифт берутся из той же правды, что на сайте». A hand-drawn copy of the product card had drifted from the site's type roles and colours.

**Why:** the page is where the owner compares options by eye. A copy that drifts, or a page that just mirrors the current pick, hides the choice.

**How to apply:** render the real component with the variant passed as a prop (e.g. `ProductCard dress=… info=…`). Don't draw a second copy, and don't read `lookNow()` for samples. Leave out variants the owner has rejected (the product card «bare»). Related: [[samples-one-row]], [[design-system-desktop-only]].
