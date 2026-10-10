---
name: filter-drawer-four-groups
description: "Shelf filter = side drawer like the cart on every width; groups Categories · Concentration · CBD in total · Type · Effect, no «CBD content» heading; oils carry mg too; no price; the «panel» look is gone; zero values greyed with (0), not hidden (owner 04–05.10.2026)"
metadata:
  node_type: memory
  type: project
  originSessionId: 0fff23bf-3747-43de-a6ea-7faab2ee217a
  modified: 2026-10-04T18:41:57.265Z
---

04.10.2026 evening, screenshot of the All-products filter as a six-column panel running off the bottom of a 593 px window: «заебал меня этот фильтр… нужно делать прокрутку… чтоб кнопку можно было нажать… такое полотно выбора не нужно, это треш. давай 4 панели выбора для всех продуктов. удаляй выбор по цене»; then asked whether pros do «open, pick, close» like the cart — yes (Gymshark).

**Why:** the under-row panel grew by content with no bottom limit, so «Show N products» was unreachable; six groups were too many.

**How to apply:** `--filter-look` = `drawer` | `bar`, never offer `panel` again; groups follow cbdin.bg minus price (И742). Later the same evening: «CBD content — слово удаляй» — no umbrella heading, % and mg are two groups of their own (`Facet.group` removed); and «мг у них есть… 30 % — это 3000 мг» — every product, oils included, falls into the mg bands. Price only as a sort order.

05.10.2026, screenshots of «cosmetics» ticked with «20 % (4)» still showing: «логика в целом в фильтре нарушена… параметры, которые не попадают в выбранную категорию, должны становиться неактивными и количество ноль показываться». Values stand by the frame (shelf without buyer picks), counts follow the choice; a zero value is greyed with «(0)» and cannot be ticked, never hidden (И750). Don’t go back to hiding zero values. Rules И739, И742, И744. Related: [[variants-as-menu]], [[gymshark-reference]].
