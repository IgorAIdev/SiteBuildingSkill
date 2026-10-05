'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'

/* Общее состояние выбора вида (look-panel/ui/studio.mjs) — тем же адресом,
   что берёт плавающая панель: один модуль — один объект на странице, и
   страница с панелью не затирают черновик друг другу (И567). Модуль — файл
   панели за её входом, сборщик сайта его не тащит: импорт по адресу. */

export type Paint = Record<string, string>
export type Intent = { brand: string; paper: 'warm' | 'neutral' | 'cool'; tint: 'none' | 'light'; inkTowardBrand?: boolean }
export type Paints = { name?: string; light: Paint; dark: Paint; intent?: Intent }
/** Вариант каталога: у палитры — краски (`seed`), у прочих — значения свойств сайта (`vars`). */
export type Option = { id: string; name: string; line?: string; seed?: Paints; vars?: Record<string, string> }
export type Note = { what: string; from: string; to: string; why: string; mode?: string }
export type Fitted = { ok: boolean; seed: { light: Paint; dark: Paint }; notes: Note[] }
export type Promise_ = { id: string; label: string; ok: boolean; rows: { mode: string; got: number; unit: string }[] }
export type Choice = {
  CUSTOM: string
  tileOf: (p: Paints, steps: unknown) => { light: Paint; dark: Paint }
  intentOf: (p: Paints) => Intent
  fitPalette: (intent: Intent, exact: { light: Paint; dark: Paint } | null) => Fitted
  families: (p: Paints, mode: 'light' | 'dark') => [string, string[]][]
  guarantees: (p: Paints, steps: unknown) => Promise_[]
}
export type Clash = { x: { field: string; id: string }; y: { field: string; id: string }; why: string }
export type Studio = {
  catalog: { groups: Record<string, Option[]>; steps: unknown }
  choice: Choice
  names: Record<string, string>
  drafting: boolean
  on: (fn: (what: string, data?: { code: string; detail?: string }) => void) => () => void
  custom: () => boolean
  current: () => Option & { seed: Paints }
  readonly paints: Paints | null
  clashes: () => Clash[]
  blockedBy: (field: string, id: string) => { field: string; id: string; why: string } | null
  title: (field: string, id: string) => string
  pick: (field: string, id: string) => void
  setPaints: (p: Paints) => void
  rename: (name: string) => void
  publish: () => Promise<boolean>
  stop: () => Promise<void>
}

const URL_ = '/look-panel/studio.mjs'
let loading: Promise<Studio> | null = null
const load = () => (loading ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ URL_).then((m: { studio: () => Promise<Studio> }) => m.studio()))

/** Состояние выбора и номер его перемены — компонент перерисовывается на каждую. */
export function useStudio(): { s: Studio | null; said: { code: string; detail?: string } | null } {
  const [s, setS] = useState<Studio | null>(null)
  const [said, setSaid] = useState<{ code: string; detail?: string } | null>(null)
  const [, bump] = useState(0)
  useEffect(() => {
    let off = () => {}
    let live = true
    load().then((x) => {
      if (!live) return
      setS(x)
      off = x.on((what, d) => { if (what === 'say') setSaid(d ?? null); else bump((n) => n + 1) })
    }, () => {})
    return () => { live = false; off() }
  }, [])
  return { s, said }
}

const never = () => () => {}
/** Строитель своей палитры — только на компьютере (слово заказчика 28.09.2026). */
export const useDesk = () => useSyncExternalStore(never, () => matchMedia('(pointer:fine)').matches, () => true)
