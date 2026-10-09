---
name: category-buttons-pill-brand
description: "Category buttons are always pills (owner exception to Shape → Corners, И746); since 08.10.2026 in the hero row ONLY «Shop all» is brand-filled, the shelf buttons are quiet (site quiet roles) — empty-cart and design-system category buttons stay filled"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0fff23bf-3747-43de-a6ea-7faab2ee217a
  modified: 2026-10-04T18:42:01.419Z
---

04.10.2026, screenshot of the hero row «Shop all · Oil · Capsules…» as grey rounded rectangles: «эти кнопки… не должны реагировать на shape в панели, потому что они созданы пилюлями только»; «и они должны быть основного цвета, серый тут не подходит».

**Why:** the button is drawn as a pill with the sign circle at its end; in a rectangle the circle looks wrong. Grey read as disabled next to brand-coloured actions.

**How to apply:** `.btn[data-cat]` in styles/btn.module.css: `--btn-r: var(--r-pop)`, fill `--pop`, ink `--on-pop`; test in tests/buttons.test.ts. Do not extend this exception to other buttons without the owner's word. Rule И746. Related: [[round-forms-only]], [[panel-knob-reaches-all]], [[one-main-colour]].

**08.10.2026:** «в херо блоке только Shop all с заливкой и яркой главной, остальные кнопки категорий тихие, предложи визуально варианты». Hero row: Shop all = brand fill, shelves = `quiet` (`data-cat='quiet'`, reads `--ctrl-btn-fill/ink/edge` — the same roles as «View cart», follows the panel's Quiet axis). Three variants drawn for him: A site-quiet outline (recommended, already on the storefront), B brand outline, C light plate. The grey plate he rejected on 04.10 was ALL buttons grey with no main; here a bright main stands beside. Not touched: empty-cart shelves, design-system samples (still filled). Amendment in И746.
