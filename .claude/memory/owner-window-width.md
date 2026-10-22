---
name: owner-window-width
description: "Owner's browser window is about 1253 CSS px wide — his screenshots are ~1880 device px at Windows scaling 150%; reproduce his view at 1253 before judging layout"
metadata:
  node_type: memory
  type: user
  originSessionId: a1ee8c60-6c77-4cd1-9cc0-74e195e2a945
  modified: 2026-10-03T15:53:41.060Z
---

The owner's screenshots of the storefront are about 1865–1880 pixels wide, and the text sizes in them match CSS sizes × 1.5 — his Windows display scaling is 150 %. So his browser window is about 1253 CSS px wide (content column ≈ 1160 px). Worked out 03.10.2026 from the shelf caption: 900 screenshot pixels = 600 CSS px (the 604px measure).

**Why:** layouts behave differently at 1253 than at the 1440/1920 widths I usually measure — at 1920 the caption was 45 % of the head, at his width 52 %; Gymshark's 798px intro is 68 % of his column, which is why he described it as «примерно 70 %».

**How to apply:** when he sends a screenshot or describes proportions, measure at 1253 × ~590 first (his laptop window is low — 1280 × 587 is the checks' low window, И659), then the standard widths. Report percentages for his width. Related: [[gymshark-reference]], [[measure-before-styling]].

22.10.2026 the cart-drawer screenshot was 495 device px wide = 330 CSS px: the window was narrow (~378 CSS), and the layout matched a finger (`pointer: coarse` — name in a 44-px target box, narrow-list variant of the line). When a screenshot shows a phone-like variant of a part, reproduce it at that width with touch emulation before measuring; the defect may live only there.
