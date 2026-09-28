---
name: no-screenshots-batch-prs
description: Owner 27.09.2026 — no screenshots in chat, they check cbdin.ro themselves; batch edits into one PR per task, no PR-activity subscription, one scheduled check then merge
metadata:
  node_type: memory
  type: feedback
  modified: 2026-09-27T21:40:00.000Z
---

Owner, 27.09.2026: «не нужно показывать мне скрины, сделал правки, залил — я сам посмотрел на проде, скрины от тебя мне не нужны». Then on PR notifications: «может много правок вместе собирать?» — yes.

**Why:** tokens. Images are the most expensive part of a session, and every PR notification wakes the session with the whole conversation plus a long instruction block (more than ten wakes on 27.09.2026).

**How to apply:** verify rendered pages yourself (measure, detector, sweep) but don't send screenshots unless asked. Collect edits in one `claude/*` branch, one PR per task. Don't call subscribe_pr_activity (unsubscribe if the harness auto-subscribed); set one send_later check-in a few minutes after the push, merge when green. After merge, tell the owner in one line what to look at on cbdin.ro. Rule И500 in CLAUDE.md. Related: [[work-locally]].

Owner, 27.09.2026 late: «наша задача экономить токены, поэтому правки всегда принимай, делай их разом, вливай вместе по команде». So: accept every edit, do them all in one pass, merge only when the owner says so (e.g. «заливай») — not on my own after green. Spend tokens sparingly: no long explorations, targeted reads, batched edits.

**28.09.2026, stricter:** «экономь токены, не нужно мне тут изображения рендерить» — after I took and viewed ~10 screenshots of my own for verification. Don't render images for myself either: verify rendered pages with numbers (Playwright `getComputedStyle`, box sizes, line counts, `display` of elements) printed as text, and the kit's rendered checks. Open an image only when a number cannot answer the question.
