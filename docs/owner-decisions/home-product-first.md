---
name: home-product-first
description: Home page of the template storefront — product first; «New to CBD?» starter shelf after the effect tiles; the trust row (lab, delivery, returns) stands last, before the footer
metadata:
  type: feedback
---

Owner 13.10.2026 (memory copy: `.claude/memory/home-product-first.md`): «Вверху политика возврата и что-то по доверию, а не сам товар — это плохо. Товар должен быть, а доверие ниже, перед футером». Research (`docs/sources-harvest.md` §10) advised proof-first, as Ritual, Seed and Endoca do; the owner overrode it.

**What the template does:** `lib/homes.ts` recipe ends with `trust`; `lib/pages.ts` puts a «New to CBD?» shelf (three gentle picks, `STARTER`) right after the effect tiles and a `trust` block last. The trust row shows only facts the shop data holds — the lab line (link to the lab-analysis document) and the delivery and returns facts (`pledgesView`); a row with no fact is not drawn. Guard: `tests/homes.test.ts`, «trust row stands last, after every product shelf, in every recipe».

**How to apply:** do not move proof up because the best stores do. Effect tiles are product choice and stay under the hero. The new copy is English in every language pack (`lib/content/home-copy.json`); translating ro/hu is a final-stage step (`docs/open.md`).
