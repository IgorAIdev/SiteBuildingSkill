---
name: work-locally
description: "Since 06.10.2026 small requested fixes include push, PR, merge and normal publication without repeat confirmation; explicit local-only instructions still win"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b28bb6bf-8743-407f-ae68-12fe93a43055
  modified: 2026-09-26T13:06:30.750Z
---

**Current instruction — 06.10.2026.** After a small icon-alignment fix stopped at «вливать?», the owner explicitly requested merging and changing the rule so this question does not recur. Small fixes within the requested task are authorized through push, PR, merge and the normal deployment to cbdin.ro, after applicable checks. Complete that flow without another conversational approval. Follow AGENTS.md; do not expand the task or override an explicit current «только локально» / «не публиковать».

**Historical local-only instruction — superseded for the scope above.** On 28.09.2026 the owner requested local commits without publishing (see [[no-history]]). It no longer blocks routine publication of small requested fixes.

**History:**
From 23.09 to 25.09.2026 the owner kept everything local («Заливать на гитхаб пока ничего не нужно, работаем локально»). On 25.09.2026 they said «заливай все на гитхаб, далее в облаке буду продолжать»: all work went to GitHub `main` through PRs #59–#62, old remote branches were deleted, and only `main` remains. The owner now continues in cloud sessions from `main`.

On 26.09.2026 the owner decided to move everything from GitHub to another laptop and work locally in the Claude desktop app, steering from the phone through Remote Control. The reason: a cloud session can't show a live page. At the same time the memory moved into the repo, at `.claude/memory/`, loaded by `.claude/rules/memory.md`.

**Why:** GitHub minutes cost the owner money (CI runs only on PRs). GitHub `main` is the source of truth for every machine and the cloud.

**How to apply:** use a task branch from current `main`, apply relevant checks, push the completed change, and merge its PR yourself with a merge commit. For small requested fixes this includes the existing automatic publication; verify the deployed result and report what changed. Tool permissions remain independent. The repo `IgorAIdev/SiteBuildingSkill` is public. Related: [[take-recommended]], [[shared-working-tree]].
