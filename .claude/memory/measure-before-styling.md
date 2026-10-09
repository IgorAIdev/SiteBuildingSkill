---
name: measure-before-styling
description: "Before any type/spacing change: pull numbers from kit research, the owner's built storefronts and 3+ live shops; think phone-first without being told"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-09-28T12:00:00.000Z
---

On 28.09.2026 the owner saw the product page on a phone (title huge and wrapping, brand/description same size, uneven gaps) and carousel arrows on a touch screen: «почему ты изначально не посмотрел исследования, витрины, сайты, скилы — ты же делаешь плохо без этого»; «блять ты сам не можешь догадаться».

**Why:** sizes set by eye look amateur; the numbers already exist in `research/site-building-2026-09-20/`, in the owner's built storefronts (`IgorAIdev/storefronts` = cbdin.bg, `IgorAIdev/CBD_ecommerce_eu`) and on leading shops.

**How to apply:** before touching font sizes, spacing or layout of a surface, fill «## Замеры» in its brief (`docs/design/<surface>.md`, check family `briefMeasured`, И507) from those three sources, then change roles via the scale builder. Always ask «what does this look like under a finger on a 390 screen» yourself — obvious phone norms (no carousel arrows on touch, И506) are not the owner's job to point out.
