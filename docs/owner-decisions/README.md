# Решения владельца — вне автозагрузки

Перенесены из `.claude/memory/` 10.10.2026 (план перестройки набора, этап 2):
индекс памяти читается каждым запросом, а эти записи нужны только при правке
вида конкретной части или уже записаны правилом в `CLAUDE.md`. Ничего не
удалено. Читать перед правкой вида части — решение владельца не
пересматривается без его слова.

## Вид витрины-образца

- [Allbirds reference](./allbirds-reference.md) — owner likes allbirds.com as the minimal reference; one pill button form, fill shows importance (measured 29.09.2026)
- [Gymshark reference](./gymshark-reference.md) — owner: good shop, take as example and maybe the model for the next storefront; caption width follows it (03.10.2026)
- [LUXA is not his](./luxa-not-owner.md) — the LUXA screenshot in the home brief was never sent by the owner (04.10.2026); his refs are Allbirds, Gymshark
- [Samples: rail vs stack](./samples-one-row.md) — product-card samples on one horizontal rail; whole pages/sections stacked vertically; one sample per variant, no dark backing (tiles 01.10.2026)
- [Design system: laptop only](./design-system-desktop-only.md) — owner never opens /design on a phone; lay out and check it for the laptop only
- [Design system shows, panel controls](./design-system-shows-panel-controls.md) — page = variants to look at; every toggle/picker only in Look panel (palette excepted); owner angry when I put switches on the page
- [Design system shows all variants](./design-system-shows-all.md) — render the real component per variant; never mirror the Look pick, never a hand-drawn copy
- [Design system: assortment tiles](./design-system-assortment.md) — /design tabs = tile grid of real things like Знаки; no text summaries, where-lists or measure rows
- [Panel overwrites server-side draft edits](./draft-overwritten-by-panel.md) — open Look panel re-posts its in-memory names; after editing the draft on the server ask the owner to reload first
- [No Brand tint](./no-brand-tint.md) — owner rejected the brand-veil button fill; removed from the catalog, never offer again
- [Effects row stays tiles](./effects-row-stays-tiles.md) — tiles, not pills; since 04.10.2026 dress «Caption» like the blog card; frames by role (И736)
- [Bands full-bleed](./bands-full-bleed.md) — band to window edge, content in frame; owner chose 03.10.2026, nothing to change
- [Round forms only](./round-forms-only.md) — buttons pills and circles, no square plates; menu/list row hover = rounded rectangle --r-ctrl, one shape everywhere (04.10.2026); button corner = Shape → Corners (--r-btn, «· pill» twins), no data-pill on buttons; since 08.10.2026 the published look is «Standard · pill», every data-pager sign button a circle (И790)
- [Phone menu on top](./phone-menu-top.md) — top header, burger first at the left edge, drawer from the left, signs not pictures, current page on a light brand plate (05.10.2026); no bottom tab bar
- [Panel knob reaches all](./panel-knob-reaches-all.md) — Corners must change buttons too; no second knob silently overriding a general one (04.10.2026)
- [Cards: no shadows](./cards-no-shadows.md) — Shadows knob does not reach product cards; owner «тени у карточек не нужны» (04.10.2026)
- [One main colour](./one-main-colour.md) — strip, loud button, chosen, help knob, category buttons = brand a9 on every palette and theme; measure all palettes, never a per-palette fix (04.10.2026)
- [Arrow: one direction](./arrow-one-direction.md) — disclosure arrow down closed, up open everywhere; no place flips it (04.10.2026)
- [Filter: drawer, own groups](./filter-drawer-four-groups.md) — side drawer like the cart; Categories · Concentration · CBD in total · Type · Effect, no «CBD content»; oils in mg bands; zero values greyed with (0), never hidden (И750); no price; never offer «panel» (04–05.10.2026)
- [Category buttons: pills, one bright](./category-buttons-pill-brand.md) — always pills (exception to Corners); hero row since 08.10.2026: only «Shop all» brand-filled, shelves quiet; variants A/B/C drawn
- [One window, one sheet](./one-pane-one-sheet.md) — menu/filters/cart share deck header + one white sheet + one foot pair (quiet left, loud right); no per-window tones or grey controls; menu foot = icon buttons + language on one plate (05.10.2026, И772)
- [Window foot + swipe](./pane-foot-and-swipe.md) — foot buttons always whole, never scroll; every sheet closes by swipe incl. from the dim strip; owner phone 360 css px; tested with a real finger (08.10.2026, И781)
- [Payment marks in the footer](./footer-payment-marks.md) — bare marks 24 px, no pills (a payment mark is not clickable), air between tiers; email wraps before @ if the column is narrow (08.10.2026, И783)
- [Window bits 08.10](./window-bits-08-10.md) — coupon error folds with its field; empty cart and favourites = word + line + quiet category rows; search pane no big buttons, no repeat field on results; × at the end of every window head; checkout without footer (И333/И689/И687/И784/И325)
- [Home: no explainers](./home-no-explainers.md) — guides go to the blog, not a home block; copy never promises «on every product» data, say «on the label» (09.10.2026, И788 п. 5)
- [Palette as a whole](./palette-whole-site.md) — neutral + one brand + red; night keeps the day's order of surfaces (И554)
- [Palette solves contrast](./palette-solves-contrast.md) — sign over a picture: measured palette role (glass), never ask the owner how to handle dark photos
- [Look panel architecture](./look-panel-architecture.md) — panel holds the variant catalog, site holds one look as values; no rebuild; removable in one command
- [Template: sample content is fine](./template-sample-content.md) — template is design; never report placeholder names/links/socials/payments as open items
- [Template has no buyers](./template-no-buyers.md) — word look choices as «сохранить вид», never «покупатели увидят»
- [cbdshop.bg is the owner's](./cbdshop-is-owners.md) — his first storefront (CBD_ecommerce_eu, vendure.cbdshop.bg); texts reusable as rewrites, not copies (04.10.2026)

## Уже правило в CLAUDE.md (полный текст и история)

- [Download, don't draw](./download-dont-draw.md) — search/download MIT samples for controls, never draw them; self-made ones deleted; licence blocks → own drawing from the idea, no copied code
- [No unasked extras](./no-unasked-extras.md) — build only what's described; no veils/shadows «for contrast»; quiet = thin and light
- [Site audit unasked](./site-audit-unasked.md) — after each look batch and before handover I audit the whole site myself: cross-page sameness + UX path (И523)
- [Pro practice by default](./pro-practice-default.md) — every decision checked vs docs/references.md + live sample first; «Источник:» line in rules; full audit at stage end/handover, weekly task paused (03.10.2026)
- [Elements: draw, don't embed](./elements-draw-not-embed.md) — sent buttons/controls → kit elements/ with tags, base only, hover/press shown at once
- [Only correct architecture](./only-correct-architecture.md) — name the owning layer before deciding or briefing; no wrong-layer shortcuts ever
- [Write into the skill](./write-into-skill.md) — every batch decision (fix or reasoned «leave») into the owning skill before the report, with a check; reminded twice (03.10, 05.10.2026)
- [All browsers, final check](./all-browsers-final-check.md) — «верно у меня» is not checked: final check runs Chrome, Edge, Chromium, Firefox, WebKit; a browser-dependent trick is a defect (И630)
- [Design through skills](./design-with-skills.md) — storefront design goes through impeccable/redesign-skill inside kit rules; owner: «дизайн говно везде, переделай скилами»

## Устарело

- [Codex in the same folder](./codex-same-folder.md) — Codex worked here and on GitHub until 08.10.2026; its local folders removed by the owner's word; if it returns: check branch/uncommitted/PRs, merge all lines, one snapshot to main
