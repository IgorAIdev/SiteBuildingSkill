---
name: one-storefront-all-domains
description: owner 21.10.2026 — one storefront app for every domain (sites are data, not copies); Belgium cbdbuy.be first, Croatia cbdshop.hr later on the same app
metadata:
  type: project
---

Owner 21.10.2026, after asking «сто доменов — сто сторфронтов?»: «одна витрина конечно. Делай, подключай её и к бельгийскому сайту и к хорватскому, но домен на него дам позже — будет cbdshop.hr».

**Why:** storefront3 (cbdin.ro) and storefront4 (cbdshop.hr) were folder copies of the kit template; every kit fix had to be ported by hand per copy, and copies drifted (signGroups, ProductView already differed on 21.10.2026). With many domains that is N ports per fix.

**How to apply:** never answer a new domain or market with a new `apps/storefrontN` copy. A site = data: host → site id → languages, market pack (law, THC limit, categories, delivery, payment), look, catalog channel (Vendure channel per market). Multi-site lives in the kit template (`templates/storefront`), the shop runs one app built from it. Belgium (cbdbuy.be) is the first site; Croatia (cbdshop.hr, domain later) the second; the Croatian copy `apps/storefront4` stays untouched as reference until Croatia moves onto the shared app. Plan: `docs/plans/multi-site.md`. Belgian law notes (novel food for ingestibles, flowers as tobacco, THC 0.2 vs 0.3 unconfirmed) — in the plan. Related: [[only-correct-architecture]], [[skill-goal]].
