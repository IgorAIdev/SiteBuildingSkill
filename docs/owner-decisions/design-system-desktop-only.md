---
name: design-system-desktop-only
description: "The owner views the design-system page (/design, look-panel) only on a laptop, never on a phone — don't check or report its phone layout"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 07b9055d-f8ad-4720-91e1-0542ef2904dc
  modified: 2026-09-30T06:47:53.873Z
---

The owner said on 30.09.2026: «дизайн систему я не буду на мобильном смотреть никогда».

**Why:** the design-system page is the owner's working tool for choosing the look by eye, and they use it only at the computer. Checking it at phone width and reporting phone numbers costs tokens and says nothing they need.

**How to apply:** on the design-system tabs (look-panel/design/*), measure and lay out for the laptop only. Don't run phone checks for them and don't mention the phone in the answer. Samples of site elements still carry their real behaviour, but that behaviour is checked on the site pages, not on the design page. The site itself stays phone-first ([[measure-before-styling]]).
