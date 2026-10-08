---
name: category-buttons-pill-brand
description: "Hero category buttons (Shop all, Oil…) are always pills filled with the brand colour — an owner-given exception to «button corner = Shape → Corners» (rail-head buttons are the second, И747) (owner 04.10.2026)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0fff23bf-3747-43de-a6ea-7faab2ee217a
  modified: 2026-10-04T18:42:01.419Z
---

04.10.2026, screenshot of the hero row «Shop all · Oil · Capsules…» as grey rounded rectangles: «эти кнопки… не должны реагировать на shape в панели, потому что они созданы пилюлями только»; «и они должны быть основного цвета, серый тут не подходит».

**Why:** the button is drawn as a pill with the sign circle at its end; in a rectangle the circle looks wrong. Grey read as disabled next to brand-coloured actions.

**How to apply:** `.btn[data-cat]` in styles/btn.module.css: `--btn-r: var(--r-pop)`, fill `--pop`, ink `--on-pop`; test in tests/buttons.test.ts. Do not extend this exception to other buttons without the owner's word. Rule И746. Related: [[round-forms-only]], [[panel-knob-reaches-all]], [[one-main-colour]].
