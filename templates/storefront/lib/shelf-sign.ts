/* Знак полки по её имени в движке — пока у коллекций Vendure нет своего
   поля для знака (И422). Выбор заказчика 01.10.2026: масло — пипетка,
   капсулы — капсула, паста — шприц, съедобное — печенье, животные — pets,
   вейп — вейп-бокс, косметика — дозатор, крема и бальзамы — тюбик. Ключ —
   имя коллекции в движке (`slug` без перевода), значение — имя знака в
   листе (`styles/icons.svg`). Читает переходник Vendure
   (`source/vendure/catalog.ts`) и кладёт в `Collection.sign`; дальше знак
   идёт данными — в меню шапки, в кнопки категорий. Поле появится в движке —
   этот файл уйдёт. */
export const SHELF_SIGN: Record<string, string> = {
  oil: 'pipette', capsules: 'pill', paste: 'syringe', edibles: 'cookie',
  pets: 'pets', vape: 'vape', cosmetics: 'soap-dispenser', topicals: 'tube',
}
