// look-panel — страница дизайн-системы принадлежит панели вида (look-panel/PANEL.md).
// Открыта, только пока LOOK_PICKER=on; `npm run look:remove` удаляет эту папку вместе с look-panel/.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { langOf } from '@/lib/route.ts'
import { DesignPage, tabOf } from '@/look-panel/design/DesignPage.tsx'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ t?: string | string[]; s?: string | string[] }> }

const one = (x: string | string[] | undefined) => (Array.isArray(x) ? x[0] : x)

export const metadata: Metadata = { title: 'Дизайн-система', robots: { index: false, follow: false } }

export default async function Design({ params, searchParams }: Props) {
  if (process.env.LOOK_PICKER !== 'on') notFound()
  const q = await searchParams
  return <DesignPage lang={await langOf(params)} tab={tabOf(one(q.t))} sub={one(q.s)} />
}
