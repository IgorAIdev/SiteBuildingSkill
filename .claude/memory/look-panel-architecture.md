---
name: look-panel-architecture
description: "Owner's requirement for the storefront «Look» panel: the panel holds the catalog of variants, the site holds one look as values, no rebuild to change, removable in one command"
metadata:
  node_type: memory
  type: project
  originSessionId: b28bb6bf-8743-407f-ae68-12fe93a43055
  modified: 2026-09-29T09:23:11.821Z
---

Owner's requirements for the reference storefront's «Look» panel (typeface, buttons, palette, spacing, header), set on 23–24.09.2026:
- «чтоб панель внешняя содержала эти много настроек и передавала одну выбранную в сайт, чтоб потом после настройки безболезненно удалить панель»
- a rebuild to change the look is too slow: «это пиздец как долго».
- he doesn't want the site carrying every variant («сайт станет тяжелым»).

**Why:** the panel is a temporary tool for choosing. The finished shop must be clean and light and keep only its own look. Changes must still show within seconds, the way Shopify theme settings do.

**How to apply:**
- **The site** stores ONE look as resolved values (CSS custom properties plus the font file plus the header id). It gets them from the data source: `look.json` in the demo, a Payload global once plan 4 is done. It renders them as an inline `<style>`, validated server-side, and caches them with revalidation.
- **The panel** (`look-panel/`) holds the variant catalog and computes the values. It previews in the browser and publishes the chosen values after `check:choice` passes.
- **Removal:** `npm run look:remove` deletes the panel, its routes and hooks, and the header variants that weren't chosen.
- **Don't** ship all variants in the site as data-attribute switches. That was the rejected intermediate design.
- **Template vs shop (owner, 24.09.2026):** «в шаблоне панель удалять нельзя даже случайно, потому что вложим туда много сил». The panel is removed only in a SHOP built from the template (`install.mjs --storefront --shop`), with `--yes`, and only after a backup; the installer restores it. In the kit template and in its showcase demo, removal is refused hard, with no override. A kit selftest ratchets the panel's presence in the template. `--force` reinstall must keep the owner's published `look.json`, the draft, the fonts and `.env`. I run removal only on the owner's explicit word and ask once more before running it.
- **Tab ↔ place (owner, 28.09.2026):** an option is shown on the tab where it is chosen, and that tab is tied to a place on the site. Examples: checkout fields sit on a Checkout tab; the buttons of the card sit where the card is. When you open a tab, the site navigates to the matching page and scrolls to the matching block. The cbdin panel was organised roughly this way. Drawn kit elements (`elements/`, 73 of them) join the panel as choosable variants on their own tab, not in one "Elements" gallery. Owner's words: «элементы нужно показывать там, где они выбираются… открываешь вкладку в панели, и сайт открывается на соответствующем блоке соответствующей страницы».

- **Design system page (owner, 29.09.2026, final word that day):** the page `/<lang>/design` only SHOWS the design system. The one exception is the palette: it is chosen both on the page (sets plus the own-palette builder) and in the panel. Every other look choice stays in the Look panel (И572); corners and shadows went back to the panel. Tried and rejected the same day: a live site iframe next to the choice, choices moved onto page tabs, and small real-element samples («не в реальном размере — оценить нереально»). Next step agreed: rebuild the Look panel page by page, starting with the home page (palette, type, cards, corners and shadows, footer chosen there). The panel and the page share one choice state, `look-panel/ui/studio.mjs`.

Related: [[storefront-template-ro]], [[take-recommended]].
