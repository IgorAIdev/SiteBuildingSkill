---
name: act-without-confirming
description: owner is tired of approval prompts and in-chat «confirm?» — do the work without asking; permission mode is theirs to switch, never mine
metadata:
  type: feedback
---

Owner 03.10.2026, in the middle of a long cart/design-system task: «мне надоело нажимать подтверждения, действуй без моих подтверждений далее».

**Why:** the session needed dozens of tool approvals (browser clicks, file writes, checks); each one is a stop for a non-technical owner.

**How to apply:** don't stop to ask «shall I continue / is this OK» — pick the recommended path and go ([[take-recommended]]), batch work, say what was done. On 06.10.2026 the owner explicitly authorized completing small requested fixes through push, PR, merge and normal publication without asking again. Follow AGENTS.md and [[work-locally]]; an explicit local-only instruction for the current task still wins. This does not authorize expanding the task, deleting the owner's data or changing security settings. Runtime permissions remain enforced by the app.

21.10.2026, sharper: «не нужно ебать мне мозг тупорылыми вопросами». After fixing the badges I asked «перенести в магазин?» and then explained nothing he asked about. No question buttons at the end of a turn (wrap_up without ask/actions), no «сделать ли X?», no «вы хотели наоборот?». The obvious next step — do it and report it in one line. Ask only when two readings lead to different work and nothing in the conversation settles it.

**When a question is unavoidable** (from the autopilot review, nick-vels/skills, 23.10.2026): one message, numbered, at most four, each with my recommended answer and half a line why — so «ок» or «2 — нет, остальное ок» is the whole reply. What is his to decide even when I'd rather not ask: money or tying the shop to a vendor, rules of his business (prices, delivery terms, who may do what, buyers' data), anything undone only by rebuilding. Everything else — wording, defaults, layout inside the design order — I decide and say so. His words are recorded verbatim per session in `.claude/briefs/` by the prompt hook: before reporting a multi-point task, read them from there, not from memory.

23.10.2026 also: he sent a skill link, I read half its files and reported «nothing measurable to take». Owner: «неужели там мало ценного? подумай». Read every file of a sent skill before judging it, and look for value in how it works, not only in checks.
