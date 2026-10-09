---
name: market-research-repo
description: keyword/intent/SERP research lives in the owner's private repo IgorAIdev/CBDSeoMarketResearch (created 08.10.2026), shared by the kit's seo-content skill and HempScale; never in the public kit
metadata:
  type: reference
---

Owner, 08.10.2026: «где эти все исследования по кейвордам и интентам хранить? ещё и HempScale эти данные нужны» — he created the private repo **IgorAIdev/CBDSeoMarketResearch**. Layout recorded in `skills/site-building/assets/seo-content/assets/market-sources.json` (`research`): `<COUNTRY>-<lang>/` folders (RO-ro, RO-hu, RO-en, HU-hu, BG-bg) with `autocomplete-<date>.json` (suggest.mjs), `serp-<date>.json`, `volumes-<date>.json` (volumes.mjs), `competitors-<date>.json`, `dossier.md`; `reports/<date>/`.

**Why:** SiteBuildingSkill is public; HempScale is a separate private product. One private store lets both read the same research.

**How to apply:** new research goes there, not into the kit. On 08.10.2026 my push of the first batch (including HempScale's BG DataForSEO data and claims-ro.json) was stopped by the Claude Code safety classifier as data exfiltration — do not route around it; the owner uploads it himself or authorizes explicitly. The batch waits locally in `D:\MyBssinessProject\research-2026-10-08`. DataForSEO key: none on this machine; `volumes.mjs` reads `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` from env or an env file outside git. Related: [[seo-copy-keywords]].
