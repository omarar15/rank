import type { Metadata } from 'next'
import { PublicList } from '@/components/PublicList'

export const metadata: Metadata = { title: 'Shared list — rank' }

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>
}) {
  const { shareToken } = await params
  return <PublicList shareToken={shareToken} />
}
