---
name: overnight-checks-ok
description: "full npm test, builds and rendered checks run only at night (owner 03.10.2026 18:50: daytime runs block his work); daytime = narrow checks of touched files; Firefox/WebKit install approved"
metadata:
  node_type: memory
  type: feedback
  originSessionId: ffb98b1b-ee65-4d68-b504-ced2148c2ad3
  modified: 2026-10-05T03:52:59.578Z
---

01.10.2026: «когда я буду спать после полуночи можешь запускать проверки хоть на всю ночь, если токенов хватит». Also approved: `npx playwright install firefox webkit` (~200 MB), an hour after that conversation (scheduled 22:33).

**Why:** the full chain (build, sweep on 41 widths, craft, detect, engines in five browsers) is long, and he does not want to wait on it.

**How to apply:** schedule the heavy final chain for after midnight (a one-shot cron, session-only: it fires only while this session stays open and idle). No push/PR (see [[work-locally]]). Fix findings by layer, record disputed ones in the morning summary, report in plain words. Related: [[all-browsers-final-check]], [[fix-what-checks-find]], [[site-audit-unasked]].

03.10.2026 18:50: «полный прогон тестов это ж долго, а мне работать нужно, можно тесты ночью сделать?» — **полный `npm test`, сборка и проверки на ней не запускаются днём вообще**: они занимают машину и мешают работе заказчика. Днём — только узкие проверки по тронутым файлам (`node --test <файл>`, `check:css/design/code/rules/icons`, ~секунды); полное — одноразовой задачей планировщика на 01:00 (`create_scheduled_task`, `fireAt`, часовой пояс +03:00), с самодостаточным промптом. Задача на ночь на 04.10: `night-tests-and-rendered-checks-04-10`.

**Night tasks stall on the first command (found 05.10.2026):** both one-shot runs `night-tests-and-rendered-checks-04-10` and `night-recheck-05-10` sat «running» for hours on their first Bash call — a permission prompt nobody answers at night; nothing was checked either night, and `night-rules-compaction` had zero runs. Before relying on a night task, check `list_task_runs` the next morning; a task that must run unattended needs a permission mode that doesn't ask — the owner switches it (security setting, not mine). 05.10 the owner instead let me run the chain in the morning once other sessions are idle: «как закончишь работу в других сессиях можешь запускать проверки». Don't start while a peer is editing: its template edit reinstalls `.storefront` mid-run (package.json loses the kit scripts → «Missing script»), wait for 5 quiet minutes.

04.10.2026: «правил немеряно… будет тысяча правил; это тоже в ночной проверке оптимизировать нужно» → rule И737 (new number only for a new question, amendments in place, entry ≤ 30 lines, `check:rules` ratchet on long entries) and a recurring scheduled task `night-rules-compaction` (daily ~04:07, after the 01:00 recheck): folds the day's continuation entries into the older one (stub «И<n> · влито в И<m>»), shortens long ones, archives full text in `docs/rules-archive/<год-месяц>.md`, reports in `docs/audit-<дата>.md`.

05.10.2026 10:07: «Закоммить, когда всё будет зелёное. Файрфокс поставлю. Ночью можешь продолжить проверки» — commit is allowed only when the whole chain is green (local main, no push). Night run scheduled as a session-only one-shot cron (01:07, 06.10) inside the session that runs without permission prompts — that is what keeps it from stalling like the scheduled-task runs did; it dies if that session is closed.
