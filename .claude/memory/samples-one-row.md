---
name: samples-one-row
description: "Product-card samples go on one horizontal rail; whole-page or section samples (home variants, pages) are stacked vertically, the standard way; cards are not stretched to the tallest"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2e1bec24-0372-4875-b6af-76c3bfa75dac
  modified: 2026-10-01T05:32:57.054Z
---

On 30.09.2026 the owner said, about the product-card samples on the design-system page: «такие примеры нельзя по вертикали располагать, тогда уже клади на рельсу, чтоб я их скроллил вправо-влево». Later the same day they narrowed it: «по горизонтали в рельсах только карточки товара можно показывать, а такие целые страницы нет, не нужно так показывать, их стандартно вертикально располагай». They also said «не нужно растягивать высоту, чтоб сровняться с самой высокой карточкой» and «карточки в экран не помещаются по высоте».

**Why:** the owner compares small variants side by side. A whole page on a rail can't be seen whole, so page-sized samples read top to bottom. Their laptop window is only ≈ 590 CSS px tall (150 % scale).

**How to apply:**
- **Product cards** (and other card-sized samples): put them on one `rail` (`data-rail="goods"`) with `RailArrows` in the section head. Name above each sample, description below. Each keeps its own height and fits the window under the sticky header.
- **Whole pages, home variants and full-width sections:** stack them vertically, one under another, each with its name above.

**One sample per variant, on the page ground.** 01.10.2026, about category tiles where each variant was a row of four shelves on a dark deck: «убирай тёмный фон под рельсами, убирай сами рельсы, мне нужно только по одной планке с примером варианта плашки». A variant is shown once — one tile, name and note — not repeated over every shelf, and not on a dark backing the site doesn't have there.

Related: [[design-system-desktop-only]], [[design-system-shows-all]].
