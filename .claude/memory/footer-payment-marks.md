---
name: footer-payment-marks
description: footer payment marks are bare 24 px marks in the base tier between the links and the © line, no pills; phone footer first column fits its longest line (email in one line) — owner 08.10.2026, И783
metadata:
  type: feedback
---

08.10.2026, two phone screenshots of the footer: «иконки платёжных систем вниз и с воздухом плохо — нужны ли пилюли (фон), на своём ли месте, может в другое место»; «email не помещается, может просто написать email или пусть переносится?». Measured: marks 8 px from the links and 8 px from the © line, pill 28 px with a 12 px mark, not clickable; email in two lines on 360/390/412.

**Why:** a pill is the look of a clickable chip (menu, facets, quiet button); a payment mark is not clickable. Gymshark (42×25) and Naturecan.ro (38×24) show bare marks above the © line; cbdin.bg (his own reference) has a faint 10 % plate — the source of the old pills, so the plate was a copy, not his word.

**How to apply:** `PayMarks` (one component for footer and design system), `--air-row` above and below, marks 1.7 × `--ctrl-fs-sm`. Place stays: base tier, above the © line (all references). Email stays an address (visible, copyable, like the phone beside it); first column on the phone is `fit-content(60%)`, wraps before «@» only if even that is not enough. Rule И783. Related: [[template-sample-content]], [[round-forms-only]].
