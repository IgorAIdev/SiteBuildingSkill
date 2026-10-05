---
name: work-locally
description: "Since 28.09.2026 local-only again: commit on local main, no push, no PR until the owner says; earlier GitHub flow (claude/* → PR → merge) is paused"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b28bb6bf-8743-407f-ae68-12fe93a43055
  modified: 2026-09-26T13:06:30.750Z
---

**28.09.2026 — local again.** Owner: «как сделаешь всё — коммить локально, вливать в GitHub не нужно, работаем локально» (see [[no-history]]). Finished work is committed on the local `main` in this checkout; no push, no PR, no CI until the owner says «заливай». The storefront runs locally (`npm run storefront`, phone by the LAN address the launcher prints). The claude/* → PR flow above is paused, not deleted. This overrides CLAUDE.md «Ветка и вливание» and «Работа показывается отрисованной — на проде» for sessions in this kit; CLAUDE.md keeps the PR flow because it travels to new shops.

**History (paused flow):**
From 23.09 to 25.09.2026 the owner kept everything local («Заливать на гитхаб пока ничего не нужно, работаем локально»). On 25.09.2026 they said «заливай все на гитхаб, далее в облаке буду продолжать»: all work went to GitHub `main` through PRs #59–#62, old remote branches were deleted, and only `main` remains. The owner now continues in cloud sessions from `main`.

On 26.09.2026 the owner decided to move everything from GitHub to another laptop and work locally in the Claude desktop app, steering from the phone through Remote Control. The reason: a cloud session can't show a live page. At the same time the memory moved into the repo, at `.claude/memory/`, loaded by `.claude/rules/memory.md`.

**Why:** GitHub minutes cost the owner money (CI runs only on PRs). GitHub `main` is the source of truth for every machine and the cloud.

**How to apply:** start work on a fresh `claude/*` branch cut from `main`. Run the checks locally before pushing, and push once per finished change. Open a PR to `main`, and once CI is green merge it yourself with a merge commit, not squash. The owner authorized pushing on 25.09.2026 (the auto-mode classifier may still ask them). `gh` is logged in as IgorAIdev. The repo `IgorAIdev/SiteBuildingSkill` is public. Related: [[take-recommended]], [[shared-working-tree]].
