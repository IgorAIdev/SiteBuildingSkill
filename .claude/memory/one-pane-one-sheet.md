---
name: one-pane-one-sheet
description: "Windows over the page (menu, filters, cart) share one anatomy — deck header, ONE white sheet, one pair of actions at the foot (quiet left, loud right); no per-window tones, plates or grey controls (owner 05.10.2026, И772)"
metadata:
  node_type: memory
  type: feedback
---

05.10.2026, three drawers side by side (filters, cart, menu) + a shelf card: «кнопки внизу в разных формах по-разному, там серые, там белые… в корзине есть несколько оттенков, а в меню нет… надёргали разного дизайна, слепили, всё несогласовано — пересмотри роли, уменьши количество ролей или сделай решения едиными, слишком большой разброс применений». Measured before: cart had five fills (deck, delivery strip tint, `--band` body, white row cards, grey stepper trough), filters two, menu three; cart foot = word + loud, filter foot = loud + outline stacked.

**Why:** the owner judges the whole site by eye across windows; every window with its own layer recipe (cart «слоями» И671) reads as a different site. He wants fewer roles, not more variants.

**How to apply:**
- A window = deck header + ONE `--surface` sheet + hairline above the foot. Body, strip and rows never paint themselves (`paneFill`, check:css). Tone is changed in one place (the window), for all windows at once.
- Foot of any window = `pn.acts` pair: quiet button left, loud right, one row; wraps with loud above, both full width. Quiet is the catalog button (outline or veil as set in the panel), never a word or a grey plate.
- A control never paints its own grey: stepper takes `--ctrl-btn-fill/edge` like every quiet button; one look on the site (`SITE_LOOK`).
- Before adding a layer/tint/plate to one window, measure what the sibling windows do; sameness beats the local idea.
- Menu foot (same day): service links stay rows; favourites + account + theme are icon buttons (`glyph`), language is codes on one `tray` plate, all in one row; the plate must be small (32 high, not the 169×51 slab he rejected).

Rule И772. Related: [[round-forms-only]], [[verify-pages-use-system]], [[design-system-shows-panel-controls]], [[only-correct-architecture]].
