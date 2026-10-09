---
name: one-main-colour
description: "Strip (deck), loud button, chosen variant, help knob, category buttons — one brand fill a9 on every palette and both themes; a per-palette fix is a defect (owner 04.10.2026)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0fff23bf-3747-43de-a6ea-7faab2ee217a
  modified: 2026-10-04T18:41:48.768Z
---

04.10.2026, owner switched palettes in the Look panel: drawer header near-black, «Continue to checkout» green or gold — «мы же уже это проходили на другой палитре… ты исправил проблему только на одной палитре, не системно»; then «кнопки процентов, кнопка связи, add to cart тоже должны быть одного основного цвета». The builder made the deck brand only when the brand was dark-kin (`DARK_KIN`), and `--chosen` took ink for a light brand.

**Why:** the owner tests by switching palettes; a fix that holds on the palette in front of me and breaks on the next one is not a fix.

**How to apply:** colour decisions live in the builder (`tools/palette.mjs`: `deckFor`, `--chosen-paper = a9`), never as a per-palette condition. After any colour change, measure every sample palette × both themes on the rendered page (inject the panel's `compose` vars with transitions off — a running transition reads the old colour). Hero stage (veil under text on a photo) stays neutral for a light brand. Rule И694, И706. Related: [[palette-whole-site]], [[only-correct-architecture]], [[panel-knob-reaches-all]].
