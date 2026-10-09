/* Копии снимков полок образца по ширинам (И663).

   Полки образца стоят снимками-файлами (lib/source/sample/shelf-shots.ts,
   public/sample/shelves/), а не снимками движка: у товара ширины отдаёт
   сервер снимков (lib/source/vendure/image.ts), у файла образца сервера нет.
   Поэтому один файл 1100 px шёл и в плитку полки 240 px, и в значок меню
   38 px — `check:craft` нашёл 43 снимка вдвое крупнее места и 12 плиток,
   не доехавших к замеру (03.10.2026).

   Копии режутся один раз и лежат рядом с оригиналом: `<имя>-<ширина>.webp`.
   Ширины — `CUTS` из shelf-shots.ts (один список на копии и на `srcset`),
   только не шире оригинала;
   оригинал остаётся последней шириной в `srcset`. Новый снимок полки —
   положить .jpg в public/sample/shelves/ и запустить:

     node scripts/sample-cuts.mjs

   sharp приходит вместе с Next (его оптимизатор снимков); своей зависимости
   у витрины нет. */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CUTS } from '../lib/source/sample/shelf-shots.ts'

const DIR = fileURLToPath(new URL('../public/sample/shelves/', import.meta.url))

{
  const { default: sharp } = await import('sharp')
  let made = 0
  for (const file of readdirSync(DIR).filter((f) => f.endsWith('.jpg'))) {
    const name = file.slice(0, -4)
    const { width = 0 } = await sharp(join(DIR, file)).metadata()
    for (const w of CUTS.filter((x) => x < width)) {
      await sharp(join(DIR, file)).resize({ width: w }).webp({ quality: 78 }).toFile(join(DIR, `${name}-${w}.webp`))
      made++
    }
  }
  console.log(`sample-cuts: ${made} копий в public/sample/shelves/`)
}
