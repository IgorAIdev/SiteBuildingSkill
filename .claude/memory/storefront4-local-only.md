---
name: storefront4-local-only
description: storefront4 deploys to cbdbuy.be only on the owner's word — 21.10 local, 23.10 day «выкатывай», 23.10 evening local again (3051 brought to main); how a release lands (release worktree → PR → green CI → merge → Coolify)
metadata:
  type: project
---
21.10.2026 после выкатки ритма — «и далее снова работаем локально»: показ на localhost:3051,
коммиты в ветку eu-hr-view `claude/bare-still` без выкатки. 23.10.2026 — «выкатывай на сайт,
cbdbuy.be мне там нужно смотреть»: выкачено PR #474 (CBD_ecommerce_eu). С 23.10 он смотрит
cbdbuy.be — правки витрины 4, которые он ждёт увидеть, выкатываются тем же путём, пока он
не скажет снова «локально».
23.10.2026 вечером, после выката THC (PR #478) — «сделай, чтоб на ноутбуке была актуальная
версия, далее локально работаем»: снова только localhost:3051. eu-hr-view (`claude/bare-still`)
доведена до `main` перемоткой; незакоммиченные правки 21.10 (быстрый заказ, ReachList, подписка
«10% off») — в `git stash` с подписью, в `main` они уже были в новом виде. Правки витрины 4
дальше — в eu-hr-view, сборка и перезапуск на 3051; в `main` CBD_ecommerce_eu не вливать, пока
он не скажет «выкатывай» (вливание = выкат на cbdbuy.be).

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

**Перенос из набора (23.10.2026):** инструменты витрины 4 (`tools/`, семьи проверок, таблицы скиллов) сильно
отстают от набора — новые проверки живут в наборе; в витрину переносится только то, что нужно её CI
(например, имя ручки в `tools/names.mjs`), иначе `check-craft` падает на незаведённой семье. Перенос —
`git diff --relative=templates/storefront` → `git apply --reject --directory=apps/storefront4`, отказы руками
(`MARKET` вместо `market()`, `lib/contacts.ts` вместо `lib/chat.ts`, `usePathname` вместо `usePagePath`).
**Ворота коммита и Windows:** с 23.10.2026 защита Windows (Application Control policy) блокирует двоичный
файл oxlint 1.82 — `pnpm accept` падает на линтере `apps/cbdin`. Обходить защиту нельзя; заказчик с телефона
разблокировать не может и 23.10 сказал «заливай на гитхаб сам» — коммит `--no-verify` после ручного
прогона остального из ворот, с причиной в сообщении коммита. Каждый раз — его словом.
