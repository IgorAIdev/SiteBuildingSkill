# Чужие скиллы вне загрузки

Лежат здесь с 10.10.2026 по решению владельца. Каждый скилл в `.claude/skills/`
кладёт своё описание в каждый запрос, а процесс набора эти не использует;
часть ещё и спорит с правилами. Примеры: `brainstorming` ставит ворота
одобрения перед любой правкой, `using-superpowers` велит вызывать скилл «при
1 % шансе» — а в `CLAUDE.md` записано «правка делается, а не обсуждается».
Тексты не менялись и не удалены: вернуть можно в любой день.

Лицензии рядом: `LICENSE.superpowers` (MIT, копия — оригинал остался в
`.claude/skills/` для `systematic-debugging`, `verification-before-completion`,
`test-driven-development`), `LICENSE.taste-skill` (MIT, копия — оригинал остался
там для `redesign-skill`).

## Что здесь

| скилл | источник | что делает |
| --- | --- | --- |
| `using-superpowers` | [obra/superpowers](https://github.com/obra/superpowers) | велит искать и вызывать скилл до любого ответа |
| `brainstorming` | obra/superpowers | разговор о замысле и согласование дизайна перед кодом; есть локальный сервер «визуального компаньона» |
| `writing-plans` | obra/superpowers | пошаговый план реализации по готовому ТЗ |
| `executing-plans` | obra/superpowers | исполнение письменного плана в отдельной сессии с контрольными точками |
| `subagent-driven-development` | obra/superpowers | исполнение плана подагентами, ревью после каждой задачи |
| `dispatching-parallel-agents` | obra/superpowers | раздача независимых задач параллельным агентам |
| `using-git-worktrees` | obra/superpowers | изолированное рабочее дерево под задачу |
| `requesting-code-review` | obra/superpowers | запрос ревью после задачи или перед слиянием |
| `receiving-code-review` | obra/superpowers | как принимать замечания ревью — проверять, а не соглашаться |
| `finishing-a-development-branch` | obra/superpowers | выбор способа влить готовую ветку |
| `writing-skills` | obra/superpowers | как писать и проверять новые скиллы |
| `taste-skill` | [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) | вкус для лендингов: не «шаблонный» вид |
| `minimalist-skill` | leonxlnx/taste-skill | редакционный минимализм: тёплая монохромность, плоские сетки |
| `brutalist-skill` | leonxlnx/taste-skill | брутализм: жёсткая сетка, контраст шрифтов, терминальная эстетика |
| `soft-skill` | leonxlnx/taste-skill | «дорогой» вид агентства: шрифты, тени, карточки, анимация |
| `brandkit` | leonxlnx/taste-skill | доски бренда и логотипы (метод: аргумент → метафора → редукция) |
| `output-skill` | leonxlnx/taste-skill | запрет сокращений и заглушек в выдаваемом коде |

Остались в `.claude/skills/` и грузятся: `systematic-debugging`,
`verification-before-completion`, `test-driven-development` (obra/superpowers),
`redesign-skill` (leonxlnx/taste-skill), `impeccable`, `emil-design-eng`,
`improve-animations`, `review-animations` и свои шесть.

## Как вернуть

```
git mv vendor/skills/<имя> .claude/skills/<имя>
```

Лицензия нужного источника уже лежит в `.claude/skills/` (`LICENSE.superpowers`,
`LICENSE.taste-skill`). После возврата: добавить скилл в таблицу
`.claude/skills/README.md`, в `tools/stages.mjs` (`ALWAYS`, `skills` этапа) и
в таблицы маршрутизации `craft`, `stages`, `code`, если он там нужен;
прогнать `npm run check:rules`. Проверить, что он не спорит с `CLAUDE.md`.

## Установка в проект

`node install.mjs --extras` кладёт этот каталог в проект как `vendor/skills/`,
а не в `.claude/skills/` — иначе скиллы снова грузились бы в каждый запрос.
