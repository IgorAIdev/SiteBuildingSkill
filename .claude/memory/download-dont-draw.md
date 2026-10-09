---
name: download-dont-draw
description: controls and elements are searched for and downloaded (MIT libraries), never drawn by me; self-made ones get deleted; audit planned Saturday 03.10.2026
metadata:
  type: feedback
---

Owner 02.10.2026 (angry, after the counter variants broke): «скачивай элементы,
не нужно их делать, т.к. ты ошибки делаешь; а то, что сделал сам, удаляй… и на
будущее давай лучше скачивай, ищи готовое, нежели писать самому».

**Why:** my own drawings of counters kept shipping defects (edge drawn as an
inset shadow under child fills, a later same-specificity rule wiping a fill,
tiny glyphs). The downloaded HyperUI/Flowbite versions had none.

**How to apply:** before any new control or variant: `gh api` the MIT libraries
(HyperUI, Flowbite, daisyUI, shadcn/ui, Preline, Headless UI, Radix), port the
sample faithfully, note source and licence; if nothing exists, say so to the
owner instead of drawing. Edge = real `border`. Self-made variants are removed
on request. The Saturday 03.10.2026 audit (scheduled task
audit-own-work-saturday, plan docs/audit-own-work-plan.md; paused by the owner's word 03.10 — runs with the stage-end audit, see [[pro-practice-default]]) lists everything I
hand-drew and what could be swapped for a downloaded sample; report only, no
replacing without the owner's word. Related: [[verify-pages-use-system]],
[[elements-draw-not-embed]].

**Update 03.10.2026:** owner: «если что-то по лицензии не получается получить — перерисуй, скопируй, будет наше без лицензии». Meaning: when a sample can't be taken (licence), redraw it in our own CSS/markup from the visual idea. Never paste restricted code and relabel it — copied code keeps its licence; own code on base.css classes (as in elements 99–104, where only the generic pattern was taken from Preline) is ours. Say in `source.md` what was taken (idea) and what was not (code).
