---
name: signs-45-degrees
description: "Category signs: all things at 45°, one thing and one detail, no jars; drawn one by one with a vector shown in chat (owner, 14.10.2026); nine shelves, nine signs; the paw stays upright-symmetric"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 018WC1PgGtafakVpWgxEiuKK
  modified: 2026-10-14T12:00:00.000Z
---

14.10.2026, cbdshop.hr: «иконки мы недавно рисовали новые для категорий, найди их» → «нужно попроще, если масло, то пипетка без банки» → «делать все иконки под углом, как пипетка» → «по одной иконке тут выводи… вектор без фона» → «давай шоколадку, всё написанное вноси в дизайн-систему».

**Decision.** Nine shelves (`CATEGORY_KEYS`), nine signs, all in `styles/icons.svg` and the gallery «Знаки → Категории»: oil `dropper-drop`, capsules `capsule`, paste `syringe-squeeze`, edibles `chocolate-piece` (also drawn: `gummy-bear`, `cookie-bite`, `candy-wrapped`, `lollipop`), flowers `cannabis-tilt`, pets `paw-tilt`, vape `vape-pen`, cosmetics `tube-cream` (a tube without a cap and without the cream), ointments and gels `pump-bottle` (pump bottle with a drop). The rules of the set — craft, `references/icons.md`, «Знаки товара — один угол, одна вещь, одна деталь». Corrections that bought them: the pipette with a drop fell outside the 24 window (check by painted pixels, not by `getBBox` — it is loose under rotation); the glass part is narrower than the rubber bulb; the paw's toes touched (gaps measured with geometry, ≥ 2.8); the vape drew a cloud — owner: «3-й вариант, без облачка»; the tube's cap and dollop removed («две детали не нужны»), body kept as it was.

**Weight.** One stroke weight for the whole sign sheet; «thinner» for one sign is impossible. Shown at 1.5, the sheet's real weight is the role in `base.css`.

**How to apply:** `skills/site-building/assets/icons/lucide/*.svg` → `node tools/icons.mjs`; rotation on every shape (the builder drops `<g>`); `templates/storefront/lib/shelf-sign.ts`. Related: [[download-dont-draw]] (these are the owner's own, drawn on his word).

**One size (20.10.2026).** Owner: signs in the gallery were of visibly different sizes (vape 7×19, capsule 16×16, jar 22×22) and the dense «jar» drafts merged into a blob at 16 px — the stroke was the same (`--icon-stroke`, non-scaling), the drawings were not. The section is now «Категории» (was «Товар»); the seven superseded dense drafts (`oil-dropper-jar`, `capsules-jar`, `chocolate-bar`, `cream-tube`, `vape-mod`, `flask-bubbles`, `pets-dog-cat`) are deleted; every sign of the section is fitted so its longer side is 20 of 24 (`node tools/icons-fit.mjs` → `skills/site-building/assets/icons/fit.json`, applied by `tools/icons.mjs`). New category sign → add to the section, run `icons-fit`, then `icons`.
