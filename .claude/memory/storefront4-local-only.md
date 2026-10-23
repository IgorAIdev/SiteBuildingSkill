---
name: storefront4-local-only
description: storefront4 deploys to cbdbuy.be only on the owner's word — 21.10.2026 local-only, 23.10.2026 «выкатывай, мне там смотреть»; how a release lands (release worktree → PR → green CI → merge → Coolify)
metadata:
  type: project
---
21.10.2026 после выкатки ритма — «и далее снова работаем локально»: показ на localhost:3051,
коммиты в ветку eu-hr-view `claude/bare-still` без выкатки. 23.10.2026 — «выкатывай на сайт,
cbdbuy.be мне там нужно смотреть»: выкачено PR #474 (CBD_ecommerce_eu). С 23.10 он смотрит
cbdbuy.be — правки витрины 4, которые он ждёт увидеть, выкатываются тем же путём, пока он
не скажет снова «локально».

**Why:** выкатка на живой домен — слово владельца, а не моё решение; но смотрит он там, где
сказал ([[fix-where-owner-looks]]).

**How to apply:** выкатка = вливание в `main` CBD_ecommerce_eu: Coolify собирает
`cbdshop-storefront4` сам по путям `apps/storefront4/**` (OPERATIONS.md, Watch Paths). Путь:
отдельная папка-копия от `claude/bare-still` (в общей папке лежат чужие незакоммиченные
файлы — быстрый заказ, [[shared-working-tree]]), туда `git merge origin/main`, `npm ci`, тесты,
`tsc`, сборка, `check:css/code/lint/port/rules` (то же гоняет работа `storefronts` в CI) →
PR → дождаться конца CI → merge. Вливание с идущей CI и отмену прогона классификатор
запрещает; приложение проверок этого репозитория не видит (токен без прав) — ждать прогон
одной командой `gh run watch`. Коммит идёт через ворота `pnpm accept` (~3 мин). Токена Coolify
на ноутбуке нет: упала сборка выката — новый PR с правкой `.md` внутри `apps/storefront4`
(CI `.md` не гоняет, Coolify пути берёт). Набор (SiteBuildingSkill) влит, как обычно.
Связано: [[one-storefront-all-domains]], [[design-system-address]].
