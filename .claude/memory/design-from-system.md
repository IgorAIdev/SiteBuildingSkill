---
name: design-from-system
description: owner 22.10.2026 (furious) — any new design is built only from what the site already shows (controls in the look chosen in the panel); never a spare panel variant or a control «like the reference»
metadata:
  type: feedback
---

22.10.2026 I gave the empty cart category tiles (`CategoryTile`, the spare `grid`
variant of the panel axis `--cat-look`) while the shop publishes pills (`dot`), and
told him «the same grid you chose for home» without checking look.json. Owner: «на
такой же дизайн где-то ещё есть на сайте?», then «хуй ложил на единообразие дизайна,
а это важно — запиши в правила: когда придумываешь дизайн, он должен быть согласно
дизайн-системе».

**Why:** he judges the site as one system by eye; a control that appears nowhere else
reads as another site, and a false «you chose this» costs his trust.

**How to apply:** before proposing a look for a new place, find the same thing on the
site (published look.json, `/<lang>/design`); take the control in the look the site
chose (`CategoryPaths` for shelf buttons). A spare panel variant is not the site's
design. Never claim «as you chose» without reading the published look. Rule in
CLAUDE.md «Новое — из дизайн-системы сайта», check `check:system` family `lookChosen`.
Related: [[one-pane-one-sheet]], [[verify-pages-use-system]].
