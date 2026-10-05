---
name: draft-overwritten-by-panel
description: Editing look.draft.json on the server is undone by the owner's open Look panel — it keeps names in browser memory and re-posts the whole draft on the next pick; after such an edit tell the owner to reload (F5) first
metadata:
  type: project
---

On 30.09.2026 I set the card to «framed» in both `.storefront/lib/source/sample/look.json` (the published look) and `look.draft.json` (the draft). The owner's open Look panel then saved a shadow pick. The panel (look-panel/ui/studio.mjs) keeps every field name in the browser and POSTs the whole draft, so the draft came back with «card: bare». The owner saw the old card and said «так писал, поставь выбранную карточку товара в сайт».

**Why:** the panel reads `/look-panel/state` only when the page loads. A server-side draft edit is invisible to an already open panel, and the panel's next pick writes over it.

**How to apply:**
- After changing the published look or the draft on the server, tell the owner in one line to reload the page (F5) before touching the panel.
- Check `/look-panel/state` afterwards: `draft.card` and `published.card` should show the new value.
- Better still, make the change through the panel's own choice state (`studio.pick`) whenever a page can do it.

Related: [[look-panel-architecture]].
