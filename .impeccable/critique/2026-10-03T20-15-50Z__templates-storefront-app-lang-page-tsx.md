---
target: storefront home page
total_score: 21
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 3
target_identity: "file:D:\\MyBssinessProject\\sitebuildingskill\\templates\\storefront\\app\\[lang]\\page.tsx"
target_fingerprint: "sha256:269910e067434d4004ca4342b31d525569d9077732eae4987b6e652edb194e81"
target_path: "D:\\MyBssinessProject\\sitebuildingskill\\templates\\storefront\\app\\[lang]\\page.tsx"
timestamp: 2026-10-03T20-15-50Z
slug: templates-storefront-app-lang-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser), no screenshots by owner rule.

Design health (Nielsen, Persuade surface, 7 and 9 n/a): 21/32 — Good-band low. Consistency 2 (two darks, pill vs 4px corners), Minimalist 2, Match 2.

Specificity: copy is shop-specific (batch numbers, lab reports); the visual shell is category-interchangeable; the lab report — "the one thing to remember" — has no block on the home page.

Colour by region (1253 px): top strip and header white; hero warm black #231F18; effects on page grey #E4E0DA; three shelves on band #F2F0EC; FAQ on page grey with four solid petrol circles; footer petrol #0C3A46. Brand = 0.1 % of the page above the footer, 18.6 % in the footer.

Priority issues:
1. [P1] Brand only in the footer; two different darks (hero warm black vs footer petrol). No role put the hero on the brand. -> palette: hero stage follows brand deck; top strip and FAQ band on the deck (И697).
2. [P1] Solid brand circles on a grey field (FAQ signs, contact knob, RO tag). -> quiet sign holder; colour from the section band.
3. [P1] "Shop" not the main action (five equal pills). -> Shop loud fill, categories quiet.
4. [P2] No lab-report block on the home page.
5. [P2] Page grey heavy (L* 89 vs 96-98 at references).
6. [P3] Two corner shapes (pills vs 4px).

Detector: 3 CLI findings (broken-image, false positives via spread props); browser: real — section intro 91 chars per line at 1253 (73ch in Manrope), phone side gutter 12 px; rest false positives or Look panel.
