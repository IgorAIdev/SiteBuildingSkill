---
name: storefront4-local-only
description: owner 21.10.2026 — after the rhythm release, storefront4 work stays local (localhost:3051), no cbdbuy.be deploys until he says
metadata:
  type: project
---
С 21.10.2026 витрина 4 правится локально: показ на localhost:3051, коммиты — в ветку
eu-hr-view без выкатки на cbdbuy.be (Coolify), пока владелец не скажет «выкатывай».

**Why:** слово владельца 21.10.2026 после выкатки ритма: «и далее снова работаем локально».

**How to apply:** набор (SiteBuildingSkill) влит, как обычно; в eu-hr-view — ветка и коммит,
без deploy. В той же папке бывает вторая сессия (быстрый заказ) — в свой коммит брать только
свои файлы ([[shared-working-tree]]). Связано: [[one-storefront-all-domains]].
