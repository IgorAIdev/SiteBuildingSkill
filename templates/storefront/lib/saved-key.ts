/** Имя строки склада избранного — его же называет реестр хранилищ
 *  (lib/storage.json, И791). Отдельно от `saved.ts`, потому что тот тянет
 *  React: тест реестра (`tests/consent.test.ts`) читает только имя и не должен
 *  требовать установленных зависимостей — без них падал `--storefront` в
 *  `selftest/storefront-install.test.mjs` (10.10.2026). */
export const SAVED_KEY = 'saved'
