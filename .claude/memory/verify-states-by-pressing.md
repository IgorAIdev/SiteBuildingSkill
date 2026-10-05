---
name: verify-states-by-pressing
description: "control states (hover, press, disabled, focus) are checked by hovering/pressing in a real browser, never by reading CSS; samples stand in working position, not at a limit; owner passes written specs (ТЗ) to GPT"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c517542c-d019-4fd3-8057-168625e3a164
  modified: 2026-10-03T09:29:56.636Z
---

Owner 02.10.2026 (angry, counter variants again): «+ − не подсвечивается», «тихий без
окантовки — а он и без фона», «я заебался вручную искать… собирай все проверки в ТЗ, я GPT
на проверку передам».

**Why:** I shipped counters whose hover/press/disabled I had never actually exercised: the
quiet one lost its fill, disabled buttons were not dimmed, samples sat on value 1 where «−»
is disabled and looked broken. Reading the rule in the file proved nothing.

**How to apply:** for any control with states, drive it with a real mouse and keyboard
(`tools/check-counters.mjs` is the pattern: transitions off, measure resting / hover / press /
disabled / focus, both themes, all engines). Show samples in the working position (counter at
2, not at its minimum). When the owner wants to check everything, write one self-contained
spec in `docs/tz-controls-check.md` style (step → expected) he can hand to GPT. Quiet variant =
the site's own control minus one thing (the edge), not a new drawing — see
[[download-dont-draw]]. Related: [[verify-pages-use-system]].

**Trap in the Claude Browser pane (03.10.2026):** a tab that is not fronted, or a pane behind
another window, gets no animation frames — `getAnimations()` shows transitions `running` at
`currentTime 0`, and computed colours stay at the old value (pressed heart read as «ink», not
«brand», and I nearly reported it as a defect). Front the tab (`tabs_select`) and inject
`*{transition:none!important}` before reading colours after a state change. The tool has click
and hover but no mouse-down-and-hold, so `:active` (press shrink) stays unverified by hand: say
so. A tiny `screenshot` (scale 0.1) is needed once per tab before coordinate clicks; the
coordinate frame is 800 px wide, so scale CSS px by `800 / innerWidth`.
