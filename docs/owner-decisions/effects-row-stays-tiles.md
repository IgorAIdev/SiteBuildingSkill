---
name: effects-row-stays-tiles
description: home «Shop by effect» row stays tiles; the thin pill strip was built, compared and rejected by the owner 03.10.2026 — don't re-propose it
metadata:
  type: project
---

03.10.2026 the owner asked for a visual example of how pros break up the long home page. I built two moves next to the old state: the effects row as a thin strip of pill links, and one quiet band under the two product shelves. He compared them and answered «прежние плитки», then sent a screenshot of the tile row with «это оставляем».

**Why:** the pictures on the effect tiles carry the row; the strip had no pictures and saved only about 150 px on a laptop (403 → 250) and almost nothing on a phone (379 → 355, pills in three lines).

**How to apply:** effects stay tiles (same door dress as the shelves, no «View all» — there is no all-effects page). The strip axis `--effects-form`, its panel field and `EffectsStrip` are removed; the measurement stays in `docs/design/home.md` §8. The quiet band under the shelves (`--band-featured: quiet`) was not rejected — the owner did not mention it; ask before changing it. Third move (a «store word» pause between the two shelves) waits for his words and one photo. Related: [[design-with-skills]], [[no-unasked-extras]], [[harvest-from-sources]].

**04.10.2026:** the owner asked for the tiles «в таком же стиле как и плашка блога» — a new dress `caption` (picture, name, two lines of the effect description below, like PostCard) is published on home and listed first in HOMES. The same day he asked which image proportions should match; answer is И736: three frame roles by what is in the picture (`--card-frame` = product ratio for every card rail incl. all tile dresses, `--scene-frame` 4:3 hero/story, `--people-frame` 2:3 reviews), check `frameRaw`. Tile dresses are no longer 1.4. Related: [[design-system-shows-all]].
