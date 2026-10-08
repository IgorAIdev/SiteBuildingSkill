'use server'
import { content } from '../source/index.ts'
import type { ConsentRecord } from '../source/contract.ts'
import { CATEGORIES } from '../consent.ts'

/** Запись выбора о cookie (И791): доказательство согласия (GDPR ст. 7 (1)) —
 *  случайный id из cookie выбора, версия реестра, категории и время; IP и имени
 *  нет. Время ставит сервер: часы браузера доказательством не служат (разбор
 *  08.10.2026). Пишет источник содержания (`Content.recordConsent`: у Payload —
 *  коллекция `consents`); витрина журнал не ведёт. Чужое (не тот вид id,
 *  незнакомая категория) не пишется — молча: полоса выбор уже сохранила в браузере. */
export async function recordConsent(entry: Omit<ConsentRecord, 'at'>): Promise<void> {
  const ok = /^[a-f0-9]{16}$/.test(entry.id) && Number.isInteger(entry.revision) && entry.revision > 0
    && Array.isArray(entry.categories) && entry.categories.every((c) => CATEGORIES.includes(c as never) && c !== 'necessary')
  if (ok) await content().recordConsent({ id: entry.id, revision: entry.revision, categories: [...entry.categories], at: new Date().toISOString() })
}
