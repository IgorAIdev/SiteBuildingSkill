---
name: codex-same-folder
description: the owner also runs Codex in this folder and on GitHub; before committing check the branch (Codex left the tree on codex/icons-swipe-export), uncommitted Codex work and PRs; bring all lines together, then one snapshot to main
metadata:
  type: project
---

08.10.2026: the owner worked with Codex in parallel — on GitHub (PRs #92–#103, merged without the kit checks: CI runs only by request) and in this very folder (preview site «версия 17», uncommitted edits, `.codex/` and `.agents/` folders). Codex had switched the shared tree to its branch `codex/icons-swipe-export`; my night commits landed there while `main` stayed at 06.10 morning — the first diff against GitHub looked like 6587 deleted lines.

**Why:** three lines of work that never saw each other; merging blind would lose either Codex's GitHub PRs or his local work, and a push from the wrong branch would publish an old tree.

**How to apply:** at the start of any commit/push work run `git branch --show-current`, `git status --short`, `git fetch` and `gh pr list --state open`; commit Codex's uncommitted work as it lies, bring GitHub in with a three-way merge from the last common snapshot (`git merge-tree --merge-base=<snapshot>` to preview, `git apply -3` to apply), resolve by the rules journal (И758 beat Codex's shelf bar), run `check:all -- --final`, fast-forward `main`, push one snapshot ([[no-history]]), close PRs whose content is in. Codex writes knowledge only into skill references, not docs/rules.md — add the rule entry (И778). `.codex/` and `.agents/` are git-ignored. Fresh clone on Windows: clone into a short folder (research paths up to 177 chars); the launcher's npx fix is in tools/storefront.mjs.
