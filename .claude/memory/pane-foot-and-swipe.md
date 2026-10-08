---
name: pane-foot-and-swipe
description: window foot (cart «Continue to checkout» / «View cart») must show whole, never scroll; every sheet closes by swipe, also from the dimmed strip beside it; owner's phone is 360 css px, DPR 2, Chrome (08.10.2026, И780)
metadata:
  type: feedback
---

08.10.2026, phone screenshots of the cart with 16 items: «нижняя часть с кнопками скролится, нужно скролить чтоб кнопки все увидеть — пиздец». He recalled «view cart без кнопки» as my earlier solution and guessed Codex changed it. Facts: the two-button pair (quiet left, loud right) is his own 05.10 word (И772); what Codex changed on 07.10 (`be0b978`) was the foot — `flex:0 1 auto` + scroll — and that is what hid the buttons (foot 229 px shrank to 89 beside a 1396 px body; buttons at 687/747 under a 670 edge).

**Why:** a foot that shrinks is the one defect he cannot forgive on a phone — the buttons are the point of the window. Same day: «левое меню не закрывается свайпом… формы все из одного места и должны одинаково работать» — in a real-touch test the sheet closed from inside, but a drag that began on the dimmed strip beside the sheet was never caught.

**How to apply:** foot = `flex:none`, cap 60 % of the window, body yields (`styles/pane.module.css`); the swipe engine is one for all windows and also takes the dimmed strip beside a side sheet (`public/pane-swipe.js`). Verify windows with a real finger (CDP touch, 360 × 670) — `check:counters` block «окна телефона». When he says a form «не закрывается», test every start point (inside, header, strip) before concluding it works. Rule И780. Related: [[one-pane-one-sheet]], [[verify-states-by-pressing]], [[codex-same-folder]].
