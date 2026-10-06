---
name: no-history
description: Owner wants no git history and no GitHub pushes while finishing the template — work locally; 28.09.2026 main squashed, all other branches deleted
metadata:
  type: feedback
---

Owner does not value git history while bringing the template into shape: «мне не нужна история пока я делаю шаблон до ума». On 28.09.2026 main on GitHub was replaced by one snapshot commit (same tree) and 13 merged branches deleted.

**Why:** he sees history as a record of my early mistakes, not as a tool; arguing to keep it annoyed him.

**How to apply:** don't argue for keeping history; when he asks, squash again. Sessions with local main on the old history must start their branch from the new origin/main (unrelated histories otherwise). See [[work-locally]].

Since 28.09.2026 also: «на гитхаб заливать пока не нужно, делаем максимально локально» — no push, no PR until he says so; edits stay local and are checked locally.

**05.10.2026 — owner said «пуш в гитхаб»; how it was done.** Local `main` (650+ commits, a different root) and `origin/main` (the 28.09 snapshot + PR #91) are unrelated histories, so a plain push is rejected and a force push would erase the remote. Publish as ONE commit on top of the remote main: `git commit-tree <main tree> -p origin/main -m …`, then `git push origin <sha>:refs/heads/main` (fast-forward, no history exposed, nothing rewritten; check with `git push --dry-run` first). The repo is public — scan tracked files for keys before pushing. Pushing main triggers the Coolify deploy to cbdin.ro. Same day: his words «мне не нужны коммиты, мне нужно видное в main» — commit everything in the tree, peers' files too; the four old side branches (check-theme, storefront-sync, two old-history ones) were deleted after confirming their content was already in main, except PR #91's anchor fix, ported as И773. Left alone: remote branch `claude/anchor-sticky`, three stale local session branches and the leftover worktree folders (the classifier blocked removing them — live sessions may sit there).

06.10.2026 morning: owner asked «залито на гитхаб?» and chose «закоммитить и залить» with three open items still red (counter edge and caption width — his decisions; WebKit headings). Same method: local commit f537c1d, then `commit-tree main^{tree} -p origin/main` → b1c4a90 pushed as a fast-forward of 034934c; key scan of `git diff origin/main main` clean; deploy to cbdin.ro follows from the push.
