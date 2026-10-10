---
name: build-in-english
description: "Storefront language (owner 10.10.2026): the template is universal — build in English as the first language, translate to the market language as a final stage before handover"
metadata:
  type: feedback
  modified: 2026-10-10
---

Owner, 10.10.2026: «шаблон же универсальный, он должен быть первым языком, на котором мы делаем витрину… изготовление на английском, сдача на языке рынка. На каком-то финальном этапе нужно перевести.»

**Why:** the template serves any market; tying it to Romanian (or Bulgarian) from the start makes it a one-market shop.

**How to apply:** `DEFAULT_LANG = 'en'` in the template is correct. Skills must not demand the market language as the default from the first scenario; switching the default language, URLs and machine text to the market language is a step of the final stage (П5/П6), done with seo-content for that market. Related: [[variants-as-menu]].
