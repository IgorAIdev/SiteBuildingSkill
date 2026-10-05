/* Повторно «тронуть» временем файлы витрины, записанные позже `since`
   (И682). Сервер разработки на Windows читает файл, пока его пишет
   переустановка, получает «файл занят» (os error 32) и держит ошибку до
   следующей правки этого файла: 03.10.2026 так дважды за час падали все
   страницы (500) после правки `styles/` и `tools/` — VariantPicker.tsx,
   catalog/page.tsx. Новое время файла — та самая «следующая правка»: сервер
   читает его заново, уже целым. Зависимости, сборку и git не трогаем. */
import { readdirSync, statSync, utimesSync } from 'node:fs'
import { join } from 'node:path'

const SKIP = new Set(['node_modules', '.next', '.git'])

/** Тронутые файлы — для отчёта и теста. */
export function retouch(dir, since, now = new Date()) {
  const touched = []
  const walk = (d) => {
    let entries
    try { entries = readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue
      const full = join(d, e.name)
      if (e.isDirectory()) { walk(full); continue }
      try {
        if (statSync(full).mtimeMs >= since) { utimesSync(full, now, now); touched.push(full) }
      } catch { /* занят и сейчас — его тронет следующая правка */ }
    }
  }
  walk(dir)
  return touched
}
