import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bands, chosen, soldByConcentration, traitOf, virtualFacets } from '../lib/source/vendure/traits.ts'

/* Концентрация и тип — грани из полей товара движка (traits.ts), числа
   сняты с движка cbdin 02.10.2026 (масла: 3 / 6 / 2 / 3 / 1 / 1 по
   5 / 10 / 15 / 20 / 30 / 40 %). */

const oil = (strength: string, volume: string, spectrumKey: string | null, shelf = 'oil') => traitOf({
  facetValues: [{ code: shelf, facet: { code: 'category' } }], customFields: { strength, volume, spectrumKey },
})
const NAMES = {
  concentration: 'Concentration', content: 'CBD in total', type: 'Type', types: { full: 'Full spectrum', broad: 'Broad spectrum' },
  mg: (lo: number, hi: number) => (lo === hi ? `${lo} mg` : `${lo}–${hi} mg`),
}

test('traits: percent is mg over ml times ten, on percent shelves only', () => {
  assert.equal(oil('1000mg', '10ml', 'full').percent, '10')
  assert.equal(oil('3000mg', '30ml', 'full').percent, '10', '30 мл с 3000 мг — те же 10 %')
  assert.equal(oil('1000mg CBD+CBDA', '10ml', 'raw').percent, '10')
  assert.equal(oil('250mg', '10ml', null).percent, '2.5')
  assert.equal(oil('600mg', '30 capsules', 'full', 'capsules').percent, null, 'у капсул нет концентрации')
  assert.equal(oil('500mg', '50ml', 'full', 'cosmetics').percent, null, 'и у косметики')
  assert.equal(oil('1000mg', '10ml', ' Full ').type, 'full')
})

test('traits: facets count against the other facet, a facet never narrows itself', () => {
  const traits = new Map([['1', oil('500mg', '10ml', 'full')], ['2', oil('1000mg', '10ml', 'full')], ['3', oil('1000mg', '10ml', 'broad')], ['4', oil('1000mg', '10ml', 'broad')]])
  const ids = ['1', '2', '3', '4']
  const none = virtualFacets(ids, traits, { concentration: [], type: [] }, NAMES)
  assert.deepEqual(none.map((f) => f.code), ['concentration', 'content', 'type'])
  assert.deepEqual(none[0].values.map((v) => [v.name, v.count]), [['5%', 1], ['10%', 3]], 'проценты — по возрастанию')
  assert.deepEqual(none[1].values.map((v) => [v.name, v.count]), [['500 mg', 1], ['1000 mg', 3]], 'у масел и мг')
  assert.deepEqual(none[2].values.map((v) => [v.name, v.count]), [['Full spectrum', 2], ['Broad spectrum', 2]], 'виды — в порядке каталога')
  const ten = virtualFacets(ids, traits, { concentration: ['10'], type: [] }, NAMES)
  assert.deepEqual(ten[0].values.map((v) => v.count), [1, 3], 'своя грань не сужает сама себя')
  assert.deepEqual(ten[2].values.map((v) => v.count), [1, 2], 'тип считается среди десяти процентов')
  assert.deepEqual(ten[0].values.map((v) => v.selected), [false, true])
  assert.deepEqual(chosen(ids, traits, { concentration: ['10'], type: ['broad'] }), ['3', '4'])
  assert.deepEqual(chosen(ids, traits, { concentration: ['5', '10'], type: [] }), ids, 'два значения одной грани — ИЛИ')
  assert.deepEqual(virtualFacets(['9'], traits, { concentration: [], type: [] }, NAMES), [], 'нет значений — нет граней')
})

/* Содержание CBD (И742): у каждого товара — мг в упаковке отрезками, у того,
   что капают или дозируют, ещё и процент (цену заказчик снял 04.10.2026). Числа — с
   движка cbdin 04.10.2026 (паста 1500 мг в 5 г под дозатор, капсулы 30 шт). */
const item = (strength: string, volume: string, shelf: string, extra: Record<string, number> = {}) => traitOf({
  facetValues: [{ code: shelf, facet: { code: 'category' } }], customFields: { strength, volume, spectrumKey: 'broad', ...extra },
})

test('traits: paste under an applicator is sold by concentration, mg per g like ml', () => {
  assert.equal(item('1500mg', '5g', 'paste', { applicatorMl: 5 }).percent, '30')
  assert.equal(item('1500mg', '5g', 'paste', { applicatorMl: 5 }).mg, 1500, 'и мг в упаковке')
  assert.equal(item('1000mg', '10ml', 'topicals', { dropsPerMl: 20 }).percent, '10', 'поле капли решает и без полки капель')
  assert.equal(soldByConcentration({ facetValues: [{ code: 'oil', facet: { code: 'category' } }], customFields: { strength: '600mg', volume: '30 capsules' } }), false, 'штуки — не концентрация')
  const balm = item('200mg', '50ml', 'pets')
  assert.equal(balm.percent, null, 'масла 0.4 % не бывает: бальзам для лап — не масло (заказчик 04.10.2026)')
  assert.equal(balm.mg, 200, 'бальзам — содержанием, как у cbdin.bg')
  assert.equal(item('300mg', '10ml', 'pets').percent, '3', 'масло для животных 3 % — концентрацией')
})

test('traits: every product carries mg in the pack, oils too', () => {
  const caps = item('900mg', '30 капсули', 'capsules')
  assert.equal(caps.percent, null)
  assert.equal(caps.mg, 900)
  assert.equal(item('500mg', '50ml', 'cosmetics').mg, 500, 'крем — содержанием')
  /* Масло — и процентом, и мг (заказчик 04.10.2026: «мг у них есть… 30 % — это
     3000 мг»): выбор «CBD in total» находит масло в своём отрезке. */
  const oil10 = item('1000mg', '10ml', 'oil')
  assert.deepEqual([oil10.percent, oil10.mg], ['10', 1000], 'масло — 10 % и 1000 мг')
  assert.deepEqual(chosen(['o', 'c'], new Map([['o', item('3000mg', '10ml', 'oil')], ['c', caps]]), { content: ['800-3000'] }), ['o', 'c'], 'масло 3000 мг — в отрезке «800–3000 mg»')
})

/* Заказчик 05.10.2026: отметил «cosmetics» — у концентрации «20 % (4)», хотя косметики
   на 20 % нет (И750). Значения стоят по рамке (вся полка без выбора), счёт — по
   выбору: у косметики проценты — нули, а не пропавшая грань со старыми числами. */
test('traits: values come from the frame with zeros, counts from the choice; bands do not move with it', () => {
  const traits = new Map([
    ['o1', oil('1000mg', '10ml', 'full')], ['o2', oil('2000mg', '10ml', 'broad')],
    ['c1', oil('500mg', '50ml', 'full', 'cosmetics')], ['c2', oil('300mg', '50ml', 'full', 'cosmetics')],
  ])
  const frame = ['o1', 'o2', 'c1', 'c2']
  const whole = virtualFacets(frame, traits, {}, NAMES)
  const creams = virtualFacets(['c1', 'c2'], traits, {}, NAMES, frame)
  const at = (fs: typeof whole, code: string) => fs.find((f) => f.code === code)!.values.map((v) => [v.name, v.count])
  assert.deepEqual(at(creams, 'concentration'), [['10%', 0], ['20%', 0]], 'у косметики проценты — нули')
  assert.deepEqual(at(creams, 'type'), [['Full spectrum', 2], ['Broad spectrum', 0]])
  assert.deepEqual(creams.find((f) => f.code === 'content')!.values.map((v) => v.code), whole.find((f) => f.code === 'content')!.values.map((v) => v.code), 'отрезки мг — те же, что без выбора')
  assert.deepEqual(at(creams, 'content'), [['300 mg', 1], ['500 mg', 1], ['1000 mg', 0], ['2000 mg', 0]])
})

test('traits: bands stay exact up to the limit, then split by equal counts without tearing equal values', () => {
  assert.deepEqual(bands([300, 600, 300], 5), [[300, 300], [600, 600]])
  const many = [10, 15, 150, 200, 250, 300, 300, 300, 350, 400, 500, 600, 750, 1000, 3000]
  const got = bands(many, 5)
  assert.equal(got.length, 5)
  assert.equal(got[0][0], 10, 'первый отрезок начинается самым малым')
  assert.equal(got.at(-1)![1], 3000, 'последний отрезок кончается самым большим')
  assert.ok(got.every(([lo, hi], i) => lo <= hi && (i === 0 || got[i - 1][1] < lo)), 'отрезки идут по возрастанию и не перекрываются')
  assert.ok(!got.some(([lo, hi], i) => i > 0 && got[i - 1][1] === 300 && lo === 300), 'три по 300 — в одном отрезке')
})

test('traits: the mg facet is bands, picked by span, counted against the other facets', () => {
  const traits = new Map([
    ['a', item('300mg', '30 капсули', 'capsules')], ['b', item('600mg', '30 капсули', 'capsules')],
    ['c', item('900mg', '30 капсули', 'capsules')], ['d', item('900mg', '30 капсули', 'capsules')],
  ])
  const ids = ['a', 'b', 'c', 'd']
  const none = virtualFacets(ids, traits, {}, NAMES)
  assert.deepEqual(none.map((f) => f.code), ['content', 'type'], 'порядок: содержание, тип; цены нет (заказчик 04.10.2026: «удаляй выбор по цене»)')
  assert.deepEqual(none[0].values.map((v) => [v.name, v.count]), [['300 mg', 1], ['600 mg', 1], ['900 mg', 2]])
  assert.ok(none[0].bands, 'мг — посчитанные отрезки')
  assert.deepEqual(chosen(ids, traits, { content: ['600-900'] }), ['b', 'c', 'd'], 'выбор по отрезку «от-до»')
  const stale = virtualFacets(ids, traits, { content: ['100-200'] }, NAMES)
  assert.deepEqual(stale[0].values.filter((v) => v.selected).map((v) => [v.code, v.name]), [['100-200', '100–200 mg']], 'выбор из адреса не пропадает молча')
})

/* «Все товары» — масла рядом с капсулами и косметикой: содержание CBD двумя мерами
   (процентами у того, что капают, мг — у всех, масла тоже), вид экстракта — у всех; ни одна
   грань не живёт только в полке, выбор едет с покупателем (слово заказчика
   04.10.2026: «вид / тип продукта нужно выбирать… и CBD содержание»; И742). */
test('traits: all products carry CBD content in % and mg and the extract type, none scoped to a shelf', () => {
  const traits = new Map([['1', oil('1000mg', '10ml', 'full')], ['2', oil('600mg', '30 capsules', 'broad', 'capsules')], ['3', oil('500mg', '50ml', 'isolate', 'cosmetics')]])
  const facets = virtualFacets(['1', '2', '3'], traits, { concentration: [], type: [] }, NAMES)
  assert.deepEqual(facets.map((f) => f.code), ['concentration', 'content', 'type'])
  assert.deepEqual(facets.find((f) => f.code === 'content')!.values.map((v) => [v.name, v.count]), [['500 mg', 1], ['600 mg', 1], ['1000 mg', 1]], 'мг — у всех трёх, масло тоже')
  assert.ok(facets.every((f) => !f.scoped), JSON.stringify(facets.map((f) => [f.code, f.scoped])))
  assert.deepEqual(facets.find((f) => f.code === 'concentration')!.values.map((v) => v.name), ['10%'])
  assert.deepEqual(facets.find((f) => f.code === 'type')!.values.map((v) => v.code), ['full', 'broad', 'isolate'])
})
