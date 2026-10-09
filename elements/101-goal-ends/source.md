# 101 · Полоса с суммами по краям

Источники:
- HyperUI «Progress bars», образец 3 «Compact with metadata»
  (https://www.hyperui.dev/components/application/progress-bars, файл
  `public/examples/application/progress-bars/3.html` репозитория
  https://github.com/markmead/hyperui, лицензия MIT, © Mark Mead);
- Flowbite «Progress → With label outside»
  (https://flowbite.com/docs/components/progress/, репозиторий
  https://github.com/themesberg/flowbite, лицензия MIT, LICENSE.md: © 2023
  Bergside Inc.).

Взято устройство: `role="progressbar"` с `aria-valuenow / min / max`, подпись
над полосой, плоская тонкая полоса без скруглений (h-1 у HyperUI), строка
подписей под ней с краёв (`justify-between` у Flowbite, «1.2 of 3.8 MB» у
HyperUI). Слева — сколько набрано в корзине, справа — порог.

Суммы, порог, валюта и слова — данные магазина, а не вёрстка («€70.00 to go for
free delivery», «€30.00» и «€100.00», «Free delivery unlocked»).

Не перенесено: заголовок капителью над полосой (у образца это название задачи;
у нас там слова про доставку, как в элементе 74). Подписи под полосой скрыты
от чтеца (`aria-hidden`): то же сказано в `aria-valuetext`.
