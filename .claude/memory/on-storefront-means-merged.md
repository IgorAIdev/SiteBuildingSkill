---
name: on-storefront-means-merged
description: never tell the owner a change is "on the storefront" until it is merged to main — he looks at localhost:3020 on his own machine and at cbdin.ro; my cloud sandbox is invisible to him (08.10.2026)
metadata:
  type: feedback
---

08.10.2026: I wrote «вариант A уже стоит на витрине». It stood only in my cloud sandbox's working tree (and its local dev server); the owner sent a screenshot of his own `localhost:3020/en` with every hero button still filled: «ты сказал что он уже на витрине, а на самом деле нет».

**Why:** his storefront is his own machine (localhost:3020, Windows) and cbdin.ro; both see only what is in `main`. A sandbox dev server is not «the storefront» for him.

**How to apply:** before merge say «в моей рабочей копии» (or nothing); after merge say «влито в main, на cbdin.ro через несколько минут, у вас локально — подтянуть main». If I promise he can look, merge first (standing authorisation 06.10.2026, small requested fixes). Related: [[work-locally]], [[owner-window-width]].

**Follow-up (08.10.2026, later):** after the merge he sent cart screenshots with the old behaviour («так не исправлено же ничего»). Measured the same window (≈410 × 505, mouse, 42 items) on my copy — foot whole, buttons inside — and on the live cbdin.ro (CSS already `flex:none; max-block-size:60%`, samples show the buttons inside). So his copy was stale: his `localhost:3020` is his own clone and does not get cloud merges until pulled (no local session was reachable from the cloud to do it), or an old cbdin.ro tab. Tell him in words: «перезагрузи страницу (Ctrl+F5)» for cbdin.ro, «в локальной сессии скажи: подтяни main и перезапусти витрину» for localhost — and ask for a screenshot with the address bar if it still shows.

