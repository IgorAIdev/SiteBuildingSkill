---
name: final-check-running-list
description: unverified items go into one running list in docs/open.md the moment they appear, so the long end-of-batch check is systematic, not from memory
metadata:
  type: feedback
---

Owner 03.10.2026, after the buttons-pair round: «проверка полная у нас будет долгой, ты же запоминаешь, что проверять в конце системно?» — I had written «не проверено» only in a rule entry and in the reply, nowhere as one list.

**Why:** the full check (build, craft, sweep at 41 widths, all engines, both themes) is long and runs once, before handover. What I could not verify by hand during a fix (press-and-hold, other DPR, other engines, a regression on the real feature next to a sample) is lost unless it is written down when it comes up.

**How to apply:** the moment I leave something unverified, append a bullet to the section «Проверить в конце партии …» at the tail of `docs/open.md` (append only, the file is shared): what to look at, in which states, what I did see and what I did not. Before handover read that list first and run it together with the standard pass. Also test the real feature next to a changed sample or storage key, not only the sample. Related: [[verify-states-by-pressing]], [[rendered-checks-changed-pages]], [[site-audit-unasked]].

04.10.2026, after a day of defects found by the owner (pagers gone, hover menus «cancelled», menus from five sources, ad-hoc shadows): «сколько ошибок — пиши в скилл, чтоб не было таких проблем, и в проверку ночную пиши всё перепроверить». Now each day has its own section «Проверить ночью <дата>» in `docs/open.md`, and a one-shot scheduled task at 01:00 reads that section (task `night-recheck-05-10` for 05.10.2026). Every defect of the day → rule with a check in the owning skill the same hour, plus a line in that night section. When something client-drawn vanishes, check the dev server's health first (rule И725), not the code.
