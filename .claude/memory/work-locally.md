---
name: work-locally
description: "Publishing (owner 10.10.2026): small fixes go branch → PR → merge myself, owner-requested ones without asking; self-initiated fixes allowed too, but listed in the report in bold, numbered 1. 2. 3."
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-10
---

**Current instruction — 10.10.2026** (replaces 06.10, 07.10 and 08.10): «Мелкие правки заливать самому, особенно если я об этой правке написал исправить. Если ты самостоятельно исправляешь, это разрешаю, но информируй меня: пиши, что исправлено, полужирным текстом и по пунктам 1. 2. 3.»

**How to apply:**
- Fix the owner asked for → branch from current `main`, applicable checks, push, PR, merge myself. No «вливать?» question.
- Fix I found and made myself → same flow, and the report lists each one as a numbered bold line: **1. Что исправлено** — где и почему.
- An explicit «только локально» / «не заливай» in the current task still wins until he lifts it.
- Merge is not «на витрине» until he pulls `main` ([[on-storefront-means-merged]]).

**Why:** he got tired of approval round-trips (06.10), but wants to see what changed without asking (10.10).

GitHub minutes cost money: CI only by hand on the self-hosted runner (AGENTS.md); run checks locally before the push. Related: [[take-recommended]], [[act-without-confirming]], [[shared-working-tree]].
