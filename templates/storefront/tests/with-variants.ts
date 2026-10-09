import type { Lang } from '../lib/locale.ts'
import type { Product, Result } from '../lib/source/contract.ts'
import { sample } from '../lib/source/sample/catalog.ts'

/** Товар с вариантами — как его отдаёт движок, где сила и мера — варианты
 *  одного товара (Vendure с группами опций). Образец держит отдельный товар
 *  на каждую силу и меру (И503); здесь его линейка собирается обратно в
 *  один товар, чтобы выбор варианта по адресу проверялся на тех же данных. */
export async function withVariants(lang: Lang, id: string): Promise<Result<Product>> {
  const r = await sample.product(lang, id)
  if (!r.ok || !r.value.line.length) return r
  const all = await Promise.all(r.value.line.map((m) => sample.product(lang, m.id)))
  const mates = all.flatMap((x) => (x.ok ? [x.value] : []))
  const reports = [...new Map(mates.flatMap((m) => m.labReports).map((l) => [l.batch, l])).values()]
  return { ok: true, value: { ...r.value, variants: mates.flatMap((m) => m.variants), labReports: reports, line: [] } }
}
