---
name: variants-as-menu
description: "Skills offer every variant of an organ as a menu for the owner's pick — no recommendation by thresholds (number of facets, products); owner 04.10.2026"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 207a8755-5617-4da7-8a09-debb0dde4e2c
  modified: 2026-10-04T12:43:24.310Z
---

04.10.2026, on the filter views I wrote into the shop skill as «до 5 параметров — панель… от 7 — колонка»: «нет, не от параметров предлагай, а просто варианты на выбор вне зависимости от параметров».

**Why:** the owner picks looks with his eyes; a numeric rule in the skill decides for him and hides variants he might want (he chose the Allbirds panel although a threshold table would have pushed the bar).

**How to apply:** when a skill lists variants of an organ (filter, pager, header, card…), write them as a menu — what it looks like and who does it so — with the kit's measured facts as numbers next to them (rule «числа рядом, выбирает заказчик глазами»), never «recommend X when N > k». Show all variants rendered (design system or drawn in chat), record his pick in docs/decisions.md. Process/implementation choices stay mine ([[take-recommended]]). Related: [[variants-in-chat]], [[design-system-shows-all]].
