---
name: arrow-one-direction
description: "Disclosure arrow is down when closed, up when open, everywhere — owner rejected «points where it grows» on the cart-drawer discount code (04.10.2026)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0fff23bf-3747-43de-a6ea-7faab2ee217a
  modified: 2026-10-04T18:41:52.126Z
---

04.10.2026: a session flipped the discount-code arrow in the cart drawer's fixed bottom to point up when closed («the field grows upward»); the owner, screenshot of the closed question with the up arrow: «перепутано направление стрелки поменяй».

**Why:** the owner reads the arrow by the site-wide convention, not by the geometry of one place.

**How to apply:** `Turn` (styles/turn.module.css) turns only by openness; no place declares its own direction. Guard: `turnFlip` in check:css. Rule И481. Related: [[only-correct-architecture]].

08.10.2026: «правило „стрелка только у раскрывающихся“ — нужно такое правило» → И779: знак раскрытия только внутри `<summary>` или кнопки раскрытия, у ссылок меню ни стрелки, ни уголка; тест `tests/nav-arrow.test.ts`.
