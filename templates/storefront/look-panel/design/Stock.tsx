import p from '@/styles/primitives.module.css'
import { StockMark, type StockLevel } from '@/components/StockMark.tsx'
import { lookNow } from '@/lib/look.ts'
import type { Lang } from '@/lib/locale.ts'
import { t } from '@/lib/i18n/index.ts'
import { Part, Worn, cssVar } from './parts.tsx'
import s from './design.module.css'

/* Наличие товара — три вида строки (`--stock-look`, панель Look → Product
   page → Stock; слово заказчика 02.10.2026): знак в круге, точка, слово.
   Каждый — в трёх состояниях, настоящей строкой карточки товара
   (StockMark), а не копией; метка «на сайте» — по опубликованному виду
   (lookNow). Выбор — в панели, не здесь. */
const LOOKS = [
  ['sign', 'Знак в круге', 'галочка · внимание · крест'],
  ['dot', 'Точка', 'залитая · наполовину · пустая'],
  ['word', 'Только слово', 'краской сигнала, без знака'],
] as const
const LEVELS: [StockLevel, string][] = [['in', 'product.inStock'], ['low', 'product.lowStock'], ['out', 'product.outOfStock']]

export async function Stock({ lang }: { lang: Lang }) {
  const { names } = await lookNow()
  return (
    <Part title="Наличие на карточке" lede="В наличии, мало, нет: смысл несёт форма знака, а не один цвет — зелёное слово без знака дальтоник не отличит. Выбранный вид стоит на карточке товара.">
      <ul className={`${p.grid} ${s.btnStyles}`}>
        {LOOKS.map(([look, name, line]) => (
          <li key={look} className={s.btnStyle}>
            <span className={`${s.famSample} ${s.famStack}`} style={cssVar('--stock-look', look)}>
              {LEVELS.map(([level, key]) => <StockMark key={level} level={level}>{t(lang, key as 'product.inStock')}</StockMark>)}
            </span>
            <span className={s.btnName}>{name}</span>
            <span className={p.note}>{line}</span>
            <code>{look}</code>
            <Worn on={look === (names['stock-look'] ?? 'sign')} />
          </li>
        ))}
      </ul>
    </Part>
  )
}
