import type { Metadata } from 'next'
import { fetchListByShareToken } from '@/lib/firestore-rest'
import { PublicList } from '@/components/PublicList'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareToken: string }>
}): Promise<Metadata> {
  const { shareToken } = await params
  const data = await fetchListByShareToken(shareToken)
  return { title: data ? `${data.title} — rank` : 'Shared list — rank' }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>
}) {
  const { shareToken } = await params
  const data = await fetchListByShareToken(shareToken)
  return <PublicList data={data} />
}
