---
name: design-system-address
description: where the design system page lives — /<lang>/design of the running storefront (LOOK_PICKER=on); public on cbdbuy.be/en/design, local on localhost:3051/en/design (21.10.2026)
metadata:
  type: reference
---

The design system is a page of the storefront itself, not a separate domain: `app/[lang]/(look-panel)/design` (look-panel/design/DesignPage.tsx), open only while `LOOK_PICKER=on`.

- Croatia shop, local: http://localhost:3051/en/design — shows today's work.
- Deployed: https://cbdbuy.be/en/design — shows the last deploy only (deploys on the owner's word — last 23.10.2026, [[storefront4-local-only]]). Checked 21.10.2026: answers 200, so the panel is open to everyone on the live domain — switching it off there (`LOOK_PICKER`) is the owner's word, per CLAUDE.md «Панель настройки отделена от сайта».
- Kit template: http://localhost:3020/en/design.

Related: [[fix-where-owner-looks]], [[one-storefront-all-domains]].
