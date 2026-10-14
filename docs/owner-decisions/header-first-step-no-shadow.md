---
name: header-first-step-no-shadow
description: "New storefront look starts with the header (all builds shown as pictures + one invented new); «Step» header = a tone sheet edged by a hairline, no shadow; top strip as tall as its tap target; phone row = menu+logo at the start edge, action signs at the end edge (owner, 14.10.2026, cbdshop.hr)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 018WC1PgGtafakVpWgxEiuKK
  modified: 2026-10-14T12:00:00.000Z
---

14.10.2026, cbdshop.hr (fourth storefront): «давай с вида шапки начнём, какие варианты в запасе? и придумаем ещё что-то, показывай тут» → «и с этого нужно начинать с шапки, правь скил». Chose «Step» («Ступень»), «строим на заливках, тонкой окантовке и фоне страницы».

**Rules.** (1) The look of a new storefront starts with the header, before colour, face, logo and home: `npm run header:sheet` pictures every build on the shop's own data, laptop and phone, plus at least one newly invented build; the pick is recorded in `docs/gate.md` in the owner's word (CLAUDE.md, «Вид новой витрины начинается с шапки»). (2) «Step» is separated by a thin edge (`--line-w` in `--rule`), not a shadow. (3) The top strip of the sheet is as tall as `--head-strip` (the tap target: 44 on touch, 32 on a mouse) with no padding of its own — it stood 60 at a 44 target. (4) On a phone the blue row is two groups: menu and logo to the start edge, search / favourites / cart to the end edge; free space in the middle only; target boxes 40 stand flush inside a group; the cart never leaves the row (320 included). First try spread five items evenly (`space-between`) — «а нужно по ритмам: бургер и лого к левому краю, иконки к правому». (5) Row corners are equal on all four sides (sheet corner minus its line).

**Why.** The header is the most seen surface on every page; it was taken silently as the default build, six builds lay unseen in stock. **How to apply:** `templates/storefront/components/Header.module.css` (`look-header:step`, `look-header:tray,nested,step`), tests `selftest/header-sheet.test.mjs`. Related: [[cards-no-shadows]], [[round-forms-only]], [[no-unasked-extras]].
