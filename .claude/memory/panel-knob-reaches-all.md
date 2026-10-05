---
name: panel-knob-reaches-all
description: A panel knob named generally (Corners) must visibly change everything it names, buttons included; no second knob may silently override it (owner, angry, 04.10.2026)
metadata:
  type: feedback
---

04.10.2026, screenshot of Look → System → Shape → Corners → Crisp with the card «Add to cart» still pills: «блять не реагируют кнопки на настройку панели, не меняется форма, ты не починил». The pill lived on Buttons → Shape (`--ctrl-btn-pill`) and overrode Corners; the panel sample even said «form in Buttons → Shape», the owner did not read it.

**Why:** the owner tests the panel by turning the obvious knob and looking at the site; a knob that changes nothing reads as broken, whatever the architecture says.

**How to apply:** one property — one knob, in the place its name points to. Button corner is now the scale role `--r-btn`, set by Corners; each corner set has a «· pill» twin (Radix `radius="full"` model), so every old combination stays representable. Before adding a knob that refines another, ask «what happens when the owner turns the general one?» — if nothing, merge them. Related: [[round-forms-only]], [[look-panel-architecture]], [[only-correct-architecture]].

**Exception (04.10.2026, owner's word):** category buttons ignore Corners on purpose — [[category-buttons-pill-brand]]. Only the owner adds such exceptions.
Second exception, same day: rail head buttons (‹ › and «View all», `data-rail-nav`, И747) — see [[round-forms-only]].
