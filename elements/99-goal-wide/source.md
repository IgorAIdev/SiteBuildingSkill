# 99 · Широкая полоса с суммой в заливке

Источники:
- Flowbite «Progress → With label inside» (https://flowbite.com/docs/components/progress/,
  файл `content/components/progress.md` репозитория https://github.com/themesberg/flowbite,
  лицензия MIT, LICENSE.md: © 2023 Bergside Inc.);
- Preline «Progress → label inside the bar» (https://preline.co/docs/progress.html;
  LICENSE репозитория https://github.com/htmlstreamofficial/preline — двойная
  «MIT» и «Preline UI Fair Use License», © 2026 Preline Labs Ltd.; страница
  документации лицензии не называет).

Взято устройство обоих образцов, оно совпадает: дорожка с `role="progressbar"`
и `aria-valuenow / min / max`, внутри — заливка с надписью по центру, лишнее
обрезается (`overflow: hidden`, `white-space: nowrap`). Высота «label inside»
(h-4 у Flowbite, 16px) в наборе — три четверти малого органа, чтобы надпись
подписи набора помещалась по высоте.

Слова про бесплатную доставку, суммы и порог — данные магазина, а не вёрстка:
в образце стоят «€70.00 to go for free delivery», «€30.00» в заливке и
«Free delivery unlocked» у взятого порога.

Не перенесено: в источнике внутри стоит процент; здесь сумма в корзине.
Если заливка уже надписи (доля меньше нескольких процентов), надпись
обрезается — так ведёт себя и источник; слова над полосой это перекрывают.

Лицензия (проверено 03.10.2026): код Preline не переносился. Разметка и CSS здесь свои —
на классах и числах набора (`base.css`), классы Tailwind образца заменены; взят общий
приём, который не защищается авторским правом и есть у любой библиотеки полос
(дорожка с заливкой и `role="progressbar"`, плавающая метка, ряд долек). Двойная
лицензия репозитория Preline на этот элемент не распространяется; Flowbite и HyperUI —
MIT, их текст в набор не копировался.
