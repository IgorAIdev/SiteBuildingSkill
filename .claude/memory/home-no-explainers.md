---
name: home-no-explainers
description: Explainer texts (how to read mg and %, spectrum) live in the blog, never as a block on the home page; no «on every product» promises
metadata:
  type: feedback
---

Owner 09.10.2026, seeing the home block «Percent or milligrams: how to read a CBD label»: «такие тексты должны быть в блоге» — the block was removed from the home (`story` stays an empty owner slot); the article already exists in the blog (`cum-citesti-mg-si-procente`).

**Why:** the home is for buying and for the buyer's queries; a guide on the home repeats the blog and, with mg comparison, contradicts his 08.10 word «сравнение по миллиграммам — его нет» (see [[seo-copy-keywords]]).

**How to apply:** explanatory content → blog article (check `lib/blog.json` first, extend instead of duplicating). Page copy never promises data the engine may not hold («на каждом товаре»): say «на этикетке» / «на упаковке» (family `promise` in `lint-copy`, И788 п. 5).
