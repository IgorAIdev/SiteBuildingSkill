import { timingSafeEqual } from 'node:crypto'

/** Сверка секрета за одно время, что бы в нём ни совпало: по времени ответа
 *  секрет не подбирают побуквенно. Секрет пересборки (api/revalidate) и `state`
 *  входа через поставщика (lib/social.ts, И787). Длина — в байтах: строка той же
 *  длины в буквах, но с не-латиницей, иначе роняла бы сверку исключением. */
export function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
