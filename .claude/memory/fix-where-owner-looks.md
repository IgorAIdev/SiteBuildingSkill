---
name: fix-where-owner-looks
description: Owner's screenshot from a shop port (3051 = Croatia storefront4) → the fix lands there too; never send him to 3020 or another port
metadata:
  type: feedback
---

When the owner sends a screenshot, the fix must be visible on the port in that screenshot. 21.10.2026: I fixed the quick-order window in the kit template (3020), he opened 3051 (eu-hr-view/apps/storefront4, `next start`) and saw no change; told «смотри 3020» — «заебал скакать между портами, мы это уже проходили».

**Why:** he looks at his shop, not the kit; a port switch is work shifted onto him.
**How to apply:** check the port in his screenshot first. Fix the kit template (rules live there), then carry the same files into that shop, rebuild (`npm run build` in storefront4) and restart its server on the same port, and check there. Only touch my own files in that tree — other sessions keep uncommitted work in it. Related: [[show-in-chat-not-ports]], [[skill-scope-not-shop]].
