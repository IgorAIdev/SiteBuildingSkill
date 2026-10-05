import type { Reach, Social } from '@/lib/contacts.ts'
import type { Pay } from '@/lib/company.ts'

/* Знаки марок и путей связи — одна карта на весь сайт (слово заказчика
   29.09.2026: «иконки, кнопки и т. д. единый источник имеют же»; И549):
   меню трубки, окно помощи, быстрый заказ, соцсети и оплата в подвале.
   Ключ — данные магазина (lib/contacts.ts, lib/company.ts), значение — имя
   знака в листе (styles/icons.svg). Телефон и почта — пером Lucide, марки
   — силуэтами Simple Icons (brands/); Telegram — самолётик нашим пером,
   без круга (решение заказчика на cbdin.bg). */
export const SIGN: Record<Reach | Social | Pay, string> = {
  phone: 'phone', email: 'mail',
  viber: 'viber', telegram: 'send', whatsapp: 'whatsapp', instagram: 'instagram',
  facebook: 'facebook', youtube: 'youtube',
  visa: 'visa', mastercard: 'mastercard', applepay: 'applepay', googlepay: 'googlepay',
}
