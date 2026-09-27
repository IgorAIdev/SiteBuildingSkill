import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formOf, standardDetails, type Form } from '../lib/source/details.ts'
import { LOCALES } from '../lib/locale.ts'
import { CATEGORIES } from '../lib/products.ts'

/* Стандартные состав и применение (И482): у каждого вида — оба текста на
   каждом языке витрины; вид узнаётся по кодам полок движка; у каждой полки
   образца вид назван. */
const FORMS: Form[] = ['oil', 'capsules', 'paste', 'edibles', 'pets', 'vape', 'cosmetics', 'topicals', 'flowers']

test('every product form has ingredients and usage in every language', () => {
  for (const form of FORMS) {
    for (const lang of LOCALES) {
      const d = standardDetails(form, lang)
      assert.ok(d.ingredients && d.ingredients.length > 20, `${form}/${lang} ingredients`)
      assert.ok(d.usage && d.usage.length > 20, `${form}/${lang} usage`)
    }
  }
})

test('form comes from the engine shelf codes; unknown codes give no text', () => {
  assert.equal(formOf(['relax', 'oil']), 'oil')
  assert.equal(formOf(['naturecbd']), null)
  assert.deepEqual(standardDetails(null, 'ro'), { ingredients: null, usage: null })
})

test('every sample shelf names its form', () => {
  for (const c of CATEGORIES) assert.ok(FORMS.includes(c.form), c.slug)
})
