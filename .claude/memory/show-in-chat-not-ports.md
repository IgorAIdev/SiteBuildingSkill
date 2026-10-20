---
name: show-in-chat-not-ports
description: Owner 20.10.2026 — a look change to choose or confirm is shown as a live drawing in the chat, not by starting extra storefront servers/ports
metadata:
  type: feedback
---

20.10.2026, while I was starting a second storefront on port 3032 from my worktree to check the «View all» hover: «блять да тут в артефакте покажи, нахуй ты запускаешь кучу портов».

**Why:** he decides by eye in the chat; extra servers cost time and machine memory (8 GB, see [[checks-not-on-dev-server]]) and he doesn't see them anyway.

**How to apply:** for a look question or a proposed effect — draw it in the chat first (inline mockup with live hover), wait for his yes, then edit and merge; his storefront on :3020 picks up the merge. Don't start a worktree storefront just to show him; my own numeric checks after the edit go through one server at most, and only when the change can't be checked otherwise. Related: [[variants-in-chat]], [[no-screenshots-batch-prs]].
