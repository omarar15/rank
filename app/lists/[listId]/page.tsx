import type { Metadata } from 'next'
import { ListDetail } from '@/components/ListDetail'

export const metadata: Metadata = { title: 'List — rank' }

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>
}) {
  const { listId } = await params
  return <ListDetail listId={listId} />
}
