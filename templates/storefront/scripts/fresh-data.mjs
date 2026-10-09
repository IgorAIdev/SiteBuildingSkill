/* Сборка рисует ДАННЫЕ ИСТОЧНИКА, а не прошлый кеш (И662).

   Опубликованный вид и каталог страница берёт через `unstable_cache`
   (lib/look.ts, теги «look» и «catalog»), и Next хранит эти записи в
   `.next/cache/fetch-cache` МЕЖДУ сборками: новая сборка отдавала вид,
   закешированный 29.09.2026, хотя lib/source/sample/look.json с тех пор
   менялся. Все замеры на сборке четыре дня мерили чужой вид — заголовок
   героя до 64 px вместо 54 (найдено 03.10.2026). На сервере свежая сборка
   кеша не несёт, а у машины набора он копится.

   Перед `next build` кеш данных стирается: сборка читает источник заново.
   Кеш собранного кода (`.next/cache/turbopack`) не трогается — он про
   скорость сборки, не про данные. */
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
rmSync(join(ROOT, '.next', 'cache', 'fetch-cache'), { recursive: true, force: true })
