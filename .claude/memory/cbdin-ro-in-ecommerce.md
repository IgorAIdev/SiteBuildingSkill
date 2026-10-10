---
name: cbdin-ro-in-ecommerce
description: cbdin.ro site moved out of the kit into cbd-ecommerce apps/storefront3 on 08.10.2026, panel removed; kit storefront template stays the showcase source
metadata:
  type: project
---

Owner, 08.10.2026: «в целом доделай сайт сегодня и подключай его к проекту ecommerce, отрезай от скила и панели, будем его уже использовать полноценно, как сделанный»; «мы делаем .ro, чтоб в storefront3 поставить его».

The finished site was installed as a shop (`install.mjs --storefront --shop`), the Look panel removed (`look:remove -- --yes`, `check:look` green) and the result placed into `D:\MyBssinessProject\cbd-ecommerce\apps\storefront3` (branch `claude/storefront3-from-kit`; own npm lock, excluded from the pnpm workspace, `infra/docker/Dockerfile.storefront3`, `compose.storefront3.yaml`, port 3030, `/api/health`). The kit's `templates/storefront` stays the template; cbdin.ro keeps serving from Coolify `skill-storefront` until the owner moves the domain to `cbdshop-storefront3`.

**Why:** the owner wants a real working shop, not a showcase with a panel.

**10.10.2026, owner: «уже живёт в екомерс».** cbdin.ro is served from cbd-ecommerce; CLAUDE.md's «влитие в main выкатывает витрину на cbdin.ro» no longer holds for the live site.

**How to apply:** a fix to the live cbdin.ro site goes into `apps/storefront3` in cbd-ecommerce (its own checks: tsc, npm test, check:css …); a fix that is also a kit lesson goes into the kit template and skill too. Until the switch, CLAUDE.md's «влитие в main выкатывает витрину на cbdin.ro» still holds. Social sign-in there needs Vendure ≥ 3.7.3 (ecommerce runs 3.7.2). See [[storefront-template-ro]], [[work-locally]].
