---
name: checks-not-on-dev-server
description: crawling checks (seo, urls, craft, sweep) only on a build; on Windows they corrupt the dev server's manifest; exception — check:part narrow one-lane run (И765)
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4c7a24fc-3bf0-45a9-a762-2361c5912ad1
  modified: 2026-09-28T13:13:27.699Z
---

Page-crawling checks (`check:seo`, `check:urls`, `check:craft`, `sweep`) go against a built site (`npm run build && npm run serve`), never against the `npm run storefront` dev server on :3020 that the owner watches from the phone.

**Why:** 28.09.2026, twice in one session: `SITE=http://localhost:3020 npm run check:seo` fired many pages at once, Next 16 dev on Windows interleaved two writes to `.storefront/.next/dev/prerender-manifest.json`, and every page returned 500 («Unexpected non-whitespace character after JSON») until the server was restarted. The owner's phone preview died with it.

**How to apply:** during fix rounds verify the dev storefront with single page loads in the browser pane (numbers via JS); run crawling checks only on a build before handover ([[rendered-checks-changed-pages]]). Recovery if it happens: stop the preview, delete `.storefront/.next/dev` (not from a shell whose cwd is inside it — Windows says «busy»), start again.

**Memory limit (28.09.2026):** the owner's machine has 8 GB; with ~24 Claude sessions open only ~0.7 GB stayed free and `check:craft` on the build crashed every page («page.waitForTimeout: Page crashed»), even one page at a time. Not a site defect — check free RAM first (`Get-CimInstance Win32_OperatingSystem`), kill leftover `chrome-headless-shell`. When short, reproduce the family's logic in the browser pane via same-origin iframes at 1440/390 and say plainly that the automated run didn't happen. Build in `.storefront` is safe beside the dev server (Next 16 keeps dev in `.next/dev`); serve with `npx next start -p 8099`, and in Git Bash pass `MSYS_NO_PATHCONV=1` or `--pages /ro` turns into a Windows path.

**Also crawls (03.10.2026):** `npm run check:choice` runs `check:craft` against `SITE` (defaults to :3020) — on the dev server it failed with «net::ERR_ABORTED … сервер упал» (the server survived this time). Run it only against a build/serve address, never the watched dev storefront.

**Repair without a restart (04.10.2026):** the server was another session's, so preview_stop wasn't mine to use. Every page answered 500 after a kit-edit reinstall. `.storefront/.next/dev/prerender-manifest.json` had a duplicate tail after a valid object («Unexpected non-whitespace character after JSON at position N»). Cutting the file to its first N characters (check `JSON.parse` first) brought every page back to 200 at once.

**check:open beside the running storefront (05.10.2026):** Next 16 won't start a second `next dev` in `.storefront` («Another next dev server is already running»), so `check:open` failed on every big run while the owner's preview was up. It now walks the running dev server instead — one address at a time (never four: that is what broke the manifest) and by that server's own sitemap (`useLive(BASE, true)`), because the launcher's SOURCE=cbdin isn't visible to the check (sample addresses gave 57 false 404s). Result that day: all 408 addresses opened.

**In-work exception (05.10.2026, И765):** `check:part` runs `check:craft --pages <part pages>` against the running storefront with `CRAFT_LANES=1` (one page at a time, like check:open) and `SOURCE=live` (addresses from the server's sitemap, not the sample tree), warms each page first and waits/retries when the launcher restarts the server (any edit under `tools/` or `scripts.mjs` reinstalls `.storefront` and restarts it — batch tool edits, then measure). Whole-tree crawls stay on a build.

**A short 500 is the reinstall, not a defect (05.10.2026):** right after any session edits `tools/`, the launcher rewrites `.storefront` and every page answers 500 for 30–60 s («Reading source code for parsing failed … app/api/revalidate/route.ts»), and `check:part` reports «page.goto: Timeout» or «страница ответила 500». Wait for 200 (curl every few seconds), then measure again; two sessions running `check:part` at once double the load and the timeouts. Batch tool edits so the server restarts once.
