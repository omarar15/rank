import type { Metadata } from 'next'
import { RankingFlow } from '@/components/RankingFlow'

export const metadata: Metadata = { title: 'Rank item — rank' }

export default async function RankPage({
  params,
}: {
  params: Promise<{ listId: string; itemId: string }>
}) {
  const { listId, itemId } = await params
  return <RankingFlow listId={listId} itemId={itemId} />
}
