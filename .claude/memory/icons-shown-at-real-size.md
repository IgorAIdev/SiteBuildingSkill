---
name: icons-shown-at-real-size
description: owner 21.10.2026 — icon variants are drawn in chat at their real size beside neighbours before being set; no detail under 2px
metadata:
  type: feedback
---
Знак на сайт ставится только после показа в чате: до трёх вариантов в строке с соседями на
настоящем росте (13 / 16 / 20 px), светлая и тёмная тема, рядом крупно.

**Why:** 21.10.2026 знак «Made in the EU» прошёл пять кругов (кольцо точек, флаг, кольцо
звёзд, диск с буквами EU, цветной флажок) — в окне 24 выглядел верно, в строке 13 px «текст
1 мм, ничего не разобрать». Слова владельца: «сначала показывай иконки».

**How to apply:** правило — `.claude/skills/craft/references/icons.md`, «Знак при слове — на
своём настоящем росте»; проверка видимой высоты — check:craft `iconRow`. Рекомендованный
вариант ставится сразу (см. [[take-recommended]]), но рисунок в чат идёт до постановки.
